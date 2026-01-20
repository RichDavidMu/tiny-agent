import { type LLM, toolLLM } from '../llm/llm.ts';
import type { ToolResponse } from '../types/tool.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type ToolBase from './toolBase.ts';

export abstract class ToolCall {
  abstract tool: ToolBase;

  llm: LLM = toolLLM;

  toolCall: ToolCallResponse | null = null;

  async step(task: string) {
    const shouldAct = await this.think(task);
    console.log('shouldAct\n', shouldAct, '\n', 'toolCall:\n', this.toolCall);
    if (shouldAct) {
      return await this.act(this.toolCall!);
    }
    return [];
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
  private async act(toolCall: ToolCallResponse): Promise<ToolResponse> {
    return await this.executeTool(toolCall, this.tool);
  }
  abstract executeTool(toolCall: ToolCallResponse, tool: ToolBase): Promise<ToolResponse>;
}
