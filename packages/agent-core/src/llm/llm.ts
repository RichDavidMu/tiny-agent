import type { ChatCompletionToolMessageParam, WebWorkerMLCEngine } from '@mlc-ai/web-llm';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from '@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion';
import type {
  AskLLMInputBase,
  AskLLMInputNonStreaming,
  AskLLMInputStreaming,
  ToolCallResponse,
  ToolContextDecision,
} from '../types/llm.ts';
import { parseLLMReply } from '../utils/llmHelper.ts';
import type { StepSchema } from '../types/planer.ts';
import { ValueError } from '../utils/exceptions.ts';
import {
  ToolCallSystemPrompt,
  ToolCallUserPrompt,
  toolContextSystemPrompt,
  toolContextUserPrompt,
} from './prompt.ts';
import { ChunkIterableToReadableStream } from './utils.ts';

export class LLM {
  model_id: string;
  client: WebWorkerMLCEngine | null = null;
  progressText: string = '';
  ready = false;
  constructor({ model_id = 'Qwen3-4B-q4f16_1-MLC' }: { model_id?: string } = {}) {
    this.model_id = model_id;
    void this.load();
  }
  async reload(): Promise<void> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    await this.client.reload(this.model_id);
    console.log(this.model_id, ' reloaded');
  }

  async unload(): Promise<void> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    await this.client.unload();
    console.log(this.model_id, ' unloaded');
  }

  async load(): Promise<void> {
    this.client = await CreateWebWorkerMLCEngine(
      new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      }),
      this.model_id,
      {
        initProgressCallback: (progress) => {
          this.progressText = progress.text;
        },
      },
      { context_window_size: 32768 },
    );
    await this.client.unload();
    console.log(this.model_id, 'loaded');
    this.ready = true;
  }

  async askLLM(params: AskLLMInputBase | AskLLMInputNonStreaming): Promise<string>;
  async askLLM(params: AskLLMInputStreaming): Promise<ReadableStream<string>>;
  async askLLM({
    messages,
    stream = false,
    enableThinking = true,
  }: {
    messages: Array<ChatCompletionMessageParam>;
    stream?: boolean;
    enableThinking?: boolean;
  }): Promise<string | ReadableStream<string>> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    if (!stream) {
      const response = await this.client.chat.completions.create({
        messages,
        stream,
      });
      if (!response.choices[0].message.content) {
        throw new ValueError('Empty or invalid response from LLM');
      }
      return response.choices[0].message.content;
    }
    const response = await this.client.chat.completions.create({
      messages,
      stream,
      extra_body: {
        enable_thinking: enableThinking,
      },
    });
    return ChunkIterableToReadableStream(response);
  }
  async toolCall({
    step,
    tool,
    context,
  }: {
    step: StepSchema;
    tool: ChatCompletionTool;
    context: ChatCompletionToolMessageParam[];
  }): Promise<ToolCallResponse> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: ToolCallSystemPrompt(JSON.stringify(tool, null, 2)) },
      ...context,
      { role: 'user', content: ToolCallUserPrompt(step.step_goal) },
    ];
    const response = await this.client.chat.completions.create({
      messages,
    });
    if (!response.choices[0].message.content) {
      throw new ValueError('Empty response from LLM');
    }
    const { content } = parseLLMReply(response.choices[0].message.content);
    return JSON.parse(content) as ToolCallResponse;
  }

  async toolContext({
    step,
    tool,
    historyContext,
  }: {
    step: StepSchema;
    tool: ChatCompletionTool;
    historyContext: string;
  }): Promise<ToolContextDecision> {
    if (!this.client) {
      throw new ValueError('No available LLM client');
    }
    const response = await this.client?.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: toolContextSystemPrompt(historyContext, JSON.stringify(tool, null, 2)),
        },
        { role: 'user', content: toolContextUserPrompt(step.step_goal) },
      ],
    });
    if (!response.choices[0].message.content) {
      throw new ValueError('Empty response from LLM');
    }
    const { content } = parseLLMReply(response.choices[0].message.content);
    return JSON.parse(content) as ToolContextDecision;
  }
}
export const planLLM = new LLM();
export const toolLLM = planLLM;
