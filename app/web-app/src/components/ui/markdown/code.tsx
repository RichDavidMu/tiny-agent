import type { JSX } from 'react';
import type { ExtraProps } from 'react-markdown';
import { cn } from '@/lib/utils.ts';
import { CodeBlock, CodeBlockCode } from '@/components/ui/code-block.tsx';

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext';
  const match = /language-(\w+)/.exec(className);
  return match ? match[1] : 'plaintext';
}

export function CodeComponent({
  className,
  children,
  ...props
}: JSX.IntrinsicElements['code'] & ExtraProps) {
  const isInline =
    !props.node?.position?.start.line ||
    props.node?.position?.start.line === props.node?.position?.end.line;

  if (isInline) {
    return (
      <span
        className={cn('bg-primary-foreground rounded-sm px-1 font-mono text-sm', className)}
        {...props}
      >
        {children}
      </span>
    );
  }

  const language = extractLanguage(className);

  return (
    <CodeBlock className={className}>
      <CodeBlockCode code={children as string} language={language} />
    </CodeBlock>
  );
}
