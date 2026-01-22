import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type LLM, toolLLM } from '../llm/llm.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type ToolBase from './toolBase.ts';

export abstract class ToolCall {
  abstract tool: ToolBase;

  llm: LLM = toolLLM;

  toolCall: ToolCallResponse | null = null;

  async step(task: string): Promise<CallToolResult> {
    const shouldAct = await this.think(task);
    console.log('shouldAct\n', shouldAct, '\n', 'toolCall:\n', this.toolCall);
    if (shouldAct) {
      const result = await this.act(this.toolCall!);
      return this.sanitizeResult(result);
    }
    return {
      content: [
        {
          type: 'text',
          text: `${this.tool.name}: toolCall success, No action needed. task: ${task}`,
        },
      ],
    };
  }

  private async think(task: string): Promise<boolean> {
    const toolCall = await this.llm.toolCall({
      task,
      tool: this.tool.toParams(),
    });
    if (!toolCall) {
      return false;
    }
    this.toolCall = toolCall;
    return true;
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
}
