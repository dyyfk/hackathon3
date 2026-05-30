import type { Persona } from "@/data/personas";
import type { Task } from "@/data/tasks";

export type ExperimentCase = {
  run_id: string;
  variant: "A" | "B";
  url: string;
  persona: Persona;
  task: Task;
};

function slug(value: string) {
  return value.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
}

type VariantUrls = Partial<Record<"A" | "B", string>>;

function clean(value?: string) {
  return value?.trim().replace(/\/$/, "");
}

export function buildExperimentCases({
  baseUrl,
  variantUrls,
  personas,
  tasks,
  runsPerCase,
}: {
  baseUrl?: string;
  variantUrls?: VariantUrls;
  personas: Persona[];
  tasks: Task[];
  runsPerCase: number;
}): ExperimentCase[] {
  const cleanBaseUrl = clean(baseUrl);
  const cleanVariantUrls: VariantUrls = {
    A: clean(variantUrls?.A),
    B: clean(variantUrls?.B),
  };
  const cases: ExperimentCase[] = [];

  for (const variant of ["A", "B"] as const) {
    const url = cleanVariantUrls[variant] || `${cleanBaseUrl}/version${variant}`;

    if (!url || url.startsWith("undefined/")) {
      throw new Error(`Missing URL for Variant ${variant}`);
    }

    for (const persona of personas) {
      for (const task of tasks) {
        for (let index = 0; index < runsPerCase; index += 1) {
          cases.push({
            run_id: slug(`${variant}_${persona.id}_${task.id}_${index}`),
            variant,
            url,
            persona,
            task,
          });
        }
      }
    }
  }

  return cases;
}
