import llmController from '../llm/llmController.ts';
import { MCPClientHost } from '../mcp';
import { AgentController, ToolActor } from '../core';
import type { AgentChunk } from './proto';
import { TaskCtx } from './handlers/task.ts';

class Service {
  private readonly toolActor = new ToolActor();
  private mcpHost = new MCPClientHost(this.toolActor);

  private async waitForReady(): Promise<void> {
    if (llmController.ready) return;
    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (llmController.ready) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  }

  async taskStream(params: { input: string }): Promise<ReadableStream<AgentChunk>> {
    await this.waitForReady();
    const ctx = new TaskCtx({ req: params });
    const agent = new AgentController(this.toolActor, ctx);
    agent.execute();
    return ctx.rs;
  }

  async addMcpServer(name: string, url: string): Promise<void> {
    await this.mcpHost.addServer({ name, url });
  }

  async removeMcpServer(name: string): Promise<void> {
    await this.mcpHost.removeServer(name);
  }

  enableTool(name: string): void {
    this.toolActor.enableTool(name);
  }

  disableTool(name: string): void {
    this.toolActor.disableTool(name);
  }
}

const service = new Service();
export { service, Service };
