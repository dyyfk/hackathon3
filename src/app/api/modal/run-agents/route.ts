import { NextResponse } from "next/server";
import sampleModalResults from "@/data/sampleModalResults.json";
import { buildExperimentCases } from "@/lib/buildExperimentCases";
import {
  summarizeAgentResults,
  type AgentResult,
} from "@/lib/summarizeAgentResults";
import type { Persona } from "@/data/personas";
import type { Task } from "@/data/tasks";

type RunAgentsBody = {
  baseUrl?: string;
  variantUrls?: Partial<Record<"A" | "B", string>>;
  runsPerCase?: number;
  personas?: Persona[];
  tasks?: Task[];
  useFallback?: boolean;
};

const modalBatchSize = 2;

function fallbackResponse(source: string, error?: string) {
  const results = (sampleModalResults as { results: AgentResult[] }).results;

  return NextResponse.json({
    source,
    error,
    totalRuns: results.length,
    results,
    summary: summarizeAgentResults(results),
  });
}

export async function POST(req: Request) {
  let body: RunAgentsBody;

  try {
    body = (await req.json()) as RunAgentsBody;
  } catch {
    return fallbackResponse("fallback_after_invalid_request", "Invalid JSON");
  }

  const modalUrl = process.env.MODAL_AGENT_URL;
  const baseUrl = body.baseUrl?.trim();
  const variantUrls = {
    A: body.variantUrls?.A?.trim(),
    B: body.variantUrls?.B?.trim(),
  };
  const personas = body.personas || [];
  const tasks = body.tasks || [];
  const runsPerCase = Math.max(1, Math.min(Number(body.runsPerCase || 1), 5));
  const hasRunUrls = Boolean(baseUrl || (variantUrls.A && variantUrls.B));

  if (body.useFallback || !modalUrl || !hasRunUrls) {
    return fallbackResponse("fallback");
  }

  try {
    const cases = buildExperimentCases({
      baseUrl,
      variantUrls,
      personas,
      tasks,
      runsPerCase,
    });
    const results: AgentResult[] = [];

    for (let start = 0; start < cases.length; start += modalBatchSize) {
      const batch = cases.slice(start, start + modalBatchSize);
      const batchResults = await Promise.all(
        batch.map(async (experimentCase) => {
          const response = await fetch(modalUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(experimentCase),
          });

          if (!response.ok) {
            const errorBody = await response.text();

            return {
              run_id: experimentCase.run_id,
              variant: experimentCase.variant,
              url: experimentCase.url,
              persona: experimentCase.persona.name,
              task: experimentCase.task.name,
              success: false,
              issues: [`modal_http_error_${response.status}`],
              friction_count: 1,
              events: [
                {
                  type: "error",
                  label: "modal_http_error",
                  status: response.status,
                  body: errorBody.slice(0, 500),
                },
              ],
            } satisfies AgentResult;
          }

          return (await response.json()) as AgentResult;
        }),
      );

      results.push(...batchResults);
    }

    return NextResponse.json({
      source: "modal",
      totalRuns: results.length,
      results,
      summary: summarizeAgentResults(results),
    });
  } catch (error) {
    return fallbackResponse(
      "fallback_after_modal_error",
      error instanceof Error ? error.message : "Unknown Modal error",
    );
  }
}
