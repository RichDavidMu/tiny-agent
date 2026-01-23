export interface ToolCallResponse {
  type: 'function';
  id: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface ToolContextDecision {
  use_context: boolean;
  files: string[];
}
