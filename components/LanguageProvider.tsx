"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LANGUAGE,
  translate,
  type Language,
  type Translator,
} from "@/lib/i18n";

const LANGUAGE_COOKIE = "language";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translator;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  initialLanguage = DEFAULT_LANGUAGE,
  children,
}: {
  initialLanguage?: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const router = useRouter();

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      try {
        document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        // ignore
      }
      document.documentElement.lang = lang;
      // Server components read the cookie, so refresh them with the new value.
      router.refresh();
    },
    [router],
  );

  const t = useMemo<Translator>(
    () => (path, params) => translate(language, path, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
