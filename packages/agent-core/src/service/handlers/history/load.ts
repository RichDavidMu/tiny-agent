import { type SessionNode, agentDb } from '../../../storage';

export async function loadHistory(sessionId: string): Promise<SessionNode[]> {
  const session = await agentDb.session.get(sessionId);
  if (!session) {
    return [];
  }

  return session.nodes;
}
