"use client";

import { useState, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  CalendarFilterProvider,
  ALL_FILTERS,
  type CalendarFilters,
  type CalendarFilterKey,
} from "./CalendarFilterContext";

const LABELS: Record<string, string> = {
  events: "calendar.events",
  tasks: "tasks.title",
  anniversaries: "birthdays.title",
  projects: "calendar.projects",
  planner: "calendar.milestones",
  notes: "notes.title",
};

const FILTER_COLORS: Record<string, string> = {
  events: "bg-blue-500",
  tasks: "bg-amber-500",
  anniversaries: "bg-pink-500",
  projects: "bg-emerald-500",
  planner: "bg-teal-500",
  notes: "bg-purple-500",
};

export function CalendarShell({
  calendar,
  sidebar,
}: {
  calendar: ReactNode;
  sidebar: ReactNode;
}) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<CalendarFilters>({
    events: true,
    tasks: true,
    anniversaries: true,
    projects: true,
    planner: true,
    notes: true,
  });

  const toggle = (k: CalendarFilterKey) =>
    setFilters((prev) => ({ ...prev, [k]: !prev[k] }));

  const labelFor = (k: string) => {
    const key = LABELS[k];
    const v = t(key);
    return v === key ? k : v;
  };

  return (
    <CalendarFilterProvider valueOverride={{ filters, setFilters, toggle }}>
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{calendar}</div>
        <div className="space-y-4">
          {sidebar}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t("calendar.filters") === "calendar.filters"
                ? "Filtros"
                : t("calendar.filters")}
            </h3>
            <div className="space-y-2">
              {ALL_FILTERS.map((k) => (
                <label
                  key={k}
                  className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={filters[k]}
                    onChange={() => toggle(k)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  {labelFor(k)}
                  <span
                    className={`ml-auto inline-block h-3 w-3 rounded-full ${FILTER_COLORS[k]}`}
                    aria-hidden="true"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CalendarFilterProvider>
  );
}