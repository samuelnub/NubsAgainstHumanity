const fs = require("fs");
const http = require("http");

exports.consts = {
    resRootPath: "./app/resource/",
    resDecksPath: "./app/resource/decks/",
    resProfilesPath: "./app/resource/profiles/",

    settingsFileName: "settings.json"
};

exports.fileToJSON = function(filePath) {
    try {
        const fileContents = fs.readFileSync(getCorrectPath(filePath));
        return JSON.parse(fileContents);
    }
    catch(err) {
        console.error("Encountered an error when trying to read file");
        console.error(err);
        return JSON.parse("{ \"lol\": \"you're not very good at this\" }");
    }
};

exports.JSONToFile = function(filePath, json) {
    try {
        if(typeof json == "undefined") {
            return;
        }
        fs.writeFileSync(getCorrectPath(filePath), JSON.stringify(json, null, 4));
    }
    catch(err) {
        console.error("Encountered an error when trying to write file");
        console.error(err);
    }
};

exports.fileToJSONAsync = function(filePath, callback /* Should have 1 argument, the returned parsed JSON object */, failureCallback) {
    fs.readFile(getCorrectPath(filePath), function(err, data) {
        if(err) {
            console.error("Encountered an error when trying to read file asynchronously");
            console.error(err);
            if(typeof failureCallback == "function") {
                failureCallback(err);
            }
        }
        else {
            try {
                const parsed = JSON.parse(data);
                callback(parsed);
            }
            catch (err) {
                console.error("Encountered an error when trying to parse JSON");
                console.error(err);
                if (typeof failureCallback == "function") {
                    failureCallback(err);
                }
            }
        }
    });
};

exports.JSONToFileAsync = function(filePath, json, callback, failureCallback) {
    fs.writeFile(getCorrectPath(filePath), JSON.stringify(json, null, 4), function(err) {
        if(err) {
            console.error("Encountered an error when trying to write file asynchronously");
            console.error(err);
            if(typeof failureCallback == "function") {
                failureCallback(err);
            }
        }
        else {
            callback();
        }
    });
};

exports.httpGetJSON = function(url /* No http://, just example www.google.com/boots_and_cats */, callback /* Also should take 1 argument, with the parsed JSON */, failureCallback) {
    http.get({
        host: splitStringAtIndex(url, url.search("/")).first,
        path: splitStringAtIndex(url, url.search("/")).second
    }, function(res) {
        let resBody = "";
        res.on("data", function(d) {
            resBody += d;
        });
        res.on("error", function(err) {
            console.error("Encountered an error when trying to make a HTTP get");
            console.error(err);
            if(typeof failureCallback == "function") {
                failureCallback(err);
            }
        });
        res.on("end", function() {
            try {
                const parsed = JSON.parse(resBody);
                callback(parsed);
            }
            catch(err) {
                console.error("Encountered an error when trying to parse JSON");
                console.error(err);
                if(typeof failureCallback == "function") {
                    failureCallback(err);
                }
            }
        });
    });
};

exports.createUUID = function() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

exports.sanitizeString = function(message) {
    return (typeof message == "string" ? message.split(/<script>|<\/script>/g).join("") : "You numbnut.");
};

exports.placeElementInContainer = function(parentContainer /* Pass an HTML element, or pass a string of the container element ID*/, yourElement, params /* row, col (width), insertBeforeCol (x axis-ordering), centred (bool) */) {
        const ourParams = {
            row: (params.hasOwnProperty("row") ? params.row : 0),
            col: (params.hasOwnProperty("col") ? params.col : 12),
            insertBeforeCol: (params.hasOwnProperty("insertBeforeCol") ? params.insertBeforeCol : -1),
            centred: (params.hasOwnProperty("centred") ? params.centred : false)
        };
        
        parentContainer = (typeof parentContainer == "string" ? document.getElementById(parentContainer) : parentContainer);
        
        if(ourParams.centred) {
            yourElement.classList.add("span", "centred");
        }

        const rows = parentContainer.getElementsByClassName("row");
        if(rows.length === 0) {
            console.error("You tried putting an element into a container with no rows! You idiot!");
            return false;
        }

        ourParams.row = (ourParams.row < rows.length && ourParams.row >= 0 ? ourParams.row : 0);
        yourElement.classList.add("col-sm-" + ourParams.col, "center-block"); // sm seems to be the right size, or else there's either too much empty room, or they're too squeezed
        
        if(ourParams.insertBeforeCol < rows[ourParams.row].childNodes.length && ourParams.insertBeforeCol >= 0) {
            rows[ourParams.row].insertBefore(yourElement, rows[ourParams.row].childNodes[ourParams.insertBeforeCol]);
        }
        else {
            rows[ourParams.row].appendChild(yourElement);
        }
        return true;
};

exports.addAnimationToElement = function(animName, element, infinite) {
    element.classList.add("animated", animName);
    if(infinite) {
        element.classList.add("infinite");
    }
    else {
        element.addEventListener("animationend", function removeAnimation() {
            element.classList.remove("animated", animName);
            element.removeEventListener("animationend", removeAnimation);
        });
    }
    return element;
};

// Helpers for these helper functions. nice lol
function getCorrectPath(filePath) {
    // A crappy hack, will utterly fail if the user decides to put their executable somewhere deep down where this string can be found in its filepath
    return (process.execPath.search("\\\\node_modules\\\\electron\\\\dist\\\\electron") !== -1 ? filePath : process.resourcesPath + "/app/" + filePath.split("./").join(""));
}

function splitStringAtIndex(message, index) {
    return {
        first: message.substring(0, index),
        second: message.substring(index)
    };
}