import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { EmbeddingEngine } from '../embeddings/embedding.ts';
import { chunkText } from '../embeddings/chunking.ts';
import { type LLM, toolLLM } from '../llm/llm.ts';
import { agentDb } from '../storage/indexedDb.ts';
import type { ToolCallResponse } from '../types/llm.ts';
import type ToolBase from './toolBase.ts';

type StepContext = {
  taskId?: string;
  stepId?: string;
  resultFile?: string;
};

const embeddingEngine = new EmbeddingEngine();

export abstract class ToolCall {
  abstract tool: ToolBase;

  llm: LLM = toolLLM;

  toolCall: ToolCallResponse | null = null;

  async step(task: string, context: StepContext): Promise<CallToolResult> {
    const shouldAct = await this.think(task);
    console.log('shouldAct\n', shouldAct, '\n', 'toolCall:\n', this.toolCall);
    let result: CallToolResult;
    if (shouldAct) {
      result = await this.act(this.toolCall!);
      const sanitized = this.sanitizeResult(result);
      await this.persistResult(sanitized, context);
      return sanitized;
    }
    result = {
      content: [
        {
          type: 'text',
          text: `${this.tool.name}: toolCall success, No action needed. task: ${task}`,
        },
      ],
    };
    await this.persistResult(result, context);
    return result;
  }

  private async think(task: string): Promise<boolean> {
    const toolCall = await this.llm.toolCall({
      task,
      tool: this.tool.toParams(),
    });
    if (!toolCall) {
      return false;
    }
    this.toolCall = toolCall;
    return true;
  }
  private async act(toolCall: ToolCallResponse): Promise<CallToolResult> {
    return await this.executeTool(toolCall, this.tool);
  }
  abstract executeTool(toolCall: ToolCallResponse, tool: ToolBase): Promise<CallToolResult>;

  private sanitizeResult(result: CallToolResult): CallToolResult {
    if (!result || !Array.isArray(result.content)) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid tool result from ${this.tool.name}: missing content array`,
          },
        ],
        isError: true,
      };
    }

    const invalidItem = result.content.find(
      (item) => item.type !== 'text' && item.type !== 'image',
    );
    if (invalidItem) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid tool result from ${this.tool.name}: unsupported content type ${String(
              invalidItem.type,
            )}`,
          },
        ],
        isError: true,
      };
    }

    return result;
  }

  private async persistResult(result: CallToolResult, context: StepContext): Promise<void> {
    const fileNameBase = context?.resultFile;
    let fileRecord: {
      id: string;
      name: string;
      mimeType: string;
      content: string;
    } | null = null;

    if (result.isError) {
      const errorText = this.collectTextContent(result) || 'Unknown tool error';
      fileRecord = await agentDb.file.create({
        name: `${fileNameBase}.txt`,
        mimeType: 'text/plain',
        content: errorText,
      });
    } else {
      const imageItem = result.content.find((item) => item.type === 'image');
      if (imageItem && 'data' in imageItem) {
        const mimeType =
          typeof imageItem.mimeType === 'string' ? imageItem.mimeType : 'application/octet-stream';
        fileRecord = await agentDb.file.create({
          name: `${fileNameBase}${this.extensionForMime(mimeType)}`,
          mimeType,
          content: String(imageItem.data ?? ''),
        });
      } else {
        const textContent = this.collectTextContent(result);
        fileRecord = await agentDb.file.create({
          name: `${fileNameBase}.txt`,
          mimeType: 'text/plain',
          content: textContent || '',
        });
      }
    }

    if (fileRecord && fileRecord.mimeType.startsWith('text/')) {
      const chunks = await chunkText(fileRecord.content);
      const embeddings = (await embeddingEngine.embed(chunks)) as number[][];
      for (let i = 0; i < chunks.length; i += 1) {
        const vector = new Float32Array(embeddings[i] ?? []);
        await agentDb.fileIndex.create({
          fileId: fileRecord.id,
          name: fileRecord.name,
          chunkText: chunks[i],
          chunkIndex: i,
          taskId: context?.taskId ?? 'unknown',
          stepId: context?.stepId ?? 'unknown',
          toolName: this.tool.name,
          embedding: vector.buffer,
          embeddingDim: vector.length,
          embeddingModel: embeddingEngine.currentModelId,
        });
      }
    }
  }

  private collectTextContent(result: CallToolResult): string {
    return result.content
      .filter((item) => item.type === 'text')
      .map((item) => ('text' in item ? String(item.text ?? '') : ''))
      .filter((text) => text.length > 0)
      .join('\n\n');
  }

  private extensionForMime(mimeType: string): string {
    if (mimeType === 'image/png') {
      return '.png';
    }
    if (mimeType === 'image/jpeg') {
      return '.jpg';
    }
    if (mimeType === 'image/webp') {
      return '.webp';
    }
    if (mimeType.startsWith('image/')) {
      return `.${mimeType.split('/')[1]}`;
    }
    return '.bin';
  }
}
