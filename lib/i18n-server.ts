import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  isLanguage,
  translate,
  type Language,
  type Translator,
} from "@/lib/i18n";

export const LANGUAGE_COOKIE = "language";

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export async function getTranslator(): Promise<Translator> {
  const language = await getLanguage();
  return (path, params) => translate(language, path, params);
}
