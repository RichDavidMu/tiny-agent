/**
 * 浏览器环境 MCP 客户端
 * 基于 JSON-RPC 2.0 协议
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPClientOptions,
  MCPServerConfig,
} from './types.ts';

export class MCPClient {
  private serverConfig: MCPServerConfig;
  private options: MCPClientOptions;
  private _tools: Tool[] = [];
  private connected: boolean = false;
  private requestId: number = 0;
  private sessionId: string | null = null;

  constructor(serverConfig: MCPServerConfig, options: MCPClientOptions = {}) {
    this.serverConfig = serverConfig;
    this.options = {
      clientName: options.clientName || 'agent-core-browser',
      clientVersion: options.clientVersion || '1.0.0',
    };
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get serverName(): string {
    return this.serverConfig.name;
  }

  get tools(): Tool[] {
    return this._tools;
  }

  private nextId(): number {
    return ++this.requestId;
  }

  private async sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await fetch(this.serverConfig.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // 保存 session ID
    const newSessionId = response.headers.get('Mcp-Session-Id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const jsonResponse: JsonRpcResponse = await response.json();

    if (jsonResponse.error) {
      throw new Error(
        `MCP error: ${jsonResponse.error.message} (code: ${jsonResponse.error.code})`,
      );
    }

    return jsonResponse.result as T;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 发送 initialize 请求
      const initResult = await this.sendRequest<{
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
      }>('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: this.options.clientName,
          version: this.options.clientVersion,
        },
      });

      console.log(
        `Connected to MCP server: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`,
      );

      // 发送 initialized 通知
      await this.sendNotification('notifications/initialized');

      this.connected = true;

      // 获取工具列表
      await this.refreshTools();
    } catch (error) {
      this.connected = false;
      throw new Error(
        `Failed to connect to MCP server ${this.serverConfig.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async sendNotification(method: string, params?: Record<string, unknown>): Promise<void> {
    const request = {
      jsonrpc: '2.0' as const,
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    await fetch(this.serverConfig.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.sessionId = null;
    this._tools = [];
  }

  async refreshTools(): Promise<Tool[]> {
    if (!this.connected) {
      throw new Error('MCP client is not connected');
    }

    const response = await this.sendRequest<{ tools: Tool[] }>('tools/list');
    this._tools = response.tools;
    return this._tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    if (!this.connected) {
      throw new Error('MCP client is not connected');
    }

    const result = await this.sendRequest<CallToolResult>('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  getTool(name: string): Tool | undefined {
    return this._tools.find((t) => t.name === name);
  }
}

// MCP 客户端管理器 - 支持多个 MCP 服务器
export class MCPClientManager {
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

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map((client) =>
      client.disconnect(),
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
  }
}
