import type { ChatCompletionMessageToolCall } from '@mlc-ai/web-llm';
import { ToolCall } from '@/tools/toolCall.ts';
import type { ToolResponse } from '@/types/tool';
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
  async executeTool(
    toolCall: ChatCompletionMessageToolCall,
    _tool: ToolBase,
  ): Promise<ToolResponse> {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      const code = args.code as string;

      if (!code) {
        return {
          error: {
            type: 'invalid_argument',
            message: 'Missing required argument: code',
          },
        };
      }

      // 使用 AsyncFunction 执行代码，支持 await
      const fn = new Function(code);
      const result = await fn();

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
        error: {
          type: 'execution_error',
          message: errorMessage,
        },
      };
    }
  }
}
