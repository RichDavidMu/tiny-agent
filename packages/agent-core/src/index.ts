import type { AgentChunk } from '@/types/agentProtocol.ts';

export class AgentCore {
  client = null;
  async chat({
    sessionId: _,
    input: __,
  }: {
    sessionId: string;
    input: string;
  }): Promise<AsyncIterable<AgentChunk>> {
    throw new Error('Not implemented');
  }
}
