// MCP 客户端管理器 - 支持多个 MCP 服务器
import { remove, unionBy } from 'lodash';
import type { ToolActor } from '../core';
import type { MCPClientOptions, MCPServerConfig } from './types.ts';
import { MCPClient } from './client.ts';

const MCP_CONFIG = 'MCP_CONFIG';

interface McpConfigType {
  servers: MCPServerConfig[];
}

function getConfigCache(): McpConfigType {
  try {
    return JSON.parse(localStorage.getItem(MCP_CONFIG) || '');
  } catch (_) {
    return { servers: [] };
  }
}

function setConfigCache(config: McpConfigType) {
  try {
    localStorage.setItem(MCP_CONFIG, JSON.stringify(config));
  } catch (_) {
    // do nothing
  }
}

export class MCPClientHost {
  private readonly builtinServer: MCPServerConfig[] = [
    {
      url: 'https://renbaicai.site/ddgs/mcp',
      name: 'web_search',
      builtin: true,
    },
  ];
  private config: McpConfigType = { servers: [] };
  private readonly toolActor: ToolActor;
  private clients: Map<string, MCPClient> = new Map();
  private readonly initPromise: Promise<void>;

  constructor(toolActor: ToolActor) {
    this.toolActor = toolActor;
    this.initPromise = this.init();
  }

  async init() {
    const cache = getConfigCache();
    cache.servers = unionBy(cache.servers, this.builtinServer, 'name');
    for (let i = 0; i < cache.servers.length; i++) {
      await this.addServer(cache.servers[i]);
    }
  }

  async waitForReady(): Promise<void> {
    await this.initPromise;
  }

  async addServer(config: MCPServerConfig, options?: MCPClientOptions): Promise<MCPClient> {
    if (this.clients.has(config.name)) {
      throw new Error(`MCP server ${config.name} already exists`);
    }
    const client = new MCPClient(config, options);
    await client.connect();
    this.config.servers.push(config);
    this.clients.set(config.name, client);
    this.toolActor.addTools(client.getToolCall());
    setConfigCache(this.config);
    return client;
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
      this.toolActor.deleteTool(name);
      remove(this.config.servers, (s) => s.name === name);
      setConfigCache(this.config);
    }
  }

  getServers(): MCPServerConfig[] {
    return this.config.servers;
  }
}
