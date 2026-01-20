import type { ChatCompletionMessageToolCall } from '@mlc-ai/web-llm';
import type { LLM } from '../app/llm.ts';
import type { ToolResponse } from '../types/tool.ts';
import llm from '../app/llm.ts';
import type ToolBase from './toolBase.ts';

export abstract class ToolCall {
  abstract tool: ToolBase;

  llm: LLM = llm;

  toolCall: ChatCompletionMessageToolCall | null = null;

  async step(task: string) {
    const shouldAct = await this.think(task);
    if (shouldAct) {
      return await this.act(this.toolCall!);
    }
    return [];
  }

  private async think(task: string): Promise<boolean> {
    const toolCalls = await this.llm.askTool({
      messages: [{ role: 'user', content: task }],
      tool: this.tool.toParams(),
    });
    if (toolCalls.length === 0) {
      return false;
    }
    this.toolCall = toolCalls[0];
    return true;
  }
  private async act(toolCall: ChatCompletionMessageToolCall): Promise<ToolResponse> {
    return await this.executeTool(toolCall, this.tool);
  }
  abstract executeTool(
    toolCall: ChatCompletionMessageToolCall,
    tool: ToolBase,
  ): Promise<ToolResponse>;
}
