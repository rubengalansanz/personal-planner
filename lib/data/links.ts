import { and, eq, like, or } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import {
  links,
  events,
  tasks,
  contacts,
  notes,
  anniversaries,
  projects,
  type RecordType,
  type LinkRow,
} from "@/db/schema";

export type LinkInsert = typeof links.$inferInsert;

export type LinkedRecord = {
  link: LinkRow;
  direction: "out" | "in";
  type: RecordType;
  id: number;
  title: string;
  href: string;
};

const hrefFor: Record<RecordType, (id: number) => string> = {
  event: (id) => `/calendario?event=${id}`,
  task: (id) => `/tareas?task=${id}`,
  contact: (id) => `/contactos?contact=${id}`,
  note: (id) => `/notas?note=${id}`,
  anniversary: (id) => `/cumpleanos?anniversary=${id}`,
  project: (id) => `/planner?project=${id}`,
};

async function titleFor(type: RecordType, id: number): Promise<string> {
  switch (type) {
    case "event": {
      const [r] = await db.select({ t: events.title }).from(events).where(eq(events.id, id));
      return r?.t ?? "(sin título)";
    }
    case "task": {
      const [r] = await db.select({ t: tasks.title }).from(tasks).where(eq(tasks.id, id));
      return r?.t ?? "(sin título)";
    }
    case "contact": {
      const [r] = await db
        .select({ f: contacts.firstName, l: contacts.lastName })
        .from(contacts)
        .where(eq(contacts.id, id));
      return [r?.f, r?.l].filter(Boolean).join(" ") || "(sin nombre)";
    }
    case "note": {
      const [r] = await db.select({ t: notes.title }).from(notes).where(eq(notes.id, id));
      return r?.t ?? "(sin título)";
    }
    case "anniversary": {
      const [r] = await db.select({ n: anniversaries.name }).from(anniversaries).where(eq(anniversaries.id, id));
      return r?.n ?? "(sin nombre)";
    }
    case "project": {
      const [r] = await db.select({ n: projects.name }).from(projects).where(eq(projects.id, id));
      return r?.n ?? "(sin nombre)";
    }
  }
}

/** Enlaces salientes y entrantes de un registro, con título y enlace resueltos. */
export async function getLinkedRecords(
  type: RecordType,
  id: number,
): Promise<LinkedRecord[]> {
  await connection();
  const outgoing = await db
    .select()
    .from(links)
    .where(and(eq(links.sourceType, type), eq(links.sourceId, id)));
  const incoming = await db
    .select()
    .from(links)
    .where(and(eq(links.targetType, type), eq(links.targetId, id)));

  const resolve = async (
    link: LinkRow,
    direction: "out" | "in",
  ): Promise<LinkedRecord> => {
    const t = direction === "out" ? link.targetType : link.sourceType;
    const i = direction === "out" ? link.targetId : link.sourceId;
    return {
      link,
      direction,
      type: t,
      id: i,
      title: await titleFor(t, i),
      href: hrefFor[t](i),
    };
  };

  return [
    ...(await Promise.all(outgoing.map((l) => resolve(l, "out")))),
    ...(await Promise.all(incoming.map((l) => resolve(l, "in")))),
  ];
}

export async function addLink(data: LinkInsert): Promise<LinkRow> {
  await connection();
  const [row] = await db.insert(links).values(data).returning();
  return row;
}

export async function removeLink(id: number): Promise<void> {
  await connection();
  await db.delete(links).where(eq(links.id, id));
}

/** Elimina todos los enlaces que involucran a una entidad (huérfanos al borrar). */
export async function removeLinksFor(
  type: RecordType,
  id: number,
): Promise<void> {
  await connection();
  await db
    .delete(links)
    .where(
      or(
        and(eq(links.sourceType, type), eq(links.sourceId, id)),
        and(eq(links.targetType, type), eq(links.targetId, id)),
      ),
    );
}

/** Busca registros de un tipo por texto (para el panel de enlaces). */
export async function searchRecords(
  type: RecordType,
  query: string,
  max = 8,
): Promise<{ id: number; title: string }[]> {
  await connection();
  const q = `%${query.trim()}%`;
  if (q === "%%") return [];
  switch (type) {
    case "event": {
      const r = await db
        .select({ id: events.id, t: events.title })
        .from(events)
        .where(like(events.title, q))
        .limit(max);
      return r.map((x) => ({ id: x.id, title: x.t ?? "(sin título)" }));
    }
    case "task": {
      const r = await db
        .select({ id: tasks.id, t: tasks.title })
        .from(tasks)
        .where(like(tasks.title, q))
        .limit(max);
      return r.map((x) => ({ id: x.id, title: x.t ?? "(sin título)" }));
    }
    case "contact": {
      const r = await db
        .select({ id: contacts.id, f: contacts.firstName, l: contacts.lastName })
        .from(contacts)
        .where(or(like(contacts.firstName, q), like(contacts.lastName, q)))
        .limit(max);
      return r.map((x) => ({
        id: x.id,
        title: [x.f, x.l].filter(Boolean).join(" ") || "(sin nombre)",
      }));
    }
    case "note": {
      const r = await db
        .select({ id: notes.id, t: notes.title })
        .from(notes)
        .where(like(notes.title, q))
        .limit(max);
      return r.map((x) => ({ id: x.id, title: x.t ?? "(sin título)" }));
    }
    case "anniversary": {
      const r = await db
        .select({ id: anniversaries.id, n: anniversaries.name })
        .from(anniversaries)
        .where(like(anniversaries.name, q))
        .limit(max);
      return r.map((x) => ({ id: x.id, title: x.n ?? "(sin nombre)" }));
    }
    case "project": {
      const r = await db
        .select({ id: projects.id, n: projects.name })
        .from(projects)
        .where(like(projects.name, q))
        .limit(max);
      return r.map((x) => ({ id: x.id, title: x.n ?? "(sin nombre)" }));
    }
  }
}
