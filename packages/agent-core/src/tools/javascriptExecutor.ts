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

      if (typeof Worker === 'undefined') {
        return {
          content: [{ type: 'text', text: 'WebWorker is not available in this environment' }],
          isError: true,
        };
      }

      const workerScript = `
        self.onmessage = async (event) => {
          const code = event.data && event.data.code;
          try {
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            const fn = new AsyncFunction(code);
            const result = await fn();
            self.postMessage({ ok: true, result });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            self.postMessage({ ok: false, error: message });
          }
        };
      `;

      const workerBlob = new Blob([workerScript], { type: 'text/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      const worker = new Worker(workerUrl);

      const response = await new Promise<{ ok: boolean; result?: unknown; error?: string }>(
        (resolve, reject) => {
          const cleanup = () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
          };

          worker.onmessage = (event) => {
            cleanup();
            resolve(event.data as { ok: boolean; result?: unknown; error?: string });
          };
          worker.onerror = (event) => {
            cleanup();
            reject(new Error(event.message || 'Worker execution failed'));
          };

          worker.postMessage({ code: args.code });
        },
      );

      if (!response.ok) {
        return {
          content: [{ type: 'text', text: response.error || 'Unknown worker error' }],
          isError: true,
        };
      }

      let textResult = 'undefined';
      if (response.result !== undefined) {
        try {
          textResult = JSON.stringify(response.result, null, 2);
        } catch {
          textResult = String(response.result);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: textResult,
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
