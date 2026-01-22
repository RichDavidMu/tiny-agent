import { qwenTokenizer } from './tokenizer.ts';

type ChunkOptions = {
  maxTokens?: number;
  overlapTokens?: number;
};

const defaultMaxTokens = 400;
const defaultOverlapTokens = 80;

export async function chunkText(text: string, options: ChunkOptions = {}): Promise<string[]> {
  const tokenizer = await qwenTokenizer.getTokenizer();
  return await chunkTextWithTokenizer(text, tokenizer, options);
}

type TokenizerLike = {
  encode: (text: string) => ArrayLike<number>;
  decode?: (tokens: Int32Array) => string;
};

export async function chunkTextWithTokenizer(
  text: string,
  tokenizer: TokenizerLike,
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
    const blockTokens = tokenizer.encode(block).length;
    if (blockTokens > maxTokens) {
      if (current) {
        chunks.push(current);
        current = '';
        currentTokens = 0;
      }
      const splitBlocks = await splitLargeBlockWithTokenizer(block, maxTokens, tokenizer);
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
    const prefix = takeTailByTokensWithTokenizer(chunks[i - 1], overlapTokens, tokenizer);
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

async function splitLargeBlockWithTokenizer(
  block: string,
  maxTokens: number,
  tokenizer: TokenizerLike,
): Promise<string[]> {
  const sentences = splitBySentence(block);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = tokenizer.encode(sentence).length;
    if (sentenceTokens > maxTokens) {
      if (current) {
        chunks.push(current);
        current = '';
        currentTokens = 0;
      }
      chunks.push(...hardSplitWithTokenizer(sentence, maxTokens, tokenizer));
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

function hardSplitWithTokenizer(
  text: string,
  maxTokens: number,
  tokenizer: TokenizerLike,
): string[] {
  const tokens = tokenizer.encode(text);
  if (tokens.length <= maxTokens) {
    return [text];
  }
  const chunks: string[] = [];
  const tokenArray = Array.from(tokens);
  for (let i = 0; i < tokenArray.length; i += maxTokens) {
    const slice = tokenArray.slice(i, i + maxTokens);
    if (tokenizer.decode) {
      chunks.push(tokenizer.decode(Int32Array.from(slice)));
    } else {
      chunks.push(text.slice(0, Math.min(text.length, maxTokens * 4)));
    }
  }
  return chunks;
}

function takeTailByTokensWithTokenizer(
  text: string,
  targetTokens: number,
  tokenizer: TokenizerLike,
): string {
  const tokens = tokenizer.encode(text);
  if (tokens.length <= targetTokens) {
    return text;
  }
  const tail = Array.from(tokens).slice(tokens.length - targetTokens);
  if (tokenizer.decode) {
    return tokenizer.decode(Int32Array.from(tail));
  }
  return text.slice(Math.max(0, text.length - targetTokens));
}
