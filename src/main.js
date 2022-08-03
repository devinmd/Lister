// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, systemPreferences } = require("electron");
const path = require("path");
const fs = require("fs");

let win;
var tray;
const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    resizable: true,
    frame: false,
    icon: path.join(__dirname, "../", "/assets", "/appicons", "appicon_512x512.png"),
    backgroundColor: "white",
    darkTheme: true,
    show: false,
  });

  // and load the index.html of the app.
  win.loadFile(__dirname + "/index.html");

  app.setAppUserModelId(app.name);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.platform !== "darwin") {
    win.once("ready-to-show", () => {
      win.show();
    });
  } else {
    win.show();
  }

  console.log("created main window");
};

win = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      console.log("app opened");
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

ipcMain.on("minimize", (evt, args) => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on("close", (evt, args) => {
  // kill tray icon
  tray.destroy();

  // quit the app
  app.quit();

  //win.hide()
  // new Notification({ title: 'Lister Minimized to Tray', body: '',}).show()
});

ipcMain.on("requestFiles", (evt, args) => {
  fs.readFile(path.join(__dirname, "../", "/resources/", "files.json"), (err, data) => {
    // return the contents of files.json
    win.webContents.send("files", JSON.parse(data));
  });
});

ipcMain.on("writeFiles", (evt, args) => {
  fs.writeFile(path.join(__dirname, "../", "/resources/", "files.json"), args, (err) => {
    if (err) {
      console.log(err);
    }
  });
});

ipcMain.on("createTray", (evt, args) => {
  if (tray != null) {
    tray.destroy();
  }
  tray = new Tray(path.join(__dirname, "../", "/assets/appicons/trayicon@2x.png"));

  // open on left click on windows
  if (process.platform == "win32") {
    tray.on("click", function () {
      tray.popUpContextMenu();
    });
  }

  let menu = Menu.buildFromTemplate([
    {
      label: "Lister",
      click: function () {
        win.show();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: function () {
        app.quit();
      },
      //icon: path.join(__dirname, '../', '/assets/', '/', 'quit.png')
    },
  ]);

  tray.setContextMenu(menu);
  tray.setToolTip("Lister");
});
