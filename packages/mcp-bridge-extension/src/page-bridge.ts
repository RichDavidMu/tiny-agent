/**
 * Page Bridge Script
 * 注入到页面中，提供 MCP Bridge 标识和 MessageChannel 通信
 */

import {
  type MCPBridgeWindow,
  MCP_BRIDGE_ID,
  MCP_BRIDGE_READY_EVENT,
  MCP_BRIDGE_VERSION,
} from './types';

(function () {
  if ((window as any)[MCP_BRIDGE_ID]) return;

  // 创建可修改的 bridge 对象
  const bridgeInfo: MCPBridgeWindow = {
    installed: true,
    version: MCP_BRIDGE_VERSION,
    port: null,
    onPortReady: null,
  };

  Object.defineProperty(window, MCP_BRIDGE_ID, {
    value: bridgeInfo,
    configurable: false,
    writable: false,
  });

  // 监听 MessageChannel 初始化消息
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const message = event.data;

    if (message?.type === 'MCP_BRIDGE_CHANNEL_INIT' && event.ports.length > 0) {
      const port = event.ports[0];
      bridgeInfo.port = port;

      // 启动 port
      port.start();

      // 触发 port ready 回调
      if (bridgeInfo.onPortReady) {
        bridgeInfo.onPortReady(port);
      }

      // 派发 channel ready 事件
      window.dispatchEvent(
        new CustomEvent('MCP_BRIDGE_CHANNEL_READY', {
          detail: { port },
        }),
      );

      // 确认收到
      window.postMessage(
        {
          type: 'MCP_BRIDGE_CHANNEL_READY',
          id: 'channel_ready',
        },
        '*',
      );

      console.log('[MCP Bridge] MessageChannel established');
    }
  });

  window.dispatchEvent(
    new CustomEvent(MCP_BRIDGE_READY_EVENT, {
      detail: { version: MCP_BRIDGE_VERSION },
    }),
  );

  console.log('[MCP Bridge] page bridge injected');
})();
