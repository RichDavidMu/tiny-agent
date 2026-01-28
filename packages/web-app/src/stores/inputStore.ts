import { makeAutoObservable } from 'mobx';
// import { toast } from 'sonner';
// import type { ChatCompletion } from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import { Agent } from 'agent-core';
import { createTask } from '@/lib/async.ts';
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class InputStore {
  input: string = '';
  messages: ChatMessage[] = [];
  agent = new Agent();
  constructor() {
    makeAutoObservable(this);
  }
  loading = false;
  setInput(text: string) {
    this.input = text;
  }

  // *handleSend(): Generator<Promise<ChatCompletion>, void, ChatCompletion> {
  async handleSend() {
    // throw new Error('Function not implemented.');
    if (!this.input.trim() || this.loading) return;
    const [ready, resolve] = createTask<boolean>();
    const timer = setInterval(() => {
      if (this.agent.llm.ready) {
        resolve(true);
        clearInterval(timer);
      }
    }, 1000);
    await ready;
    const plan = await this.agent.task(this.input);
    // if (!llm.client) {
    //   toast.error('Loading model...');
    //   return;
    // }
    // const userMessage: ChatMessage = { role: 'user', content: this.input };
    // this.messages.push(userMessage);
    // this.input = '';
    this.loading = true;
    // try {
    //   const reply = yield llm.client.chat.completions.create({
    //     messages: this.messages,
    //   });
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: plan,
    };
    this.messages.push(assistantMessage);
    // } catch (error) {
    //   toast.error('Failed to get response:' + error);
    //   const errorMessage: ChatMessage = {
    //     role: 'assistant',
    //     content: 'Sorry, I encountered an error. Please try again.',
    //   };
    //   this.messages.push(errorMessage);
    // } finally {
    this.loading = false;
    // }
  }
}
