import { observer } from 'mobx-react-lite';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message.tsx';
import { cn } from '@/lib/utils.ts';
import { Loader } from '@/components/ui/loader.tsx';
import rootStore from '@/stores/rootStore.ts';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import Footer from '@/components/chat/components/content/components/footer/footer.tsx';
// import llm from '@/agentCore/llm.ts';

const Content = observer(() => {
  const { inputStore } = rootStore;
  const { isMobile } = useSidebar();
  return (
    <div
      data-sidebar={isMobile ? 'mobile' : 'desktop'}
      className="flex h-svh w-full data-[sidebar=desktop]:w-[calc(100vw-var(--sidebar-width))] flex-col bg-muted/30"
    >
      <div className="mx-auto flex w-full h-full max-w-4xl flex-col px-4 py-4">
        <>
          <div className="flex-1 space-y-4 overflow-y-auto rounded-xl p-4">
            {inputStore.messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {/*{llm.ready ? 'Start a conversation with the AI!' : llm.progressText}*/}
              </div>
            )}
            {inputStore.messages.map((message, index) => (
              <Message
                key={index}
                className={cn(message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <MessageAvatar
                  src={message.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
                  alt={message.role === 'user' ? 'User' : 'AI'}
                  fallback={message.role === 'user' ? 'U' : 'AI'}
                />
                <MessageContent
                  markdown={message.role === 'assistant'}
                  className={cn(
                    'max-w-[80%]',
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary',
                  )}
                >
                  {message.content}
                </MessageContent>
              </Message>
            ))}
            {inputStore.loading && (
              <Message>
                <MessageAvatar src="/bot-avatar.png" alt="AI" fallback="AI" />
                <MessageContent className="bg-secondary">
                  <Loader variant="typing" size="md" />
                </MessageContent>
              </Message>
            )}
          </div>
          <Footer />
        </>
      </div>
    </div>
  );
});

export default Content;
