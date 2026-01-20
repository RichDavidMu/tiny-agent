/**
 * 浏览器环境 MCP 客户端
 * 基于 JSON-RPC 2.0 协议
 */

import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolCall } from '../tools/toolCall.ts';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPClientOptions,
  MCPServerConfig,
} from './types.ts';
import { bridgeFetch } from './bridge.ts';
import { MCPToolCall } from './toolWrapper.ts';

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

  getToolCall(): ToolCall[] {
    return this.tools.map((tool) => new MCPToolCall(this, tool));
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
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await bridgeFetch(this.serverConfig.url, {
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

    const contentType = response.headers.get('Content-Type') || '';
    let jsonResponse: JsonRpcResponse;

    if (contentType.includes('text/event-stream')) {
      // 解析 SSE 流
      jsonResponse = await this.parseSSEResponse(response);
    } else {
      // 直接解析 JSON
      jsonResponse = await response.json();
    }

    if (jsonResponse.error) {
      throw new Error(
        `MCP error: ${jsonResponse.error.message} (code: ${jsonResponse.error.code})`,
      );
    }

    return jsonResponse.result as T;
  }

  /**
   * 解析 SSE 响应，提取最终的 JSON-RPC 结果
   */
  private async parseSSEResponse(response: Response): Promise<JsonRpcResponse> {
    const text = await response.text();
    const lines = text.split('\n');

    let lastData: string | null = null;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        lastData = line.slice(6);
      }
    }

    if (!lastData) {
      throw new Error('No data in SSE response');
    }

    return JSON.parse(lastData);
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
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    await bridgeFetch(this.serverConfig.url, {
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
