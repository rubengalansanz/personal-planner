import { listAnniversariesWithNext, listContactBirthdays } from "@/lib/data";
import {
  createAnniversaryAction,
  updateAnniversaryAction,
  deleteAnniversaryAction,
} from "@/app/actions/anniversaries";
import { isoToDate } from "@/lib/datetime";
import {
  PageHeader,
  EntityDialog,
  DeleteButton,
  ColumnVisibility,
  TableSort,
  Table,
  Th,
  Td,
  Badge,
  EmptyState,
  type FieldDef,
} from "@/components/ui";
import { LinksPanel } from "@/components/links/LinksPanel";
import { getTranslator } from "@/lib/i18n-server";
import type { Translator } from "@/lib/i18n";
import type { AnniversaryRow } from "@/db/schema";

const TYPE_TONE: Record<string, "info" | "success" | "neutral"> = {
  birthday: "info",
  anniversary: "success",
  other: "neutral",
};

function annFields(t: Translator): FieldDef[] {
  return [
    { name: "name", label: t("birthdays.name"), required: true },
    { name: "date", label: t("birthdays.date"), type: "date", required: true },
    {
      name: "type",
      label: t("birthdays.type"),
      type: "select",
      options: [
        { value: "birthday", label: t("birthdays.types.birthday") },
        { value: "anniversary", label: t("birthdays.types.anniversary") },
        { value: "other", label: t("birthdays.types.other") },
      ],
    },
    {
      name: "reminderMin",
      label: t("birthdays.reminder"),
      type: "number",
    },
  ];
}

function annValues(a: AnniversaryRow) {
  return {
    id: a.id,
    name: a.name,
    date: isoToDate(a.date),
    type: a.type,
    reminderMin: a.reminderMin,
  };
}

function fmt(iso: string, t: Translator) {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${t(`monthsShort.${m ?? 1}`)}`;
}

function untilLabel(days: number, t: Translator) {
  if (days <= 0) return t("common.today");
  if (days === 1) return t("common.tomorrow");
  return t("common.inDays", { n: days });
}

const triggerClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300";

export default async function CumpleanosPage() {
  const t = await getTranslator();
  const items = await listAnniversariesWithNext();
  const sorted = [...items].sort((a, b) => a.daysUntil - b.daysUntil);
  const contactBirthdays = await listContactBirthdays();
  const fields = annFields(t);

  return (
    <>
      <PageHeader
        title={t("birthdays.title")}
        description={t("birthdays.description")}
        action={
          <EntityDialog
            title={t("birthdays.newItem")}
            trigger={t("common.new")}
            action={createAnniversaryAction}
            fields={fields}
            triggerClassName={triggerClass}
          />
        }
      />
      <div className="p-4">
        {sorted.length === 0 ? (
          <EmptyState>{t("birthdays.empty")}</EmptyState>
        ) : (
          <ColumnVisibility
            storageKey="birthdays:columns"
            columns={[
              { key: "name", label: t("birthdays.name") },
              { key: "type", label: t("birthdays.type") },
              { key: "upcoming", label: t("birthdays.upcoming") },
              { key: "when", label: t("birthdays.when") },
              { key: "actions", label: t("common.actions") },
            ]}
          >
            <TableSort>
              <Table>
                <thead>
                  <tr>
                    <Th data-col="name" data-sort="name">{t("birthdays.name")}</Th>
                    <Th data-col="type" data-sort="type">{t("birthdays.type")}</Th>
                    <Th data-col="upcoming" data-sort="upcoming">{t("birthdays.upcoming")}</Th>
                    <Th data-col="when" data-sort="when">{t("birthdays.when")}</Th>
                    <Th data-col="actions" />
                  </tr>
                </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <Td data-col="name">{a.name}</Td>
                  <Td data-col="type">
                    <Badge tone={TYPE_TONE[a.type]}>
                      {t(`birthdays.types.${a.type}`)}
                    </Badge>
                  </Td>
                  <Td data-col="upcoming">{fmt(a.nextDate, t)}</Td>
                  <Td data-col="when">{untilLabel(a.daysUntil, t)}</Td>
                  <Td data-col="actions" className="text-right">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title={t("birthdays.editItem")}
                        trigger={t("common.edit")}
                        action={updateAnniversaryAction}
                        fields={fields}
                        values={annValues(a)}
                        extra={
                          <LinksPanel
                            sourceType="anniversary"
                            sourceId={a.id}
                          />
                        }
                        onDelete={deleteAnniversaryAction}
                      />
                      <DeleteButton
                        action={deleteAnniversaryAction.bind(null, a.id)}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
            </TableSort>
          </ColumnVisibility>
        )}
      </div>
      {contactBirthdays.length > 0 && (
        <div className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {t("contacts.title")} · {t("contacts.birthday")}
          </h2>
          <Table>
            <thead>
              <tr>
                <Th>{t("birthdays.name")}</Th>
                <Th>{t("birthdays.when")}</Th>
              </tr>
            </thead>
            <tbody>
              {contactBirthdays.map((c) => (
                <tr key={`contact-${c.id}`}>
                  <Td>{c.name}</Td>
                  <Td>{isoToDate(c.birthday)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
