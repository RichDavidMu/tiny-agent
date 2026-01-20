/**
 * MCP Bridge - 与浏览器扩展通信
 * 检测扩展安装状态，通过扩展代理请求绕过 CORS
 * 支持 MessageChannel 高效流式传输
 */

import {
  type MCPBridgeRequest,
  type MCPBridgeResponse,
  type MCPBridgeStreamChunk,
  type MCPBridgeStreamEnd,
  type MCPBridgeStreamError,
  type MCPBridgeWindow,
  MCP_BRIDGE_ID,
  MCP_BRIDGE_READY_EVENT,
} from 'mcp-bridge-extension';

// 获取 bridge 对象
function getBridge(): MCPBridgeWindow | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as Record<string, MCPBridgeWindow>)[MCP_BRIDGE_ID] || null;
}

// 获取 MessagePort
function getPort(): MessagePort | null {
  return getBridge()?.port || null;
}

// 等待中的请求
const pendingRequests = new Map<
  string,
  {
    resolve: (response: MCPBridgeResponse) => void;
    reject: (error: Error) => void;
  }
>();

// 流式请求的回调
const streamCallbacks = new Map<
  string,
  {
    onChunk: (chunk: MCPBridgeStreamChunk) => void;
    onEnd: (end: MCPBridgeStreamEnd) => void;
    onError: (error: MCPBridgeStreamError) => void;
  }
>();

// 处理消息
function handleMessage(message: unknown) {
  if (!message || typeof message !== 'object') return;
  const msg = message as { type?: string; id?: string };
  if (!msg.type || !msg.id) return;

  // 处理普通响应
  if (msg.type === 'MCP_BRIDGE_RESPONSE') {
    const response = msg as MCPBridgeResponse;
    const pending = pendingRequests.get(response.id);
    if (pending) {
      pendingRequests.delete(response.id);
      pending.resolve(response);
    }
  }

  // 处理流式响应
  if (msg.type === 'MCP_BRIDGE_STREAM_CHUNK') {
    const chunk = msg as MCPBridgeStreamChunk;
    const callbacks = streamCallbacks.get(chunk.id);
    if (callbacks) {
      callbacks.onChunk(chunk);
    }
  }

  if (msg.type === 'MCP_BRIDGE_STREAM_END') {
    const end = msg as MCPBridgeStreamEnd;
    const callbacks = streamCallbacks.get(end.id);
    if (callbacks) {
      callbacks.onEnd(end);
      streamCallbacks.delete(end.id);
    }
  }

  if (msg.type === 'MCP_BRIDGE_STREAM_ERROR') {
    const error = msg as MCPBridgeStreamError;
    const callbacks = streamCallbacks.get(error.id);
    if (callbacks) {
      callbacks.onError(error);
      streamCallbacks.delete(error.id);
    }
  }
}

// 设置消息监听
let messageListenerSetup = false;

function setupMessageListener() {
  if (messageListenerSetup || typeof window === 'undefined') return;
  messageListenerSetup = true;

  const bridge = getBridge();

  // 如果有 port，使用 port 监听
  if (bridge?.port) {
    bridge.port.onmessage = (event) => handleMessage(event.data);
  } else if (bridge) {
    // 等待 port 就绪
    bridge.onPortReady = (port) => {
      port.onmessage = (event) => handleMessage(event.data);
    };
  }

  // 同时监听 postMessage 作为备用
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    handleMessage(event.data);
  });

  // 监听 channel ready 事件
  window.addEventListener('MCP_BRIDGE_CHANNEL_READY', ((
    event: CustomEvent<{ port: MessagePort }>,
  ) => {
    const port = event.detail.port;
    if (port) {
      port.onmessage = (e) => handleMessage(e.data);
    }
  }) as EventListener);
}

// 初始化监听器
if (typeof window !== 'undefined') {
  setupMessageListener();
}

// 生成唯一 ID
let requestIdCounter = 0;
function generateRequestId(): string {
  return `mcp_bridge_${Date.now()}_${++requestIdCounter}`;
}

// 发送消息（优先使用 MessageChannel）
function sendMessage(message: MCPBridgeRequest) {
  const port = getPort();
  if (port) {
    port.postMessage(message);
  } else {
    window.postMessage(message, '*');
  }
}

/**
 * 检测扩展是否安装
 */
export function isExtensionInstalled(): boolean {
  const bridge = getBridge();
  return bridge?.installed === true;
}

/**
 * 获取扩展版本
 */
export function getExtensionVersion(): string | null {
  return getBridge()?.version || null;
}

/**
 * 检测 MessageChannel 是否可用
 */
export function isChannelAvailable(): boolean {
  return getPort() !== null;
}

/**
 * 等待扩展就绪
 */
export function waitForExtension(timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isExtensionInstalled()) {
      resolve(true);
      return;
    }

    const onReady = () => {
      window.removeEventListener(MCP_BRIDGE_READY_EVENT, onReady);
      resolve(true);
    };

    window.addEventListener(MCP_BRIDGE_READY_EVENT, onReady);

    setTimeout(() => {
      window.removeEventListener(MCP_BRIDGE_READY_EVENT, onReady);
      resolve(isExtensionInstalled());
    }, timeout);
  });
}

/**
 * 等待 MessageChannel 就绪
 */
export function waitForChannel(timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isChannelAvailable()) {
      resolve(true);
      return;
    }

    const onReady = () => {
      window.removeEventListener('MCP_BRIDGE_CHANNEL_READY', onReady);
      resolve(true);
    };

    window.addEventListener('MCP_BRIDGE_CHANNEL_READY', onReady);

    setTimeout(() => {
      window.removeEventListener('MCP_BRIDGE_CHANNEL_READY', onReady);
      resolve(isChannelAvailable());
    }, timeout);
  });
}

/**
 * 通过扩展发送请求（绕过 CORS）
 */
export async function bridgeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!isExtensionInstalled()) {
    throw new Error('MCP Bridge extension is not installed');
  }

  setupMessageListener();

  const id = generateRequestId();

  const request: MCPBridgeRequest = {
    type: 'MCP_BRIDGE_REQUEST',
    id,
    url,
    method: (options.method as 'GET' | 'POST') || 'GET',
    headers: options.headers as Record<string, string>,
    body: options.body as string,
  };

  // 发送请求并等待响应
  const response = await new Promise<MCPBridgeResponse>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });

    // 设置超时
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Bridge request timeout'));
      }
    }, 30000);

    sendMessage(request);
  });

  if (!response.success) {
    throw new Error(response.error || 'Bridge request failed');
  }

  // 构造 Response 对象
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * 通过扩展发送流式请求
 * 返回一个 ReadableStream
 */
export function bridgeStreamFetch(
  url: string,
  options: RequestInit = {},
): {
  stream: ReadableStream<Uint8Array>;
  responsePromise: Promise<{ status: number; statusText: string; headers: Record<string, string> }>;
} {
  if (!isExtensionInstalled()) {
    throw new Error('MCP Bridge extension is not installed');
  }

  setupMessageListener();

  const id = generateRequestId();
  const encoder = new TextEncoder();

  let responseInfo: { status: number; statusText: string; headers: Record<string, string> } | null =
    null;
  let resolveResponseInfo: (
    info:
      | { status: number; statusText: string; headers: Record<string, string> }
      | PromiseLike<{ status: number; statusText: string; headers: Record<string, string> }>,
  ) => void;
  let rejectResponseInfo: (error: Error) => void;

  const responsePromise = new Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }>((resolve, reject) => {
    resolveResponseInfo = resolve;
    rejectResponseInfo = reject;
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamCallbacks.set(id, {
        onChunk: (chunk) => {
          // 首个 chunk 包含响应信息
          if (!responseInfo && chunk.status !== undefined) {
            responseInfo = {
              status: chunk.status,
              statusText: chunk.statusText || '',
              headers: chunk.headers || {},
            };
            resolveResponseInfo(responseInfo);
          }
          controller.enqueue(encoder.encode(chunk.chunk));
        },
        onEnd: () => {
          controller.close();
        },
        onError: (error) => {
          const err = new Error(error.error);
          controller.error(err);
          if (!responseInfo) {
            rejectResponseInfo(err);
          }
        },
      });

      // 发送流式请求
      const request: MCPBridgeRequest = {
        type: 'MCP_BRIDGE_REQUEST',
        id,
        url,
        method: (options.method as 'GET' | 'POST') || 'GET',
        headers: options.headers as Record<string, string>,
        body: options.body as string,
        stream: true,
      };

      sendMessage(request);
    },
    cancel() {
      streamCallbacks.delete(id);
    },
  });

  return { stream, responsePromise };
}

/**
 * 创建一个自动选择的 fetch 函数
 * 如果扩展已安装则使用扩展，否则使用原生 fetch
 */
export function createSmartFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // 如果扩展已安装，使用扩展代理
    if (isExtensionInstalled()) {
      try {
        return await bridgeFetch(url, init);
      } catch {
        // 扩展请求失败，回退到原生 fetch
        console.warn('[MCP Bridge] Extension request failed, falling back to native fetch');
      }
    }

    // 使用原生 fetch
    return fetch(input, init);
  };
}
