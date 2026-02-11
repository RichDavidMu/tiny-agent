export interface PlanSchema {
  tasks: TaskSchema[];
}
export interface TaskSchema {
  task_id: string;
  task_uuid: string;
  task_goal: string;
  status: 'pending' | 'done' | 'error';
  steps: StepSchema[];
  thinking?: string;
}
export interface StepSchema {
  step_id: string;
  step_uuid: string;
  step_goal: string;
  status: 'pending' | 'done' | 'error';
  tool_name: string;
  result_file_name: string;
  result_summary_hint: string;
  result_file_id: string | null;
}
export interface ContinueRes {
  status: 'continue';
}
export interface DoneRes {
  status: 'done';
  finalAnswer: string;
}

export interface ChangedRes {
  status: 'changed';
  plan: PlanSchema;
}

export type RethinkRes = ContinueRes | DoneRes | ChangedRes;
