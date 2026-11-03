"use client";

import { useEffect, useState } from "react";
import {
  listLinkedRecordsAction,
  searchRecordsAction,
  addLinkAction,
  removeLinkAction,
} from "@/app/actions/links";
import { Badge, Select, Input, Button, useToast } from "@/components/ui";
import { useLanguage } from "@/components/LanguageProvider";
import type { RecordType, LinkedRecord } from "@/lib/data";

const TYPES: RecordType[] = [
  "event",
  "task",
  "contact",
  "note",
  "anniversary",
  "project",
];

export function LinksPanel({
  sourceType,
  sourceId,
}: {
  sourceType: RecordType;
  sourceId: number;
}) {
  const { t } = useLanguage();
  const [links, setLinks] = useState<LinkedRecord[]>([]);
  const [targetType, setTargetType] = useState<RecordType>("contact");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; title: string }[]>([]);
  const toast = useToast();
  const typeLabel = (type: RecordType) => t(`links.types.${type}`);

  const refresh = async () => {
    setLinks(await listLinkedRecordsAction(sourceType, sourceId));
  };

  useEffect(() => {
    let active = true;
    listLinkedRecordsAction(sourceType, sourceId).then((data) => {
      if (active) setLinks(data);
    });
    return () => {
      active = false;
    };
  }, [sourceType, sourceId]);

  const onSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setResults(await searchRecordsAction(targetType, q));
  };

  const onAdd = async (targetId: number) => {
    await addLinkAction({ sourceType, sourceId, targetType, targetId });
    setQuery("");
    setResults([]);
    await refresh();
    toast(t("links.added"));
  };

  const onRemove = async (id: number) => {
    await removeLinkAction(id);
    await refresh();
    toast(t("links.removed"));
  };

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <h3 className="mb-2 text-sm font-semibold">{t("links.title")}</h3>
      {links.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("links.empty")}</p>
      ) : (
        <ul className="mb-3 space-y-1">
          {links.map((l) => (
            <li
              key={l.link.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0">
                <Badge tone="neutral">
                  {l.direction === "out" ? "→" : "←"} {typeLabel(l.type)}
                </Badge>{" "}
                <a href={l.href} className="hover:underline">
                  {l.title}
                </a>
              </span>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => onRemove(l.link.id)}
              >
                {t("links.remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as RecordType)}
            className="w-36"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </Select>
          <Input
            placeholder={t("links.search")}
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {results.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded border border-zinc-200 p-1 dark:border-zinc-800">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate">{r.title}</span>
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  onClick={() => onAdd(r.id)}
                >
                  {t("links.add")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
