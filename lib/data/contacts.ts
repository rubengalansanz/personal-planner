import { asc, eq, isNotNull, like, or } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { contacts, type ContactRow } from "@/db/schema";

export type ContactInsert = typeof contacts.$inferInsert;

export async function listContacts(query?: string): Promise<ContactRow[]> {
  await connection();
  const q = query?.trim();
  if (!q) {
    return db
      .select()
      .from(contacts)
      .orderBy(asc(contacts.lastName), asc(contacts.firstName));
  }
  const pattern = `%${q}%`;
  return db
    .select()
    .from(contacts)
    .where(
      or(
        like(contacts.firstName, pattern),
        like(contacts.lastName, pattern),
        like(contacts.company, pattern),
        like(contacts.email, pattern),
        like(contacts.nickname, pattern),
      ),
    )
    .orderBy(asc(contacts.lastName), asc(contacts.firstName));
}

export async function getContact(id: number): Promise<ContactRow | undefined> {
  await connection();
  const [row] = await db.select().from(contacts).where(eq(contacts.id, id));
  return row;
}

export async function createContact(data: ContactInsert): Promise<ContactRow> {
  await connection();
  const [row] = await db.insert(contacts).values(data).returning();
  return row;
}

export async function updateContact(
  id: number,
  data: Partial<ContactInsert>,
): Promise<ContactRow | undefined> {
  await connection();
  const [row] = await db
    .update(contacts)
    .set(data)
    .where(eq(contacts.id, id))
    .returning();
  return row;
}

export async function removeContact(id: number): Promise<void> {
  await connection();
  const { removeLinksFor } = await import("./links");
  await removeLinksFor("contact", id);
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function listContactBirthdays(): Promise<
  { id: number; name: string; birthday: string }[]
> {
  await connection();
  const rows = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      birthday: contacts.birthday,
    })
    .from(contacts)
    .where(isNotNull(contacts.birthday));
  return rows
    .filter((r) => !!r.birthday)
    .map((r) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ") || "Contacto",
      birthday: r.birthday as string,
    }));
}
