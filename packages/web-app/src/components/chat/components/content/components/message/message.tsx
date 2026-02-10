import type { Node } from '@/stream/node';
import { MessageAvatar, Message as MessageBox, MessageContent } from '@/components/ui/message.tsx';
import { cn } from '@/lib/utils.ts';
import { ContentBlock } from '@/components/chat/components/content/components/message/contentBlock.tsx';

export function Message({ node }: { node: Node }) {
  return (
    <MessageBox className={cn(node.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
      <MessageAvatar
        src={node.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
        alt={node.role === 'user' ? 'User' : 'AI'}
        fallback={node.role === 'user' ? 'U' : 'AI'}
      />
      <MessageContent
        className={cn(
          'max-w-[80%] rounded-lg p-2 text-foreground bg-secondary prose break-words whitespace-normal',
          node.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary',
        )}
      >
        {node.content.map((c) => (
          <ContentBlock content={c} key={c.id} />
        ))}
      </MessageContent>
    </MessageBox>
  );
}
