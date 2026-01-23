/*
  任务规划与反思
 */
import { v4 as uuidv4 } from 'uuid';
import { LLMGenerator } from '../tools/llmGenerator.ts';
import { JavascriptExecutor } from '../tools/javascriptExecutor.ts';
import { type LLM, planLLM, toolLLM } from '../llm/llm.ts';
import type { ToolCall } from '../tools/toolCall.ts';
import type { PlanSchema } from '../types/planer.ts';
import { agentDb } from '../storage/db.ts';
import {
  PlanSystemPrompt,
  PlanUserPrompt,
  RethinkSystemPrompt,
  RethinkUserPrompt,
} from './prompt.ts';

type RethinkResponse = {
  action: 'continue' | 'revise_plan' | 'final';
  reason?: string;
  plan: PlanSchema;
  final_answer?: string;
};

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

  async generatePlan(input: string): Promise<string> {
    const availableTools = this.tools
      .map((t) => `- ${t.tool.name}: ${t.tool.description}`)
      .join('\n');
    const res = await this.llm.askLLM({
      messages: [
        { role: 'system', content: PlanSystemPrompt },
        {
          role: 'user',
          content: PlanUserPrompt(input, availableTools),
        },
      ],
    });
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const plantext = /<plan>\s*([\s\S]*?)\s*<\/plan>/.exec(res)?.[1];
    if (!plantext) {
      return '';
    }
    this.plan = JSON.parse(plantext);
    if (!this.plan || this.plan.tasks.length === 0) {
      return '';
    }
    this.attachUuids(this.plan);
    console.log(this.plan);
    let rethinkRounds = 0;
    while (true) {
      if (rethinkRounds >= 10) {
        return 'Rethink limit reached (10 rounds).';
      }
      const taskIndex = this.plan.tasks.findIndex((task) => task.status !== 'completed');
      if (taskIndex === -1) {
        break;
      }
      const task = this.plan.tasks[taskIndex];
      for (let stepIndex = 0; stepIndex < task.steps.length; stepIndex += 1) {
        const step = task.steps[stepIndex];
        await toolLLM.reload();
        const tool = this.tools.find((t) => t.tool.name === step.tool_name)!;
        const result = await tool.step(step, this.plan);
        console.log('工具调用结果\n', result);
        step.status = result.isError ? 'pending' : 'completed';
        await toolLLM.unload();
      }
      task.status = task.steps.every((step) => step.status === 'completed')
        ? 'completed'
        : 'pending';

      const rethink = await this.runRethink(input, task, this.plan);
      rethinkRounds += 1;
      if (rethink.action === 'final' && rethink.final_answer) {
        return rethink.final_answer;
      }
      this.plan = this.reconcilePlan(this.plan, rethink.plan);
    }

    return res;
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
    plan: PlanSchema,
  ): Promise<RethinkResponse> {
    const toolResults = await this.buildToolResults(task);
    const response = await this.llm.askLLM({
      messages: [
        { role: 'system', content: RethinkSystemPrompt },
        {
          role: 'user',
          content: RethinkUserPrompt({
            userGoal,
            currentTask: JSON.stringify(task, null, 2),
            toolResults: JSON.stringify(toolResults, null, 2),
            plan: JSON.stringify(plan, null, 2),
          }),
        },
      ],
    });

    const rethinkJson = this.extractJson(response);
    return JSON.parse(rethinkJson) as RethinkResponse;
  }

  private async buildToolResults(task: PlanSchema['tasks'][number]): Promise<
    Array<{
      step_id: string;
      step_goal: string;
      tool_name: string;
      result_file: string;
      file_id: string | null;
    }>
  > {
    const results = [];
    for (const step of task.steps) {
      const files = await agentDb.file.findByName(step.result_file);
      const fileId = files.length > 0 ? files[files.length - 1].id : null;
      results.push({
        step_id: step.step_id,
        step_goal: step.step_goal,
        tool_name: step.tool_name,
        result_file: step.result_file,
        file_id: fileId,
      });
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

  private extractJson(content: string): string {
    const match = /\{[\s\S]*\}/.exec(content);
    if (!match) {
      throw new Error('Rethink output does not contain JSON');
    }
    return match[0];
  }
}
