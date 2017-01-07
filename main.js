const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const helper = require("./app/js/helper");

let mainWindow;

function createWindow() {
    console.log(process.execPath);
    console.log(process.resourcesPath);
    global.nah = {}; // our little namespace object thing. Just don't wanna pollute the global object
    global.nah.settings = helper.fileToJSON("./app/resource/settings.json");

    mainWindow = new BrowserWindow({
        titleBarStyle: "hidden",
        autoHideMenuBar: true,
        width: global.nah.settings.width,
        height: global.nah.settings.height
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "app/index.html"),
        protocol: "file:",
        slashes: true
    }));

    if(global.nah.settings.debug) {
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