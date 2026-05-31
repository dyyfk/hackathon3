export type Persona = {
  id: string;
  name: string;
  description: string;
  constraints: string[];
};

export const personas: Persona[] = [
  {
    id: "budget_traveler",
    name: "Budget traveler",
    description:
      "Wants the cheapest acceptable stay and cares about total price transparency.",
    constraints: ["total price", "fees", "fast checkout"],
  },
  {
    id: "pet_owner",
    name: "Pet owner",
    description:
      "Needs a pet-friendly stay and wants to avoid hidden policy surprises.",
    constraints: ["pet friendly", "cancellation policy", "parking"],
  },
  {
    id: "family_planner",
    name: "Family planner",
    description:
      "Compares listings carefully and needs clear amenities before checkout.",
    constraints: ["amenities", "rating", "clear summary"],
  },
];
