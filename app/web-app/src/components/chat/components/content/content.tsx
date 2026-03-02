import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar.tsx';
import Footer from '@/components/chat/components/content/components/footer/footer.tsx';
import tree from '@/stream/tree.ts';
import { Message } from '@/components/chat/components/content/components/message/message.tsx';
import { useScroll } from '@/hooks/use-scroll.tsx';
import stream from '@/stream/stream.ts';
import mcpStore from '@/stores/mcp-store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Content = observer(() => {
  const { isMobile } = useSidebar();
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerListRef = useRef<HTMLDivElement | null>(null);
  useScroll(containerRef, scrollBottomRef, innerListRef, stream.loading);

  // 加载 MCP 配置以检查插件安装状态
  useEffect(() => {
    mcpStore.loadMCPConfigs();
  }, []);
  return (
    <div
      data-sidebar={isMobile ? 'mobile' : 'desktop'}
      className="flex h-svh w-full data-[sidebar=desktop]:w-[calc(100vw-var(--sidebar-width))] flex-col bg-muted/30"
    >
      <div className="mx-auto flex w-full h-full max-w-4xl flex-col px-4 py-4">
        <>
          <div ref={containerRef} className="flex-1 overflow-y-auto rounded-xl p-4 no-scrollbar">
            {tree.list.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-2xl space-y-4">
                  {/* MCP 插件安装提示 */}
                  {!mcpStore.extensionInstalled && (
                    <Alert variant="default">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>需要安装浏览器扩展</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p>
                          要使用MCP功能，您需要安装 Tiny Agent MCP Bridge
                          浏览器扩展。安装后可以使用网页检索工具。
                        </p>
                        <p className="text-sm">安装扩展后，请刷新此页面以继续。</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            window.open(
                              'https://chromewebstore.google.com/detail/tiny-agent-mcp-bridge/enancoankilkplgabpojdilmgjaebodi',
                              '_blank',
                            )
                          }
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          安装扩展
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* 模型加载状态 */}
                  {!stream.ready && (
                    <div className="text-center text-muted-foreground">
                      正在加载模型(qwen3-4b)
                      <br />
                      {stream.readyProgress}
                    </div>
                  )}
                  {/* 欢迎消息 */}
                  {stream.ready && mcpStore.extensionInstalled && (
                    <div className="text-center text-muted-foreground">
                      Start a conversation with the AI!
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={innerListRef} className="space-y-4">
              {tree.list.map((node) => (
                <Message
                  node={node}
                  key={node.id}
                  status={tree.status}
                  isCurrentNode={tree.currentNode === node}
                />
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
