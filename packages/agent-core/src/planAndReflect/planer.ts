/*
  任务规划与反思
 */
import { LLMGenerator } from '@/tools/llmGenerator.ts';
import { JavascriptExecutor } from '@/tools/javascriptExecutor.ts';
import llm, { type LLM } from '../app/llm.ts';
import { PlanPrompt, SystemPrompt } from './prompt.ts';

export class PlanAndReflect {
  step: number = 0;
  llm: LLM = llm;

  tools = [new LLMGenerator(), new JavascriptExecutor()];

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
    const res = await this.llm.ask({
      messages: [
        { role: 'system', content: SystemPrompt },
        {
          role: 'user',
          content: PlanPrompt(input, availableTools),
        },
      ],
    });
    const plantext = /<plan>(.*?)<\/plan>/.exec(res)?.[1];
    if (!plantext) {
      return '';
    }
    this.plans = JSON.parse(plantext);
    for (const task of this.plans!.tasks) {
      for (const step of task.steps) {
        const tool = this.tools.find((t) => t.tool.name === step.tool_name)!;
        const result = await tool.step(step.step_goal);
        console.log('工具调用结果\n', result);
      }
    }
    return res;
  }
}
