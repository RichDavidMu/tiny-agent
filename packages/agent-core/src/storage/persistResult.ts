import type { ChatCompletionTool } from '@mlc-ai/web-llm';
import { agentLogger } from '@tini-agent/utils';
import type { StepSchema, ToolStepResult } from '../types';
import { agentDb } from './db.ts';

/**
 * Persist tool execution result to database
 * - If successful: saves file and records to toolResult table
 * - If failed: only records to toolResult table without saving file
 */
export async function persistResult(
  stepResult: ToolStepResult,
  step: StepSchema,
  taskId: string,
  tool: ChatCompletionTool | null,
): Promise<void> {
  const { result, shouldAct, input } = stepResult;
  const fileName = step.result_file_name;
  const content = result.content[0];
  const isError = result.isError || false;

  let resultText: string;
  let mimeType: string;
  let fileContent: string;

  if (content.type === 'text') {
    resultText = content.text ?? 'Unknown tool error';
    mimeType = 'text/plain';
    try {
      JSON.parse(content.text);
      mimeType = 'application/json';
    } catch (_) {}
    fileContent = resultText;
  } else if (content.type === 'image') {
    resultText = `[Image: ${fileName}]`;
    mimeType = content.mimeType ?? 'image/png';
    fileContent = content.data;
  } else {
    resultText = 'Unknown tool error';
    mimeType = 'text/plain';
    fileContent = resultText;
  }

  // Only save file if execution was successful
  if (!isError) {
    try {
      await agentDb.file.create({
        id: step.result_file_id!,
        name: fileName,
        mimeType: mimeType,
        content: fileContent,
      });
    } catch (e) {
      agentLogger.error(e);
    }
  }

  // Always record to toolResult table
  await agentDb.toolResult.create({
    id: step.step_uuid,
    stepId: step.step_id,
    taskId: taskId,
    result: resultText,
    isError: isError,
    stepGoal: step.step_goal,
    resultFile: step.result_file_name,
    fileId: step.result_file_id!,
    shouldAct,
    input,
    tool,
  });
}
