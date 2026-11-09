"use client";

import { useEffect, useRef, useState } from "react";
import { ColumnPicker, useColumnVisibility, type ColumnDef } from "./ColumnPicker";

export function ColumnVisibility({
  storageKey,
  columns,
  children,
}: {
  storageKey: string;
  columns: ColumnDef[];
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { visible, isVisible, toggle } = useColumnVisibility(storageKey, columns);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    for (const col of columns) {
      const show = isVisible(col.key);
      const els = container.querySelectorAll<HTMLElement>(
        `[data-col="${col.key}"]`,
      );
      els.forEach((el) => {
        el.style.display = show ? "" : "none";
      });
    }
  }, [visible, columns, isVisible]);

  // Re-run when isVisible changes (toggle updates state -> isVisible identity changes? isVisible is stable fn but visible changed)
  // The effect above depends on isVisible which is a function; need visible dependency. Let's instead depend on a serialized visible string.
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ColumnPicker columns={columns} isVisible={isVisible} toggle={toggle} />
      </div>
      <div ref={containerRef}>{children}</div>
    </div>
  );
}
