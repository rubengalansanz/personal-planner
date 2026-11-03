"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Language } from "@/lib/i18n";

const LANGUAGES: { code: Language; labelKey: string; flag: string }[] = [
  { code: "es", labelKey: "settingsPage.languages.es", flag: "🇪🇸" },
  { code: "en", labelKey: "settingsPage.languages.en", flag: "🇬🇧" },
  { code: "de", labelKey: "settingsPage.languages.de", flag: "🇩🇪" },
  { code: "fr", labelKey: "settingsPage.languages.fr", flag: "🇫🇷" },
  { code: "it", labelKey: "settingsPage.languages.it", flag: "🇮🇹" },
  { code: "pt", labelKey: "settingsPage.languages.pt", flag: "🇵🇹" },
];

export default function AjustesPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <PageHeader
        title={t("settingsPage.title")}
        description={t("settingsPage.description")}
      />
      <div className="p-6 max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("settingsPage.languageSection")}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("settingsPage.languageHint")}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const selected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                    selected
                      ? "border-foreground bg-zinc-50 dark:bg-zinc-800/80 ring-2 ring-foreground/20"
                      : "border-zinc-200 hover:border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className="text-2xl" role="img" aria-hidden>
                    {lang.flag}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {t(lang.labelKey)}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {lang.code}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
