"use client";

import { useEffect, useRef } from "react";

export function TableSort({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const table = container.querySelector("table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const state: Record<string, "asc" | "desc"> = {};

    const sort = (key: string) => {
      const dir = state[key] === "asc" ? "desc" : "asc";
      state[key] = dir;
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.sort((a, b) => {
        const ca = a.querySelector<HTMLElement>(`[data-col="${key}"]`);
        const cb = b.querySelector<HTMLElement>(`[data-col="${key}"]`);
        const va = ca?.dataset.sortValue ?? ca?.textContent?.trim() ?? "";
        const vb = cb?.dataset.sortValue ?? cb?.textContent?.trim() ?? "";
        const na = Number(va);
        const nb = Number(vb);
        let cmp = 0;
        if (!Number.isNaN(na) && !Number.isNaN(nb) && va !== "" && vb !== "") {
          cmp = na - nb;
        } else {
          cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: "base" });
        }
        return dir === "asc" ? cmp : -cmp;
      });
      rows.forEach((r) => tbody.appendChild(r));
    };

    const headers = table.querySelectorAll<HTMLElement>("th[data-sort]");
    headers.forEach((th) => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => sort(th.dataset.sort as string));
    });

    return () => {
      headers.forEach((th) => {
        th.replaceWith(th.cloneNode(true));
      });
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
