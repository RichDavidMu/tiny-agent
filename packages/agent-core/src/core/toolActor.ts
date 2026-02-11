import { remove } from 'lodash';
import type { ToolExecutionContext, ToolExecutionResult, ToolStepResult } from '../types';
import type { ToolCall } from '../tools/toolCall.ts';
import { WritingExpert } from '../tools/writingExpert.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { CodeExpert } from '../tools/codeExpert.ts';
import type { TaskCtx } from '../service';

/**
 * Tool Actor - executes tools and manages tool lifecycle
 */
export class ToolActor {
  private builtinTools = [new WritingExpert(), new JavascriptExecutor(), new CodeExpert()];
  private tools: ToolCall[] = [...this.builtinTools];

  /**
   * add available tools
   */
  addTools(tools: ToolCall[]): void {
    this.tools = this.tools.concat(tools);
  }

  addTool(tool: ToolCall): void {
    this.tools.push(tool);
  }

  deleteTool(toolName: string): void {
    remove(this.tools, (i) => i.tool.name === toolName);
  }

  enableTool(name: string): void {
    const target = this.tools.find((t) => t.tool.name === name);
    if (target) {
      target.tool.toolChoice = 'auto';
    }
  }

  disableTool(name: string): void {
    const target = this.tools.find((t) => t.tool.name === name);
    if (target) {
      target.tool.toolChoice = 'none';
    }
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
  async execute(ctx: TaskCtx, context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const { step, plan, task } = context;

    // Find the tool
    const tool = this.tools.find((t) => t.tool.name === step.tool_name);
    let stepResult: ToolStepResult;
    if (!tool) {
      // Tool not found
      stepResult = {
        result: {
          isError: true,
          content: [{ text: `工具不存在: ${step.tool_name}`, type: 'text' }],
        },
        shouldAct: false,
        input: null,
      };
    } else {
      try {
        // Execute the tool
        stepResult = await tool.step(ctx, step, task, plan);
      } catch (error) {
        // Tool execution error
        stepResult = {
          result: {
            isError: true,
            content: [
              {
                text: `工具执行错误: ${error instanceof Error ? error.message : String(error)}`,
                type: 'text',
              },
            ],
          },
          shouldAct: false,
          input: null,
        };
      }
    }

    // Update step status
    if (stepResult.result.isError) {
      step.status = 'error';
    } else {
      step.status = 'done';
    }

    return {
      result: stepResult,
      step,
      tool: tool ? tool.tool.toParams() : null,
    };
  }

  /**
   * Get tool descriptions for planning
   */
  getToolDescriptions(): string {
    const enabledTools = this.tools.filter((t) => t.tool.toolChoice === 'auto');
    const list = enabledTools.map((t) => `- ${t.tool.name}`).join('\n');
    const desc = enabledTools
      .map((t) => `- tool_name: ${t.tool.name}\n- tool_description: \n${t.tool.description}`)
      .join('\n\n');
    return `可用tool_name\n${list}\n\n详细工具描述：\n${desc}`;
  }
}
