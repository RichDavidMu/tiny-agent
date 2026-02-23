import type {
  ContentBlockTaskToolResultDelta,
  ContentBlockTaskToolUseDelta,
  HistoryTaskContent,
  TaskContentBlock,
  TaskSchema,
} from 'agent-core';
import { action, computed, makeObservable, observable } from 'mobx';
import { BaseContentNode } from '../base.ts';
import { Step } from './step.ts';

export class TaskNode extends BaseContentNode {
  type = 'task' as const;
  taskGoal = '';
  taskUuid = '';
  status: TaskSchema['status'] = 'pending';
  steps = observable.map<string, Step>();
  constructor(initParams?: HistoryTaskContent) {
    super();
    makeObservable(this, {
      status: observable,
      steps: observable,
      stepList: computed,
      update: action,
    });
    if (!initParams) return;
    const { task_goal, task_uuid, status, steps } = initParams;
    this.taskGoal = task_goal;
    this.taskUuid = task_uuid;
    this.status = status;
    steps.forEach((s) => {
      const newStep = new Step({
        meta: {
          status: s.status,
          step_uuid: s.step_uuid,
          step_id: s.stepId,
          step_goal: s.step_goal,
          result_file_id: s.attachment?.id || '',
          result_file_name: s.attachment?.name || '',
          tool_name: s.tool_name,
          result_summary_hint: '',
        },
        initParams: s,
      });
      this.steps.set(s.step_uuid, newStep);
    });
  }

  get stepList() {
    return Array.from(this.steps.values());
  }
  update(chunk: TaskContentBlock) {
    if (chunk.type === 'content_block_start') {
      const { task_uuid, task_goal, steps } = chunk.content_block;
      this.taskGoal = task_goal;
      this.taskUuid = task_uuid;
      steps.forEach((s) => {
        this.steps.set(s.step_uuid, new Step({ meta: s }));
      });
      return;
    }
    const { type } = chunk.content_block;
    if (type === 'task_status') {
      const { status } = chunk.content_block;
      this.status = status;
      return;
    }
    const { step_uuid } = chunk.content_block;
    const targetStep = this.steps.get(step_uuid);
    if (!targetStep) {
      return;
    }
    targetStep.update(chunk as ContentBlockTaskToolUseDelta | ContentBlockTaskToolResultDelta);
  }
}
