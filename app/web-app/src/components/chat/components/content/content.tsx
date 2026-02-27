import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import Footer from '@/components/chat/components/content/components/footer/footer.tsx';
import tree from '@/stream/tree.ts';
import { Message } from '@/components/chat/components/content/components/message/message.tsx';
import { useScroll } from '@/hooks/use-scroll.tsx';
import stream from '@/stream/stream.ts';

const Content = observer(() => {
  const { isMobile } = useSidebar();
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerListRef = useRef<HTMLDivElement | null>(null);
  useScroll(containerRef, scrollBottomRef, innerListRef, stream.loading);
  return (
    <div
      data-sidebar={isMobile ? 'mobile' : 'desktop'}
      className="flex h-svh w-full data-[sidebar=desktop]:w-[calc(100vw-var(--sidebar-width))] flex-col bg-muted/30"
    >
      <div className="mx-auto flex w-full h-full max-w-4xl flex-col px-4 py-4">
        <>
          <div ref={containerRef} className="flex-1 overflow-y-auto rounded-xl p-4 no-scrollbar">
            <div ref={innerListRef} className="space-y-4">
              {tree.list.length === 0 && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {/*{llm.ready ? 'Start a conversation with the AI!' : llm.progressText}*/}
                </div>
              )}
              {tree.list.map((node) => (
                <Message node={node} key={node.id} />
              ))}
              <div ref={scrollBottomRef} />
            </div>
          </div>
          <Footer />
        </>
      </div>
    </div>
  );
});

export default Content;
