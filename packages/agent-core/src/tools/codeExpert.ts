import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ChatCompletionAssistantMessageParam } from '@mlc-ai/web-llm';
import type { ToolCallResponse } from '../types/llm.ts';
import {
  type LLMParsedChunk,
  createThinkingContentTransform,
} from '../llm/transformers/thinkingContentTransform.ts';
import { ToolCall } from './toolCall.ts';
import ToolBase from './toolBase';

const SYSTEM_PROMPT = `You are a code expert tool built on a general-purpose LLM.

Your only task is to produce correct, high-quality source code.

Strict output rules:
- Output ONLY code.
- Do NOT include explanations, comments outside code, markdown, or formatting fences.
- Do NOT include analysis, reasoning, or natural language text.
- Do NOT restate the problem.

Behavioral requirements:
- Assume the input provides sufficient context to write the code.
- If details are missing, make reasonable engineering assumptions and encode them directly in the code.
- Prefer clear structure, idiomatic style, and maintainable abstractions.
- Handle edge cases and errors explicitly in code.
- Do not overengineer unless required by the task.

Scope constraints:
- Focus strictly on software implementation.
- Do not write prose, documentation, or stylistic content.
- If the request is not a programming task, output nothing.

Language handling:
- Use the language specified in the input.
- If no language is specified, default to TypeScript.

Quality bar:
- Code should be production-ready or near-production-ready.
- Avoid placeholders, TODOs, or pseudocode.`;

class CodeTool extends ToolBase {
  schema = {
    name: 'code_expert',
    description: `A specialized software engineering tool for solving programming and system design problems.
Focused on correctness, performance, maintainability, and best engineering practices.
Suitable for code implementation, debugging, refactoring, and architecture design.
Not suitable for prose writing, copywriting, or stylistic language tasks.`,
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

export class CodeExpert extends ToolCall {
  tool = new CodeTool();
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
