import { listTasks } from "@/lib/data";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/tasks";
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
import type { TaskRow } from "@/db/schema";

function taskFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("tasks.titleField"), required: true },
    { name: "notes", label: t("tasks.notesField"), type: "textarea" },
    { name: "startDate", label: t("tasks.startDate"), type: "date" },
    { name: "dueDate", label: t("tasks.dueDate"), type: "date" },
    {
      name: "priority",
      label: t("tasks.priority"),
      type: "select",
      defaultValue: "2",
      options: [
        { value: "1", label: t("tasks.priorities.1") },
        { value: "2", label: t("tasks.priorities.2") },
        { value: "3", label: t("tasks.priorities.3") },
      ],
    },
    {
      name: "status",
      label: t("tasks.status"),
      type: "select",
      options: [
        { value: "pending", label: t("tasks.statuses.pending") },
        { value: "done", label: t("tasks.statuses.done") },
      ],
    },
    { name: "category", label: t("tasks.category") },
  ];
}

function taskValues(task: TaskRow) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    startDate: isoToDate(task.startDate),
    dueDate: isoToDate(task.dueDate),
    priority: task.priority,
    status: task.status,
    category: task.category,
  };
}

const triggerClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300";

export default async function TareasPage() {
  const t = await getTranslator();
  const tasks = await listTasks();
  const fields = taskFields(t);

  return (
    <>
      <PageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        action={
          <EntityDialog
            title={t("tasks.newTask")}
            trigger={t("tasks.newTask")}
            action={createTaskAction}
            fields={fields}
            triggerClassName={triggerClass}
          />
        }
      />
      <div className="p-4">
        {tasks.length === 0 ? (
          <EmptyState>{t("tasks.empty")}</EmptyState>
        ) : (
          <ColumnVisibility
            storageKey="tasks:columns"
            columns={[
              { key: "title", label: t("tasks.titleField") },
              { key: "dueDate", label: t("tasks.dueDate") },
              { key: "priority", label: t("tasks.priority") },
              { key: "status", label: t("tasks.status") },
              { key: "category", label: t("tasks.category") },
              { key: "actions", label: t("common.actions") },
            ]}
          >
            <TableSort>
              <Table>
                <thead>
              <tr>
                <Th data-col="title" data-sort="title">{t("tasks.titleField")}</Th>
                <Th data-col="dueDate" data-sort="dueDate">{t("tasks.dueDate")}</Th>
                <Th data-col="priority" data-sort="priority">{t("tasks.priority")}</Th>
                <Th data-col="status" data-sort="status">{t("tasks.status")}</Th>
                <Th data-col="category" data-sort="category">{t("tasks.category")}</Th>
                <Th data-col="actions" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <Td data-col="title">{task.title}</Td>
                  <Td data-col="dueDate">{task.dueDate ? isoToDate(task.dueDate) : "—"}</Td>
                  <Td data-col="priority">
                    <Badge
                      tone={
                        task.priority === 1
                          ? "danger"
                          : task.priority === 2
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {t(`tasks.priorities.${task.priority}`)}
                    </Badge>
                  </Td>
                  <Td data-col="status">
                    {task.status === "done"
                      ? t("tasks.statuses.done")
                      : t("tasks.statuses.pending")}
                  </Td>
                  <Td data-col="category">{task.category}</Td>
                  <Td data-col="actions" className="text-right">
                    <div className="flex justify-end gap-2">
                      <EntityDialog
                        title={t("tasks.editTask")}
                        trigger={t("common.edit")}
                        action={updateTaskAction}
                        fields={fields}
                        values={taskValues(task)}
                        extra={
                          <LinksPanel sourceType="task" sourceId={task.id} />
                        }
                        onDelete={deleteTaskAction}
                      />
                      <DeleteButton
                        action={deleteTaskAction.bind(null, task.id)}
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
    </>
  );
}
