const { app, BrowserWindow } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "backend");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const NPM_CMD = "C:\\Program Files\\nodejs\\npm.cmd";

let backendProc = null;
let frontendProc = null;
let mainWindow = null;

function waitForHealthy(url, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on("error", retry);
      req.setTimeout(2000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
      else setTimeout(check, 800);
    };
    check();
  });
}

function killTree(proc) {
  if (!proc || proc.killed || proc.pid == null) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${proc.pid} /t /f`);
    } catch {
      // process may already be gone
    }
  } else {
    try {
      proc.kill();
    } catch {
      // ignore
    }
  }
}

function startBackend() {
  const uvicorn = path.join(BACKEND_DIR, ".venv", "Scripts", "uvicorn.exe");
  backendProc = spawn(uvicorn, ["app.main:app", "--port", "8000"], {
    cwd: BACKEND_DIR,
    windowsHide: true,
  });
  backendProc.stderr.on("data", (d) => console.error(`[backend] ${d}`));
  backendProc.on("error", (e) => console.error("[backend] failed to start", e));
}

function startFrontend() {
  frontendProc = spawn("cmd.exe", ["/c", NPM_CMD, "run", "start", "--", "-p", "3000"], {
    cwd: FRONTEND_DIR,
    windowsHide: true,
  });
  frontendProc.stderr.on("data", (d) => console.error(`[frontend] ${d}`));
  frontendProc.on("error", (e) => console.error("[frontend] failed to start", e));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    title: "Symmetrics",
    backgroundColor: "#f7f9fc",
  });

  mainWindow.loadFile(path.join(__dirname, "loading.html"));

  startBackend();
  startFrontend();

  try {
    await waitForHealthy("http://localhost:8000/api/health");
    await waitForHealthy("http://localhost:3000");
    mainWindow.loadURL("http://localhost:3000");
  } catch (err) {
    console.error(err);
    mainWindow.loadFile(path.join(__dirname, "error.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  killTree(backendProc);
  killTree(frontendProc);
  app.quit();
});

app.on("before-quit", () => {
  killTree(backendProc);
  killTree(frontendProc);
});
