import type { LLMParsedChunk } from './thinkingContentTransform.ts';

export type StructuredChunk =
  | {
      type: 'plan' | 'status' | 'final';
      content: string;
    }
  | LLMParsedChunk;

export function createContentStructParseTransform(): TransformStream<
  LLMParsedChunk,
  StructuredChunk
> {
  type Mode = 'content' | 'plan' | 'status' | 'final';

  let buffer = '';
  let mode: Mode = 'content';

  const openTags = {
    plan: '<plan>',
    status: '<status>',
    final: '<final>',
  } as const;

  const closeTags = {
    plan: '</plan>',
    status: '</status>',
    final: '</final>',
  } as const;

  const OPEN_TAGS = Object.entries(openTags);
  const CLOSE_TAGS = closeTags;

  function findOpenTag(buf: string) {
    let best: { type: keyof typeof openTags; index: number } | null = null;

    for (const [type, tag] of OPEN_TAGS) {
      const i = buf.indexOf(tag);
      if (i !== -1 && (!best || i < best.index)) {
        best = { type: type as keyof typeof openTags, index: i };
      }
    }
    return best;
  }

  return new TransformStream({
    transform(input, controller) {
      if (input.type !== 'content') {
        controller.enqueue(input);
        return;
      }

      buffer += input.content;

      while (buffer.length > 0) {
        // ===== content 模式 =====
        if (mode === 'content') {
          const next = findOpenTag(buffer);

          if (!next) {
            // ❗不确定是不是 tag 前缀，什么都不输出
            return;
          }

          if (next.index > 0) {
            controller.enqueue({
              type: 'content',
              content: buffer.slice(0, next.index),
            });
          }
          buffer = buffer.slice(next.index + openTags[next.type].length);
          mode = next.type;
          continue;
        }

        // ===== plan / status / final 模式 =====
        const closeTag = CLOSE_TAGS[mode];
        const closeIndex = buffer.indexOf(closeTag);

        if (closeIndex === -1) {
          // ❗同样，可能是 close tag 前缀，等待更多 chunk
          return;
        }

        if (closeIndex > 0) {
          controller.enqueue({
            type: mode,
            content: buffer.slice(0, closeIndex),
          });
        }

        buffer = buffer.slice(closeIndex + closeTag.length);
        mode = 'content';
      }
    },

    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue({
          type: mode,
          content: buffer,
        });
        buffer = '';
      }
    },
  });
}
