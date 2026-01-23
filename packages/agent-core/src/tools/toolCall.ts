import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type LLM, toolLLM } from '../llm/llm.ts';
import { agentDb } from '../storage/db.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type { PlanSchema, StepSchema } from '../types/planer.ts';
import type ToolBase from './toolBase.ts';

export abstract class ToolCall {
  abstract tool: ToolBase;

  llm: LLM = toolLLM;

  toolCall: ToolCallResponse | null = null;

  async step(step: StepSchema, plan: PlanSchema): Promise<CallToolResult> {
    const toolContext = await this.buildToolCallContext(step, plan);
    const shouldAct = await this.think(step, toolContext);
    console.log('shouldAct\n', shouldAct, '\n', 'toolCall:\n', this.toolCall);
    let result: CallToolResult;
    if (shouldAct) {
      result = await this.act(this.toolCall!);
      const sanitized = this.sanitizeResult(result);
      await this.persistResult(sanitized, step);
      return sanitized;
    }
    result = {
      content: [
        {
          type: 'text',
          text: `${this.tool.name}: toolCall success, No action needed. task: ${step.step_goal}`,
        },
      ],
    };
    await this.persistResult(result, step);
    return result;
  }

  private async think(step: StepSchema, context: string): Promise<boolean> {
    const toolCall = await this.llm.toolCall({
      step,
      tool: this.tool.toParams(),
      context,
    });
    if (!toolCall) {
      return false;
    }
    this.toolCall = toolCall;
    return true;
  }

  private async buildToolCallContext(step: StepSchema, plan: PlanSchema): Promise<string> {
    const completedTask = plan.tasks.filter((t) => t.status === 'completed');
    if (completedTask.length === 0) {
      return '';
    }
    const historyLines = completedTask
      .map(
        (task) =>
          `- task: ${task.task_goal}
         ${task.steps.map(
           (step) =>
             `\n- step: ${step.step_goal}
             - file: ${step.result_file}
             - fileHint: ${step.result_summary_hint}\n
             `,
         )}`,
      )
      .join('\n');
    const decision = await this.llm.toolContext({
      step,
      historyContext: historyLines,
      tool: this.tool.toParams(),
    });
    if (!decision.use_context || decision.files.length === 0) {
      return '';
    }

    const fileSections: string[] = [];
    for (const fileName of decision.files) {
      const files = await agentDb.file.findByName(fileName);
      const file = files[files.length - 1];
      if (!file) {
        continue;
      }
      if (!file.mimeType.startsWith('text/')) {
        fileSections.push(`[file ${file.name} id=${file.id}] non-text content (${file.mimeType})`);
        continue;
      }
      fileSections.push(`[file ${file.name} id=${file.id}]\n${this.truncate(file.content, 1200)}`);
    }
    return [...historyLines, ...fileSections].join('\n');
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}...`;
  }

  private async act(toolCall: ToolCallResponse): Promise<CallToolResult> {
    return await this.executeTool(toolCall, this.tool);
  }
  abstract executeTool(toolCall: ToolCallResponse, tool: ToolBase): Promise<CallToolResult>;

  private sanitizeResult(result: CallToolResult): CallToolResult {
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

  private async persistResult(result: CallToolResult, step: StepSchema): Promise<void> {
    const fileName = step.result_file;
    if (result.isError) {
      const errorText = this.collectTextContent(result) || 'Unknown tool error';
      await agentDb.file.create({
        name: fileName,
        mimeType: 'text/plain',
        content: errorText,
      });
      return;
    }
    const textContent = this.collectTextContent(result);
    await agentDb.file.create({
      name: fileName,
      mimeType: 'text/plain',
      content: textContent,
    });
  }

  private collectTextContent(result: CallToolResult): string {
    return result.content
      .filter((item) => item.type === 'text')
      .map((item) => ('text' in item ? String(item.text ?? '') : ''))
      .filter((text) => text.length > 0)
      .join('\n\n');
  }
}
