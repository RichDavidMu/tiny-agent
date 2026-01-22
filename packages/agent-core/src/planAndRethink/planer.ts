/*
  任务规划与反思
 */
import { v4 as uuidv4 } from 'uuid';
import { LLMGenerator } from '../tools/llmGenerator.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { type LLM, planLLM, toolLLM } from '../llm/llm.ts';
import type { ToolCall } from '../tools/toolCall.ts';
import type { PlanSchema } from '../types/planer.ts';
import { PlanSystemPrompt, PlanUserPrompt } from './prompt.ts';

export class PlanAndRethink {
  step: number = 0;
  llm: LLM = planLLM;

  // 内置工具
  private builtinTools: ToolCall[] = [new LLMGenerator(), new JavascriptExecutor()];

  // MCP 工具
  private mcpTools: ToolCall[] = [];

  // 所有工具（内置 + MCP）
  get tools(): ToolCall[] {
    return [...this.builtinTools, ...this.mcpTools];
  }

  setMCPTools(tools: ToolCall[]): void {
    this.mcpTools = tools;
  }

  plans: PlanSchema | null = null;

  async plan(input: string): Promise<string> {
    const availableTools = this.tools
      .map((t) => `- ${t.tool.name}: ${t.tool.description}`)
      .join('\n');
    const res = await this.llm.askLLM({
      messages: [
        { role: 'system', content: PlanSystemPrompt },
        {
          role: 'user',
          content: PlanUserPrompt(input, availableTools),
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
    this.attachUuids(this.plans);
    console.log(this.plans);
    for (const step of this.plans.tasks[0].steps) {
      await toolLLM.reload();
      const tool = this.tools.find((t) => t.tool.name === step.tool_name)!;
      const result = await tool.step(step.step_goal);
      console.log('工具调用结果\n', result);
      await toolLLM.unload();
    }
    return res;
  }
  async rethink() {
    throw new Error('Not implement');
  }

  private attachUuids(plan: PlanSchema): void {
    for (const task of plan.tasks) {
      task.task_uuid = uuidv4();
      for (const step of task.steps) {
        step.step_uuid = uuidv4();
      }
    }
  }
}
