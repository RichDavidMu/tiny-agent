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

  const ALL_TAGS = [...Object.values(openTags), ...Object.values(closeTags)];

  const MAX_TAG_LEN = Math.max(...ALL_TAGS.map((t) => t.length));

  function findNextOpenTag(buf: string) {
    let best: { type: keyof typeof openTags; index: number } | null = null;

    for (const type of Object.keys(openTags) as Array<keyof typeof openTags>) {
      const i = buf.indexOf(openTags[type]);
      if (i !== -1 && (!best || i < best.index)) {
        best = { type, index: i };
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
          const next = findNextOpenTag(buffer);

          if (!next) {
            // ⚠️ 关键：只输出“安全前缀”
            const safeLen = buffer.length - (MAX_TAG_LEN - 1);
            if (safeLen > 0) {
              controller.enqueue({
                type: 'content',
                content: buffer.slice(0, safeLen),
              });
              buffer = buffer.slice(safeLen);
            }
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

        // ===== plan / state / final 模式 =====
        const closeTag = closeTags[mode];
        const closeIndex = buffer.indexOf(closeTag);

        if (closeIndex === -1) {
          const safeLen = buffer.length - (MAX_TAG_LEN - 1);
          if (safeLen > 0) {
            controller.enqueue({
              type: mode,
              content: buffer.slice(0, safeLen),
            });
            buffer = buffer.slice(safeLen);
          }
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
