import { and, asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { tasks, type TaskRow } from "@/db/schema";

export type TaskInsert = typeof tasks.$inferInsert;

export async function listTasks(opts?: {
  status?: "pending" | "done";
  category?: string;
}): Promise<TaskRow[]> {
  await connection();
  const conditions = [];
  if (opts?.status) conditions.push(eq(tasks.status, opts.status));
  if (opts?.category) conditions.push(eq(tasks.category, opts.category));
  return db
    .select()
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(tasks.dueDate), asc(tasks.priority));
}

export async function getTask(id: number): Promise<TaskRow | undefined> {
  await connection();
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  return row;
}

export async function createTask(data: TaskInsert): Promise<TaskRow> {
  await connection();
  const [row] = await db.insert(tasks).values(data).returning();
  return row;
}

export async function updateTask(
  id: number,
  data: Partial<TaskInsert>,
): Promise<TaskRow | undefined> {
  await connection();
  const [row] = await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning();
  return row;
}

export async function removeTask(id: number): Promise<void> {
  await connection();
  const { removeLinksFor } = await import("./links");
  await removeLinksFor("task", id);
  await db.delete(tasks).where(eq(tasks.id, id));
}
