export type AgentResult = {
  run_id?: string;
  variant?: string;
  url?: string;
  persona?: string;
  task?: string;
  success?: boolean;
  time_to_complete_sec?: number;
  step_count?: number;
  friction_count?: number;
  issues?: string[];
  events?: unknown[];
};

export type VariantSummary = {
  runs: number;
  successRate: number;
  avgTime: number;
  avgSteps: number;
  avgFriction: number;
  topIssues: { issue: string; count: number }[];
};

export type AgentSummary = Record<string, VariantSummary>;

function average(rows: AgentResult[], key: keyof AgentResult) {
  if (rows.length === 0) {
    return 0;
  }

  return (
    rows.reduce((sum, row) => {
      const value = row[key];
      return sum + (typeof value === "number" ? value : 0);
    }, 0) / rows.length
  );
}

export function summarizeAgentResults(results: AgentResult[]): AgentSummary {
  const byVariant: Record<string, AgentResult[]> = {};

  for (const result of results) {
    const key = result.variant || "unknown";
    byVariant[key] = byVariant[key] || [];
    byVariant[key].push(result);
  }

  const summary: AgentSummary = {};

  for (const [variant, rows] of Object.entries(byVariant)) {
    const issueCounts: Record<string, number> = {};

    for (const row of rows) {
      for (const issue of row.issues || []) {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      }
    }

    summary[variant] = {
      runs: rows.length,
      successRate:
        rows.length === 0
          ? 0
          : rows.filter((row) => row.success).length / rows.length,
      avgTime: average(rows, "time_to_complete_sec"),
      avgSteps: average(rows, "step_count"),
      avgFriction: average(rows, "friction_count"),
      topIssues: Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count })),
    };
  }

  return summary;
}
