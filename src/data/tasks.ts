export type Task = {
  id: string;
  name: string;
  goal: string;
  successCriteria: string[];
};

export const tasks: Task[] = [
  {
    id: "complete_primary_flow",
    name: "Complete primary stay flow",
    goal: "Reach the main conversion point for the variant: checkout confirmation for Version A or request confirmation for Version B.",
    successCriteria: [
      "stay selected",
      "primary action reached",
      "confirmation observed",
    ],
  },
  {
    id: "verify_parking_decision_details",
    name: "Verify parking and decision details",
    goal: "Find a stay with parking and verify the key price or detail signals before the primary action.",
    successCriteria: [
      "parking visible",
      "price signal visible",
      "primary action reached",
    ],
  },
];
