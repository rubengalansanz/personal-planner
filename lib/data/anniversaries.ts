import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { anniversaries, type AnniversaryRow } from "@/db/schema";
import { parseMonthDay } from "@/lib/anniversary-date";

export type AnniversaryInsert = typeof anniversaries.$inferInsert;
export type UpcomingAnniversary = AnniversaryRow & {
  nextDate: string;
  daysUntil: number;
};

/** Calcula la próxima ocurrencia anual de un aniversario dentro de [from, to].
 * Acepta ISO completo (`YYYY-MM-DD...`, lo que guarda `dateToIso`) y
 * `MM-DD` pelado (filas legacy). Fechas inválidas → null. */
export function nextOccurrence(
  date: string,
  from: Date,
  to: Date,
): string | null {
  const md = parseMonthDay(date);
  if (!md) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  for (const year of [from.getFullYear(), from.getFullYear() + 1]) {
    const candidate = new Date(year, md.month - 1, md.day, 0, 0, 0, 0);
    if (
      candidate.getMonth() !== md.month - 1 ||
      candidate.getDate() !== md.day
    )
      continue;
    const fromMid = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toMid = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    if (candidate >= fromMid && candidate <= toMid) {
      return `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;
    }
  }
  return null;
}

export async function listAnniversaries(): Promise<AnniversaryRow[]> {
  await connection();
  return db.select().from(anniversaries).orderBy(asc(anniversaries.date));
}

export async function listUpcomingAnniversaries(
  from: Date,
  to: Date,
): Promise<UpcomingAnniversary[]> {
  await connection();
  const all = await db.select().from(anniversaries).orderBy(asc(anniversaries.date));
  const fromMid = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMid = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const out: UpcomingAnniversary[] = [];
  for (const a of all) {
    const next = nextOccurrence(a.date, fromMid, toMid);
    if (next) {
      const nextMid = new Date(next + "T00:00:00");
      const daysUntil = Math.round(
        (nextMid.getTime() - fromMid.getTime()) / 86400000,
      );
      out.push({ ...a, nextDate: next, daysUntil });
    }
  }
  return out;
}

/** Próximas ocurrencias anuales en los próximos `days` días (por defecto 365). */
export async function listAnniversariesWithNext(
  days = 365,
): Promise<UpcomingAnniversary[]> {
  const from = new Date();
  const to = new Date(Date.now() + days * 86400000);
  return listUpcomingAnniversaries(from, to);
}

export async function getAnniversary(
  id: number,
): Promise<AnniversaryRow | undefined> {
  await connection();
  const [row] = await db
    .select()
    .from(anniversaries)
    .where(eq(anniversaries.id, id));
  return row;
}

export async function createAnniversary(
  data: AnniversaryInsert,
): Promise<AnniversaryRow> {
  await connection();
  const [row] = await db.insert(anniversaries).values(data).returning();
  return row;
}

export async function updateAnniversary(
  id: number,
  data: Partial<AnniversaryInsert>,
): Promise<AnniversaryRow | undefined> {
  await connection();
  const [row] = await db
    .update(anniversaries)
    .set(data)
    .where(eq(anniversaries.id, id))
    .returning();
  return row;
}

export async function removeAnniversary(id: number): Promise<void> {
  await connection();
  const { removeLinksFor } = await import("./links");
  await removeLinksFor("anniversary", id);
  await db.delete(anniversaries).where(eq(anniversaries.id, id));
}
