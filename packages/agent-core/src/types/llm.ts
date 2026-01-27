import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

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

export interface AskLLMInputBase {
  messages: Array<ChatCompletionMessageParam>;
  enableThinking?: boolean;
}
export interface AskLLMInputStreaming extends AskLLMInputBase {
  stream: true;
}
export interface AskLLMInputNonStreaming {
  stream: false;
}
