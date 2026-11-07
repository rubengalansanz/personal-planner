import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { notes, type NoteRow } from "@/db/schema";

export type NoteInsert = typeof notes.$inferInsert;

export async function listNotes(
  category?: string,
  sort: "title" | "category" | "updated" = "title",
): Promise<NoteRow[]> {
  await connection();
  const orderBy =
    sort === "category"
      ? asc(notes.category)
      : sort === "updated"
        ? asc(notes.updatedAt)
        : asc(notes.title);
  return db
    .select()
    .from(notes)
    .where(category ? eq(notes.category, category) : undefined)
    .orderBy(orderBy);
}

export async function getNote(id: number): Promise<NoteRow | undefined> {
  await connection();
  const [row] = await db.select().from(notes).where(eq(notes.id, id));
  return row;
}

export async function createNote(data: NoteInsert): Promise<NoteRow> {
  await connection();
  const [row] = await db.insert(notes).values(data).returning();
  return row;
}

export async function updateNote(
  id: number,
  data: Partial<NoteInsert>,
): Promise<NoteRow | undefined> {
  await connection();
  const [row] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(notes.id, id))
    .returning();
  return row;
}

export async function removeNote(id: number): Promise<void> {
  await connection();
  await db.delete(notes).where(eq(notes.id, id));
}
