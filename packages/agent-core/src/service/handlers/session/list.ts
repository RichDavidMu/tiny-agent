import { agentDb } from '../../../storage';

export async function getSessionListHandler() {
  const records = await agentDb.session.list();
  return records.map((r) => r.id);
}
