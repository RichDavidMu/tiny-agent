/**
 * MCP 客户端类型定义
 */

// JSON-RPC 请求
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

// JSON-RPC 响应
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP 服务器配置
export interface MCPServerConfig {
  name: string;
  url: string; // MCP 服务器 HTTP 端点
  builtin?: boolean; // 是否是内建工具，不可删除
}

// MCP 客户端选项
export interface MCPClientOptions {
  clientName?: string;
  clientVersion?: string;
}
