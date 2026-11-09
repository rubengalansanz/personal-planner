"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type CalendarFilterKey =
  | "events"
  | "tasks"
  | "anniversaries"
  | "projects"
  | "planner"
  | "notes";

export const ALL_FILTERS: CalendarFilterKey[] = [
  "events",
  "tasks",
  "anniversaries",
  "projects",
  "planner",
  "notes",
];

export type CalendarFilters = Record<CalendarFilterKey, boolean>;

const defaultFilters: CalendarFilters = {
  events: true,
  tasks: true,
  anniversaries: true,
  projects: true,
  planner: true,
  notes: true,
};

export interface CalendarFilterContextValue {
  filters: CalendarFilters;
  setFilters: (f: CalendarFilters) => void;
  toggle: (k: CalendarFilterKey) => void;
}

const CalendarFilterContext = createContext<CalendarFilterContextValue | null>(null);

export function CalendarFilterProvider({
  children,
  valueOverride,
}: {
  children: ReactNode;
  valueOverride?: CalendarFilterContextValue | null;
}) {
  const [filters, setFilters] = useState<CalendarFilters>(defaultFilters);
  const toggle = (k: CalendarFilterKey) =>
    setFilters((prev) => ({ ...prev, [k]: !prev[k] }));
  const value = valueOverride ?? { filters, setFilters, toggle };
  return (
    <CalendarFilterContext.Provider value={value}>
      {children}
    </CalendarFilterContext.Provider>
  );
}

export function useCalendarFilters(): CalendarFilterContextValue {
  const ctx = useContext(CalendarFilterContext);
  if (!ctx) {
    // Fallback: all visible, no-op toggle (shouldn't happen in provider)
    return { filters: defaultFilters, setFilters: () => {}, toggle: () => {} };
  }
  return ctx;
}