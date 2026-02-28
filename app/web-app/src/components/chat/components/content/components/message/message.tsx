import { observer } from 'mobx-react-lite';
import type { Node } from '@/stream/node';
import { MessageAvatar, Message as MessageBox, MessageContent } from '@/components/ui/message.tsx';
import { cn } from '@/lib/utils.ts';
import { Loader } from '@/components/ui/loader.tsx';
import tree from '@/stream/tree.ts';
import { StatusBlock } from '@/components/chat/components/content/components/message/status-block/status-block.tsx';
import { ContentBlock } from './content-block.tsx';

export const Message = observer(({ node }: { node: Node }) => {
  return (
    <MessageBox className={cn(node.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
      <MessageAvatar
        src={node.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
        alt={node.role === 'user' ? 'User' : 'AI'}
        fallback={node.role === 'user' ? 'U' : 'AI'}
      />
      <MessageContent
        className={cn(
          'space-y-4 max-w-[80%] rounded-lg p-2 text-foreground prose break-words whitespace-normal',
          node.role === 'user' ? 'bg-primary text-primary-foreground' : '',
        )}
      >
        {node.content.map((c) => (
          <ContentBlock content={c} key={c.id} />
        ))}
        {node.isEmpty && <Loader variant="typing" size="md" />}
        {node.role === 'assistant' && tree.currentNode === node && <StatusBlock node={node} />}
      </MessageContent>
    </MessageBox>
  );
});
