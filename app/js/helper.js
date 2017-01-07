const fs = require("fs");

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

// Helpers for these helper functions. nice lol
function getCorrectPath(filePath) {
    return (process.execPath.search("\\\\node_modules\\\\electron\\\\dist\\\\electron") !== -1 ? filePath : process.resourcesPath + "/app/" + filePath.split("./").join(""));
}