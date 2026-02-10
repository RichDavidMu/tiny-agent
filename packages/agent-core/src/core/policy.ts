import { AgentState, type PolicyDecision, type StateContext } from '../types/fsm.ts';

/**
 * Policy interface - decides what to do next based on current state
 */
export interface IPolicy {
  decide(context: StateContext): Promise<PolicyDecision>;
}

/**
 * Default policy implementation
 */
export class Policy implements IPolicy {
  private readonly maxRethinkRounds = 10;

  async decide(context: StateContext): Promise<PolicyDecision> {
    switch (context.state) {
      case AgentState.IDLE: {
        return { nextState: AgentState.PLANNING, action: 'plan' };
      }
      case AgentState.PLANNING: {
        if (!context.plan || context.plan.tasks.length === 0 || context.error) {
          return { nextState: AgentState.ERROR };
        }
        return { nextState: AgentState.EXECUTING, action: 'execute_step' };
      }

      case AgentState.EXECUTING: {
        if (!context.currentTask) {
          return { nextState: AgentState.ERROR };
        }
        const nextStep = context.currentTask.steps.find((s) => s.status === 'pending');
        if (nextStep) {
          return { nextState: AgentState.EXECUTING, action: 'execute_step' };
        }
        return { nextState: AgentState.RETHINKING, action: 'rethink' };
      }

      case AgentState.RETHINKING: {
        if (context.rethinkRounds >= this.maxRethinkRounds) {
          return { nextState: AgentState.ERROR };
        }
        // finalAnswer exist, return finalAnswer to user
        if (context.finalAnswer) {
          return { nextState: AgentState.DONE };
        }
        // Find next pending task
        const nextTask = context.plan?.tasks.find((t) => t.status === 'pending');
        if (nextTask) {
          return { nextState: AgentState.EXECUTING, action: 'execute_step' };
        }
        return { nextState: AgentState.RETHINKING };
      }
      case AgentState.DONE:
      case AgentState.ERROR:
        return { nextState: context.state };

      default:
        return { nextState: AgentState.ERROR };
    }
  }
}
