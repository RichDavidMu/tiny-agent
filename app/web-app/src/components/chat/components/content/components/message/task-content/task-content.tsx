import { observer } from 'mobx-react-lite';
import type { TaskNode } from 'src/stream/node/content-nodes/task-node';
import { useEffect, useState } from 'react';
import { Steps, StepsContent, StepsItem, StepsTrigger } from '@/components/ui/steps';
import { Tool } from '@/components/ui/tool.tsx';

export const TaskContent = observer(({ content }: { content: TaskNode }) => {
  const [open, setOpen] = useState(!content.ended);
  useEffect(() => {
    setOpen(!content.ended);
  }, [content.ended]);
  return (
    <Steps open={open} onOpenChange={(v) => setOpen(v)} className="text-primary">
      <StepsTrigger>{content.taskGoal}</StepsTrigger>
      <StepsContent>
        <div className="space-y-1">
          {content.stepList.map((s) => (
            <StepsItem key={s.meta.step_uuid}>
              <div>{s.meta.step_goal}</div>
              <Tool
                className="w-full max-w-md"
                toolPart={{
                  type: s.meta.tool_name,
                  state: s.state,
                  input: s.input,
                  output: s.output,
                  errorText: s.errorText,
                  toolCallId: s.meta.step_uuid,
                }}
              />
            </StepsItem>
          ))}
        </div>
      </StepsContent>
    </Steps>
  );
});
