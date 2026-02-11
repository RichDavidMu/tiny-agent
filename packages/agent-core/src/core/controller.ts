import { v4 as uuidv4 } from 'uuid';
import { agentLogger } from '@tini-agent/utils';
import { AgentState, type PlanSchema, type RethinkRes, type StateContext } from '../types';
import {
  type StructuredChunk,
  createContentStructParseTransform,
  createThinkingContentTransform,
  llmController,
} from '../llm';
import { persistResult } from '../storage/persistResult.ts';
import { agentDb } from '../storage/db.ts';
import type { MessageStop, TaskCtx } from '../service';
import { PlanSystemPrompt, PlanUserPrompt } from './prompt/planPrompt.ts';
import type { ToolActor } from './toolActor.ts';
import { type IPolicy, Policy } from './policy.ts';
import { StateMachine } from './stateMachine.ts';
import { EmptyPlan, ValueError } from './exceptions.ts';
import { RethinkSystemPrompt, RethinkUserPrompt } from './prompt/rethinkPrompt.ts';

/**
 * Agent Controller - orchestrates state machine, policy, and tool actor
 */
export class AgentController {
  private stateMachine: StateMachine;
  private policy: IPolicy;
  private toolActor: ToolActor;
  public ctx: TaskCtx;

  constructor(toolActor: ToolActor, ctx: TaskCtx) {
    this.toolActor = toolActor;
    this.policy = new Policy();
    this.ctx = ctx;

    // Initialize state machine
    const initialContext: StateContext = {
      state: AgentState.IDLE,
      plan: null,
      currentTask: null,
      currentStep: null,
      userInput: '',
      rethinkRounds: 0,
    };
    this.stateMachine = new StateMachine(initialContext);
  }

  /**
   * Execute a task
   */
  async execute(): Promise<void> {
    this.stateMachine.reset(this.ctx.req.input);
    while (true) {
      const context = this.stateMachine.getContext();
      const decision = await this.policy.decide(context);
      agentLogger.log(`Decision: ${decision.action}, Next State: ${decision.nextState}`);
      this.ctx.status(decision.nextState);
      // Transition to next state
      this.stateMachine.transition(decision.nextState);

      // Execute action based on decision
      if (decision.action === 'plan') {
        await this.handlePlanning();
      } else if (decision.action === 'execute_step') {
        await this.handleExecution();
      } else if (decision.action === 'rethink') {
        await this.handleRethinking();
      } else if (decision.action === 'done') {
        break;
      }
      // Check for terminal states
      if (context.state === AgentState.DONE || context.state === AgentState.ERROR) {
        break;
      }
    }

    const finalContext = this.stateMachine.getContext();
    let ans = '';
    let stop_reason: MessageStop['message']['stop_reason'] = 'success';
    if (finalContext.state === AgentState.ERROR) {
      ans = finalContext.error?.message || 'agent task failed';
      stop_reason = 'error';
    } else {
      ans = finalContext.finalAnswer || 'Task completed';
    }
    this.ctx.onText(ans, 'text');
    this.ctx.onContentBlockEnd();
    this.ctx.onEnd(stop_reason);
  }

  /**
   * Handle planning phase
   */
  private async handlePlanning(): Promise<void> {
    const context = this.stateMachine.getContext();
    const availableTools = this.toolActor.getToolDescriptions();

    await llmController.planLLM.reload();
    const textStream = await llmController.planLLM.askLLM({
      messages: [
        { role: 'system', content: PlanSystemPrompt },
        {
          role: 'user',
          content: PlanUserPrompt(context.userInput, availableTools),
        },
      ],
      stream: true,
    });
    const parsedStream = textStream
      .pipeThrough(createThinkingContentTransform())
      .pipeThrough(createContentStructParseTransform());
    let planText = '';
    let thinking = '';
    const reader = parsedStream.getReader();
    let chunk: ReadableStreamReadResult<StructuredChunk>;
    let emitThinkingEnd = false;
    while (!(chunk = await reader.read()).done) {
      if (chunk.value.type === 'thinking') {
        this.ctx.res.onText(chunk.value.content, 'thinking');
        thinking += chunk.value.content;
      }
      if (chunk.value.type === 'plan') {
        if (!emitThinkingEnd) {
          this.ctx.res.onContentBlockEnd();
          emitThinkingEnd = true;
        }
        planText += chunk.value.content;
      }
    }
    await llmController.planLLM.unload();
    if (!planText) {
      this.stateMachine.updateContext({ error: new EmptyPlan('Failed to generate plan') });
      return;
    }
    agentLogger.debug(`thinking:\n${thinking}\nplan:\n${planText}`);
    const plan: PlanSchema = JSON.parse(planText);
    this.attachIds(plan);

    // Find first pending task
    const firstTask = plan.tasks.find((t) => t.status === 'pending');
    this.stateMachine.updateContext({
      plan,
      currentTask: firstTask || null,
    });
  }

  /**
   * Handle execution phase
   */
  private async handleExecution(): Promise<void> {
    const context = this.stateMachine.getContext();
    if (!context.plan || !context.currentTask) {
      this.stateMachine.updateContext({ error: new EmptyPlan('No plan or task to execute') });
      return;
    }

    // Find next pending step
    const nextStepIndex = context.currentTask.steps.findIndex((s) => s.status === 'pending');
    if (nextStepIndex === 0) {
      this.ctx.onTaskStart(context.currentTask);
    }
    const nextStep = context.currentTask.steps[nextStepIndex];
    if (!nextStep) {
      return;
    }

    // Execute the step
    await llmController.toolLLM.reload();
    const { result, tool } = await this.toolActor.execute(this.ctx, {
      step: nextStep,
      task: context.currentTask,
      plan: context.plan,
    });
    agentLogger.debug('Tool execution result:', result);
    nextStep.result_file_id = `file-${uuidv4()}`;
    await persistResult(result, nextStep, context.currentTask.task_uuid, tool);
    // Update context with current step
    if (context.currentTask.steps.every((s) => s.status !== 'pending')) {
      if (context.currentTask.steps.find((s) => s.status === 'error')) {
        context.currentTask.status = 'error';
      } else {
        context.currentTask.status = 'done';
      }
      this.ctx.onTaskStatus(context.currentTask);
      this.ctx.onContentBlockEnd();
      await llmController.toolLLM.unload();
    }
    this.stateMachine.updateContext({
      currentStep: nextStep,
    });
  }

  /**
   * Handle rethinking phase
   */
  private async handleRethinking(): Promise<void> {
    const context = this.stateMachine.getContext();
    if (!context.plan || !context.currentTask) {
      return;
    }

    const toolMemo = await this.buildToolMemo();
    await llmController.planLLM.reload();
    const textStream = await llmController.planLLM.askLLM({
      messages: [
        { role: 'system', content: RethinkSystemPrompt },
        {
          role: 'user',
          content: RethinkUserPrompt({
            userGoal: context.userInput,
            currentTask: JSON.stringify(context.currentTask, null, 2),
            toolResult: toolMemo,
            plan: JSON.stringify(context.plan, null, 2),
          }),
        },
      ],
      stream: true,
    });

    const parsedStream = textStream
      .pipeThrough(createThinkingContentTransform())
      .pipeThrough(createContentStructParseTransform());
    let planText = '';
    let finalText = '';
    let status = '';
    let thinking = '';
    const reader = parsedStream.getReader();
    let chunk: ReadableStreamReadResult<StructuredChunk>;
    while (!(chunk = await reader.read()).done) {
      if (chunk.value.type === 'thinking') {
        thinking += chunk.value.content;
        this.ctx.onText(chunk.value.content, 'thinking');
      }
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

    this.ctx.onContentBlockEnd();

    await llmController.planLLM.unload();
    agentLogger.debug(
      `thinking:\n${thinking}\nplan:\n${planText}\n final:\n${finalText}\n status:${status}`,
    );
    const rethinkResult = this.parseRethinkResult(status.trim(), finalText, planText);

    // Update context based on rethink result
    if (rethinkResult.status === 'done') {
      this.stateMachine.updateContext({
        finalAnswer: rethinkResult.finalAnswer,
      });
    } else if (rethinkResult.status === 'changed') {
      const newPlan = this.reconcilePlan(context.plan, rethinkResult.plan);
      const nextTask = newPlan.tasks.find((t) => t.status === 'pending');
      this.stateMachine.updateContext({
        plan: newPlan,
        currentTask: nextTask || null,
        rethinkRounds: context.rethinkRounds + 1,
      });
    } else {
      // Continue with next task
      const nextTask = context.plan.tasks.find((t) => t.status === 'pending');
      this.stateMachine.updateContext({
        currentTask: nextTask || null,
        rethinkRounds: context.rethinkRounds + 1,
      });
    }
  }

  private async buildToolMemo(): Promise<string> {
    const curTask = this.stateMachine.getContext().currentTask;
    if (!curTask) {
      return 'No tool result memory';
    }
    let toolMemo = '';
    for (const step of curTask.steps) {
      const result = await agentDb.toolResult.get(step.step_uuid);
      if (!result) {
        continue;
      }
      toolMemo += `- step_id:${result.stepId}\n- step_goal: ${result.stepGoal}\n - result:\n${result.result}\n\n -file_id: ${result.fileId}`;
    }
    if (!toolMemo) {
      return 'No tool result memory';
    }
    return toolMemo;
  }

  /**
   * Parse rethink result
   */
  private parseRethinkResult(status: string, finalText: string, planText: string): RethinkRes {
    switch (status) {
      case 'continue':
        return { status };
      case 'done':
        return { status, finalAnswer: finalText };
      case 'changed':
        return { status, plan: JSON.parse(planText) };
      default:
        throw new ValueError('Unknown status from rethink: ' + status);
    }
  }

  /**
   * Attach UUIDs to plan
   */
  private attachIds(plan: PlanSchema): void {
    for (const task of plan.tasks) {
      task.task_uuid = uuidv4();
      task.status = task.status ?? 'pending';
      for (const step of task.steps) {
        step.step_uuid = uuidv4();
        step.status = step.status ?? 'pending';
        step.result_file_id = null;
      }
    }
  }

  /**
   * Reconcile plan with incoming changes
   */
  private reconcilePlan(current: PlanSchema, incoming: PlanSchema): PlanSchema {
    const executedPlan = current.tasks.filter((t) => t.status !== 'pending');
    this.attachIds(incoming);
    return { tasks: [...executedPlan, ...incoming.tasks] };
  }
}
