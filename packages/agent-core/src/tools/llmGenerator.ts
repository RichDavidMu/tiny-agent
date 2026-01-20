import type { ChatCompletionMessageToolCall } from '@mlc-ai/web-llm';
import { ToolCall } from '@/tools/toolCall.ts';
import type { ToolResponse } from '@/types/tool';
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
  async executeTool(
    toolCall: ChatCompletionMessageToolCall,
    _tool: ToolBase,
  ): Promise<ToolResponse> {
    const params = JSON.parse(toolCall.function.arguments);
    const res = await this.llm.ask({
      messages: [{ role: 'user', content: params.task }],
      stream: true,
    });
    return {
      content: [{ type: 'text', text: res }],
    };
  }
}
