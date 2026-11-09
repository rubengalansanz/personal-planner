import type { AnniversaryRow, EventRow, TaskRow } from "@/db/schema";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toICSDateOnly(year: number, month: number, day: number): string {
  return `${year}${pad(month)}${pad(day)}`;
}

/**
 * Extrae mes/día de una fecha de aniversario.
 * Acepta ISO completo ("YYYY-MM-DD...") y "MM-DD" pelado.
 */
function normalizeIcalDate(date: string): string {
  const trimmed = String(date ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : trimmed;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseMonthDay(date: string): { month: number; day: number } | null {
  const normalized = normalizeIcalDate(date);
  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return { month, day };
    return null;
  }
  const bare = normalized.match(/^(\d{1,2})-(\d{1,2})$/);
  if (bare) {
    const month = Number(bare[1]);
    const day = Number(bare[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return { month, day };
  }
  return null;
}

/** Año ancla para el DTSTART de un aniversario (el guardado, o 2000 bisiesto). */
function anniversaryAnchorYear(date: string): number {
  const normalized = normalizeIcalDate(date);
  const iso = normalized.match(/^(\d{4})-\d{2}-\d{2}/);
  return iso ? Number(iso[1]) : 2000;
}

function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
  );
}

function calendarHeader(): string[] {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Personal Planner//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
}

function foldLine(line: string): string[] {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return [line];
  const chars = [...line];
  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  let isFirst = true;
  for (const ch of chars) {
    const chBytes = enc.encode(ch).length;
    const limit = isFirst ? 75 : 74;
    if (current.length > 0 && currentBytes + chBytes > limit) {
      out.push(current);
      current = " " + ch;
      currentBytes = 1 + chBytes;
      isFirst = false;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  if (current) out.push(current);
  return out;
}

function foldLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const l of lines) out.push(...foldLine(l));
  return out;
}

function wrapCalendar(body: string[]): string {
  return [
    ...foldLines(calendarHeader()),
    ...foldLines(body),
    ...foldLines(["END:VCALENDAR"]),
  ].join("\r\n");
}

function eventToLines(e: EventRow, stamp: string): string[] | null {
  const lines = ["BEGIN:VEVENT", `UID:${e.id}@agenda.local`, `DTSTAMP:${stamp}`];
  if (e.allDay) {
    const start = normalizeIcalDate(e.startAt);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
    const end = e.endAt ? normalizeIcalDate(e.endAt) : start;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
    const [sy, sm, sd] = start.split("-").map(Number);
    const [ey, em, ed] = end.split("-").map(Number);
    lines.push(`DTSTART;VALUE=DATE:${toICSDateOnly(sy, sm, sd)}`);
    // all-day DTEND is exclusive (next day)
    const endDate = new Date(ey, em - 1, ed);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(
      `DTEND;VALUE=DATE:${toICSDateOnly(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate())}`,
    );
  } else {
    const start = new Date(e.startAt);
    if (Number.isNaN(start.getTime())) return null;
    const end = e.endAt ? new Date(e.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(`DTSTART:${toICSDate(start)}`);
    lines.push(`DTEND:${toICSDate(end)}`);
  }
  if (e.title) lines.push(`SUMMARY:${escapeICS(e.title)}`);
  if (e.location) lines.push(`LOCATION:${escapeICS(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${escapeICS(e.description)}`);
  lines.push("END:VEVENT");
  return lines;
}

/** Aniversarios como VEVENT recurrente anual. */
function anniversaryToLines(a: AnniversaryRow, stamp: string): string[] | null {
  const md = parseMonthDay(a.date);
  if (!md) return null;
  let year = anniversaryAnchorYear(a.date);
  if (!isValidDate(year, md.month, md.day)) year = 2000;
  if (!isValidDate(year, md.month, md.day)) return null;

  const lines = [
    "BEGIN:VEVENT",
    `UID:anniversary-${a.id}@agenda.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toICSDateOnly(year, md.month, md.day)}`,
    "RRULE:FREQ=YEARLY",
  ];
  if (a.name) lines.push(`SUMMARY:${escapeICS(a.name)}`);
  lines.push("END:VEVENT");
  return lines;
}

/** Tareas como VTODO con vencimiento y estado. */
function taskToLines(t: TaskRow, stamp: string): string[] {
  const lines = [
    "BEGIN:VTODO",
    `UID:task-${t.id}@agenda.local`,
    `DTSTAMP:${stamp}`,
  ];
  if (t.title) lines.push(`SUMMARY:${escapeICS(t.title)}`);
  if (t.notes) lines.push(`DESCRIPTION:${escapeICS(t.notes)}`);
  if (t.dueDate) {
    const dueStr = String(t.dueDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueStr)) {
      const [y, m, d] = dueStr.split("-").map(Number);
      lines.push(`DUE;VALUE=DATE:${toICSDateOnly(y, m, d)}`);
    } else {
      const due = new Date(dueStr);
      if (!Number.isNaN(due.getTime())) {
        const isMidnight =
          due.getHours() === 0 &&
          due.getMinutes() === 0 &&
          due.getSeconds() === 0 &&
          due.getMilliseconds() === 0;
        lines.push(
          isMidnight
            ? `DUE;VALUE=DATE:${toICSDateOnly(due.getFullYear(), due.getMonth() + 1, due.getDate())}`
            : `DUE:${toICSDate(due)}`,
        );
      }
    }
  }
  lines.push(`STATUS:${t.status === "done" ? "COMPLETED" : "NEEDS-ACTION"}`);
  if (t.category) lines.push(`CATEGORIES:${escapeICS(t.category)}`);
  lines.push("END:VTODO");
  return lines;
}

export function eventsToICal(events: EventRow[]): string {
  const stamp = toICSDate(new Date());
  const body: string[] = [];
  for (const e of events) {
    const lines = eventToLines(e, stamp);
    if (lines) body.push(...lines);
  }
  return wrapCalendar(body);
}

/** Aniversarios → VEVENT con `RRULE:FREQ=YEARLY`. */
export function anniversariesToICal(anniversaries: AnniversaryRow[]): string {
  const stamp = toICSDate(new Date());
  const body: string[] = [];
  for (const a of anniversaries) {
    const lines = anniversaryToLines(a, stamp);
    if (lines) body.push(...lines);
  }
  return wrapCalendar(body);
}

/** Tareas → VTODO con vencimiento y estado. */
export function tasksToICal(tasks: TaskRow[]): string {
  const stamp = toICSDate(new Date());
  const body: string[] = [];
  for (const t of tasks) {
    body.push(...taskToLines(t, stamp));
  }
  return wrapCalendar(body);
}

/** Export global: eventos + aniversarios + tareas en un solo calendario. */
export function agendaToICal(args: {
  events: EventRow[];
  anniversaries: AnniversaryRow[];
  tasks: TaskRow[];
}): string {
  const stamp = toICSDate(new Date());
  const body: string[] = [];
  for (const e of args.events) {
    const lines = eventToLines(e, stamp);
    if (lines) body.push(...lines);
  }
  for (const a of args.anniversaries) {
    const lines = anniversaryToLines(a, stamp);
    if (lines) body.push(...lines);
  }
  for (const t of args.tasks) {
    body.push(...taskToLines(t, stamp));
  }
  return wrapCalendar(body);
}
