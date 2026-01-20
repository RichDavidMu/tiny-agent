import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';
import type { ChatCompletionTool } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import type { Memory } from './memory.ts';
import { ValueError } from './exceptions.ts';
// console.log(prebuiltAppConfig);
export class LLM {
  model_id: string;
  client: MLCEngine | null = null;
  progressText: string = '';
  ready = false;
  constructor({ model_id = 'Qwen3-4B-q4f16_1-MLC' }: { model_id?: string } = {}) {
    this.model_id = model_id;
    void this.load();
  }

  async load() {
    this.client = await CreateMLCEngine(
      this.model_id,
      {
        initProgressCallback: (progress) => {
          this.progressText = progress.text;
        },
      },
      { context_window_size: 32768 },
    );
    console.log('loaded');
    // this.tokenizer = await asyncLoadTokenizer(this.model_id);
    this.ready = true;
  }

  async ask({ messages, stream = true }: { messages: Memory['messages']; stream?: boolean }) {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    if (!stream) {
      const response = await this.client.chat.completions.create({
        messages,
        stream,
      });
      if (!response.choices[0].message.content) {
        throw new ValueError('Empty or invalid response from LLM');
      }
      return response.choices[0].message.content;
    }
    const response = await this.client.chat.completions.create({
      messages,
      stream,
    });
    const collectedMessages: string[] = [];
    for await (const chunk of response) {
      const chunk_message = chunk.choices[0].delta?.content || '';
      console.log(collectedMessages.join(''));
      collectedMessages.push(chunk_message);
    }
    const fullResponse = collectedMessages.join('').trim();
    if (!fullResponse) {
      throw new ValueError('Empty response from streaming LLM');
    }
    return fullResponse;
  }
  async askTool({ messages, tool }: { messages: Memory['messages']; tool: ChatCompletionTool }) {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    const response = await this.client.chat.completions.create({
      messages,
      tools: [tool],
      tool_choice: { type: 'function', function: { name: tool.function.name } },
    });
    if (!response.choices[0].message.tool_calls?.length) {
      throw new ValueError('No tool calls found');
    }
    return response.choices[0].message.tool_calls;
  }
}
export default new LLM();
