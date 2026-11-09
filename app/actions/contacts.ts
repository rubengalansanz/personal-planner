"use server";

import { revalidatePath } from "next/cache";
import { createContact, updateContact, removeContact } from "@/lib/data";
import { dateToIso } from "@/lib/datetime";
import { strOrNull } from "@/lib/form";

function parseContact(fd: FormData) {
  return {
    title: strOrNull(fd.get("title")),
    firstName: strOrNull(fd.get("firstName")),
    lastName: strOrNull(fd.get("lastName")),
    nickname: strOrNull(fd.get("nickname")),
    company: strOrNull(fd.get("company")),
    jobTitle: strOrNull(fd.get("jobTitle")),
    telHome: strOrNull(fd.get("telHome")),
    telWork: strOrNull(fd.get("telWork")),
    telMobile: strOrNull(fd.get("telMobile")),
    telFax: strOrNull(fd.get("telFax")),
    telegram: strOrNull(fd.get("telegram")),
    email: strOrNull(fd.get("email")),
    addressHome: strOrNull(fd.get("addressHome")),
    addressWork: strOrNull(fd.get("addressWork")),
    notes: strOrNull(fd.get("notes")),
    birthday: dateToIso(fd.get("birthday")),
  };
}

export async function createContactAction(fd: FormData) {
  const data = parseContact(fd);
  if (!data.firstName && !data.lastName && !data.company) return;
  await createContact(data);
  revalidatePath("/contactos");
}

export async function updateContactAction(fd: FormData) {
  const id = Number(fd.get("id"));
  if (!id) return;
  const data = parseContact(fd);
  if (!data.firstName && !data.lastName && !data.company) return;
  await updateContact(id, data);
  revalidatePath("/contactos");
}

export async function deleteContactAction(id: number) {
  if (id) await removeContact(id);
  revalidatePath("/contactos");
}
