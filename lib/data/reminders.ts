import { isNotNull } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { events, anniversaries, contacts } from "@/db/schema";
import { parseMonthDay } from "@/lib/anniversary-date";

export type ReminderSource =
  | {
      kind: "event";
      id: number;
      title: string;
      startAt: string;
      reminderMin: number | null;
    }
  | {
      kind: "anniversary";
      id: number;
      title: string;
      date: string;
      reminderMin: number | null;
    }
  | {
      kind: "contact";
      id: number;
      title: string;
      date: string;
      reminderMin: number | null;
    };

/** Fuentes con recordatorio configurado (eventos y aniversarios). */
export async function listReminderSources(): Promise<ReminderSource[]> {
  await connection();
  const evs = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      reminderMin: events.reminderMin,
    })
    .from(events)
    .where(isNotNull(events.reminderMin));

  const anns = await db
    .select({
      id: anniversaries.id,
      name: anniversaries.name,
      date: anniversaries.date,
      reminderMin: anniversaries.reminderMin,
    })
    .from(anniversaries)
    .where(isNotNull(anniversaries.reminderMin));

  const cons = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      birthday: contacts.birthday,
    })
    .from(contacts)
    .where(isNotNull(contacts.birthday));

  return [
    ...evs.map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      reminderMin: e.reminderMin,
    })),
    ...anns.map((a) => ({
      kind: "anniversary" as const,
      id: a.id,
      title: a.name,
      date: a.date,
      reminderMin: a.reminderMin,
    })),
    ...cons.map((c) => ({
      kind: "contact" as const,
      id: c.id,
      title: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Contacto",
      date: c.birthday as string,
      reminderMin: 0,
    })),
  ];
}

export type DueReminder = {
  kind: "event" | "anniversary" | "contact";
  id: number;
  title: string;
  dueAt: Date;
};

function eventDueAt(startAt: string, reminderMin: number | null): Date | null {
  if (reminderMin == null) return null;
  const d = new Date(startAt);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() - reminderMin);
  return d;
}

function anniversaryDueAt(date: string, reminderMin: number | null): Date | null {
  if (reminderMin == null) return null;
  const md = parseMonthDay(date);
  if (!md) return null;
  const now = new Date();
  const year = now.getFullYear();
  // 29/02 en años no bisiestos: avisa el 28/02.
  const day = md.month === 2 && md.day === 29 ? 28 : md.day;
  let d = new Date(year, md.month - 1, day, 9, 0, 0, 0);
  if (d.getTime() < now.getTime()) {
    d = new Date(year + 1, md.month - 1, day, 9, 0, 0, 0);
  }
  d.setMinutes(d.getMinutes() - reminderMin);
  return d;
}

/** Recordatorios cuya alerta corresponde en la ventana actual. */
export async function listDueReminders(
  now: Date = new Date(),
  windowMin = 30,
): Promise<DueReminder[]> {
  const sources = await listReminderSources();
  const out: DueReminder[] = [];
  for (const s of sources) {
    const due =
      s.kind === "event"
        ? eventDueAt(s.startAt, s.reminderMin)
        : anniversaryDueAt(s.date, s.reminderMin);
    if (!due) continue;
    const diffMs = now.getTime() - due.getTime();
    if (diffMs >= 0 && diffMs <= windowMin * 60_000) {
      out.push({ kind: s.kind, id: s.id, title: s.title, dueAt: due });
    }
  }
  return out;
}
