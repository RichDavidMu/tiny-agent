/*
  任务规划与反思
 */
import { v4 as uuidv4 } from 'uuid';
import { LLMGenerator } from '../tools/llmGenerator.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { type LLM, planLLM, toolLLM } from '../llm/llm.ts';
import type { ToolCall } from '../tools/toolCall.ts';
import type { PlanSchema, RethinkRes } from '../types/planer.ts';
import { agentDb } from '../storage/db.ts';
import { persistResult } from '../storage/persistResult.ts';
import { MaxRethinkReached, ValueError } from '../utils/exceptions.ts';
import { createThinkingContentTransform } from '../llm/transformers/thinkingContentTransform.ts';
import {
  type StructuredChunk,
  createContentStructParseTransform,
} from '../llm/transformers/contentStructParseTransform.ts';
import type { ICallToolResult } from '../types/tools.ts';
import {
  PlanSystemPrompt,
  PlanUserPrompt,
  RethinkSystemPrompt,
  RethinkUserPrompt,
} from './prompt.ts';

const MAX_RETHINK_ROUND = 10;

export class PlanAndRethink {
  step: number = 0;
  llm: LLM = planLLM;

  // 内置工具
  private builtinTools: ToolCall[] = [new LLMGenerator(), new JavascriptExecutor()];

  // MCP 工具
  private mcpTools: ToolCall[] = [];

  // 所有工具（内置 + MCP）
  get tools(): ToolCall[] {
    return [...this.builtinTools, ...this.mcpTools];
  }

  setMCPTools(tools: ToolCall[]): void {
    this.mcpTools = tools;
  }

  plan: PlanSchema | null = null;

  async generatePlan(input: string) {
    const availableTools = this.tools
      .map(
        (t) =>
          `tool_name: ${t.tool.name}\ntool_description: \n${t.tool.description}
          `,
      )
      .join('\n\n');
    console.log(availableTools);
    await this.llm.reload();
    const textStream = await this.llm.askLLM({
      messages: [
        { role: 'system', content: PlanSystemPrompt },
        {
          role: 'user',
          content: PlanUserPrompt(input, availableTools),
        },
      ],
      stream: true,
    });
    const parsedStream = textStream
      .pipeThrough(createThinkingContentTransform())
      .pipeThrough(createContentStructParseTransform());
    let planText = '';
    let thinkingText = '';
    const reader = parsedStream.getReader();
    let chunk: ReadableStreamReadResult<StructuredChunk>;
    while (!(chunk = await reader.read()).done) {
      if (chunk.value.type === 'plan') {
        planText += chunk.value.content;
      }
      if (chunk.value.type === 'thinking') {
        thinkingText += chunk.value.content;
      }
    }
    console.log(thinkingText);
    console.log(planText);
    await this.llm.unload();
    if (!planText) {
      return;
    }
    this.plan = JSON.parse(planText);
    if (!this.plan || this.plan.tasks.length === 0) {
      return;
    }
    this.attachUuids(this.plan);
    console.log(this.plan);
    await this.executePlan(input);
  }
  async executePlan(input: string) {
    let rethinkRounds = 0;
    while (true) {
      if (rethinkRounds >= MAX_RETHINK_ROUND) {
        throw new MaxRethinkReached();
      }
      const pendingTask = this.plan!.tasks.findIndex((task) => task.status !== 'completed');
      if (pendingTask === -1) {
        break;
      }
      const task = this.plan!.tasks[pendingTask];
      await toolLLM.reload();
      for (let stepIndex = 0; stepIndex < task.steps.length; stepIndex += 1) {
        const step = task.steps[stepIndex];
        console.log(this.tools);
        const tool = this.tools.find((t) => t.tool.name === step.tool_name);
        let result: ICallToolResult;
        if (!tool) {
          result = { isError: true, content: [{ text: '工具不存在', type: 'text' }] };
        } else {
          result = await tool.step(step, this.plan!);
        }
        console.log('工具调用结果\n', result);
        await persistResult(result, step, task.task_id);
      }
      await toolLLM.unload();
      const rethink = await this.runRethink(input, task);
      rethinkRounds += 1;
      if (rethink.status === 'done') {
        return rethink.finalAnswer;
      } else if (rethink.status === 'changed') {
        this.plan = this.reconcilePlan(this.plan!, rethink.plan);
      } else {
        task.status = 'completed';
        task.steps.forEach((s) => (s.status = 'completed'));
      }
    }
  }
  private attachUuids(plan: PlanSchema): void {
    for (const task of plan.tasks) {
      task.task_uuid = uuidv4();
      task.status = task.status ?? 'pending';
      for (const step of task.steps) {
        step.step_uuid = uuidv4();
        step.status = step.status ?? 'pending';
      }
    }
  }

  private async runRethink(
    userGoal: string,
    task: PlanSchema['tasks'][number],
  ): Promise<RethinkRes> {
    const toolResults = await this.buildToolResults(task);
    await this.llm.reload();
    const textStream = await this.llm.askLLM({
      messages: [
        { role: 'system', content: RethinkSystemPrompt },
        {
          role: 'user',
          content: RethinkUserPrompt({
            userGoal,
            currentTask: JSON.stringify(task, null, 2),
            toolResults: JSON.stringify(toolResults, null, 2),
            plan: JSON.stringify(this.plan, null, 2),
          }),
        },
      ],
      stream: true,
    });
    console.log(textStream);
    const parsedStream = textStream
      .pipeThrough(createThinkingContentTransform())
      .pipeThrough(createContentStructParseTransform());
    let planText = '';
    let finalText = '';
    let status = '';
    const reader = parsedStream.getReader();
    let chunk: ReadableStreamReadResult<StructuredChunk>;
    while (!(chunk = await reader.read()).done) {
      if (chunk.value.type === 'plan') {
        planText += chunk.value.content;
      }
      if (chunk.value.type === 'final') {
        finalText += chunk.value.content;
      }
      if (chunk.value.type === 'status') {
        status = chunk.value.content;
      }
    }
    console.log('final', finalText);
    console.log('status:', status);
    console.log('plan', planText);
    await this.llm.unload();
    switch (status) {
      case 'continue':
        return { status };
      case 'done':
        return { status, finalAnswer: finalText };
      case 'changed':
        return { status, plan: JSON.parse(planText) };
      default: {
        throw new ValueError('Unknown status from rethink: ' + status);
      }
    }
  }

  private async buildToolResults(task: PlanSchema['tasks'][number]): Promise<
    Array<{
      step_id: string;
      step_goal: string;
      tool_name: string;
      result: string;
      is_error: boolean;
      result_file: string;
      file_id: string | null;
    }>
  > {
    const results = [];
    for (const step of task.steps) {
      const toolResult = await agentDb.toolResult.findByStepId(step.step_id);
      if (toolResult) {
        results.push({
          step_id: step.step_id,
          step_goal: step.step_goal,
          tool_name: step.tool_name,
          result: toolResult.result,
          is_error: toolResult.isError,
          result_file: toolResult.resultFile,
          file_id: toolResult.fileId,
        });
      } else {
        // Fallback if no tool result found
        results.push({
          step_id: step.step_id,
          step_goal: step.step_goal,
          tool_name: step.tool_name,
          result: 'No result recorded',
          is_error: true,
          result_file: step.result_file,
          file_id: null,
        });
      }
    }
    return results;
  }

  private reconcilePlan(current: PlanSchema, incoming: PlanSchema): PlanSchema {
    const taskMap = new Map(
      current.tasks.filter((task) => task.task_uuid).map((task) => [task.task_uuid!, task]),
    );

    const mergedTasks = incoming.tasks.map((incomingTask) => {
      const existingTask = incomingTask.task_uuid ? taskMap.get(incomingTask.task_uuid) : undefined;
      const task: PlanSchema['tasks'][number] = {
        ...incomingTask,
        task_uuid: existingTask?.task_uuid ?? incomingTask.task_uuid ?? uuidv4(),
        status: incomingTask.status ?? 'pending',
      };

      if (existingTask?.status === 'completed') {
        task.status = 'completed';
      }

      const stepMap = new Map(
        (existingTask?.steps ?? [])
          .filter((step) => step.step_uuid)
          .map((step) => [step.step_uuid!, step]),
      );

      task.steps = incomingTask.steps.map((incomingStep) => {
        const existingStep = incomingStep.step_uuid
          ? stepMap.get(incomingStep.step_uuid)
          : undefined;
        const step = {
          ...incomingStep,
          step_uuid: existingStep?.step_uuid ?? incomingStep.step_uuid ?? uuidv4(),
          status: incomingStep.status ?? 'pending',
        };
        if (existingStep?.status === 'completed') {
          step.status = 'completed';
        }
        return step;
      });

      return task;
    });

    return { tasks: mergedTasks };
  }
}
