/*
  任务规划与反思
 */
import { LLMGenerator } from '../tools/llmGenerator.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { type LLM, planLLM } from '../llm/llm.ts';
import { WebFetcher } from '../tools/webFetch.ts';
import { WebSearcher } from '../tools/webSearch.ts';
import type { MCPClient, MCPToolCall } from '../mcp';
import { createMCPToolCalls } from '../mcp';
import type { ToolCall } from '../tools/toolCall.ts';
import type { PlanSchema } from '../types/planer.ts';
import { PlanPrompt, SystemPrompt } from './prompt.ts';

export class PlanAndRethink {
  step: number = 0;
  llm: LLM = planLLM;

  // 内置工具
  private builtinTools: ToolCall[] = [
    new LLMGenerator(),
    new JavascriptExecutor(),
    new WebFetcher(),
    new WebSearcher(),
  ];

  // MCP 工具
  private mcpTools: MCPToolCall[] = [];

  // 所有工具（内置 + MCP）
  get tools(): ToolCall[] {
    return [...this.builtinTools, ...this.mcpTools];
  }

  // 添加 MCP 服务器的工具
  async addMCPTools(mcpClient: MCPClient): Promise<void> {
    if (!mcpClient.isConnected) {
      await mcpClient.connect();
    }
    const newTools = createMCPToolCalls(mcpClient);
    this.mcpTools.push(...newTools);
  }

  // 移除指定 MCP 客户端的工具
  removeMCPTools(mcpClient: MCPClient): void {
    this.mcpTools = this.mcpTools.filter((t) => t.tool.name !== mcpClient.serverName);
  }

  // 清除所有 MCP 工具
  clearMCPTools(): void {
    this.mcpTools = [];
  }

  plans: PlanSchema | null = null;

  async plan(input: string) {
    const availableTools = this.tools
      .map((t) => `- ${t.tool.name}: ${t.tool.description}`)
      .join('\n');
    const res = await this.llm.askLLM({
      messages: [
        { role: 'system', content: SystemPrompt },
        {
          role: 'user',
          content: PlanPrompt(input, availableTools),
        },
      ],
    });
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const plantext = /<plan>\s*([\s\S]*?)\s*<\/plan>/.exec(res)?.[1];
    if (!plantext) {
      return '';
    }
    this.plans = JSON.parse(plantext);
    if (!this.plans || this.plans.tasks.length === 0) {
      return '';
    }
    console.log(this.plans);
    for (const step of this.plans.tasks[0].steps) {
      const tool = this.tools.find((t) => t.tool.name === step.tool_name)!;
      const result = await tool.step(step.step_goal);
      console.log('工具调用结果\n', result);
    }
    return res;
  }
}
