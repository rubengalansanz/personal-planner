"use server";

import { revalidatePath } from "next/cache";
import { createEvent, updateEvent, removeEvent } from "@/lib/data";
import { datetimeLocalToIso } from "@/lib/datetime";
import { str, strOrNull, numOrNull, boolVal } from "@/lib/form";

function parseEvent(fd: FormData) {
  return {
    title: str(fd.get("title")),
    description: strOrNull(fd.get("description")),
    startAt: datetimeLocalToIso(fd.get("startAt")),
    endAt: datetimeLocalToIso(fd.get("endAt")),
    allDay: boolVal(fd.get("allDay")),
    location: strOrNull(fd.get("location")),
    reminderMin: numOrNull(fd.get("reminderMin")),
  };
}

export async function createEventAction(fd: FormData) {
  const data = parseEvent(fd);
  if (!data.title || !data.startAt || !data.endAt) return;
  await createEvent(data);
  revalidatePath("/calendario");
}

export async function updateEventAction(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!id) return;
  const data = parseEvent(fd);
  if (!data.title || !data.startAt || !data.endAt) return;
  await updateEvent(id, data);
  revalidatePath("/calendario");
}

export async function deleteEventAction(id: number) {
  if (id) await removeEvent(id);
  revalidatePath("/calendario");
}
