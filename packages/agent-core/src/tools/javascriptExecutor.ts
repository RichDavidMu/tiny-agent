import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolCallResponse } from '../types/llm.ts';
import { ToolCall } from './toolCall.ts';
import ToolBase from './toolBase';

class JSExecuteTool extends ToolBase {
  schema = {
    name: 'javascript_execute',
    description: '执行一段 JavaScript 代码，并返回运行结果',
    inputSchema: {
      type: 'object' as const,
      properties: {
        code: {
          type: 'string',
          description: '需要执行的代码',
        },
      },
      required: ['code'],
    },
  };
}

export class JavascriptExecutor extends ToolCall {
  tool = new JSExecuteTool();
  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<CallToolResult> {
    try {
      const args = toolCall.function.arguments;

      if (typeof args.code !== 'string') {
        return {
          content: [{ type: 'text', text: 'Missing required argument: code' }],
          isError: true,
        };
      }

      // 使用 AsyncFunction 执行代码，支持 await
      const fn = new Function(args.code);
      const result = Promise.resolve(fn());

      return {
        content: [
          {
            type: 'text',
            text: result !== undefined ? JSON.stringify(result, null, 2) : 'undefined',
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      };
    }
  }
}
