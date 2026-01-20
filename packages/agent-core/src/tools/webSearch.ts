import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolCallResponse } from '../types/llm.ts';
import ToolBase from './toolBase.ts';
import { ToolCall } from './toolCall.ts';

class WebSearchTool extends ToolBase {
  schema = {
    name: 'web_search',
    description: '使用搜索引擎搜索信息',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词',
        },
      },
      required: ['query'],
    },
  };
}

export type SearchProvider = 'duckduckgo' | 'searxng';

export interface SearchConfig {
  provider: SearchProvider;
  endpoint?: string; // 用于 SearXNG 自托管实例
}

export class WebSearcher extends ToolCall {
  tool = new WebSearchTool();

  config: SearchConfig = {
    provider: 'duckduckgo',
  };

  async executeTool(toolCall: ToolCallResponse, _tool: ToolBase): Promise<CallToolResult> {
    const args = toolCall.function.arguments;
    try {
      if (typeof args.query !== 'string') {
        return {
          content: [{ type: 'text', text: 'Missing required argument: query' }],
          isError: true,
        };
      }

      const results = await this.search(args.query);
      return {
        content: [{ type: 'text', text: results }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      };
    }
  }

  private async search(query: string): Promise<string> {
    switch (this.config.provider) {
      case 'duckduckgo':
        return this.searchDuckDuckGo(query);
      case 'searxng':
        return this.searchSearXNG(query);
      default:
        throw new Error(`Unknown search provider: ${this.config.provider}`);
    }
  }

  // DuckDuckGo Instant Answer API (免费，无需 API key)
  private async searchDuckDuckGo(query: string): Promise<string> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const response = await fetch(url);
    const data = await response.json();

    const results: string[] = [];

    if (data.Abstract) {
      results.push(`摘要: ${data.Abstract}`);
    }

    if (data.RelatedTopics?.length > 0) {
      results.push('相关主题:');
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push(`- ${topic.Text}`);
        }
      }
    }

    return results.length > 0 ? results.join('\n') : '未找到相关结果';
  }

  // SearXNG (开源元搜索引擎，可使用公共实例或自托管)
  private async searchSearXNG(query: string): Promise<string> {
    const endpoint = this.config.endpoint || 'https://searx.be';
    const url = `${endpoint}/search?q=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results?.length) {
      return '未找到相关结果';
    }

    const results = data.results
      .slice(0, 5)
      .map(
        (r: { title: string; url: string; content?: string }) =>
          `- ${r.title}\n  ${r.url}\n  ${r.content || ''}`,
      );

    return results.join('\n\n');
  }
}
