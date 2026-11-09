import { app, BrowserWindow, shell, ipcMain, Notification, dialog } from "electron";
import * as path from "path";
import * as crypto from "crypto";
import * as net from "net";
import { spawn, type ChildProcess } from "child_process";
import { setupNotifications } from "./notifications";

const isDev = !app.isPackaged;
let PORT = 3456;
const HEALTH_TOKEN = crypto.randomBytes(16).toString("hex");
let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

function getProjectRoot(): string {
  return path.join(__dirname, "..");
}

function getServerDir(): string {
  if (!app.isPackaged) return getProjectRoot();
  return path.join(process.resourcesPath, "app.asar.unpacked");
}

function getDbPath(): string {
  return path.join(app.getPath("userData"), "agenda.db");
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(url: string, token: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(check);
      reject(new Error(`Server at ${url} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const check = setInterval(async () => {
      try {
        const res = await fetch(`${url}/api/health`, { redirect: "manual" });
        if (res.ok) {
          const json = (await res.json()) as { token?: string };
          if (json.token === token) {
            clearTimeout(timeout);
            clearInterval(check);
            resolve();
          }
        }
      } catch {
        // Server not ready yet
      }
    }, 500);
  });
}

function startNextServer(): Promise<void> {
  if (isDev) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const serverDir = getServerDir();
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: String(PORT),
      DB_FILE: getDbPath(),
      MIGRATIONS_DIR: path.join(process.resourcesPath, "db", "migrations"),
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
      ELECTRON_HEALTH_TOKEN: HEALTH_TOKEN,
    };

    const child = spawn(
      process.execPath,
      [path.join(serverDir, ".next", "standalone", "server.js")],
      {
        cwd: serverDir,
        env,
        stdio: "inherit",
      },
    );

    nextServer = child;
    child.on("error", (err) => {
      reject(err);
    });
    child.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        // Server died unexpectedly
        if (mainWindow && !mainWindow.isDestroyed()) {
          dialog.showErrorBox(
            "Personal Planner",
            `El servidor interno se detuvo (código ${code}). La aplicación se cerrará.`,
          );
          app.quit();
        }
      }
    });

    waitForServer(`http://127.0.0.1:${PORT}`, HEALTH_TOKEN)
      .then(resolve)
      .catch(reject);
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Personal Planner",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        shell.openExternal(url);
      }
    } catch {
      // ignore invalid urls
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopNextServer(): void {
  if (nextServer) {
    nextServer.kill("SIGTERM");
    nextServer = null;
  }
}

ipcMain.handle("open-external", (_, url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      shell.openExternal(url);
    }
  } catch {
    // ignore invalid urls
  }
});

ipcMain.handle("get-database-path", () => {
  return getDbPath();
});

ipcMain.handle("show-notification", (_, title: string, body: string) => {
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body });
    notification.show();
    notification.on("click", () => {
      mainWindow?.focus();
    });
  }
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  try {
    if (!isDev) {
      PORT = await getFreePort();
      await startNextServer();
    }
    createWindow();
    setupNotifications(mainWindow, PORT);
  } catch (err) {
    dialog.showErrorBox(
      "Personal Planner",
      `No se pudo iniciar la aplicación: ${err instanceof Error ? err.message : String(err)}`,
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopNextServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  stopNextServer();
});