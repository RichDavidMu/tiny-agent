import type { MLCEngine } from '@mlc-ai/web-llm';

type ChunkOptions = {
  maxTokens?: number;
  overlapTokens?: number;
};

const defaultMaxTokens = 400;
const defaultOverlapTokens = 80;

export async function chunkText(
  text: string,
  engine: MLCEngine,
  options: ChunkOptions = {},
): Promise<string[]> {
  const maxTokens = options.maxTokens ?? defaultMaxTokens;
  const overlapTokens = options.overlapTokens ?? defaultOverlapTokens;
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim());
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const block of blocks) {
    if (!block) {
      continue;
    }
    const blockTokens = (await engine.tokenize(block)).length;
    if (blockTokens > maxTokens) {
      if (current) {
        chunks.push(current);
        current = '';
        currentTokens = 0;
      }
      const splitBlocks = await splitLargeBlockWithEngine(block, maxTokens, engine);
      for (const splitBlock of splitBlocks) {
        chunks.push(splitBlock);
      }
      continue;
    }

    if (currentTokens + blockTokens <= maxTokens) {
      current = current ? `${current}\n\n${block}` : block;
      currentTokens += blockTokens;
    } else {
      chunks.push(current);
      current = block;
      currentTokens = blockTokens;
    }
  }

  if (current) {
    chunks.push(current);
  }

  if (overlapTokens <= 0 || chunks.length <= 1) {
    return chunks;
  }

  const overlapped: string[] = [];
  for (let i = 0; i < chunks.length; i += 1) {
    if (i === 0) {
      overlapped.push(chunks[i]);
      continue;
    }
    const prefix = await takeTailByTokensWithEngine(chunks[i - 1], overlapTokens, engine);
    overlapped.push(prefix ? `${prefix}\n\n${chunks[i]}` : chunks[i]);
  }
  return overlapped;
}

function splitBySentence(text: string): string[] {
  const parts = text
    .split(/([.!?。！？]\s+)/)
    .map((part) => part.trim())
    .filter(Boolean);

  const sentences: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    if (i % 2 === 0) {
      const sentence = parts[i];
      const punctuation = parts[i + 1] ?? '';
      sentences.push(`${sentence}${punctuation}`.trim());
    }
  }
  return sentences.length > 0 ? sentences : [text];
}

async function splitLargeBlockWithEngine(
  block: string,
  maxTokens: number,
  engine: MLCEngine,
): Promise<string[]> {
  const sentences = splitBySentence(block);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = (await engine.tokenize(sentence)).length;
    if (sentenceTokens > maxTokens) {
      if (current) {
        chunks.push(current);
        current = '';
        currentTokens = 0;
      }
      chunks.push(...(await hardSplitWithEngine(sentence, maxTokens, engine)));
      continue;
    }

    if (currentTokens + sentenceTokens <= maxTokens) {
      current = current ? `${current} ${sentence}` : sentence;
      currentTokens += sentenceTokens;
    } else {
      chunks.push(current);
      current = sentence;
      currentTokens = sentenceTokens;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function hardSplitWithEngine(
  text: string,
  maxTokens: number,
  engine: MLCEngine,
): Promise<string[]> {
  const tokens = await engine.tokenize(text);
  if (tokens.length <= maxTokens) {
    return [text];
  }
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const slice = tokens.slice(i, i + maxTokens);
    chunks.push(await engine.decodeTokens(slice));
  }
  return chunks;
}

async function takeTailByTokensWithEngine(
  text: string,
  targetTokens: number,
  engine: {
    tokenize: (input: string) => Promise<Int32Array>;
    decodeTokens: (input: Int32Array) => Promise<string>;
  },
): Promise<string> {
  const tokens = await engine.tokenize(text);
  if (tokens.length <= targetTokens) {
    return text;
  }
  const tail = tokens.slice(tokens.length - targetTokens);
  return await engine.decodeTokens(tail);
}
