import { marked } from 'marked';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown, { type ExtraProps } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { CreateFileInput } from '@tini-agent/agent-core';
import rehypeRaw from 'rehype-raw';
import { useMemoizedFn } from 'ahooks';
import { CodeComponent } from '@/components/ui/markdown/code.tsx';
import { PreComponent } from '@/components/ui/markdown/pre.tsx';
import { FileComponent } from '@/components/ui/markdown/file.tsx';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  attachments?: CreateFileInput[];
};

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({ children, attachments }: Omit<MarkdownProps, 'id' | 'className'>) {
    const file = useMemoizedFn(({ children }: { children: string } & ExtraProps) => {
      if (!children) {
        return null;
      }
      const ids = children.split(',');
      return <FileComponent ids={ids} attachment={attachments} />;
    });

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code: CodeComponent,
          pre: PreComponent,
          // eslint-disable-next-line
          // @ts-ignore
          file,
        }}
      >
        {children}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.children === nextProps.children;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

function MarkdownComponent({ children, id, className, attachments }: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock attachments={attachments} key={`${blockId}-block-${index}`}>
          {block}
        </MemoizedMarkdownBlock>
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

export { Markdown };
