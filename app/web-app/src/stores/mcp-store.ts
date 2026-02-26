import { makeAutoObservable } from 'mobx';
import { service } from '@tini-agent/agent-core';

export interface MCPConfig {
  name: string;
  url: string;
  builtin?: boolean;
}

class MCPStore {
  mcpList: MCPConfig[] = [];
  loading = false;
  extensionInstalled = true;

  constructor() {
    makeAutoObservable(this);
  }

  async loadMCPConfigs() {
    this.loading = true;
    try {
      // 检查插件安装状态
      this.extensionInstalled = await service.isMcpExtensionInstalled();
      if (this.extensionInstalled) {
        // 等待 MCP 初始化完成后再获取配置
        this.mcpList = await service.getMcpServers();
      }
    } finally {
      this.loading = false;
    }
  }

  async addMCP(config: MCPConfig) {
    try {
      // service 会自动处理存储
      await service.addMcpServer(config.name, config.url);
      // 重新加载列表
      await this.loadMCPConfigs();
    } catch (error) {
      throw new Error(`Failed to add MCP server: ${error}`);
    }
  }

  async removeMCP(name: string) {
    try {
      // service 会自动处理存储
      await service.removeMcpServer(name);
      // 重新加载列表
      await this.loadMCPConfigs();
    } catch (error) {
      throw new Error(`Failed to remove MCP server: ${error}`);
    }
  }
}

export default new MCPStore();
