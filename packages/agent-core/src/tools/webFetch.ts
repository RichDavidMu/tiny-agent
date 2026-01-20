import type { ToolResponse } from '../types/tool';
import type { ToolCallResponse } from '../types/llm.ts';
import { ToolCall } from './toolCall.ts';
import ToolBase from './toolBase';

class WebFetchTool extends ToolBase {
  schema = {
    name: 'web_fetch',
    description: '获取指定 URL 的网页内容',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: '要获取内容的 URL 地址',
        },
      },
      required: ['url'],
    },
  };
}

export class WebFetcher extends ToolCall {
  tool = new WebFetchTool();

  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<ToolResponse> {
    try {
      const args = toolCall.function.arguments;
      if (typeof args.url !== 'string') {
        return {
          error: {
            type: 'invalid_argument',
            message: 'Missing required argument: url',
          },
        };
      }
      const response = await fetch(args.url);

      if (!response.ok) {
        return {
          error: {
            type: 'fetch_error',
            message: `HTTP error: ${response.status} ${response.statusText}`,
          },
        };
      }

      const contentType = response.headers.get('content-type') || '';
      let content: string;

      if (contentType.includes('application/json')) {
        const json = await response.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await response.text();
      }

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: {
          type: 'fetch_error',
          message: errorMessage,
        },
      };
    }
  }
}
