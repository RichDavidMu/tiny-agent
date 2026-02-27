import type { ChatCompletionTool } from '@mlc-ai/web-llm';
import type { CreateFileInput } from '../storage';
import type { ToolStepResult } from './tools.ts';
import type { PlanSchema, StepSchema, TaskSchema } from './planer.ts';

/**
 * Agent execution states
 */
export enum AgentState {
  IDLE = 'idle',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  RETHINKING = 'rethinking',
  DONE = 'done',
  ERROR = 'error',
}

/**
 * State transition context
 */
export interface StateContext {
  thinking: string;
  state: AgentState;
  plan: PlanSchema | null;
  currentTask: TaskSchema | null;
  currentStep: StepSchema | null;
  userInput: string;
  rethinkRounds: number;
  error?: Error;
  finalAnswer?: string;
  finalAttachments?: CreateFileInput[];
}

/**
 * Policy decision result
 */
export interface PolicyDecision {
  nextState: AgentState;
  action?: 'execute_step' | 'rethink' | 'done' | 'plan';
  data?: unknown;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  step: StepSchema;
  plan: PlanSchema;
  task: TaskSchema;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  result: ToolStepResult;
  step: StepSchema;
  tool: ChatCompletionTool | null;
}
