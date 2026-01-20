import { PlanAndRethink } from './planAndReflect/planer.ts';
import { planLLM } from './llm/llm.ts';

export class Agent {
  llm = planLLM;
  planer = new PlanAndRethink();

  async task(input: string) {
    return await this.planer.plan(input);
  }
}
