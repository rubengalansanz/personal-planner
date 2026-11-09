import { NextResponse } from "next/server";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { anniversaries, events, tasks } from "@/db/schema";
import {
  agendaToICal,
  anniversariesToICal,
  eventsToICal,
  tasksToICal,
} from "@/lib/ical";

export const dynamic = "force-dynamic";

const TYPES = ["events", "anniversaries", "tasks"] as const;
type ExportType = (typeof TYPES)[number];

const FILENAMES: Record<ExportType | "all", string> = {
  all: "agenda.ics",
  events: "agenda-eventos.ics",
  anniversaries: "agenda-cumpleanos.ics",
  tasks: "agenda-tareas.ics",
};

function icsResponse(ics: string, filename: string): NextResponse {
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export iCalendar.
 * Sin `type` → global (eventos + aniversarios + tareas).
 * `?type=events|anniversaries|tasks` → solo esa sección.
 */
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  if (type !== null && !(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: `Tipo inválido. Usa uno de: ${TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  await connection();

  if (type === "events") {
    const rows = await db.select().from(events).orderBy(asc(events.startAt));
    return icsResponse(eventsToICal(rows), FILENAMES.events);
  }
  if (type === "anniversaries") {
    const rows = await db
      .select()
      .from(anniversaries)
      .orderBy(asc(anniversaries.date));
    return icsResponse(anniversariesToICal(rows), FILENAMES.anniversaries);
  }
  if (type === "tasks") {
    const rows = await db.select().from(tasks).orderBy(asc(tasks.dueDate));
    return icsResponse(tasksToICal(rows), FILENAMES.tasks);
  }

  const [allEvents, allAnniversaries, allTasks] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startAt)),
    db.select().from(anniversaries).orderBy(asc(anniversaries.date)),
    db.select().from(tasks).orderBy(asc(tasks.dueDate)),
  ]);
  return icsResponse(
    agendaToICal({
      events: allEvents,
      anniversaries: allAnniversaries,
      tasks: allTasks,
    }),
    FILENAMES.all,
  );
}
