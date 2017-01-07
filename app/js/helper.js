const fs = require("fs");

// TODO: make file read/write async, and give callbacks, but this isn't a "large concurrent userbase server", so this should be okay for now.

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

exports.createUUID = function() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

// Helpers for these helper functions. nice lol
function getCorrectPath(filePath) {
    // A crappy hack, will utterly fail if the user decides to put their executable somewhere deep down where this string can be found in its filepath
    return (process.execPath.search("\\\\node_modules\\\\electron\\\\dist\\\\electron") !== -1 ? filePath : process.resourcesPath + "/app/" + filePath.split("./").join(""));
}