import type { ContentNode } from '@/stream/node';
import { Markdown } from '@/components/ui/markdown.tsx';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ui/reasoning.tsx';

export function ContentBlock({ content }: { content: ContentNode }) {
  if (content.type === 'text') {
    return <Markdown>{content.text}</Markdown>;
  }
  if (content.type === 'task') {
    return <Markdown>{content.text}</Markdown>;
  }
  if (content.type === 'thinking') {
    return (
      <Reasoning isStreaming={!content.ended}>
        <ReasoningTrigger>Show reasoning</ReasoningTrigger>
        <ReasoningContent
          markdown
          className="ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700"
        >
          {content.text}
        </ReasoningContent>
      </Reasoning>
    );
  }
}
