import type { ChatCompletionChunk } from '@mlc-ai/web-llm';

export function ChunkIterableToReadableStream(
  iterable: AsyncIterable<ChatCompletionChunk>,
  options: {
    onStop?: () => Promise<void>;
  } = {},
): ReadableStream<string> {
  const iterator = iterable[Symbol.asyncIterator]();
  const { onStop = () => {} } = options;
  return new ReadableStream<string>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
        await onStop();
      } else {
        controller.enqueue(value.choices[0].delta?.content || '');
      }
    },
    async cancel() {
      try {
        if (iterator.return) {
          await iterator.return();
        }
      } finally {
        await onStop();
      }
    },
  });
}
