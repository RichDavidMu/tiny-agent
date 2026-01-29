import { AgentState, type StateContext } from '../types/fsm.ts';

/**
 * State machine for agent execution
 */
export class StateMachine {
  private context: StateContext;
  private listeners: Map<AgentState, Array<(context: StateContext) => void>> = new Map();

  constructor(initialContext: StateContext) {
    this.context = initialContext;
  }

  getState(): AgentState {
    return this.context.state;
  }

  getContext(): StateContext {
    return { ...this.context };
  }

  updateContext(updates: Partial<StateContext>): void {
    this.context = { ...this.context, ...updates };
  }

  transition(newState: AgentState, updates?: Partial<StateContext>): void {
    const oldState = this.context.state;
    if (updates) {
      this.updateContext(updates);
    }
    this.context.state = newState;
    console.log(`State transition: ${oldState} -> ${newState}`);
    this.notifyListeners(newState);
  }

  on(state: AgentState, callback: (context: StateContext) => void): void {
    if (!this.listeners.has(state)) {
      this.listeners.set(state, []);
    }
    this.listeners.get(state)!.push(callback);
  }

  private notifyListeners(state: AgentState): void {
    const callbacks = this.listeners.get(state);
    if (callbacks) {
      callbacks.forEach((cb) => cb(this.getContext()));
    }
  }

  reset(userInput: string): void {
    this.context = {
      state: AgentState.IDLE,
      plan: null,
      currentTask: null,
      currentStep: null,
      userInput,
      rethinkRounds: 0,
    };
  }
}
