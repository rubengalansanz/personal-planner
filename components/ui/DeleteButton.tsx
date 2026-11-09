"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Dialog, Button } from "@/components/ui";
import { useLanguage } from "@/components/LanguageProvider";

export function DeleteButton({
  action,
  label,
  className,
}: {
  action: () => void | Promise<void>;
  label?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const { t } = useLanguage();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        }
      >
        {label ?? t("common.delete")}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("common.deleteConfirm") || "¿Eliminar?"}
      >
        <div className="space-y-4">
          <p className="text-left text-sm text-zinc-600 dark:text-zinc-300">
            {t("common.deleteConfirm") || "¿Eliminar?"}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await action();
                  setOpen(false);
                })
              }
            >
              {t("common.delete")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}