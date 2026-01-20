/**
 * MCP Bridge 扩展消息类型
 */

// 扩展标识符，用于检测安装状态
export const MCP_BRIDGE_ID = '__MCP_BRIDGE_EXTENSION__';
export const MCP_BRIDGE_VERSION = '0.1.0';
export const MCP_BRIDGE_READY_EVENT = 'MCP_BRIDGE_READY';

// 扩展信息（注入到 window 上）
export interface MCPBridgeInfo {
  installed: boolean;
  version: string;
}

// 扩展 MCPBridgeInfo，包含 MessagePort 支持
export interface MCPBridgeWindow extends MCPBridgeInfo {
  port: MessagePort | null;
  onPortReady: ((port: MessagePort) => void) | null;
}

// 消息类型
export type MCPBridgeMessageType =
  | 'MCP_BRIDGE_PING'
  | 'MCP_BRIDGE_PONG'
  | 'MCP_BRIDGE_REQUEST'
  | 'MCP_BRIDGE_RESPONSE'
  | 'MCP_BRIDGE_STREAM_CHUNK'
  | 'MCP_BRIDGE_STREAM_END'
  | 'MCP_BRIDGE_STREAM_ERROR'
  | 'MCP_BRIDGE_CHANNEL_INIT'
  | 'MCP_BRIDGE_CHANNEL_READY';

// 基础消息结构
export interface MCPBridgeMessage {
  type: MCPBridgeMessageType;
  id: string;
}

// Ping 消息
export interface MCPBridgePing extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_PING';
}

// Pong 响应
export interface MCPBridgePong extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_PONG';
  version: string;
}

// MCP 请求
export interface MCPBridgeRequest extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_REQUEST';
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  stream?: boolean; // 是否需要流式响应
}

// MCP 响应（完整响应）
export interface MCPBridgeResponse extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_RESPONSE';
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}

// 流式响应 - 数据块
export interface MCPBridgeStreamChunk extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_STREAM_CHUNK';
  chunk: string;
  // 首个 chunk 包含响应头信息
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

// 流式响应 - 结束
export interface MCPBridgeStreamEnd extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_STREAM_END';
}

// 流式响应 - 错误
export interface MCPBridgeStreamError extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_STREAM_ERROR';
  error: string;
}

// Channel 初始化消息 - 用于建立 MessageChannel
export interface MCPBridgeChannelInit extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_CHANNEL_INIT';
}

// Channel 就绪确认
export interface MCPBridgeChannelReady extends MCPBridgeMessage {
  type: 'MCP_BRIDGE_CHANNEL_READY';
}

export type MCPBridgeMessages =
  | MCPBridgePing
  | MCPBridgePong
  | MCPBridgeRequest
  | MCPBridgeResponse
  | MCPBridgeStreamChunk
  | MCPBridgeStreamEnd
  | MCPBridgeStreamError
  | MCPBridgeChannelInit
  | MCPBridgeChannelReady;
