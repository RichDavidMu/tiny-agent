import type {
  ContentBlockTaskToolResultDelta,
  ContentBlockTaskToolUseDelta,
  TaskContentBlock,
  TaskSchema,
} from 'agent-core';
import { makeAutoObservable, observable } from 'mobx';
import { BaseContentNode } from '../base.ts';
import { StepMeta } from './stepMeta.ts';

export class TaskNode extends BaseContentNode {
  type = 'task' as const;
  taskGoal = '';
  taskUuid = '';
  status: TaskSchema['status'] = 'pending';
  steps = observable.map<string, StepMeta>();
  get stepList() {
    return Array.from(this.steps.values());
  }
  constructor() {
    super();
    makeAutoObservable(this);
  }
  update(chunk: TaskContentBlock) {
    if (chunk.type === 'content_block_start') {
      const { task_uuid, task_goal, steps } = chunk.content_block;
      this.taskGoal = task_goal;
      this.taskUuid = task_uuid;
      steps.forEach((s) => {
        this.steps.set(s.step_uuid, new StepMeta({ meta: s }));
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
