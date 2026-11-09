"use client";

import { useEffect, useRef } from "react";

export function ColumnReorder({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const table = container.querySelector("table");
    if (!table) return;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;

    const headerRow = thead.querySelector("tr");
    if (!headerRow) return;

    const getCols = () =>
      Array.from(headerRow.querySelectorAll<HTMLElement>("th[data-col]")).map(
        (th) => th.dataset.col as string,
      );

    const applyOrder = (order: string[]) => {
      const ths = Array.from(headerRow.querySelectorAll<HTMLElement>("th"));
      // Reorder header
      const headerCells = order
        .map((k) => ths.find((th) => th.dataset.col === k))
        .filter(Boolean) as HTMLElement[];
      // include non-data-col th (e.g. empty) at end
      const rest = ths.filter((th) => !th.dataset.col);
      [...headerCells, ...rest].forEach((th) => headerRow.appendChild(th));

      // Reorder body rows
      Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
        const cells = Array.from(row.querySelectorAll<HTMLElement>("td"));
        const ordered = order
          .map((k) => cells.find((td) => td.dataset.col === k))
          .filter(Boolean) as HTMLElement[];
        const restCells = cells.filter((td) => !td.dataset.col);
        [...ordered, ...restCells].forEach((td) => row.appendChild(td));
      });
    };

    // Load saved order
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as string[];
        const current = getCols();
        // only apply if same set
        if (saved.length === current.length && saved.every((k) => current.includes(k))) {
          applyOrder(saved);
        }
      }
    } catch {
      // ignore
    }

    let dragKey: string | null = null;

    const onDragStart = (e: DragEvent) => {
      const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement | null;
      if (!th) return;
      dragKey = th.dataset.col ?? null;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragKey ?? "");
      }
      th.style.opacity = "0.5";
    };

    const onDragEnd = (e: DragEvent) => {
      const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement | null;
      if (th) th.style.opacity = "";
      dragKey = null;
    };

    const onDragOver = (e: DragEvent) => {
      const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement | null;
      if (!th || !dragKey) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: DragEvent) => {
      const th = (e.target as HTMLElement).closest("th[data-col]") as HTMLElement | null;
      if (!th || !dragKey) return;
      e.preventDefault();
      const dropKey = th.dataset.col as string;
      if (dropKey === dragKey) return;
      const current = getCols();
      const from = current.indexOf(dragKey);
      const to = current.indexOf(dropKey);
      if (from < 0 || to < 0) return;
      const newOrder = [...current];
      newOrder.splice(from, 1);
      newOrder.splice(to, 0, dragKey);
      applyOrder(newOrder);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
      } catch {
        // ignore
      }
      dragKey = null;
    };

    const headers = table.querySelectorAll<HTMLElement>("th[data-col]");
    headers.forEach((th) => {
      th.draggable = true;
      th.addEventListener("dragstart", onDragStart);
      th.addEventListener("dragend", onDragEnd);
      th.addEventListener("dragover", onDragOver);
      th.addEventListener("drop", onDrop);
    });

    return () => {
      headers.forEach((th) => {
        th.draggable = false;
        th.removeEventListener("dragstart", onDragStart);
        th.removeEventListener("dragend", onDragEnd);
        th.removeEventListener("dragover", onDragOver);
        th.removeEventListener("drop", onDrop);
      });
    };
  }, [storageKey]);

  return <div ref={ref}>{children}</div>;
}
