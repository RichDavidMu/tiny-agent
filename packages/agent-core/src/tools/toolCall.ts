import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionAssistantMessageParam } from '@mlc-ai/web-llm';
import { agentLogger } from '@tini-agent/utils';
import { agentDb } from '../storage/db.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type { PlanSchema, StepSchema, TaskSchema } from '../types/planer.ts';
import type { ICallToolResult } from '../types/tools.ts';
import llmController from '../llm/llmController.ts';
import type { LLM } from '../llm/llm.ts';
import type { TaskCtx } from '../service/handlers/task.ts';
import type ToolBase from './toolBase.ts';

export abstract class ToolCall {
  abstract tool: ToolBase;

  needContext: boolean = false;

  llm: LLM = llmController.toolLLM;

  toolCall: ToolCallResponse | null = null;

  async step(
    step: StepSchema,
    task: TaskSchema,
    plan: PlanSchema,
    ctx: TaskCtx,
  ): Promise<ICallToolResult> {
    ctx.onToolUseStart(this.tool.toParams(), step);
    let toolContext: ChatCompletionAssistantMessageParam[] = [];
    if (this.needContext) {
      toolContext = await this.buildToolCallContext(step, plan);
    }
    const shouldAct = await this.think(step, task);
    ctx.onToolUseEnd(shouldAct, JSON.stringify(this.toolCall || {}, undefined, 2));
    agentLogger.debug(
      'shouldAct\n',
      shouldAct,
      '\n',
      'toolCall:\n',
      this.toolCall,
      'toolContext:\n',
      toolContext,
    );
    let result: CallToolResult;
    if (shouldAct) {
      result = await this.act(this.toolCall!, toolContext);
      ctx.onToolResult(result, step);
    } else {
      result = {
        content: [
          {
            type: 'text',
            text: `${this.tool.name}: toolCall success, No action needed. task: ${step.step_goal}`,
          },
        ],
      };
    }
    return this.sanitizeResult(result);
  }

  private async think(step: StepSchema, task: TaskSchema): Promise<boolean> {
    const toolCall = await this.llm.toolCall({
      step,
      task,
      tool: this.tool.toParams(),
    });
    if (!toolCall) {
      return false;
    }
    this.toolCall = toolCall;
    return true;
  }

  private async buildToolCallContext(
    step: StepSchema,
    plan: PlanSchema,
  ): Promise<ChatCompletionAssistantMessageParam[]> {
    const completedTask = plan.tasks.filter((t) => t.status === 'done');
    if (completedTask.length === 0) {
      return [];
    }
    const historyLines = completedTask
      .map((task) => {
        const stepsText = task.steps
          .map(
            (step) =>
              `- step: ${step.step_goal}\n- step_id: ${step.step_uuid}\n- result_summary_hint: ${step.result_summary_hint}`,
          )
          .join('\n');
        return `- task: ${task.task_goal}\n${stepsText}`;
      })
      .join('\n');
    const decision = await this.llm.toolContext({
      step,
      historyContext: historyLines,
      tool: this.tool.toParams(),
    });
    if (!decision.use_context || decision.steps.length === 0) {
      return [];
    }
    const toolMessage: ChatCompletionAssistantMessageParam[] = [];
    for (const stepId of decision.steps) {
      const step = await agentDb.toolResult.get(stepId);
      if (!step || step.isError || !step.tool) {
        continue;
      }
      toolMessage.push({
        role: 'assistant',
        content: `Observation:
*${step.tool.function.name}*执行完成，得到以下结果（供当前推理使用）：
${this.truncate(step.result, 1200)}
`,
      });
    }
    return toolMessage;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}...`;
  }

  private async act(
    toolCall: ToolCallResponse,
    context: ChatCompletionAssistantMessageParam[],
  ): Promise<CallToolResult> {
    if (this.needContext) {
      return await this.executeTool(toolCall, this.tool, context);
    }
    return await this.executeTool(toolCall, this.tool);
  }

  abstract executeTool(
    toolCall: ToolCallResponse,
    tool: ToolBase,
    context?: ChatCompletionAssistantMessageParam[],
  ): Promise<CallToolResult>;

  private sanitizeResult(result: CallToolResult): ICallToolResult {
    if (!result || !Array.isArray(result.content)) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid tool result from ${this.tool.name}: missing content array`,
          },
        ],
        isError: true,
      };
    }
    if (result.content.length > 1) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid tool result from ${this.tool.name}: Multi-result tools are not supported.`,
          },
        ],
        isError: true,
      };
    }
    const invalidItem = result.content.find(
      (item) => item.type !== 'text' && item.type !== 'image',
    );
    if (invalidItem) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid tool result from ${this.tool.name}: unsupported content type ${String(
              invalidItem.type,
            )}`,
          },
        ],
        isError: true,
      };
    }
    return result;
  }
}
