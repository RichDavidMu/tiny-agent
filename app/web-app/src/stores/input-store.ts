import { makeAutoObservable } from 'mobx';
import { toast } from 'sonner';
import stream from '@/stream/stream.ts';

export class InputStore {
  input: string = '';
  constructor() {
    makeAutoObservable(this);
  }
  setInput(text: string) {
    this.input = text;
  }

  async handleSend() {
    if (!this.input.trim()) {
      toast.info('please input your prompt');
      return;
    }
    if (stream.loading) {
      toast.info('task running, please wait for a while');
      return;
    }
    if (!stream.ready) {
      toast.info('please wait for llm ready');
      return;
    }
    await stream.task({ input: this.input });
  }
}
