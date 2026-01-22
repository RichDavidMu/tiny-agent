export interface PlanSchema {
  tasks: {
    task_id: string;
    task_goal: string;
    steps: {
      step_id: string;
      step_goal: string;
      tool_name: string;
      result_file: string;
      result_summary_hint: string;
    }[];
  }[];
}
