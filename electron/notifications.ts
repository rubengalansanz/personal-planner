import { app, BrowserWindow, Notification } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

const POLL_INTERVAL = 30_000;
let PORT = 3456;
const notifiedKeys = new Set<string>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function storePath(): string {
  return path.join(app.getPath("userData"), "notified-reminders.json");
}

function loadNotified(): void {
  try {
    const raw = fs.readFileSync(storePath(), "utf8");
    const arr = JSON.parse(raw) as string[];
    for (const k of arr) {
      notifiedKeys.add(k);
    }
  } catch {
    // ignore
  }
}

function saveNotified(): void {
  try {
    fs.writeFileSync(storePath(), JSON.stringify([...notifiedKeys]), "utf8");
  } catch {
    // ignore
  }
}

interface DueReminder {
  kind: "event" | "anniversary";
  id: number;
  title: string;
  dueAt: string;
}

async function fetchDueReminders(): Promise<DueReminder[]> {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/electron/reminders`);
    if (!res.ok) return [];
    return (await res.json()) as DueReminder[];
  } catch {
    return [];
  }
}

export function setupNotifications(mainWindow: BrowserWindow | null, port?: number): void {
  if (port) PORT = port;
  if (!mainWindow) return;
  loadNotified();

  const tick = async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    try {
      const due = await fetchDueReminders();

      for (const d of due) {
        const key = `${d.kind}:${d.id}`;
        if (notifiedKeys.has(key)) continue;
        notifiedKeys.add(key);

        if (Notification.isSupported()) {
          const notification = new Notification({
            title: "Agenda · Recordatorio",
            body: d.title,
          });

          notification.on("click", () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.focus();
              mainWindow.webContents.send("navigate", "/calendario");
            }
          });

          notification.show();
        }
      }
      saveNotified();
    } catch (err) {
      console.error("Notification poll error:", err);
    }
  };

  void tick();
  intervalId = setInterval(tick, POLL_INTERVAL);
}

export function stopNotifications(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  saveNotified();
  notifiedKeys.clear();
}