const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

const constants = require("./app/js/constants");

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        titleBarStyle: "hidden",
        autoHideMenuBar: true,
        width: 800,
        height: 600
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "app/index.html"),
        protocol: "file:",
        slashes: true
    }));

    if(constants.debug) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", function() {
        mainWindow = null;
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", function() {
    if(process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    if(mainWindow == null) {
        createWindow();
    }
});