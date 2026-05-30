"use client";

import { Download, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  clearUXEvents,
  exportUXEvents,
  getStoredUXEvents,
  type UXEvent,
} from "@/lib/analytics";

function groupByType(events: UXEvent[]) {
  return events.reduce<Record<string, number>>((summary, event) => {
    summary[event.type] = (summary[event.type] || 0) + 1;
    return summary;
  }, {});
}

export function EventDebugPanel() {
  const [events, setEvents] = useState<UXEvent[]>([]);

  useEffect(() => {
    setEvents(getStoredUXEvents());
  }, []);

  const sessions = useMemo(
    () => [...new Set(events.map((event) => event.sessionId))],
    [events],
  );
  const frictionEvents = events.filter((event) => event.type === "friction");
  const eventTypes = groupByType(events);

  function clearEvents() {
    clearUXEvents();
    setEvents([]);
  }

  function downloadEvents() {
    const payload = exportUXEvents();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staybnb-events-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-testid="dashboard-page" className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <section
          data-testid="dashboard-total-sessions"
          className="rounded-2xl border border-stone-200 bg-white p-5"
        >
          <p className="text-sm text-stone-500">Total sessions</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">
            {sessions.length}
          </p>
        </section>
        <section
          data-testid="dashboard-total-events"
          className="rounded-2xl border border-stone-200 bg-white p-5"
        >
          <p className="text-sm text-stone-500">Total events</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">
            {events.length}
          </p>
        </section>
        <section
          data-testid="dashboard-friction-events"
          className="rounded-2xl border border-stone-200 bg-white p-5"
        >
          <p className="text-sm text-stone-500">Friction events</p>
          <p className="mt-2 text-3xl font-semibold text-stone-950">
            {frictionEvents.length}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Events by type
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Local browser events for the current profile.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              data-testid="dashboard-export-json"
              aria-label="Export events as JSON"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-950"
              type="button"
              onClick={downloadEvents}
            >
              <Download className="size-4" />
              Export JSON
            </button>
            <button
              data-testid="dashboard-clear-events"
              aria-label="Clear local events"
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={clearEvents}
            >
              <Trash2 className="size-4" />
              Clear events
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(eventTypes).map(([type, count]) => (
            <span
              key={type}
              className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
            >
              {type}: {count}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-stone-950">
          Recent sessions
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sessions.slice(-6).reverse().map((sessionId) => (
            <div
              key={sessionId}
              className="rounded-xl bg-stone-50 p-4 font-mono text-xs text-stone-700"
            >
              {sessionId}
            </div>
          ))}
          {sessions.length === 0 ? (
            <p className="text-sm text-stone-500">No sessions recorded yet.</p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-stone-950">
            Last 50 events
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table
            data-testid="dashboard-events-table"
            className="min-w-full divide-y divide-stone-200 text-left text-sm"
          >
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Page</th>
                <th className="px-5 py-3">Element</th>
                <th className="px-5 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {events.slice(-50).reverse().map((event, index) => (
                <tr key={`${event.timestamp}-${index}`}>
                  <td className="px-5 py-3 text-stone-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 font-medium text-stone-900">
                    {event.type}
                  </td>
                  <td className="px-5 py-3 text-stone-600">{event.page}</td>
                  <td className="px-5 py-3 text-stone-600">
                    {event.elementTestId || "-"}
                  </td>
                  <td className="px-5 py-3 text-stone-500">
                    {event.metadata ? JSON.stringify(event.metadata) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
