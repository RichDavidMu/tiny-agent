import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { asyncLoadTokenizer } from '@mlc-ai/web-llm/lib/cache_util';
import type { ChatConfig, ModelRecord } from '@mlc-ai/web-llm/lib/config';
import type { Tokenizer } from '@mlc-ai/web-tokenizers';

function findModelRecord(modelId: string): ModelRecord {
  const record = prebuiltAppConfig.model_list.find((item) => item.model_id === modelId);
  if (!record) {
    throw new Error(`Model not found in prebuilt config: ${modelId}`);
  }
  return record;
}

function resolveModelUrl(modelUrl: string): string {
  if (modelUrl.startsWith('http')) {
    return modelUrl;
  }
  if (typeof document !== 'undefined') {
    return new URL(modelUrl, document.URL).href;
  }
  if (typeof location !== 'undefined') {
    return new URL(modelUrl, location.origin).href;
  }
  return modelUrl;
}

async function loadChatConfig(modelUrl: string): Promise<ChatConfig> {
  const configUrl = new URL('mlc-chat-config.json', modelUrl).href;
  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error(`Failed to load chat config: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as ChatConfig;
}

export class QwenTokenizer {
  private tokenizerPromise: Promise<Tokenizer> | null = null;

  async getTokenizer(modelId = defaultModelId): Promise<Tokenizer> {
    if (this.tokenizerPromise) {
      return this.tokenizerPromise;
    }

    this.tokenizerPromise = (async () => {
      const record = findModelRecord(modelId);
      const modelUrl = resolveModelUrl(record.model);
      const config = await loadChatConfig(modelUrl);
      return await asyncLoadTokenizer(modelUrl, config, prebuiltAppConfig);
    })();

    return this.tokenizerPromise;
  }
}

export const qwenTokenizer = new QwenTokenizer();

export async function tokenizeWithQwen3(text: string, modelId?: string): Promise<Int32Array> {
  const tokenizer = await qwenTokenizer.getTokenizer(modelId);
  return tokenizer.encode(text);
}

export async function countTokensWithQwen3(text: string, modelId?: string): Promise<number> {
  const tokens = await tokenizeWithQwen3(text, modelId);
  return tokens.length;
}
const defaultModelId = 'Qwen3-4B-q4f16_1-MLC';
