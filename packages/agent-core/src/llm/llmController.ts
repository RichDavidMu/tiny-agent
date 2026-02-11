import { LLM } from './llm.ts';

const DEFAULT_MODEL = 'Qwen3-4B-q4f16_1-MLC';

class LLMController {
  public planLLM: LLM;
  public toolLLM: LLM;

  constructor() {
    this.planLLM = new LLM({ model_id: DEFAULT_MODEL });
    this.toolLLM = this.planLLM;
  }
  get ready() {
    return this.planLLM.ready && this.toolLLM.ready;
  }
}

export default new LLMController();
