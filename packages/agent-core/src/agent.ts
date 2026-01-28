import { AgentController, ToolActor } from './core';
import { MCPClientHost } from './mcp';
import { WritingExpert } from './tools/writingExpert.ts';
import { JavascriptExecutor } from './tools/javascriptExecutor.ts';
import { planLLM } from './llm/llm.ts';
import { CodeExpert } from './tools/codeExpert.ts';

export class Agent {
  mcpHost = new MCPClientHost();
  llm = planLLM;
  private readonly toolActor: ToolActor;
  private controller: AgentController;

  constructor() {
    // Initialize with built-in tools
    const builtinTools = [new WritingExpert(), new JavascriptExecutor(), new CodeExpert()];
    this.toolActor = new ToolActor(builtinTools);
    this.controller = new AgentController(this.toolActor);

    void this.init();
  }

  async init(): Promise<void> {
    await this.initMcp();
  }

  async initMcp(): Promise<void> {
    try {
      await this.mcpHost.addServer({ name: 'ddgs-search', url: 'https://renbaicai.site/ddgs/mcp' });
      const mcpTools = this.mcpHost.getToolCalls();
      this.toolActor.addTool(mcpTools);
    } catch (e) {
      console.log(e);
    }
  }

  async task(input: string): Promise<string> {
    return await this.controller.execute(input);
  }
}
