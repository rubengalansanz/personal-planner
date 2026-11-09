import { listContacts } from "@/lib/data";
import {
  createContactAction,
  updateContactAction,
  deleteContactAction,
} from "@/app/actions/contacts";
import { isoToDate } from "@/lib/datetime";
import {
  PageHeader,
  EntityDialog,
  DeleteButton,
  ColumnVisibility,
  Table,
  Th,
  Td,
  EmptyState,
  type FieldDef,
} from "@/components/ui";
import { LinksPanel } from "@/components/links/LinksPanel";
import { getTranslator } from "@/lib/i18n-server";
import type { Translator } from "@/lib/i18n";
import type { ContactRow } from "@/db/schema";

function contactFields(t: Translator): FieldDef[] {
  return [
    {
      name: "title",
      label: t("contacts.salutation"),
      type: "select",
      options: [
        { value: "", label: t("contacts.salutationNone") },
        { value: "Sr.", label: "Sr." },
        { value: "Sra.", label: "Sra." },
        { value: "Srta.", label: "Srta." },
        { value: "Dr.", label: "Dr." },
      ],
    },
    { name: "firstName", label: t("contacts.firstName") },
    { name: "lastName", label: t("contacts.lastName") },
    { name: "nickname", label: t("contacts.nickname") },
    { name: "company", label: t("contacts.company") },
    { name: "jobTitle", label: t("contacts.jobTitle") },
    { name: "telHome", label: t("contacts.telHome") },
    { name: "telWork", label: t("contacts.telWork") },
    { name: "telMobile", label: t("contacts.telMobile") },
    { name: "telFax", label: t("contacts.telFax") },
    { name: "telegram", label: t("contacts.telegram") },
    { name: "email", label: t("contacts.email") },
    { name: "birthday", label: t("contacts.birthday"), type: "date" },
    {
      name: "addressHome",
      label: t("contacts.addressHome"),
      type: "textarea",
    },
    {
      name: "addressWork",
      label: t("contacts.addressWork"),
      type: "textarea",
    },
    { name: "notes", label: t("contacts.notes"), type: "textarea" },
  ];
}

function contactValues(c: ContactRow, fields: FieldDef[]) {
  const r = c as unknown as Record<string, unknown>;
  const v: Record<string, string | number | boolean | null> = { id: c.id };
  for (const f of fields) {
    const val = r[f.name];
    if (val == null) v[f.name] = "";
    else if (f.type === "date") v[f.name] = isoToDate(String(val));
    else if (typeof val === "boolean") v[f.name] = val;
    else v[f.name] = String(val);
  }
  return v;
}

function fullName(c: ContactRow, unnamed: string) {
  return (
    [c.title, c.firstName, c.lastName].filter(Boolean).join(" ") || unnamed
  );
}

const triggerClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300";

export default async function ContactosPage() {
  const t = await getTranslator();
  const contacts = await listContacts();
  const fields = contactFields(t);

  return (
    <>
      <PageHeader
        title={t("contacts.title")}
        description={t("contacts.description")}
        action={
          <EntityDialog
            title={t("contacts.newContact")}
            trigger={t("contacts.newContact")}
            action={createContactAction}
            fields={fields}
            triggerClassName={triggerClass}
          />
        }
      />
      <div className="p-4">
        {contacts.length === 0 ? (
          <EmptyState>{t("contacts.empty")}</EmptyState>
        ) : (
          <ColumnVisibility
            storageKey="contacts:columns"
            columns={[
              { key: "name", label: t("contacts.firstName") },
              { key: "company", label: t("contacts.company") },
              { key: "email", label: t("contacts.email") },
              { key: "mobile", label: t("contacts.telMobile") },
              { key: "contact", label: t("contacts.contact") },
              { key: "actions", label: t("common.actions") ?? "Acciones" },
            ]}
          >
            <Table>
              <thead>
              <tr>
                <Th data-col="name">{t("contacts.firstName")}</Th>
                <Th data-col="company">{t("contacts.company")}</Th>
                <Th data-col="email">{t("contacts.email")}</Th>
                <Th data-col="mobile">{t("contacts.telMobile")}</Th>
                <Th data-col="contact">{t("contacts.contact")}</Th>
                <Th data-col="actions" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <Td data-col="name">{fullName(c, t("common.unnamed"))}</Td>
                  <Td data-col="company">{c.company ?? "—"}</Td>
                  <Td data-col="email">{c.email ?? "—"}</Td>
                  <Td data-col="mobile">
                    {c.telMobile ? (
                      <a
                        href={`tel:${c.telMobile}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {c.telMobile}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td data-col="contact">
                    <div className="flex flex-wrap gap-1">
                      {c.telMobile && (
                        <a
                          href={`https://wa.me/${c.telMobile.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                          title="WhatsApp"
                        >
                          WA
                        </a>
                      )}
                      {(c.telegram || c.telMobile) && (
                        <a
                          href={
                            c.telegram
                              ? `https://t.me/${c.telegram.replace(/^@/, "")}`
                              : `https://t.me/+${c.telMobile!.replace(/[^0-9]/g, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
                          title="Telegram"
                        >
                          TG
                        </a>
                      )}
                      {!c.telMobile && !c.telegram && (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </div>
                  </Td>
                  <Td data-col="actions" className="text-right">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title={t("contacts.editContact")}
                        trigger={t("common.edit")}
                        action={updateContactAction}
                        fields={fields}
                        values={contactValues(c, fields)}
                        extra={
                          <LinksPanel sourceType="contact" sourceId={c.id} />
                        }
                        onDelete={deleteContactAction}
                      />
                      <DeleteButton action={deleteContactAction.bind(null, c.id)} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </ColumnVisibility>
        )}
      </div>
    </>
  );
}
