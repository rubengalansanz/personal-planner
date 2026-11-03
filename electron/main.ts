import { app, BrowserWindow, shell, ipcMain, Notification } from "electron";
import * as path from "path";
import { spawn, type ChildProcess } from "child_process";
import { setupNotifications } from "./notifications";

const isDev = !app.isPackaged;
const PORT = 3456;
let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

function getProjectRoot(): string {
  return path.join(__dirname, "..");
}

/**
 * Directorio desde el que lanzar el servidor Next standalone.
 * En dev es la raíz del proyecto; empaquetado NO puede ser `..` de `__dirname`
 * (eso es el fichero `app.asar`, y spawn con cwd=fichero da ENOTDIR), sino
 * `app.asar.unpacked`, donde asarUnpack deja `.next/standalone/**` en disco.
 */
function getServerDir(): string {
  if (!app.isPackaged) return getProjectRoot();
  return path.join(process.resourcesPath, "app.asar.unpacked");
}

function getDbPath(): string {
  return path.join(app.getPath("userData"), "agenda.db");
}

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(check);
      reject(new Error(`Server at ${url} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const check = setInterval(async () => {
      try {
        const res = await fetch(url, { redirect: "manual" });
        if (res.status > 0) {
          clearTimeout(timeout);
          clearInterval(check);
          resolve();
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
      PORT: String(PORT),
      DB_FILE: getDbPath(),
      MIGRATIONS_DIR: path.join(process.resourcesPath, "db", "migrations"),
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
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
    child.on("error", reject);

    waitForServer(`http://localhost:${PORT}`)
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
      sandbox: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
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
  shell.openExternal(url);
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

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
    setupNotifications(mainWindow);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error("Failed to start application:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopNextServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopNextServer();
});
