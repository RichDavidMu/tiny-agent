export interface PlanSchema {
  tasks: {
    task_id: string;
    task_goal: string;
    steps: [
      {
        step_id: string;
        step_goal: string;
        tool_name: string;
        tool_intent: string;
        expected_output: string;
      },
    ];
  }[];
}
