import { observer } from 'mobx-react-lite';
import { useAsyncEffect } from 'ahooks';
import { service } from 'agent-core';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import Footer from '@/components/chat/components/content/components/footer/footer.tsx';
import tree from '@/stream/tree.ts';
import { Message } from '@/components/chat/components/content/components/message/message.tsx';
import rootStore from '@/stores/root-store.ts';

const Content = observer(() => {
  const { historyStore } = rootStore;
  const { sessionId, navigate } = historyStore;
  const { isMobile } = useSidebar();

  useEffect(() => () => tree.reset(), []);
  useAsyncEffect(async () => {
    tree.reset();
    if (sessionId) {
      const history = await service.getSessionHistory({ sessionId });
      if (!history) {
        toast.error('invalidate session');
        navigate('/chat');
        return;
      }
      tree.generateFromSession(history);
    }
  }, [sessionId]);

  return (
    <div
      data-sidebar={isMobile ? 'mobile' : 'desktop'}
      className="flex h-svh w-full data-[sidebar=desktop]:w-[calc(100vw-var(--sidebar-width))] flex-col bg-muted/30"
    >
      <div className="mx-auto flex w-full h-full max-w-4xl flex-col px-4 py-4">
        <>
          <div className="flex-1 space-y-4 overflow-y-auto rounded-xl p-4">
            {tree.list.length === 0 && (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {/*{llm.ready ? 'Start a conversation with the AI!' : llm.progressText}*/}
              </div>
            )}
            {tree.list.map((node) => (
              <Message node={node} key={node.id} />
            ))}
          </div>
          <Footer />
        </>
      </div>
    </div>
  );
});

export default Content;
