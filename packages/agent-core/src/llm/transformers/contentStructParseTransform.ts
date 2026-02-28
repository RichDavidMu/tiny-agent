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

  const OPEN_ENTRIES = Object.entries(openTags) as [keyof typeof openTags, string][];

  function findEarliestOpenTag(buf: string) {
    let best: { type: keyof typeof openTags; index: number } | null = null;

    for (const [type, tag] of OPEN_ENTRIES) {
      const i = buf.indexOf(tag);
      if (i !== -1 && (!best || i < best.index)) {
        best = { type, index: i };
      }
    }
    return best;
  }

  function longestPrefixOverlap(buf: string, tag: string) {
    const max = Math.min(buf.length, tag.length - 1);

    for (let i = max; i > 0; i--) {
      if (buf.endsWith(tag.slice(0, i))) {
        return i;
      }
    }
    return 0;
  }

  return new TransformStream({
    transform(input, controller) {
      if (input.type !== 'content') {
        controller.enqueue(input);
        return;
      }

      buffer += input.content;

      while (buffer.length > 0) {
        // =========================
        // content 模式
        // =========================
        if (mode === 'content') {
          const next = findEarliestOpenTag(buffer);

          if (!next) {
            // 没有完整 openTag
            // 保留可能的 tag 前缀
            const overlaps = OPEN_ENTRIES.map(([_, tag]) => longestPrefixOverlap(buffer, tag));

            const maxOverlap = Math.max(0, ...overlaps);
            const safeLength = buffer.length - maxOverlap;

            if (safeLength > 0) {
              controller.enqueue({
                type: 'content',
                content: buffer.slice(0, safeLength),
              });
              buffer = buffer.slice(safeLength);
            }

            return;
          }

          // 先输出 openTag 前的内容
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

        // =========================
        // plan / status / final 模式
        // =========================
        const closeTag = closeTags[mode];
        const closeIndex = buffer.indexOf(closeTag);

        if (closeIndex !== -1) {
          // 先输出 closeTag 前的内容
          if (closeIndex > 0) {
            controller.enqueue({
              type: mode,
              content: buffer.slice(0, closeIndex),
            });
          }

          buffer = buffer.slice(closeIndex + closeTag.length);
          mode = 'content';
          continue;
        }

        // 没有完整 closeTag
        const overlap = longestPrefixOverlap(buffer, closeTag);
        const safeLength = buffer.length - overlap;

        if (safeLength > 0) {
          controller.enqueue({
            type: mode,
            content: buffer.slice(0, safeLength),
          });
          buffer = buffer.slice(safeLength);
        }

        return;
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
