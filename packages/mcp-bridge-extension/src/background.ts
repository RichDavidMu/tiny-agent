/**
 * Background Service Worker
 * 支持普通请求和 SSE 流式请求
 */

import type {
  MCPBridgePong,
  MCPBridgeRequest,
  MCPBridgeResponse,
  MCPBridgeStreamChunk,
  MCPBridgeStreamEnd,
  MCPBridgeStreamError,
} from './types';
import { MCP_BRIDGE_VERSION } from './types';

// 处理普通消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MCP_BRIDGE_PING') {
    const pong: MCPBridgePong = {
      type: 'MCP_BRIDGE_PONG',
      id: message.id,
      version: MCP_BRIDGE_VERSION,
    };
    sendResponse(pong);
    return true;
  }

  if (message.type === 'MCP_BRIDGE_REQUEST') {
    const request = message as MCPBridgeRequest;

    if (request.stream) {
      // 流式请求通过 port 处理
      handleStreamRequest(request, sender.tab?.id);
      sendResponse({ type: 'MCP_BRIDGE_STREAM_STARTED', id: request.id });
    } else {
      // 普通请求
      handleMCPRequest(request).then(sendResponse);
    }
    return true;
  }

  return false;
});

// 处理普通请求
async function handleMCPRequest(request: MCPBridgeRequest): Promise<MCPBridgeResponse> {
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => (headers[k] = v));

    return {
      type: 'MCP_BRIDGE_RESPONSE',
      id: request.id,
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers,
      body: await response.text(),
    };
  } catch (error) {
    return {
      type: 'MCP_BRIDGE_RESPONSE',
      id: request.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 处理流式请求
async function handleStreamRequest(request: MCPBridgeRequest, tabId?: number) {
  if (!tabId) {
    console.error('[MCP Bridge] No tab ID for stream request');
    return;
  }

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => (headers[k] = v));

    if (!response.body) {
      // 没有 body，发送完整响应
      const body = await response.text();
      sendToTab(tabId, {
        type: 'MCP_BRIDGE_STREAM_CHUNK',
        id: request.id,
        chunk: body,
        status: response.status,
        statusText: response.statusText,
        headers,
      } as MCPBridgeStreamChunk);

      sendToTab(tabId, {
        type: 'MCP_BRIDGE_STREAM_END',
        id: request.id,
      } as MCPBridgeStreamEnd);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isFirst = true;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        sendToTab(tabId, {
          type: 'MCP_BRIDGE_STREAM_END',
          id: request.id,
        } as MCPBridgeStreamEnd);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      const msg: MCPBridgeStreamChunk = {
        type: 'MCP_BRIDGE_STREAM_CHUNK',
        id: request.id,
        chunk,
      };

      // 首个 chunk 包含响应头
      if (isFirst) {
        msg.status = response.status;
        msg.statusText = response.statusText;
        msg.headers = headers;
        isFirst = false;
      }

      sendToTab(tabId, msg);
    }
  } catch (error) {
    sendToTab(tabId, {
      type: 'MCP_BRIDGE_STREAM_ERROR',
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    } as MCPBridgeStreamError);
  }
}

// 发送消息到 tab
function sendToTab(
  tabId: number,
  message: MCPBridgeStreamChunk | MCPBridgeStreamEnd | MCPBridgeStreamError,
) {
  chrome.tabs.sendMessage(tabId, message).catch((err) => {
    console.error('[MCP Bridge] Failed to send to tab:', err);
  });
}

console.log('[MCP Bridge] background started');
