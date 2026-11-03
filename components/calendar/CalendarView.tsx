"use client";

import { useMemo, useState } from "react";
import { Dialog, EntityDialog, type FieldDef } from "@/components/ui";
import { LinksPanel } from "@/components/links/LinksPanel";
import { useLanguage } from "@/components/LanguageProvider";
import type { Translator } from "@/lib/i18n";
import type { EventRow } from "@/db/schema";
import { isoToDatetimeLocal } from "@/lib/datetime";

function eventFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("calendar.titleField"), required: true },
    {
      name: "startAt",
      label: t("calendar.startAt"),
      type: "datetime-local",
      required: true,
    },
    {
      name: "endAt",
      label: t("calendar.endAt"),
      type: "datetime-local",
      required: true,
    },
    { name: "allDay", label: t("calendar.allDay"), type: "checkbox" },
    { name: "location", label: t("calendar.location") },
    { name: "reminderMin", label: t("calendar.reminder"), type: "number" },
    {
      name: "description",
      label: t("calendar.descriptionField"),
      type: "textarea",
    },
  ];
}

function eventValues(e: EventRow) {
  return {
    id: e.id,
    title: e.title,
    startAt: isoToDatetimeLocal(e.startAt),
    endAt: isoToDatetimeLocal(e.endAt),
    allDay: e.allDay,
    location: e.location,
    reminderMin: e.reminderMin,
    description: e.description,
  };
}

export function CalendarView({
  events,
  createAction,
  updateAction,
  deleteAction,
}: {
  events: EventRow[];
  createAction: (fd: FormData) => void | Promise<void>;
  updateAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (id: number) => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const fields = eventFields(t);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const byDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const key = e.startAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const startOffset = (firstDay + 6) % 7; // semana inicia lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [newDate, setNewDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const detailEvents = dayDetail ? byDate.get(dayDetail) ?? [] : [];
  const detailTitle = dayDetail
    ? t("calendar.eventsOn", {
        date: `${Number(dayDetail.slice(8, 10))} ${t(
          `months.${Number(dayDetail.slice(5, 7))}`,
        )}`,
      })
    : "";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("calendar.prevMonth")}
          >
            ‹
          </button>
          <span className="min-w-32 text-center text-sm font-semibold">
            {t(`months.${month + 1}`)} {year}
          </span>
          <button
            onClick={next}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("calendar.nextMonth")}
          >
            ›
          </button>
        </div>
        <EntityDialog
          title={t("calendar.newEvent")}
          trigger={t("calendar.newEvent")}
          action={createAction}
          fields={fields}
          triggerClassName="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
        />
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <div
            key={d}
            className="px-2 py-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {t(`weekdays.${d}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d == null) {
            return (
              <div
                key={`empty-${i}`}
                className="h-28 overflow-hidden border-b border-r border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-900/30"
              />
            );
          }
          const key = ymd(d);
          const dayEvents = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              onDoubleClick={(e) => {
                // Los controles dentro del día (eventos, «+N más») ya abren su diálogo.
                if ((e.target as HTMLElement).closest("button, a")) return;
                setNewDate(key);
              }}
              className={`flex h-28 select-none flex-col overflow-hidden border-b border-r border-zinc-100 p-1 dark:border-zinc-900 ${
                isToday ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
              }`}
            >
              <EntityDialog
                title={t("calendar.newEvent")}
                trigger={
                  <span
                    className={`inline-block rounded px-1 text-xs ${
                      isToday
                        ? "bg-blue-600 font-semibold text-white"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {d}
                  </span>
                }
                action={createAction}
                fields={fields}
                values={{
                  startAt: `${key}T09:00`,
                  endAt: `${key}T10:00`,
                }}
              />
              <div className="mt-1 flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((e) => (
                  <EntityDialog
                    key={e.id}
                    title={t("calendar.editEvent")}
                    trigger={
                      <span className="block truncate rounded bg-blue-100 px-1 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {e.title}
                      </span>
                    }
                    action={updateAction}
                    fields={fields}
                    values={eventValues(e)}
                    extra={<LinksPanel sourceType="event" sourceId={e.id} />}
                    onDelete={deleteAction}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setDayDetail(key)}
                    className="block w-full truncate rounded px-1 text-left text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t("calendar.more", { n: dayEvents.length - 2 })}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EntityDialog
        title={t("calendar.newEvent")}
        open={newDate !== null}
        onOpenChange={(next) => {
          if (!next) setNewDate(null);
        }}
        action={createAction}
        fields={fields}
        values={
          newDate
            ? { startAt: `${newDate}T09:00`, endAt: `${newDate}T10:00` }
            : undefined
        }
      />

      <Dialog
        open={dayDetail !== null}
        onClose={() => setDayDetail(null)}
        title={detailTitle}
      >
        <div className="space-y-3">
          {dayDetail && (
            <EntityDialog
              title={t("calendar.newEvent")}
              trigger={t("calendar.newEvent")}
              action={createAction}
              fields={fields}
              triggerClassName="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300"
              values={{
                startAt: `${dayDetail}T09:00`,
                endAt: `${dayDetail}T10:00`,
              }}
            />
          )}
          <ul className="space-y-2">
            {detailEvents.map((e) => (
              <li key={e.id}>
                <EntityDialog
                  title={t("calendar.editEvent")}
                  trigger={
                    <div className="flex items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
                      <span className="truncate font-medium">{e.title}</span>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {e.startAt.slice(11, 16)}
                      </span>
                    </div>
                  }
                  action={updateAction}
                  fields={fields}
                  values={eventValues(e)}
                  extra={<LinksPanel sourceType="event" sourceId={e.id} />}
                  onDelete={deleteAction}
                />
              </li>
            ))}
          </ul>
        </div>
      </Dialog>
    </div>
  );
}
