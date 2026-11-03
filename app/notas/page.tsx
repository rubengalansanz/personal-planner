import { listNotes } from "@/lib/data";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/app/actions/notes";
import {
  PageHeader,
  EntityDialog,
  Button,
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
import type { NoteRow } from "@/db/schema";

function noteFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("notes.titleField"), required: true },
    { name: "category", label: t("notes.category") },
    { name: "content", label: t("notes.contentField"), type: "textarea" },
  ];
}

function noteValues(n: NoteRow) {
  return {
    id: n.id,
    title: n.title,
    category: n.category,
    content: n.content,
  };
}

const triggerClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300";

export default async function NotasPage() {
  const t = await getTranslator();
  const notes = await listNotes();
  const fields = noteFields(t);

  return (
    <>
      <PageHeader
        title={t("notes.title")}
        description={t("notes.description")}
        action={
          <EntityDialog
            title={t("notes.newNote")}
            trigger={t("notes.newNote")}
            action={createNoteAction}
            fields={fields}
            triggerClassName={triggerClass}
          />
        }
      />
      <div className="p-4">
        {notes.length === 0 ? (
          <EmptyState>{t("notes.empty")}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("notes.titleField")}</Th>
                <Th>{t("notes.category")}</Th>
                <Th>{t("notes.updated")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id}>
                  <Td>{n.title}</Td>
                  <Td>
                    <Badge>{n.category}</Badge>
                  </Td>
                  <Td>{n.updatedAt?.slice(0, 10)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title={t("notes.editNote")}
                        trigger={t("common.edit")}
                        action={updateNoteAction}
                        fields={fields}
                        values={noteValues(n)}
                        extra={
                          <LinksPanel sourceType="note" sourceId={n.id} />
                        }
                        onDelete={deleteNoteAction}
                      />
                      <form action={deleteNoteAction.bind(null, n.id)}>
                        <Button variant="danger" type="submit">
                          {t("common.delete")}
                        </Button>
                      </form>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
