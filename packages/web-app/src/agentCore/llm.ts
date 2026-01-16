import { CreateMLCEngine, type MLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { action, makeObservable, observable, runInAction } from 'mobx';
console.log(prebuiltAppConfig);
const LLM_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
class LLM {
  client: MLCEngine | null = null;
  progress: number = 100;
  constructor() {
    makeObservable(this, {
      progress: observable,
      load: action,
    });
    void this.load();
  }

  async load() {
    this.client = await CreateMLCEngine(LLM_ID, {
      initProgressCallback: (progress) => {
        runInAction(() => {
          this.progress = progress.progress;
        });
      },
    });
  }
}
export default new LLM();
