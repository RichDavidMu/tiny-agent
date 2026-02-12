import { agentDb } from '../../../storage';
import type { SessionListResponse } from '../../proto';

export async function getSessionListHandler(): Promise<SessionListResponse> {
  const records = await agentDb.session.list();
  // Sort by updatedAt in descending order (most recent first)
  const sorted = records.sort((a, b) => b.updatedAt - a.updatedAt);
  return { list: sorted.map((r) => ({ id: r.id, name: r.name || r.id })) };
}
