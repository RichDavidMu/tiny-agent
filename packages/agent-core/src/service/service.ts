import { MCPClientHost } from '../mcp';
import { AgentController, ToolActor } from '../core';
import { llmController } from '../llm';
import type { AgentChunk } from './proto';
import {
  type GetHistoryReq,
  TaskCtx,
  type TaskReq,
  getHistory,
  saveSessionHistory,
} from './handlers';
import { getSessionListHandler } from './handlers/session/list.ts';

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

  async taskStream(params: TaskReq): Promise<ReadableStream<AgentChunk>> {
    await this.waitForReady();
    const ctx = new TaskCtx({ req: params });
    const agent = new AgentController(this.toolActor, ctx);
    agent.execute().then(() => {
      saveSessionHistory(ctx, agent.stateMachine.getContext());
    });
    return ctx.rs;
  }

  async getSessionHistory(params: GetHistoryReq) {
    return await getHistory(params);
  }

  async getSessionList() {
    return await getSessionListHandler();
  }

  async addMcpServer(name: string, url: string): Promise<void> {
    await this.mcpHost.addServer({ name, url });
  }

  async removeMcpServer(name: string): Promise<void> {
    await this.mcpHost.removeServer(name);
  }

  async getMcpServers() {
    await this.mcpHost.waitForReady();
    return this.mcpHost.getServers();
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
