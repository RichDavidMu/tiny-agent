import { CreateMLCEngine, type MLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';
import { action, makeObservable, observable, runInAction } from 'mobx';
console.log(prebuiltAppConfig);
const LLM_ID = 'Qwen3-4B-q4f16_1-MLC';
class LLM {
  client: MLCEngine | null = null;
  progressText: string = '';
  constructor() {
    makeObservable(this, {
      progressText: observable,
      load: action,
    });
    void this.load();
  }

  async load() {
    this.client = await CreateMLCEngine(
      LLM_ID,
      {
        initProgressCallback: (progress) => {
          runInAction(() => {
            this.progressText = progress.text;
          });
        },
      },
      { context_window_size: 32768 },
    );
  }
}
export default new LLM();
