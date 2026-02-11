import { observer } from 'mobx-react-lite';
import { Steps, StepsContent, StepsItem, StepsTrigger } from '@/components/ui/steps';
import type { TaskNode } from '@/stream/node/contentNodes/taskNode';
import { Tool } from '@/components/ui/tool.tsx';

export const TaskContent = observer(({ content }: { content: TaskNode }) => {
  return (
    <Steps defaultOpen>
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
