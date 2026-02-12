import type {
  HistoryContentNode,
  HistoryNode,
  HistoryResponse,
  HistoryStepContent,
} from '../../proto';
import { type SessionContentNode, type SessionTaskContent, agentDb } from '../../../storage';

export interface GetHistoryReq {
  sessionId: string;
}

export async function getHistory({ sessionId }: GetHistoryReq): Promise<HistoryResponse | null> {
  const session = await agentDb.session.get(sessionId);
  if (!session) {
    return null;
  }

  const nodes: HistoryNode[] = await Promise.all(
    session.nodes.map(async (node) => {
      const content = await Promise.all(node.content.map((c) => transformContentNode(c)));
      return {
        id: node.id,
        role: node.role,
        parent: node.parent,
        content,
      };
    }),
  );

  return {
    id: session.id,
    nodes,
  };
}

async function transformContentNode(node: SessionContentNode): Promise<HistoryContentNode> {
  if (node.type === 'text') {
    return node;
  }
  if (node.type === 'thinking') {
    return node;
  }
  if (node.type === 'task') {
    return transformTaskContent(node);
  }
  return node;
}

async function transformTaskContent(task: SessionTaskContent): Promise<HistoryContentNode> {
  const steps: (HistoryStepContent | null)[] = await Promise.all(
    task.steps.map(async (step) => {
      const toolResult = await agentDb.toolResult.get(step.step_uuid);
      if (!toolResult) {
        return null;
      }
      return {
        step_uuid: step.step_uuid,
        step_goal: step.step_goal,
        tool_name: step.tool_name,
        status: step.status,
        input: toolResult.input,
        shouldAct: toolResult.shouldAct,
        result: toolResult.result,
        stepId: toolResult.stepId,
        attachment: {
          id: toolResult.fileId,
          name: toolResult.resultFile,
          mimeType: toolResult.mimeType,
        },
      };
    }),
  );

  return {
    type: 'task',
    task_uuid: task.task_uuid,
    task_goal: task.task_goal,
    status: task.status,
    steps: steps.filter(Boolean) as HistoryStepContent[],
  };
}
