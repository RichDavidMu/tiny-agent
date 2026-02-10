/**
 * MCP 工具包装器
 * 将 MCP 工具转换为 agent-core 的 ToolCall 格式
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolCall } from '../tools/toolCall.ts';
import ToolBase from '../tools/toolBase.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type { MCPClient } from './client.ts';

// MCP 工具适配为 ToolBase
class MCPToolAdapter extends ToolBase {
  schema: Tool;

  constructor(mcpTool: Tool) {
    super();
    this.schema = mcpTool;
  }
}

// MCP 工具的 ToolCall 包装器
export class MCPToolCall extends ToolCall {
  tool: ToolBase;
  private mcpClient: MCPClient;
  private readonly toolName: string;

  constructor(mcpClient: MCPClient, mcpTool: Tool) {
    super();
    this.mcpClient = mcpClient;
    this.toolName = mcpTool.name;
    this.tool = new MCPToolAdapter(mcpTool);
  }

  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<CallToolResult> {
    try {
      const args = toolCall.function.arguments;
      return await this.mcpClient.callTool(this.toolName, args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      };
    }
  }
}
