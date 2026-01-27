export type LLMParsedChunk = {
  type: 'thinking' | 'content';
  content: string;
};

const State = {
  INIT: 0, // 决定是否进入 thinking
  THINKING: 1, // <thinking>...</thinking>
  CONTENT: 2, // 正文
} as const;
type StateType = 0 | 1 | 2;

export function createThinkingContentTransform(): TransformStream<string, LLMParsedChunk> {
  const tag = 'think';
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;

  let buffer = '';
  let state: StateType = State.INIT;
  let allowThinking = true;

  function flushBuffer(controller: TransformStreamDefaultController<LLMParsedChunk>) {
    if (!buffer) return;

    if (state === State.THINKING) {
      controller.enqueue({ content: buffer, type: 'thinking' });
    } else {
      controller.enqueue({ content: buffer, type: 'content' });
    }
    buffer = '';
  }

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      while (true) {
        // ===== INIT =====
        if (state === State.INIT) {
          // 吃掉前置空白
          buffer = buffer.replace(/^\s+/, '');
          if (allowThinking && buffer.startsWith(openTag)) {
            buffer = buffer.slice(openTag.length);
            state = State.THINKING;
            continue;
          }

          if (buffer.length > 0) {
            state = State.CONTENT;
            continue;
          }

          break;
        }

        // ===== THINKING =====
        if (state === State.THINKING) {
          const end = buffer.indexOf(closeTag);
          if (end === -1) {
            if (buffer) {
              controller.enqueue({ content: buffer, type: 'thinking' });
              buffer = '';
            }
            break;
          }

          if (end > 0) {
            controller.enqueue({ content: buffer.slice(0, end), type: 'thinking' });
          }

          buffer = buffer.slice(end + closeTag.length);
          state = State.CONTENT;
          allowThinking = false;
          continue;
        }

        // ===== CONTENT =====
        if (state === State.CONTENT) {
          if (buffer) {
            controller.enqueue({ content: buffer, type: 'content' });
            buffer = '';
          }
          break;
        }
      }
    },

    flush(controller) {
      flushBuffer(controller);
    },
  });
}
