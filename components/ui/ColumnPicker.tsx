"use client";

import { useEffect, useState } from "react";

export type ColumnDef = { key: string; label: string };

export function useColumnVisibility(
  storageKey: string,
  allColumns: ColumnDef[],
): {
  visible: Set<string>;
  toggle: (key: string) => void;
  isVisible: (key: string) => boolean;
} {
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(allColumns.map((c) => c.key)),
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggle = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isVisible = (key: string) => visible.has(key);

  return { visible, toggle, isVisible };
}

export function ColumnPicker({
  columns,
  isVisible,
  toggle,
}: {
  columns: ColumnDef[];
  isVisible: (key: string) => boolean;
  toggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
      >
        Columnas
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {columns.map((c) => (
            <label
              key={c.key}
              className="flex items-center gap-2 px-1 py-0.5 text-sm"
            >
              <input
                type="checkbox"
                checked={isVisible(c.key)}
                onChange={() => toggle(c.key)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {c.label}
            </label>
          ))}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
