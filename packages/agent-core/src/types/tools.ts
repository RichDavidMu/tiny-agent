import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

type ExcludeByType<T, K extends string> = T extends { type: K } ? never : T;

export type ICallToolResult = ExcludeByType<CallToolResult, 'audio' | 'resource_link' | 'resource'>;

export type ToolStepResult = {
  result: ICallToolResult;
  input: Record<string, any> | null;
  shouldAct: boolean;
};
