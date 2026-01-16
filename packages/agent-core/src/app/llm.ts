import { CreateMLCEngine, type MLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import type { Memory } from '@/app/memory.ts';
import { ValueError } from '@/app/exceptions.ts';
console.log(prebuiltAppConfig);
class LLM {
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
    // this.tokenizer = await asyncLoadTokenizer(this.model_id);
    this.ready = true;
  }

  async ask({ messages, stream = true }: { messages: Memory['messages']; stream?: boolean }) {
    if (!this.client) {
      return;
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
  }
}
export default new LLM();
