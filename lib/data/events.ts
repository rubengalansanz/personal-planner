import { and, asc, eq, gte, lte } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { events, type EventRow } from "@/db/schema";

export type EventInsert = typeof events.$inferInsert;

/** Eventos que solapan la ventana [from, to] (ISO). Sin filtro si no se indica. */
export async function listEvents(from?: string, to?: string): Promise<EventRow[]> {
  await connection();
  const where =
    from && to
      ? and(lte(events.startAt, to), gte(events.endAt, from))
      : undefined;
  return db.select().from(events).where(where).orderBy(asc(events.startAt));
}

export async function getEvent(id: number): Promise<EventRow | undefined> {
  await connection();
  const [row] = await db.select().from(events).where(eq(events.id, id));
  return row;
}

export async function createEvent(data: EventInsert): Promise<EventRow> {
  await connection();
  const [row] = await db.insert(events).values(data).returning();
  return row;
}

export async function updateEvent(
  id: number,
  data: Partial<EventInsert>,
): Promise<EventRow | undefined> {
  await connection();
  const [row] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(events.id, id))
    .returning();
  return row;
}

export async function removeEvent(id: number): Promise<void> {
  await connection();
  const { removeLinksFor } = await import("./links");
  await removeLinksFor("event", id);
  await db.delete(events).where(eq(events.id, id));
}
