/**
 * Content Script
 * 负责注入 page script + 通过 MessageChannel 转发消息（支持流式）
 */

import type { MCPBridgePing, MCPBridgePong, MCPBridgeRequest, MCPBridgeResponse } from './types';

// MessageChannel 端口 - 用于与页面通信
let pagePort: MessagePort | null = null;

// 注入 page script
function injectPageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('page-bridge.js');
  script.type = 'text/javascript';
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// 处理请求并返回响应
async function handleRequest(
  message: MCPBridgePing | MCPBridgeRequest,
  respond: (response: unknown) => void,
) {
  if (message.type === 'MCP_BRIDGE_PING') {
    try {
      const pong = await chrome.runtime.sendMessage(message);
      respond(pong);
    } catch {
      const errorResponse: MCPBridgePong = {
        type: 'MCP_BRIDGE_PONG',
        id: message.id,
        version: '',
      };
      respond(errorResponse);
    }
    return;
  }

  if (message.type === 'MCP_BRIDGE_REQUEST') {
    try {
      const request = message as MCPBridgeRequest;
      const response = await chrome.runtime.sendMessage(request);

      // 非流式请求直接返回完整响应
      if (!request.stream) {
        respond(response as MCPBridgeResponse);
      }
      // 流式请求的响应会通过 chrome.runtime.onMessage 转发
    } catch (error) {
      respond({
        type: 'MCP_BRIDGE_RESPONSE',
        id: message.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as MCPBridgeResponse);
    }
  }
}

// 建立 MessageChannel 连接
function setupMessageChannel() {
  const channel = new MessageChannel();
  pagePort = channel.port1;

  // 监听来自页面的消息（通过 MessageChannel）
  pagePort.onmessage = async (event) => {
    const message = event.data;
    if (!message || typeof message.type !== 'string') return;

    await handleRequest(message, (response) => {
      pagePort?.postMessage(response);
    });
  };

  // 将 port2 发送给页面
  window.postMessage(
    {
      type: 'MCP_BRIDGE_CHANNEL_INIT',
      id: 'channel_init',
    },
    '*',
    [channel.port2],
  );
}

// 监听来自 background 的流式消息，转发给页面
chrome.runtime.onMessage.addListener((message) => {
  if (
    message.type === 'MCP_BRIDGE_STREAM_CHUNK' ||
    message.type === 'MCP_BRIDGE_STREAM_END' ||
    message.type === 'MCP_BRIDGE_STREAM_ERROR'
  ) {
    // 优先使用 MessageChannel，否则回退到 postMessage
    if (pagePort) {
      pagePort.postMessage(message);
    } else {
      window.postMessage(message, '*');
    }
  }
});

// 监听来自页面的 postMessage（始终处理，作为备用通道）
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || typeof message.type !== 'string') return;

  // 页面确认收到 channel
  if (message.type === 'MCP_BRIDGE_CHANNEL_READY') {
    console.log('[MCP Bridge] channel ready confirmed');
    return;
  }

  // 处理 PING 和 REQUEST（通过 postMessage 发送的请求）
  if (message.type === 'MCP_BRIDGE_PING' || message.type === 'MCP_BRIDGE_REQUEST') {
    await handleRequest(message, (response) => {
      window.postMessage(response, '*');
    });
  }
});

// 初始化
injectPageScript();

// 延迟建立 MessageChannel，确保 page script 已加载
setTimeout(() => {
  setupMessageChannel();
}, 0);

console.log('[MCP Bridge] content script loaded');
