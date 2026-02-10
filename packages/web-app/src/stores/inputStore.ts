import { makeAutoObservable } from 'mobx';
// import { toast } from 'sonner';
// import type { ChatCompletion } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class InputStore {
  input: string = '';
  messages: ChatMessage[] = [];
  constructor() {
    makeAutoObservable(this);
  }
  loading = false;
  setInput(text: string) {
    this.input = text;
  }

  // *handleSend(): Generator<Promise<ChatCompletion>, void, ChatCompletion> {
  async handleSend() {
    if (!this.input.trim() || this.loading) return;
    const userInput = this.input;
    this.messages.push({ role: 'user', content: userInput });
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    this.messages.push(assistantMessage);
    this.input = '';
  }
}
