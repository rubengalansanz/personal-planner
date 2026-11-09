import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { projects, type ProjectRow } from "@/db/schema";

export type ProjectInsert = typeof projects.$inferInsert;

export async function listProjects(
  status?: ProjectRow["status"],
): Promise<ProjectRow[]> {
  await connection();
  return db
    .select()
    .from(projects)
    .where(status ? eq(projects.status, status) : undefined)
    .orderBy(asc(projects.name));
}

export async function getProject(id: number): Promise<ProjectRow | undefined> {
  await connection();
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row;
}

export async function createProject(data: ProjectInsert): Promise<ProjectRow> {
  await connection();
  const [row] = await db.insert(projects).values(data).returning();
  return row;
}

export async function updateProject(
  id: number,
  data: Partial<ProjectInsert>,
): Promise<ProjectRow | undefined> {
  await connection();
  const [row] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();
  return row;
}

export async function removeProject(id: number): Promise<void> {
  await connection();
  const { removeLinksFor } = await import("./links");
  await removeLinksFor("project", id);
  await db.delete(projects).where(eq(projects.id, id));
}
