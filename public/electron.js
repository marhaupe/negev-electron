const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const isDev = require("electron-is-dev");

const { executeStreamingLoadtest } = require("@negev/core");
const { ipcMain, dialog } = require("electron");
const fs = require("fs");

let mainWindow;

function createWindow() {
  setupListeners();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: { nodeIntegration: true },
  });
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../../build/index.html")}`
  );
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function setupListeners() {
  ipcMain.on("request:loadtestFetcher", async (event, config) => {
    try {
      const stream = executeStreamingLoadtest(config);
      stream.on("data", (data) =>
        event.reply("response:loadtestFetcher", { data: JSON.stringify(data) })
      );
      stream.on("end", () =>
        event.reply("response:loadtestFetcher", { end: true })
      );
      stream.on("close", () =>
        event.reply("response:loadtestFetcher", { close: true })
      );
      stream.on("error", (error) =>
        event.reply("response:loadtestFetcher", {
          error: { error: error.toString() },
        })
      );
    } catch (error) {
      event.reply("response:loadtestFetcher", {
        error: { error: error.toString() },
      });
    }
  });

  ipcMain.on("request:loadConfig", async (event, config) => {
    dialog.showOpenDialog(
      {
        defaultPath: "negev-config.json",
        properties: ["openFile", "showHiddenFiles"],
        filters: [{ name: "JSON", extensions: ["json"] }],
      },
      (fileName) => {
        if (!fileName || fileName.length === 0) {
          return;
        }
        if (fileName.length > 1) {
          dialog.showMessageBox({
            type: "error",
            message: "Plase choose a single file",
            buttons: ["OK"],
          });
        }

        fs.readFile(fileName[0], (err, data) => {
          if (err) {
            dialog.showMessageBox({
              type: "error",
              message: err.message,
              buttons: ["OK"],
            });
            return;
          }
          try {
            const config = JSON.parse(data.toString());
            event.reply("response:loadConfig", config);
          } catch (error) {
            dialog.showMessageBox({
              type: "error",
              message: error,
              buttons: ["OK"],
            });
            return;
          }
        });
      }
    );
  });

  ipcMain.on("request:saveConfig", async (event, config) => {
    dialog.showSaveDialog(
      {
        defaultPath: "negev-config.json",
      },
      (fileName) => {
        if (fileName === undefined) {
          return;
        }

        // fileName is a string that contains the path and filename created in the save file dialog.
        fs.writeFile(fileName, JSON.stringify(config), (err) => {
          if (err) {
            dialog.showMessageBox({
              type: "error",
              message: err.message,
              buttons: ["OK"],
            });
          }
        });
      }
    );
  });
}
