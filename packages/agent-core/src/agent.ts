import { PlanAndRethink } from './planAndRethink/planer.ts';
import { planLLM } from './llm/llm.ts';
import { MCPClientHost } from './mcp';

export class Agent {
  llm = planLLM;
  planer = new PlanAndRethink();
  mcpHost = new MCPClientHost();
  constructor() {
    this.init();
  }
  async init() {
    await this.initMcp();
  }

  async initMcp() {
    try {
      await this.mcpHost.addServer({ name: 'ddgs-search', url: 'https://renbaicai.site/ddgs/mcp' });
      const tools = this.mcpHost.getToolCalls();
      this.planer.setMCPTools(tools);
    } catch (e) {
      console.log(e);
    }
  }

  async task(input: string) {
    return await this.planer.plan(input);
  }
}
