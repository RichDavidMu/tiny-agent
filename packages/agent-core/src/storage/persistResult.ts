import type { StepSchema } from '../types/planer.ts';
import type { ICallToolResult } from '../types/tools.ts';
import { agentDb } from './db.ts';

/**
 * Persist tool execution result to database
 * - If successful: saves file and records to toolResult table
 * - If failed: only records to toolResult table without saving file
 */
export async function persistResult(
  result: ICallToolResult,
  step: StepSchema,
  taskId: string,
): Promise<void> {
  const fileName = step.result_file;
  const content = result.content[0];
  const isError = result.isError || false;

  let resultText: string;
  let mimeType: string;
  let fileContent: string;

  if (content.type === 'text') {
    resultText = content.text ?? 'Unknown tool error';
    mimeType = 'text/plain';
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

  let fileId: string | null = null;

  // Only save file if execution was successful
  if (!isError) {
    try {
      const fileRecord = await agentDb.file.create({
        name: fileName,
        mimeType: mimeType,
        content: fileContent,
      });
      fileId = fileRecord.id;
    } catch (e) {
      console.log(e);
    }
  }

  // Always record to toolResult table
  await agentDb.toolResult.create({
    stepId: step.step_uuid!,
    taskId: taskId,
    result: resultText,
    isError: isError,
    resultFile: fileName,
    fileId: fileId,
  });
}
