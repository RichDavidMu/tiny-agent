import type { ICallToolResult } from '../types/tools.ts';
import type { ToolCall } from '../tools/toolCall.ts';
import type { ToolExecutionContext, ToolExecutionResult } from '../types/fsm.ts';

/**
 * Tool Actor - executes tools and manages tool lifecycle
 */
export class ToolActor {
  private tools: ToolCall[];

  constructor(tools: ToolCall[]) {
    this.tools = tools;
  }

  /**
   * add available tools
   */
  addTool(tools: ToolCall[]): void {
    this.tools = this.tools.concat(tools);
  }

  /**
   * Get available tools
   */
  getTools(): ToolCall[] {
    return this.tools;
  }

  /**
   * Execute a tool for a given step
   */
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const { step, plan, task } = context;

    // Find the tool
    const tool = this.tools.find((t) => t.tool.name === step.tool_name);
    let result: ICallToolResult;
    if (!tool) {
      // Tool not found
      result = {
        isError: true,
        content: [{ text: `工具不存在: ${step.tool_name}`, type: 'text' }],
      };
    } else {
      try {
        // Execute the tool
        result = await tool.step(step, task, plan);
      } catch (error) {
        // Tool execution error
        result = {
          isError: true,
          content: [
            {
              text: `工具执行错误: ${error instanceof Error ? error.message : String(error)}`,
              type: 'text',
            },
          ],
        };
      }
    }

    // Update step status
    if (result.isError) {
      step.status = 'error';
    } else {
      step.status = 'done';
    }

    return {
      result,
      step,
      tool: tool ? tool.tool.toParams() : null,
    };
  }

  /**
   * Get tool descriptions for planning
   */
  getToolDescriptions(): string {
    const list = this.tools.map((t) => `- ${t.tool.name}`).join('\n');
    const desc = this.tools
      .map((t) => `- tool_name: ${t.tool.name}\n- tool_description: \n${t.tool.description}`)
      .join('\n\n');
    return `可用tool_name\n${list}\n\n详细工具描述：\n${desc}`;
  }
}
