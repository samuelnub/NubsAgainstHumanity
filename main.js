const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const helper = require("./app/js/helper");

let mainWindow;

function createWindow() {
    global.nah = {}; // our little namespace object thing. Just don't wanna pollute the global object

    helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.settingsFileName, function (settingsJson) {
        global.nah.settings = settingsJson;

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

        if (global.nah.settings.debug) {
            mainWindow.webContents.openDevTools();
        }

        // just so links will open in your default browser instead of messing up everything
        mainWindow.webContents.on("will-navigate", handleRedirect);
        mainWindow.webContents.on("new-window", handleRedirect);
        function handleRedirect(e, url) {
            e.preventDefault()
            electron.shell.openExternal(url);
        }

        console.log(app.getPath("userData"));
        mainWindow.on("closed", function () {
            mainWindow = null;
        });
    }, function (err) {
        console.error("Encountered an error when trying to read settings.json file");
        console.error(err);
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    if (mainWindow == null) {
        createWindow();
    }
});