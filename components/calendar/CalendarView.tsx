"use client";

import { useMemo, useState } from "react";
import { Dialog, EntityDialog, type FieldDef } from "@/components/ui";
import { LinksPanel } from "@/components/links/LinksPanel";
import { useLanguage } from "@/components/LanguageProvider";
import { useCalendarFilters } from "./CalendarFilterContext";
import type { Translator } from "@/lib/i18n";
import type {
  EventRow,
  TaskRow,
  AnniversaryRow,
  ProjectRow,
  NoteRow,
  PlannerItemRow,
} from "@/db/schema";
import { isoToDatetimeLocal, isoToDate } from "@/lib/datetime";
import { parseMonthDay } from "@/lib/anniversary-date";

function eventFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("calendar.titleField"), required: true },
    {
      name: "startAt",
      label: t("calendar.startAt"),
      type: "datetime-local",
      required: true,
    },
    {
      name: "endAt",
      label: t("calendar.endAt"),
      type: "datetime-local",
      required: true,
    },
    { name: "allDay", label: t("calendar.allDay"), type: "checkbox" },
    { name: "location", label: t("calendar.location") },
    { name: "reminderMin", label: t("calendar.reminder"), type: "number" },
    {
      name: "description",
      label: t("calendar.descriptionField"),
      type: "textarea",
    },
  ];
}

function eventValues(e: EventRow) {
  return {
    id: e.id,
    title: e.title,
    startAt: isoToDatetimeLocal(e.startAt),
    endAt: isoToDatetimeLocal(e.endAt),
    allDay: e.allDay,
    location: e.location,
    reminderMin: e.reminderMin,
    description: e.description,
  };
}

function taskFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("tasks.titleField"), required: true },
    { name: "notes", label: t("tasks.notesField"), type: "textarea" },
    { name: "startDate", label: t("tasks.startDate"), type: "date" },
    { name: "dueDate", label: t("tasks.dueDate"), type: "date" },
    {
      name: "priority",
      label: t("tasks.priority"),
      type: "select",
      defaultValue: "2",
      options: [
        { value: "1", label: t("tasks.priorities.1") },
        { value: "2", label: t("tasks.priorities.2") },
        { value: "3", label: t("tasks.priorities.3") },
      ],
    },
    {
      name: "status",
      label: t("tasks.status"),
      type: "select",
      options: [
        { value: "pending", label: t("tasks.statuses.pending") },
        { value: "done", label: t("tasks.statuses.done") },
      ],
    },
    { name: "category", label: t("tasks.category") },
  ];
}
function taskValues(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    startDate: isoToDate(task.startDate),
    dueDate: isoToDate(task.dueDate),
    priority: task.priority,
    status: task.status,
    category: task.category,
  };
}

function anniversaryFields(t: Translator): FieldDef[] {
  return [
    { name: "name", label: t("birthdays.name"), required: true },
    { name: "date", label: t("birthdays.date"), type: "date", required: true },
    {
      name: "type",
      label: t("birthdays.type"),
      type: "select",
      options: [
        { value: "birthday", label: t("birthdays.types.birthday") },
        { value: "anniversary", label: t("birthdays.types.anniversary") },
        { value: "other", label: t("birthdays.types.other") },
      ],
    },
    { name: "reminderMin", label: t("birthdays.reminder"), type: "number" },
  ];
}
function anniversaryValues(a: AnniversaryRow) {
  return {
    id: a.id,
    name: a.name,
    date: isoToDate(a.date),
    type: a.type,
    reminderMin: a.reminderMin,
  };
}

function projectFields(t: Translator): FieldDef[] {
  return [
    { name: "name", label: t("planner.name"), required: true },
    { name: "description", label: t("planner.descriptionField"), type: "textarea" },
    { name: "startDate", label: t("planner.startDate"), type: "date" },
    { name: "targetDate", label: t("planner.targetDate"), type: "date" },
    {
      name: "status",
      label: t("planner.status"),
      type: "select",
      options: [
        { value: "planning", label: t("planner.statuses.planning") },
        { value: "active", label: t("planner.statuses.active") },
        { value: "done", label: t("planner.statuses.done") },
        { value: "archived", label: t("planner.statuses.archived") },
      ],
    },
    { name: "color", label: t("planner.color") },
  ];
}
function projectValues(p: ProjectRow) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    startDate: isoToDate(p.startDate),
    targetDate: isoToDate(p.targetDate),
    status: p.status,
    color: p.color,
  };
}

function plannerItemFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("planner.itemTitle"), required: true },
    { name: "startDate", label: t("planner.startDate"), type: "date" },
    { name: "dueDate", label: t("planner.targetDate"), type: "date" },
    {
      name: "status",
      label: t("planner.status"),
      type: "select",
      options: [
        { value: "todo", label: t("planner.itemStatuses.todo") },
        { value: "in_progress", label: t("planner.itemStatuses.in_progress") },
        { value: "done", label: t("planner.itemStatuses.done") },
      ],
    },
    { name: "progress", label: t("planner.progress"), type: "number" },
    {
      name: "priority",
      label: t("planner.priority"),
      type: "select",
      options: [
        { value: "1", label: t("tasks.priorities.1") },
        { value: "2", label: t("tasks.priorities.2") },
        { value: "3", label: t("tasks.priorities.3") },
      ],
    },
    { name: "notes", label: t("planner.notes"), type: "textarea" },
  ];
}
function plannerItemValues(it: PlannerItemRow) {
  return {
    id: it.id,
    title: it.title,
    startDate: isoToDate(it.startDate),
    dueDate: isoToDate(it.dueDate),
    status: it.status,
    progress: it.progress,
    priority: it.priority,
    notes: it.notes,
  };
}

function noteFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("notes.titleField"), required: true },
    { name: "content", label: t("notes.contentField"), type: "textarea" },
    { name: "category", label: t("notes.category") },
  ];
}
function noteValues(n: NoteRow) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    category: n.category,
  };
}

type View = "day" | "week" | "month" | "year";

export function CalendarView({
  events,
  tasks = [],
  anniversaries = [],
  projects = [],
  notes = [],
  plannerItems = [],
  createAction,
  updateAction,
  deleteAction,
  taskUpdateAction,
  taskDeleteAction,
  anniversaryUpdateAction,
  anniversaryDeleteAction,
  projectUpdateAction,
  projectDeleteAction,
  plannerItemUpdateAction,
  plannerItemDeleteAction,
  noteUpdateAction,
  noteDeleteAction,
}: {
  events: EventRow[];
  tasks?: TaskRow[];
  anniversaries?: AnniversaryRow[];
  projects?: ProjectRow[];
  notes?: NoteRow[];
  plannerItems?: PlannerItemRow[];
  createAction: (fd: FormData) => void | Promise<void>;
  updateAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (id: number) => void | Promise<void>;
  taskUpdateAction?: (fd: FormData) => void | Promise<void>;
  taskDeleteAction?: (id: number) => void | Promise<void>;
  anniversaryUpdateAction?: (fd: FormData) => void | Promise<void>;
  anniversaryDeleteAction?: (id: number) => void | Promise<void>;
  projectUpdateAction?: (fd: FormData) => void | Promise<void>;
  projectDeleteAction?: (id: number) => void | Promise<void>;
  plannerItemUpdateAction?: (fd: FormData) => void | Promise<void>;
  plannerItemDeleteAction?: (id: number) => void | Promise<void>;
  noteUpdateAction?: (fd: FormData) => void | Promise<void>;
  noteDeleteAction?: (id: number) => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const { filters } = useCalendarFilters();
  const tv = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const fields = eventFields(t);
  const tFields = taskFields(t);
  const aFields = anniversaryFields(t);
  const pFields = projectFields(t);
  const piFields = plannerItemFields(t);
  const nFields = noteFields(t);
  const today = new Date();
  const [view, setView] = useState<View>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [anchor, setAnchor] = useState<Date>(today);

  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const byDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const key = e.startAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  const birthdaysByDate = useMemo(() => {
    const map = new Map<string, AnniversaryRow[]>();
    for (const a of anniversaries) {
      const md = parseMonthDay(a.date);
      if (!md) continue;
      // show on the matching day of the displayed month/year
      const key = `${year}-${pad(month + 1)}-${pad(md.day)}`;
      if (md.month !== month + 1) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [anniversaries, year, month]);

  const projectsByDate = useMemo(() => {
    const map = new Map<string, ProjectRow[]>();
    for (const p of projects) {
      if (!p.targetDate) continue;
      const key = p.targetDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [projects]);

  const notesByDate = useMemo(() => {
    const map = new Map<string, NoteRow[]>();
    for (const n of notes) {
      if (!n.updatedAt) continue;
      const key = n.updatedAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return map;
  }, [notes]);

  const plannerByDate = useMemo(() => {
    const map = new Map<string, PlannerItemRow[]>();
    for (const it of plannerItems) {
      if (!it.dueDate) continue;
      const key = it.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [plannerItems]);

  const todayKey = ymd(today);

  // Navigation helpers
  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const shiftWeek = (delta: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + delta * 7);
    setAnchor(d);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const shiftDay = (delta: number) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + delta);
    setAnchor(d);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const shiftYear = (delta: number) => setYear((y) => y + delta);

  const [newDate, setNewDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const detailEvents = dayDetail ? byDate.get(dayDetail) ?? [] : [];
  const detailTitle = dayDetail
    ? t("calendar.eventsOn", {
        date: `${Number(dayDetail.slice(8, 10))} ${t(
          `months.${Number(dayDetail.slice(5, 7))}`,
        )}`,
      })
    : "";

  const viewLabel =
    view === "month"
      ? `${t(`months.${month + 1}`)} ${year}`
      : view === "year"
        ? `${year}`
        : view === "week"
          ? `${t(`months.${anchor.getMonth() + 1}`)} ${anchor.getFullYear()}`
          : `${Number(ymd(anchor).slice(8, 10))} ${t(
              `months.${Number(ymd(anchor).slice(5, 7))}`,
            )} ${anchor.getFullYear()}`;

  const prev = () => {
    if (view === "month") shiftMonth(-1);
    else if (view === "week") shiftWeek(-1);
    else if (view === "day") shiftDay(-1);
    else shiftYear(-1);
  };
  const next = () => {
    if (view === "month") shiftMonth(1);
    else if (view === "week") shiftWeek(1);
    else if (view === "day") shiftDay(1);
    else shiftYear(1);
  };

  // Week view: 7 days starting Monday of anchor's week
  const weekDays = useMemo(() => {
    const d = new Date(anchor);
    const day = d.getDay(); // 0=Sun
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - mondayOffset);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(monday);
      x.setDate(monday.getDate() + i);
      days.push(x);
    }
    return days;
  }, [anchor]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("calendar.prevMonth")}
          >
            ‹
          </button>
          <span className="min-w-32 text-center text-sm font-semibold">
            {viewLabel}
          </span>
          <button
            onClick={next}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("calendar.nextMonth")}
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-zinc-200 dark:border-zinc-800">
            {(["day", "week", "month", "year"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2 py-1 text-xs font-medium ${
                  view === v
                    ? "bg-foreground text-background"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {tv(`calendar.views.${v}`, v)}
              </button>
            ))}
          </div>
          <EntityDialog
            title={t("calendar.newEvent")}
            trigger={t("calendar.newEvent")}
            action={createAction}
            fields={fields}
            triggerClassName="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
            values={
              view === "day"
                ? { startAt: `${ymd(anchor)}T09:00`, endAt: `${ymd(anchor)}T10:00` }
                : undefined
            }
          />
        </div>
      </div>

      {view === "month" && (
        <>
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                className="px-2 py-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                {t(`weekdays.${d}`)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {(() => {
              const firstDay = new Date(year, month, 1).getDay();
              const startOffset = (firstDay + 6) % 7;
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: (number | null)[] = [];
              for (let i = 0; i < startOffset; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              while (cells.length % 7 !== 0) cells.push(null);
              return cells.map((d, i) => {
                if (d == null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="h-28 overflow-hidden border-b border-r border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/30"
                    />
                  );
                }
                const key = `${year}-${pad(month + 1)}-${pad(d)}`;
                const dayEvents = byDate.get(key) ?? [];
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    onDoubleClick={(e) => {
                      if ((e.target as HTMLElement).closest("button, a")) return;
                      setNewDate(key);
                    }}
                    className={`flex h-28 select-none flex-col overflow-hidden border-b border-r border-zinc-100 p-1 dark:border-zinc-900 ${
                      isToday ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <EntityDialog
                      title={t("calendar.newEvent")}
                      trigger={
                        <span
                          className={`inline-block rounded px-1 text-xs ${
                            isToday
                              ? "bg-blue-600 font-semibold text-white"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {d}
                        </span>
                      }
                      action={createAction}
                      fields={fields}
                      values={{
                        startAt: `${key}T09:00`,
                        endAt: `${key}T10:00`,
                      }}
                    />
                    <div className="mt-1 flex-1 space-y-1 overflow-hidden">
                      {filters.events &&
                        dayEvents.slice(0, 2).map((e) => (
                        <EntityDialog
                          key={`ev-${e.id}`}
                          title={t("calendar.editEvent")}
                          trigger={
                            <span className="block truncate rounded bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {e.title}
                            </span>
                          }
                          action={updateAction}
                          fields={fields}
                          values={eventValues(e)}
                          extra={
                            <LinksPanel sourceType="event" sourceId={e.id} />
                          }
                          onDelete={deleteAction}
                        />
                      ))}
                      {filters.tasks && (tasksByDate.get(key) ?? []).slice(0, 2).map((tk) =>
                        taskUpdateAction ? (
                          <EntityDialog
                            key={`task-${tk.id}`}
                            title={t("tasks.editTask")}
                            trigger={
                              <span className="block truncate rounded bg-amber-100 px-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {tk.title}
                              </span>
                            }
                            action={taskUpdateAction}
                            fields={tFields}
                            values={taskValues(tk)}
                            onDelete={taskDeleteAction}
                            extra={<LinksPanel sourceType="task" sourceId={tk.id} />}
                          />
                        ) : (
                          <span
                            key={`task-${tk.id}`}
                            className="block truncate rounded bg-amber-100 px-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          >
                            {tk.title}
                          </span>
                        ),
                      )}
                      {filters.anniversaries && (birthdaysByDate.get(key) ?? []).slice(0, 2).map((b) =>
                        anniversaryUpdateAction ? (
                          <EntityDialog
                            key={`bd-${b.id}`}
                            title={t("birthdays.editItem")}
                            trigger={
                              <span className="block truncate rounded bg-pink-100 px-1 text-xs text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                                {b.name}
                              </span>
                            }
                            action={anniversaryUpdateAction}
                            fields={aFields}
                            values={anniversaryValues(b)}
                            onDelete={anniversaryDeleteAction}
                            extra={<LinksPanel sourceType="anniversary" sourceId={b.id} />}
                          />
                        ) : (
                          <span
                            key={`bd-${b.id}`}
                            className="block truncate rounded bg-pink-100 px-1 text-xs text-pink-800 dark:bg-pink-950 dark:text-pink-300"
                          >
                            {b.name}
                          </span>
                        ),
                      )}
                      {filters.projects && (projectsByDate.get(key) ?? []).slice(0, 2).map((p) =>
                        projectUpdateAction ? (
                          <EntityDialog
                            key={`proj-${p.id}`}
                            title={t("planner.editProject")}
                            trigger={
                              <span className="block truncate rounded bg-emerald-100 px-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {p.name}
                              </span>
                            }
                            action={projectUpdateAction}
                            fields={pFields}
                            values={projectValues(p)}
                            onDelete={projectDeleteAction}
                            extra={<LinksPanel sourceType="project" sourceId={p.id} />}
                          />
                        ) : (
                          <span
                            key={`proj-${p.id}`}
                            className="block truncate rounded bg-emerald-100 px-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            {p.name}
                          </span>
                        ),
                      )}
                      {filters.planner && (plannerByDate.get(key) ?? []).slice(0, 2).map((it) =>
                        plannerItemUpdateAction ? (
                          <EntityDialog
                            key={`pl-${it.id}`}
                            title={t("planner.editItem")}
                            trigger={
                              <span className="block truncate rounded bg-teal-100 px-1 text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                                {it.title}
                              </span>
                            }
                            action={plannerItemUpdateAction}
                            fields={piFields}
                            values={plannerItemValues(it)}
                            hiddenValues={{ projectId: it.projectId }}
                            onDelete={plannerItemDeleteAction}
                            extra={undefined}
                          />
                        ) : (
                          <span
                            key={`pl-${it.id}`}
                            className="block truncate rounded bg-teal-100 px-1 text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                          >
                            {it.title}
                          </span>
                        ),
                      )}
                      {filters.notes && (notesByDate.get(key) ?? []).slice(0, 2).map((n) =>
                        noteUpdateAction ? (
                          <EntityDialog
                            key={`note-${n.id}`}
                            title={t("notes.editNote")}
                            trigger={
                              <span className="block truncate rounded bg-purple-100 px-1 text-xs text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                {n.title}
                              </span>
                            }
                            action={noteUpdateAction}
                            fields={nFields}
                            values={noteValues(n)}
                            onDelete={noteDeleteAction}
                            extra={<LinksPanel sourceType="note" sourceId={n.id} />}
                          />
                        ) : (
                          <span
                            key={`note-${n.id}`}
                            className="block truncate rounded bg-purple-100 px-1 text-xs text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          >
                            {n.title}
                          </span>
                        ),
                      )}
                      {dayEvents.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setDayDetail(key)}
                          className="block w-full truncate rounded px-1 text-left text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {t("calendar.more", { n: dayEvents.length - 2 })}
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {view === "week" && (
        <div className="grid grid-cols-7">
          {weekDays.map((d) => {
            const key = ymd(d);
            const dayEvents = byDate.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`min-h-40 border-b border-r border-zinc-100 p-1 dark:border-zinc-900 ${
                  isToday ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
                }`}
              >
                <div className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t(`weekdays.${((d.getDay() + 6) % 7) + 1}`)} {d.getDate()}
                </div>
                <div className="space-y-1">
                  {filters.events && dayEvents.map((e) => (
                    <EntityDialog
                      key={e.id}
                      title={t("calendar.editEvent")}
                      trigger={
                        <span className="block truncate rounded bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {e.title}
                        </span>
                      }
                      action={updateAction}
                      fields={fields}
                      values={eventValues(e)}
                      extra={<LinksPanel sourceType="event" sourceId={e.id} />}
                      onDelete={deleteAction}
                    />
                  ))}
                </div>
                <EntityDialog
                  title={t("calendar.newEvent")}
                  trigger={
                    <span className="mt-1 block text-xs text-blue-600 hover:underline dark:text-blue-400">
                      + {t("calendar.newEvent")}
                    </span>
                  }
                  action={createAction}
                  fields={fields}
                  values={{
                    startAt: `${key}T09:00`,
                    endAt: `${key}T10:00`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {viewLabel}
          </h3>
          <ul className="space-y-2">
            {(byDate.get(ymd(anchor)) ?? []).map((e) => (
              <li key={e.id}>
                <EntityDialog
                  title={t("calendar.editEvent")}
                  trigger={
                    <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
                      <span className="truncate font-medium">{e.title}</span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {e.startAt.slice(11, 16)}–{e.endAt.slice(11, 16)}
                      </span>
                    </div>
                  }
                  action={updateAction}
                  fields={fields}
                  values={eventValues(e)}
                  extra={<LinksPanel sourceType="event" sourceId={e.id} />}
                  onDelete={deleteAction}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <EntityDialog
              title={t("calendar.newEvent")}
              trigger={t("calendar.newEvent")}
              action={createAction}
              fields={fields}
              triggerClassName="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
              values={{
                startAt: `${ymd(anchor)}T09:00`,
                endAt: `${ymd(anchor)}T10:00`,
              }}
            />
          </div>
        </div>
      )}

      {view === "year" && (
        <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4">
          {Array.from({ length: 12 }, (_, m) => {
            const monthEvents = events.filter((e) => {
              const d = new Date(e.startAt);
              return d.getFullYear() === year && d.getMonth() === m;
            });
            return (
              <button
                key={m}
                onClick={() => {
                  setMonth(m);
                  setView("month");
                }}
                className="rounded-md border border-zinc-200 p-2 text-left text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <div className="font-semibold">{t(`months.${m + 1}`)}</div>
                <div className="text-xs text-zinc-500">
                  {monthEvents.length} {tv("calendar.events", "eventos")}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <EntityDialog
        title={t("calendar.newEvent")}
        open={newDate !== null}
        onOpenChange={(next) => {
          if (!next) setNewDate(null);
        }}
        action={createAction}
        fields={fields}
        values={
          newDate
            ? { startAt: `${newDate}T09:00`, endAt: `${newDate}T10:00` }
            : undefined
        }
      />

      <Dialog
        open={dayDetail !== null}
        onClose={() => setDayDetail(null)}
        title={detailTitle}
      >
        <div className="space-y-3">
          {dayDetail && (
            <EntityDialog
              title={t("calendar.newEvent")}
              trigger={t("calendar.newEvent")}
              action={createAction}
              fields={fields}
              triggerClassName="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
              values={{
                startAt: `${dayDetail}T09:00`,
                endAt: `${dayDetail}T10:00`,
              }}
            />
          )}
          <ul className="space-y-2">
            {filters.events &&
              detailEvents.map((e) => (
              <li key={e.id}>
                <EntityDialog
                  title={t("calendar.editEvent")}
                  trigger={
                    <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
                      <span className="truncate font-medium">{e.title}</span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {e.startAt.slice(11, 16)}
                      </span>
                    </div>
                  }
                  action={updateAction}
                  fields={fields}
                  values={eventValues(e)}
                  extra={<LinksPanel sourceType="event" sourceId={e.id} />}
                  onDelete={deleteAction}
                />
              </li>
            ))}
          </ul>
          {filters.tasks && (tasksByDate.get(dayDetail ?? "") ?? []).length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Tareas
              </div>
              <ul className="space-y-1">
                {(tasksByDate.get(dayDetail ?? "") ?? []).map((tk) => (
                  <li key={`task-${tk.id}`}>
                    {taskUpdateAction ? (
                      <EntityDialog
                        title={t("tasks.editTask")}
                        trigger={
                          <span className="block rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {tk.title}
                          </span>
                        }
                        action={taskUpdateAction}
                        fields={tFields}
                        values={taskValues(tk)}
                        onDelete={taskDeleteAction}
                            extra={<LinksPanel sourceType="task" sourceId={tk.id} />}
                      />
                    ) : (
                      <span className="block rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {tk.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filters.anniversaries && (birthdaysByDate.get(dayDetail ?? "") ?? []).length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-pink-700 dark:text-pink-300">
                Cumpleaños
              </div>
              <ul className="space-y-1">
                {(birthdaysByDate.get(dayDetail ?? "") ?? []).map((b) => (
                  <li key={`bd-${b.id}`}>
                    {anniversaryUpdateAction ? (
                      <EntityDialog
                        title={t("birthdays.editItem")}
                        trigger={
                          <span className="block rounded bg-pink-100 px-2 py-1 text-xs text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                            {b.name}
                          </span>
                        }
                        action={anniversaryUpdateAction}
                        fields={aFields}
                        values={anniversaryValues(b)}
                        onDelete={anniversaryDeleteAction}
                            extra={<LinksPanel sourceType="anniversary" sourceId={b.id} />}
                      />
                    ) : (
                      <span className="block rounded bg-pink-100 px-2 py-1 text-xs text-pink-800 dark:bg-pink-950 dark:text-pink-300">
                        {b.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filters.projects && (projectsByDate.get(dayDetail ?? "") ?? []).length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Proyectos
              </div>
              <ul className="space-y-1">
                {(projectsByDate.get(dayDetail ?? "") ?? []).map((p) => (
                  <li key={`proj-${p.id}`}>
                    {projectUpdateAction ? (
                      <EntityDialog
                        title={t("planner.editProject")}
                        trigger={
                          <span className="block rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {p.name}
                          </span>
                        }
                        action={projectUpdateAction}
                        fields={pFields}
                        values={projectValues(p)}
                        onDelete={projectDeleteAction}
                            extra={<LinksPanel sourceType="project" sourceId={p.id} />}
                      />
                    ) : (
                      <span className="block rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {p.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filters.planner && (plannerByDate.get(dayDetail ?? "") ?? []).length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                Hitos
              </div>
              <ul className="space-y-1">
                {(plannerByDate.get(dayDetail ?? "") ?? []).map((it) => (
                  <li key={`pl-${it.id}`}>
                    {plannerItemUpdateAction ? (
                      <EntityDialog
                        title={t("planner.editItem")}
                        trigger={
                          <span className="block rounded bg-teal-100 px-2 py-1 text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            {it.title}
                          </span>
                        }
                        action={plannerItemUpdateAction}
                        fields={piFields}
                        values={plannerItemValues(it)}
                        hiddenValues={{ projectId: it.projectId }}
                        onDelete={plannerItemDeleteAction}
                            extra={undefined}
                      />
                    ) : (
                      <span className="block rounded bg-teal-100 px-2 py-1 text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {it.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filters.notes && (notesByDate.get(dayDetail ?? "") ?? []).length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                Notas
              </div>
              <ul className="space-y-1">
                {(notesByDate.get(dayDetail ?? "") ?? []).map((n) => (
                  <li key={`note-${n.id}`}>
                    {noteUpdateAction ? (
                      <EntityDialog
                        title={t("notes.editNote")}
                        trigger={
                          <span className="block rounded bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {n.title}
                          </span>
                        }
                        action={noteUpdateAction}
                        fields={nFields}
                        values={noteValues(n)}
                        onDelete={noteDeleteAction}
                            extra={<LinksPanel sourceType="note" sourceId={n.id} />}
                      />
                    ) : (
                      <span className="block rounded bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {n.title}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
