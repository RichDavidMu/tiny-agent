import { makeAutoObservable } from 'mobx';
import { toast } from 'sonner';
import type { ChatCompletion } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import llm from '@/agentCore/llm.ts';

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
  *handleSend(): Generator<Promise<ChatCompletion>, void, ChatCompletion> {
    if (!this.input.trim() || this.loading) return;
    if (!llm.client) {
      toast.error('Loading model...');
      return;
    }
    const userMessage: ChatMessage = { role: 'user', content: this.input };
    this.messages.push(userMessage);
    this.input = '';
    this.loading = true;
    try {
      const reply = yield llm.client.chat.completions.create({
        messages: this.messages,
      });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply.choices[0].message.content || '',
      };
      this.messages.push(assistantMessage);
    } catch (error) {
      toast.error('Failed to get response:' + error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      this.messages.push(errorMessage);
    } finally {
      this.loading = false;
    }
  }
}
