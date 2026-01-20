/*
  任务规划与反思
 */
import { LLMGenerator } from '../tools/llmGenerator.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { type LLM, planLLM } from '../llm/llm.ts';
import { WebFetcher } from '../tools/webFetch.ts';
import { WebSearcher } from '../tools/webSearch.ts';
import { PlanPrompt, SystemPrompt } from './prompt.ts';

export class PlanAndRethink {
  step: number = 0;
  llm: LLM = planLLM;

  tools = [new LLMGenerator(), new JavascriptExecutor(), new WebFetcher(), new WebSearcher()];

  plans: {
    tasks: {
      task_id: string;
      task_goal: string;
      steps: [
        {
          step_id: string;
          step_goal: string;
          tool_name: string;
          tool_intent: string;
          expected_output: string;
        },
      ];
    }[];
  } | null = null;

  async plan(input: string) {
    const availableTools = this.tools
      .map((t) => `- ${t.tool.name}: ${t.tool.description}`)
      .join('\n');
    const res = await this.llm.askLLM({
      messages: [
        { role: 'system', content: SystemPrompt },
        {
          role: 'user',
          content: PlanPrompt(input, availableTools),
        },
      ],
    });
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const plantext = /<plan>\s*([\s\S]*?)\s*<\/plan>/.exec(res)?.[1];
    if (!plantext) {
      return '';
    }
    this.plans = JSON.parse(plantext);
    if (!this.plans || this.plans.tasks.length === 0) {
      return '';
    }
    console.log(this.plans);
    for (const step of this.plans.tasks[0].steps) {
      const tool = this.tools.find((t) => t.tool.name === step.tool_name)!;
      const result = await tool.step(step.step_goal);
      console.log('工具调用结果\n', result);
    }
    return res;
  }
}
