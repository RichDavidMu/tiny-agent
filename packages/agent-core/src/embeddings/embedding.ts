import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';
import type {
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
} from '@mlc-ai/web-llm/lib/openai_api_protocols/embedding';

const defaultEmbeddingModelId = 'snowflake-arctic-embed-s-q0f32-MLC-b4';

export class EmbeddingEngine {
  private modelId: string;
  private client: MLCEngine | null = null;
  progressText = '';
  ready = false;

  constructor({ modelId = defaultEmbeddingModelId }: { modelId?: string } = {}) {
    this.modelId = modelId;
    void this.load();
  }

  get currentModelId(): string {
    return this.modelId;
  }

  async load(): Promise<void> {
    this.client = await CreateMLCEngine(
      this.modelId,
      {
        initProgressCallback: (progress) => {
          console.log(progress.text);
          this.progressText = progress.text;
        },
      },
      { context_window_size: 512 },
    );
    await this.client.unload();
    this.ready = true;
  }

  async reload(): Promise<void> {
    if (!this.client) {
      throw new Error('No available embedding engine');
    }
    await this.client.reload(this.modelId);
  }

  async unload(): Promise<void> {
    if (!this.client) {
      throw new Error('No available embedding engine');
    }
    await this.client.unload();
  }

  async embed(input: string | string[]): Promise<number[] | number[][]> {
    const response = await this.embedWithResponse({ input, model: this.modelId });
    if (Array.isArray(input)) {
      return response.data.map((item) => item.embedding);
    }
    return response.data[0].embedding;
  }

  async embedWithResponse(request: EmbeddingCreateParams): Promise<CreateEmbeddingResponse> {
    if (!this.client) {
      throw new Error('No available embedding engine');
    }

    await this.reload();
    try {
      return await this.client.embeddings.create({
        ...request,
        model: request.model ?? this.modelId,
      });
    } finally {
      await this.unload();
    }
  }
}
