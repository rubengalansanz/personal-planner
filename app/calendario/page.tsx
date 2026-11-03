import { listEvents, listTasks, listUpcomingPlannerItems } from "@/lib/data";
import { CalendarView } from "@/components/calendar/CalendarView";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "@/app/actions/events";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  Badge,
} from "@/components/ui";
import { getTranslator } from "@/lib/i18n-server";

export default async function CalendarioPage() {
  const t = await getTranslator();
  const [events, tasks, planner] = await Promise.all([
    listEvents(),
    listTasks({ status: "pending" }),
    listUpcomingPlannerItems(),
  ]);

  return (
    <>
      <PageHeader
        title={t("calendar.title")}
        description={t("calendar.description")}
        action={
          <a
            href="/api/calendar"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            {t("calendar.exportIcs")}
          </a>
        }
      />
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarView
            events={events}
            createAction={createEventAction}
            updateAction={updateEventAction}
            deleteAction={deleteEventAction}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t("calendar.pendingTasks")}
              description={t("calendar.pendingTasksCount", {
                n: tasks.length,
              })}
            />
            <CardBody className="space-y-2">
              {tasks.length === 0 ? (
                <EmptyState>{t("calendar.noPendingTasks")}</EmptyState>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{task.title}</span>
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
                  </div>
                ))
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title={t("calendar.upcomingMilestones")}
              description={t("calendar.upcomingMilestonesDesc")}
            />
            <CardBody className="space-y-2">
              {planner.length === 0 ? (
                <EmptyState>{t("calendar.noUpcomingMilestones")}</EmptyState>
              ) : (
                planner.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="text-xs text-zinc-500">
                      {item.dueDate?.slice(0, 10)}
                    </span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
