export const Role = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;
export const ROLE_VALUES = Array.from(Object.values(Role));
export type ROLE_TYPE = (typeof Role)[keyof typeof Role];

export const ToolChoice = {
  NONE: 'none',
  AUTO: 'auto',
  REQUIRED: 'required',
} as const;
export const TOOL_CHOICE_VALUES = Array.from(Object.values(ToolChoice));
export type TOOL_CHOICE_TYPE = (typeof ToolChoice)[keyof typeof ToolChoice];

export const AgentState = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  FINISHED: 'FINISHED',
  ERROR: 'ERROR',
} as const;
export const AGENT_STATE_VALUES = Array.from(Object.values(AgentState));
export type AGENT_STATE_TYPE = (typeof AgentState)[keyof typeof AgentState];
