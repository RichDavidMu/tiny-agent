import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import type { ToolCallResponse } from '../types/llm.ts';
import { ValueError } from './exceptions.ts';
import { ToolCallSystemPrompt, ToolCallUserPrompt } from './prompt.ts';
export class LLM {
  model_id: string;
  client: MLCEngine | null = null;
  progressText: string = '';
  ready = false;
  constructor({ model_id = 'Qwen3-4B-q4f16_1-MLC' }: { model_id?: string } = {}) {
    this.model_id = model_id;
    void this.load();
  }
  async reload(): Promise<void> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    await this.client.reload(this.model_id);
    console.log(this.model_id, ' reloaded');
  }

  async unload(): Promise<void> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    await this.client.unload();
    console.log(this.model_id, ' unloaded');
  }

  async load(): Promise<void> {
    this.client = await CreateMLCEngine(
      this.model_id,
      {
        initProgressCallback: (progress) => {
          this.progressText = progress.text;
        },
      },
      { context_window_size: 32768 },
    );
    await this.unload();
    this.ready = true;
  }

  async askLLM({
    messages,
    stream = true,
  }: {
    messages: Array<ChatCompletionMessageParam>;
    stream?: boolean;
  }) {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    await this.reload();
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
    await this.unload();
    return fullResponse;
  }
  async toolCall({ task, tool }: { task: string; tool: ChatCompletionTool }) {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: ToolCallSystemPrompt(JSON.stringify(tool, null, 2)) },
      { role: 'user', content: ToolCallUserPrompt(task) },
    ];
    const response = await this.client.chat.completions.create({
      messages,
    });
    const content = response.choices[0].message.content;
    if (!content || !content.includes('</think>')) {
      throw new ValueError('Empty response from LLM');
    }
    const toolCall = content.split('</think>')[1];
    return JSON.parse(toolCall) as ToolCallResponse;
  }
}
export const planLLM = new LLM();
export const toolLLM = planLLM;
