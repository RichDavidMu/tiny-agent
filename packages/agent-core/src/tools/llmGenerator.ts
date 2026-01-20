import type { ToolResponse } from '../types/tool';
import type { ToolCallResponse } from '../types/llm.ts';
import { ToolCall } from './toolCall.ts';
import ToolBase from './toolBase';

class LLMGeneratorTool extends ToolBase {
  schema = {
    name: 'llm_generator',
    description: '使用大模型生成工具生成自然语言，总结文本，翻译文本等',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task: {
          type: 'string',
          description: '任务描述',
        },
      },
      required: ['task'],
    },
  };
}

export class LLMGenerator extends ToolCall {
  tool = new LLMGeneratorTool();
  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<ToolResponse> {
    const args = toolCall.function.arguments;
    if (typeof args.task !== 'string') {
      return {
        error: {
          type: 'invalid_argument',
          message: 'Missing required argument: url',
        },
      };
    }
    const res = await this.llm.askLLM({
      messages: [{ role: 'user', content: args.task }],
      stream: true,
    });
    return {
      content: [{ type: 'text', text: res }],
    };
  }
}
