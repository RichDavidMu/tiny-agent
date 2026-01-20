export { MCPClient } from './client.ts';
export { MCPClientHost } from './host.ts';
export { MCPToolCall } from './toolWrapper.ts';
export type { MCPServerConfig, MCPClientOptions } from './types.ts';

// Bridge 功能
export {
  isExtensionInstalled,
  getExtensionVersion,
  waitForExtension,
  bridgeFetch,
  bridgeStreamFetch,
  createSmartFetch,
  isChannelAvailable,
  waitForChannel,
} from './bridge.ts';
