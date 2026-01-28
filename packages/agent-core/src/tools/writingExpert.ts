import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionAssistantMessageParam } from '@mlc-ai/web-llm';
import type { ToolCallResponse } from '../types/llm.ts';
import {
  type LLMParsedChunk,
  createThinkingContentTransform,
} from '../llm/transformers/thinkingContentTransform.ts';
import { ToolCall } from './toolCall.ts';
import ToolBase from './toolBase';

const SYSTEM_PROMPT = `You are a professional writing expert tool built on a general-purpose LLM.

Your sole responsibility is to produce high-quality written content.
You must focus on clarity, structure, tone control, rhetoric, and audience adaptation.

Core principles:
- Prioritize linguistic quality over technical depth.
- Optimize for readability, persuasion, and stylistic consistency.
- Adjust tone precisely based on user intent (formal, casual, academic, marketing, narrative, etc.).
- Respect genre conventions (email, article, report, proposal, copywriting, fiction, documentation).
- Actively improve structure: outlines, headings, logical flow, transitions.

Strict constraints:
- DO NOT write source code or pseudo-code unless the user explicitly asks for code snippets.
- DO NOT explain programming concepts, APIs, system architecture, or algorithms.
- If a request is primarily technical or programming-related, respond with:
  “This request is outside the scope of the writing expert tool.”

Operational behavior:
- When input is vague, infer reasonable writing intent rather than asking questions.
- When rewriting or polishing, preserve original meaning unless explicitly asked to transform it.
- Prefer concrete examples, metaphors, or analogies when helpful.
- Avoid unnecessary verbosity unless long-form writing is requested.

Output requirements:
- Produce only the final written content.
- Do NOT include analysis, reasoning steps, or meta commentary.`;

class WritingTool extends ToolBase {
  schema = {
    name: 'writing_expert',
    description:
      'A specialized writing tool for producing high-quality written content.Focused on clarity, structure, tone control, and stylistic consistency.Suitable for emails, articles, reports, copywriting, and content polishing.Not suitable for programming, code generation, or technical system design.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task: {
          type: 'string',
          description: '任务描述',
        },
      },
      required: ['task'],
    },
  };
}

export class WritingExpert extends ToolCall {
  tool = new WritingTool();
  needContext = true;
  async executeTool(
    toolCall: ToolCallResponse,
    _tool: ToolBase,
    context: ChatCompletionAssistantMessageParam[],
  ): Promise<CallToolResult> {
    const args = toolCall.function.arguments;
    if (typeof args.task !== 'string') {
      return {
        content: [{ type: 'text', text: 'Missing required argument: task' }],
        isError: true,
      };
    }
    const textStream = await this.llm.askLLM({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...context,
        { role: 'user', content: args.task },
      ],
      stream: true,
    });
    const parsedStream = textStream.pipeThrough(createThinkingContentTransform());
    const reader = parsedStream.getReader();
    let content = '';
    let chunk: ReadableStreamReadResult<LLMParsedChunk>;
    while (!(chunk = await reader.read()).done) {
      if (chunk.value.type === 'content') {
        content += chunk.value.content;
      }
    }
    return {
      content: [{ type: 'text', text: content }],
    };
  }
}
