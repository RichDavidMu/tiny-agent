import { agentDb } from '../storage/indexedDb.ts';
import type { CreateFileIndexInput, FileIndexRecord } from '../storage/types.ts';
import { EmbeddingEngine } from './embedding.ts';

export type FileIndexSearchResult = {
  record: FileIndexRecord;
  score: number;
};

const defaultEmbeddingEngine = new EmbeddingEngine();

export async function indexFileChunkWithEmbedding(
  input: CreateFileIndexInput,
  embeddingEngine: EmbeddingEngine = defaultEmbeddingEngine,
): Promise<FileIndexRecord> {
  const embedding = await embeddingEngine.embed(input.chunkText);
  const vector = new Float32Array(embedding as number[]);
  return await agentDb.fileIndex.create({
    ...input,
    embedding: vector.buffer,
    embeddingDim: vector.length,
    embeddingModel: embeddingEngine.currentModelId,
  });
}

export async function searchFileIndexByText(
  query: string,
  { limit = 5, minScore = 0.0 }: { limit?: number; minScore?: number } = {},
  embeddingEngine: EmbeddingEngine = defaultEmbeddingEngine,
): Promise<FileIndexSearchResult[]> {
  const embedding = await embeddingEngine.embed(query);
  return await searchFileIndexByEmbedding(embedding as number[], { limit, minScore });
}

export async function searchFileIndexByEmbedding(
  embedding: number[] | Float32Array,
  { limit = 5, minScore = 0.0 }: { limit?: number; minScore?: number } = {},
): Promise<FileIndexSearchResult[]> {
  const queryVector = normalizeVector(
    embedding instanceof Float32Array ? embedding : new Float32Array(embedding),
  );

  const records = await agentDb.fileIndex.list();
  const scored: FileIndexSearchResult[] = [];

  for (const record of records) {
    if (!record.embedding) {
      continue;
    }
    const vector = new Float32Array(record.embedding);
    if (vector.length === 0 || vector.length !== queryVector.length) {
      continue;
    }
    const score = dotProduct(queryVector, normalizeVector(vector));
    if (score >= minScore) {
      scored.push({ record, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function normalizeVector(vector: Float32Array): Float32Array {
  const norm = Math.sqrt(dotProduct(vector, vector));
  if (norm === 0) {
    return vector;
  }
  const normalized = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    normalized[i] = vector[i] / norm;
  }
  return normalized;
}

function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}
