import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionTool } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';

export default abstract class ToolBase {
  get name(): string {
    return this.schema.name;
  }

  toolChoice: 'none' | 'auto' = 'auto';

  get description(): string {
    return this.schema.description || '';
  }

  abstract schema: Tool;

  toParams(): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.schema.name,
        description: this.schema.description,
        parameters: {
          type: this.schema.inputSchema.type,
          properties: this.schema.inputSchema.properties,
          required: this.schema.inputSchema.required,
        },
      },
    };
  }
}
