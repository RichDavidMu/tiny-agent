import { observer } from 'mobx-react-lite';
import { AgentState } from '@tini-agent/agent-core';
import type { Node } from '@/stream/node';
import { Loader } from '@/components/ui/loader.tsx';

export const StatusBlock = observer(({ node, status }: { node: Node; status: AgentState }) => {
  const latestContent = node.content[node.content.length - 1];
  if (!latestContent) {
    return null;
  }
  if (status === AgentState.PLANNING && latestContent.type === 'thinking' && latestContent.ended) {
    return <Loader size="md" text="Planing" variant="loading-dots" />;
  }
  if (status === AgentState.RETHINKING) {
    return <Loader size="md" text="Rethinking" variant="loading-dots" />;
  }
});
