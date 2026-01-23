export interface PlanSchema {
  tasks: TaskSchema[];
}
export interface TaskSchema {
  task_id: string;
  task_uuid?: string;
  task_goal: string;
  status?: 'pending' | 'completed' | 'error';
  steps: StepSchema[];
}
export interface StepSchema {
  step_id: string;
  step_uuid?: string;
  step_goal: string;
  status?: 'pending' | 'completed' | 'error';
  tool_name: string;
  result_file: string;
  result_summary_hint: string;
}
