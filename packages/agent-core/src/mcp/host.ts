// MCP 客户端管理器 - 支持多个 MCP 服务器
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolCall } from '../tools/toolCall.ts';
import type { MCPClientOptions, MCPServerConfig } from './types.ts';
import { MCPClient } from './client.ts';

export class MCPClientHost {
  private clients: Map<string, MCPClient> = new Map();

  async addServer(config: MCPServerConfig, options?: MCPClientOptions): Promise<MCPClient> {
    if (this.clients.has(config.name)) {
      throw new Error(`MCP server ${config.name} already exists`);
    }

    const client = new MCPClient(config, options);
    await client.connect();
    this.clients.set(config.name, client);
    return client;
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  getAllClients(): MCPClient[] {
    return Array.from(this.clients.values());
  }

  // 获取所有服务器的所有工具
  getAllTools(): { serverName: string; tool: Tool }[] {
    const allTools: { serverName: string; tool: Tool }[] = [];
    for (const client of this.clients.values()) {
      for (const tool of client.tools) {
        allTools.push({
          serverName: client.serverName,
          tool,
        });
      }
    }
    return allTools;
  }

  getToolCalls(): ToolCall[] {
    const allTools: ToolCall[] = [];
    for (const client of this.clients.values()) {
      for (const tool of client.getToolCall()) {
        allTools.push(tool);
      }
    }
    return allTools;
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map((client) =>
      client.disconnect(),
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
  }
}
