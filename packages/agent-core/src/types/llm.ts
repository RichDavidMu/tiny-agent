export interface ToolCallResponse {
  type: 'function';
  id: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}
