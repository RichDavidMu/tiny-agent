import type { SessionContentNode, SessionNode, SessionTaskContent } from '../../../storage';
import { agentDb } from '../../../storage';
import type { StateContext } from '../../../types';
import type { TaskCtx } from '../task';

export async function saveHistory(sessionId: string, nodes: SessionNode[]): Promise<void> {
  const existing = await agentDb.session.get(sessionId);
  if (existing) {
    await agentDb.session.update(sessionId, { nodes });
  } else {
    await agentDb.session.create({ id: sessionId, nodes });
  }
}

export function buildSessionNodeFromContext(
  messageId: string,
  role: 'user' | 'assistant',
  parent: string | null,
  context: StateContext,
): SessionNode {
  const content: SessionContentNode[] = [];

  // Add user input as text
  if (role === 'user') {
    content.push({ type: 'text', text: context.userInput });
  } else {
    // handle assistant node
    if (context.plan) {
      for (const task of context.plan.tasks) {
        const taskContent: SessionTaskContent = {
          type: 'task',
          task_uuid: task.task_uuid,
          task_goal: task.task_goal,
          status: task.status,
          steps: task.steps.map((step) => ({
            step_uuid: step.step_uuid,
            step_goal: step.step_goal,
            tool_name: step.tool_name,
            status: step.status,
          })),
        };
        content.push(taskContent);
      }
    }
    if (context.finalAnswer) {
      content.push({ type: 'text', text: context.finalAnswer });
    }
  }

  // Add plan tasks

  return {
    id: messageId,
    role,
    parent,
    content,
  };
}

/**
 * Save session history after task execution
 * This function is called from the service layer after agent execution completes
 */
export async function saveSessionHistory(ctx: TaskCtx, finalContext: StateContext): Promise<void> {
  const { userMessageId, assistantMessageId, sessionId: sid } = ctx.getIDs();

  // Load existing session history
  const existingSession = await agentDb.session.get(sid);
  const nodes: SessionNode[] = existingSession?.nodes || [];

  // Find parent node (last assistant message)
  const lastAssistantNode = nodes.filter((n) => n.role === 'assistant').pop();
  const parentId = lastAssistantNode?.id || null;

  // Save user message
  const userNode = buildSessionNodeFromContext(userMessageId, 'user', parentId, finalContext);
  nodes.push(userNode);

  // Save assistant message
  const assistantNode = buildSessionNodeFromContext(
    assistantMessageId,
    'assistant',
    userMessageId,
    finalContext,
  );
  nodes.push(assistantNode);

  // Save session history
  await saveHistory(sid, nodes);
}
