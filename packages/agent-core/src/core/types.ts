import type { ChatCompletionTool } from '@mlc-ai/web-llm';
import type { ICallToolResult } from '../types/tools.ts';
import type { PlanSchema, StepSchema, TaskSchema } from '../types/planer.ts';

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
  state: AgentState;
  plan: PlanSchema | null;
  currentTask: TaskSchema | null;
  currentStep: StepSchema | null;
  userInput: string;
  rethinkRounds: number;
  error?: Error;
  finalAnswer?: string;
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
  result: ICallToolResult;
  step: StepSchema;
  tool: ChatCompletionTool | null;
}
