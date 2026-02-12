import { agentDb } from '../../../storage';
import type { SessionListResponse } from '../../proto';

export async function getSessionListHandler(): Promise<SessionListResponse> {
  const records = await agentDb.session.list();
  return { list: records.map((r) => ({ id: r.id, name: r.name })) };
}
