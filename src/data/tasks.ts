export type Task = {
  id: string;
  name: string;
  goal: string;
  successCriteria: string[];
};

export const tasks: Task[] = [
  {
    id: "find_budget_stay",
    name: "Find a stay under budget",
    goal: "Search for a two-night stay and reach checkout with a clearly visible total price.",
    successCriteria: [
      "listing selected",
      "checkout reached",
      "total price visible",
    ],
  },
  {
    id: "find_pet_friendly_parking",
    name: "Find pet-friendly stay with parking",
    goal: "Find a listing that clearly shows pet-friendly and parking information.",
    successCriteria: [
      "pet-friendly visible",
      "parking visible",
      "checkout reached",
    ],
  },
];
