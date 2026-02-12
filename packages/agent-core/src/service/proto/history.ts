// History response types for service layer
import type {
  CreateToolResultInput,
  SessionStepContent,
  SessionTaskContent,
  SessionTextContent,
  SessionThinkingContent,
} from '../../storage';
import type { DeltaTaskContentToolResult } from './task.ts';

export type HistoryResponse = {
  id: string; // session_id
  nodes: HistoryNode[];
};

export type HistoryNode = {
  id: string; // message_id
  role: 'user' | 'assistant';
  parent: string | null;
  content: HistoryContentNode[];
};

export type HistoryContentNode = HistoryTextContent | HistoryThinkingContent | HistoryTaskContent;

export interface HistoryTextContent extends SessionTextContent {}

export interface HistoryThinkingContent extends SessionThinkingContent {}

export interface HistoryTaskContent extends SessionTaskContent {
  steps: HistoryStepContent[];
}

export interface HistoryStepContent
  extends
    SessionStepContent,
    Pick<CreateToolResultInput, 'shouldAct' | 'input' | 'result' | 'stepId'>,
    Pick<DeltaTaskContentToolResult, 'attachment'> {}
