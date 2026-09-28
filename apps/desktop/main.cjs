const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
function openWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 760,
    minHeight: 620,
    backgroundColor: "#f5f4ef",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.loadFile(
    path.join(
      app.isPackaged
        ? path.join(process.resourcesPath, "web")
        : path.join(__dirname, "../simulator/dist"),
      "index.html",
    ),
  );
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  openWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
