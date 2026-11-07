import { listProjects, listPlannerItems, listEvents } from "@/lib/data";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createPlannerItemAction,
  updatePlannerItemAction,
  deletePlannerItemAction,
} from "@/app/actions/planner";
import { isoToDate } from "@/lib/datetime";
import {
  PageHeader,
  EntityDialog,
  Card,
  CardHeader,
  CardBody,
  Badge,
  EmptyState,
  type FieldDef,
} from "@/components/ui";
import { LinksPanel } from "@/components/links/LinksPanel";
import { getTranslator } from "@/lib/i18n-server";
import type { Translator } from "@/lib/i18n";
import type { ProjectRow, PlannerItemRow } from "@/db/schema";

const PROJECT_TONE: Record<
  string,
  "neutral" | "info" | "success" | "warning"
> = {
  planning: "warning",
  active: "info",
  done: "success",
  archived: "neutral",
};

const ITEM_TONE: Record<string, "neutral" | "info" | "success"> = {
  todo: "neutral",
  in_progress: "info",
  done: "success",
};

function projectFields(t: Translator): FieldDef[] {
  return [
    { name: "name", label: t("planner.name"), required: true },
    {
      name: "description",
      label: t("planner.descriptionField"),
      type: "textarea",
    },
    { name: "startDate", label: t("planner.startDate"), type: "date" },
    { name: "targetDate", label: t("planner.targetDate"), type: "date" },
    {
      name: "status",
      label: t("planner.status"),
      type: "select",
      options: [
        { value: "planning", label: t("planner.statuses.planning") },
        { value: "active", label: t("planner.statuses.active") },
        { value: "done", label: t("planner.statuses.done") },
        { value: "archived", label: t("planner.statuses.archived") },
      ],
    },
    { name: "color", label: t("planner.color") },
  ];
}

function itemFields(t: Translator): FieldDef[] {
  return [
    { name: "title", label: t("planner.itemTitle"), required: true },
    { name: "startDate", label: t("planner.startDate"), type: "date" },
    { name: "dueDate", label: t("planner.targetDate"), type: "date" },
    {
      name: "status",
      label: t("planner.status"),
      type: "select",
      options: [
        { value: "todo", label: t("planner.itemStatuses.todo") },
        { value: "in_progress", label: t("planner.itemStatuses.in_progress") },
        { value: "done", label: t("planner.itemStatuses.done") },
      ],
    },
    { name: "progress", label: t("planner.progress"), type: "number" },
    {
      name: "priority",
      label: t("planner.priority"),
      type: "select",
      options: [
        { value: "1", label: t("tasks.priorities.1") },
        { value: "2", label: t("tasks.priorities.2") },
        { value: "3", label: t("tasks.priorities.3") },
      ],
    },
    { name: "notes", label: t("planner.notes"), type: "textarea" },
  ];
}

function projectValues(p: ProjectRow) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    startDate: isoToDate(p.startDate),
    targetDate: isoToDate(p.targetDate),
    status: p.status,
    color: p.color,
  };
}

function itemValues(it: PlannerItemRow) {
  return {
    id: it.id,
    projectId: it.projectId,
    title: it.title,
    startDate: isoToDate(it.startDate),
    dueDate: isoToDate(it.dueDate),
    status: it.status,
    progress: it.progress,
    priority: it.priority,
    notes: it.notes,
  };
}

const triggerClass =
  "inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-zinc-700 dark:hover:bg-zinc-300";

export default async function PlannerPage() {
  const t = await getTranslator();
  const projects = await listProjects();
  const withItems = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      items: await listPlannerItems(p.id),
    })),
  );
  const events = await listEvents();
  const upcomingEvents = events
    .filter((e) => new Date(e.startAt) >= new Date())
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 10);
  const projects_ = projectFields(t);
  const items_ = itemFields(t);

  return (
    <>
      <PageHeader
        title={t("planner.title")}
        description={t("planner.description")}
        action={
          <EntityDialog
            title={t("planner.newProject")}
            trigger={t("planner.newProject")}
            action={createProjectAction}
            fields={projects_}
            triggerClassName={triggerClass}
          />
        }
      />
      <div className="space-y-4 p-4">
        {withItems.length === 0 ? (
          <EmptyState>{t("planner.noProjects")}</EmptyState>
        ) : (
          withItems.map(({ project, items }) => {
            const status = t(`planner.statuses.${project.status}`);
            return (
              <Card key={project.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </span>
                  }
                  description={
                    project.targetDate
                      ? t("planner.target", {
                          date: isoToDate(project.targetDate),
                        })
                      : undefined
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={PROJECT_TONE[project.status]}>
                        {status}
                      </Badge>
                      <EntityDialog
                        title={t("planner.editProject")}
                        trigger={t("common.edit")}
                        action={updateProjectAction}
                        fields={projects_}
                        values={projectValues(project)}
                        extra={
                          <LinksPanel
                            sourceType="project"
                            sourceId={project.id}
                          />
                        }
                        onDelete={deleteProjectAction}
                      />
                    </div>
                  }
                />
                <CardBody className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      {t("planner.noItems")}{" "}
                      <EntityDialog
                        title={t("planner.newItem")}
                        trigger={t("planner.addItem")}
                        action={createPlannerItemAction}
                        fields={items_}
                        hiddenValues={{ projectId: project.id }}
                        triggerClassName="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      />
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {[...items]
                        .sort((a, b) =>
                          (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
                        )
                        .map((it) => (
                          <li
                            key={it.id}
                            className="flex items-start gap-3 rounded-md border border-zinc-100 p-2 dark:border-zinc-900"
                          >
                            <span
                              className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">
                                  {it.title}
                                </span>
                                <span className="shrink-0 text-xs text-zinc-500">
                                  {it.dueDate
                                    ? isoToDate(it.dueDate)
                                    : t("common.noDate")}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge tone={ITEM_TONE[it.status]}>
                                  {t(`planner.itemStatuses.${it.status}`)}
                                </Badge>
                                <Badge tone="neutral">
                                  {t(`tasks.priorities.${it.priority}`)}
                                </Badge>
                              </div>
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, it.progress))}%`,
                                    backgroundColor: project.color,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <EntityDialog
                                title={t("planner.editItem")}
                                trigger="✎"
                                action={updatePlannerItemAction}
                                fields={items_}
                                values={itemValues(it)}
                                hiddenValues={{ projectId: project.id }}
                                onDelete={deletePlannerItemAction}
                              />
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })
        )}
        {upcomingEvents.length > 0 && (
          <Card>
            <CardHeader
              title={t("planner.upcomingEvents") ?? "Próximas citas"}
              description={t("planner.upcomingEventsDesc") ?? "Citas del calendario"}
            />
            <CardBody className="space-y-2">
              {upcomingEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{e.title}</span>
                  <span className="text-xs text-zinc-500">
                    {e.startAt.slice(0, 10)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
