import { type ChatCompletionMessageParam } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';

export class Memory {
  messages: Array<ChatCompletionMessageParam> = [];
  maxMessages: number;
  constructor({ maxMessages = 100 }: { maxMessages?: number } = {}) {
    this.maxMessages = maxMessages;
  }
  addMessage(message: ChatCompletionMessageParam) {
    this.messages = [...this.messages, message];
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
  getRecentMessages(n: number) {
    return this.messages.slice(-n);
  }
  addMessages(messages: Array<ChatCompletionMessageParam>) {
    this.messages = [...this.messages, ...messages];
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }
  clear() {
    this.messages = [];
  }
}
