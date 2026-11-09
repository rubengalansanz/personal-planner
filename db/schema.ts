import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Tipos de registro enlazables (para la tabla `links`). */
export const recordTypes = [
  "event",
  "task",
  "contact",
  "note",
  "anniversary",
  "project",
] as const;
export type RecordType = (typeof recordTypes)[number];

/** Calendario / Diario: citas y eventos. */
export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    startAt: text("start_at").notNull(),
    endAt: text("end_at").notNull(),
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    location: text("location"),
    reminderMin: integer("reminder_min"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("events_start_at_idx").on(t.startAt)],
);

/** Tareas (To Do). */
export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    notes: text("notes"),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    priority: integer("priority").notNull().default(2),
    status: text("status", { enum: ["pending", "done"] })
      .notNull()
      .default("pending"),
    category: text("category").notNull().default("General"),
    completedAt: text("completed_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("tasks_due_date_idx").on(t.dueDate), index("tasks_status_idx").on(t.status)],
);

/** Contactos (Agenda). */
export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    nickname: text("nickname"),
    company: text("company"),
    jobTitle: text("job_title"),
    telHome: text("tel_home"),
    telWork: text("tel_work"),
    telMobile: text("tel_mobile"),
    telFax: text("tel_fax"),
    telegram: text("telegram"),
    email: text("email"),
    addressHome: text("address_home"),
    addressWork: text("address_work"),
    notes: text("notes"),
    birthday: text("birthday"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("contacts_last_name_idx").on(t.lastName)],
);

/** Notas (Notepad). */
export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    content: text("content"),
    category: text("category").notNull().default("General"),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("notes_category_idx").on(t.category)],
);

/** Planner: proyectos. */
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  targetDate: text("target_date"),
  status: text("status", { enum: ["planning", "active", "done", "archived"] })
    .notNull()
    .default("active"),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Planner: hitos/items de un proyecto. */
export const plannerItems = sqliteTable(
  "planner_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    status: text("status", { enum: ["todo", "in_progress", "done"] })
      .notNull()
      .default("todo"),
    progress: integer("progress").notNull().default(0),
    priority: integer("priority").notNull().default(2),
    notes: text("notes"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("planner_items_project_idx").on(t.projectId)],
);

/** Cumpleaños / Aniversarios (fechas anuales recurrentes). */
export const anniversaries = sqliteTable("anniversaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull().default("birthday"),
  reminderMin: integer("reminder_min"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Enlaces entre registros (referencias cruzadas tipo Organizer). */
export const links = sqliteTable(
  "links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceType: text("source_type", { enum: recordTypes }).notNull(),
    sourceId: integer("source_id").notNull(),
    targetType: text("target_type", { enum: recordTypes }).notNull(),
    targetId: integer("target_id").notNull(),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("links_source_idx").on(t.sourceType, t.sourceId),
    index("links_target_idx").on(t.targetType, t.targetId),
  ],
);

/** Suscripciones Web Push. */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("push_sub_endpoint_idx").on(t.endpoint)],
);

export type EventRow = typeof events.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
export type PlannerItemRow = typeof plannerItems.$inferSelect;
export type AnniversaryRow = typeof anniversaries.$inferSelect;
export type LinkRow = typeof links.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
