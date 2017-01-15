const fs = require("fs");
const http = require("http");

const consts = {
    resRootPath: "./app/resource/",
    resCardsPath: "./app/resource/cards/",

    profileFileName: "profile.json",
    settingsFileName: "settings.json",

    underline: "________",
    insults: [
        "sickle cell",
        "mistake",
        "failed abortion",
        "nutwhacker",
        "nutsack",
        "doofus",
        "dinglebat",
        "bastard",
        "donkey",
        "dweeb",
        "git",
        "geezer",
        "hick",
        "louse",
        "nut",
        "wimp",
        "yahoo",
        "wing-dingly fingle-bob",
        "skadouche-bag",
        "sub-human scum",
        "dried up remnant within an unsanitized toilet bowl",
        "sick pterodactyl",
        "mentally handicapped individual"
    ]
};
exports.consts = consts;

exports.fileToJSON = fileToJSON;
function fileToJSON(filePath) {
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
}

exports.fileToJSONAsync = fileToJSONAsync;
function fileToJSONAsync(filePath, callback /* Should have 1 argument, the returned parsed JSON object */, failureCallback) {
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

exports.JSONToFileAsync = JSONToFileAsync;
function JSONToFileAsync(filePath, json, callback, failureCallback) {
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

exports.httpGetJSON = httpGetJSON;
function httpGetJSON(url /* No http://, just example www.google.com/boots_and_cats */, callback /* Also should take 1 argument, with the parsed JSON */, failureCallback) {
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

exports.createUUID = createUUID;
function createUUID() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

exports.sanitizeString = sanitizeString;
function sanitizeString(message) {
    if(typeof message != "string") {
        return "You numbnut, what the hell are you trying to sanitize? Your balls?";
    }
    return message.replace(/<(?!b|\/b|em|\/em|i|\/i|small|\/small|strong|\/strong|sub|\/sub|sup|\/sup|ins|\/ins|del|\/del|mark|\/mark|a|\/a|img|\/img|li|\/li|h|\/h|p|\/p|tt|\/tt|code|\/code)/g, "&lt;"); // TODO: either whitelist acceptable formatting tags, or blacklist bad ones
};

exports.debugMessageRenderer = function(message) {
    const stillThereAnimName = "shake";
    if(!document.getElementById("debug-banner") || (document.getElementById("debug-banner") && document.getElementById("debug-banner").classList.contains("animated") && !document.getElementById("debug-banner").classList.contains(stillThereAnimName))) {
        if(document.getElementById("debug-banner")) {
            document.body.removeChild(document.getElementById("debug-banner"));
        }
        const debugDiv = document.createElement("div");
        debugDiv.id = "debug-banner";

        const debugText = document.createElement("p");
        debugText.id = "debug-text";
        debugText.innerHTML = sanitizeString(message);
        debugDiv.appendChild(debugText);

        const closeButton = document.createElement("button");
        const buttonTexts = [
            "Who cares.",
            "Go away.",
            "Shoo.",
            "Please leave.",
            "Why.",
            "Alright.",
            "Ok.",
            "Sure, man.",
            "No.",
            "Accept",
            "Oh no.",
            "What a curse.",
            "Damn.",
            "Heck.",
            "That sucks.",
            "No way José",
            "\uD83D\uDE04\uD83D\uDD2B"
        ];
        closeButton.innerHTML = buttonTexts[Math.floor(Math.random() * buttonTexts.length)];
        closeButton.addEventListener("click", function(e) {
            addAnimationToElement("slideOutUp", debugDiv, false, function() {
                document.body.removeChild(debugDiv);
            });
        });
        debugDiv.appendChild(closeButton);

        document.body.appendChild(addAnimationToElement("bounceInDown", debugDiv, false));
    }
    else {
        document.getElementById("debug-text").innerHTML = sanitizeString(message);
        addAnimationToElement(stillThereAnimName, document.getElementById("debug-banner"), false);
    }
};

exports.createContainerElement = createContainerElement;
function createContainerElement(fluid, rows) {
    const container = document.createElement("div");
    container.classList.add((fluid ? "container-fluid" : "container"));
    for (let i = 0; i < rows; i++) {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");
        container.appendChild(rowDiv);
    }
    return container;
}

exports.placeElementInContainer = placeElementInContainer;
function placeElementInContainer(parentContainer /* Pass an HTML element, or pass a string of the container element ID*/, yourElement, params /* row, col (width), insertBeforeCol (x axis-ordering), centred (bool) */) {
        const ourParams = {
            row: (params.hasOwnProperty("row") ? params.row : 0),
            col: (params.hasOwnProperty("col") ? params.col : 12),
            insertBeforeCol: (params.hasOwnProperty("insertBeforeCol") ? params.insertBeforeCol : -1),
            centred: (params.hasOwnProperty("centred") ? params.centred : false),
            deviceSize: (params.hasOwnProperty("deviceSize") ? params.deviceSize : "xs")
        };
        
        parentContainer = (typeof parentContainer == "string" ? document.getElementById(parentContainer) : parentContainer);
        
        if(ourParams.centred) {
            yourElement.classList.add("centred");
        }

        const rows = parentContainer.getElementsByClassName("row");
        if(rows.length === 0) {
            console.error("You tried putting an element into a container with no rows! You idiot!");
            return false;
        }

        ourParams.row = (ourParams.row < rows.length && ourParams.row >= 0 ? ourParams.row : 0);
        yourElement.classList.add("col-" + ourParams.deviceSize + "-" + ourParams.col, "center-block"); // sm seems to be the right size, or else there's either too much empty room, or they're too squeezed
        
        if(ourParams.insertBeforeCol < rows[ourParams.row].childNodes.length && ourParams.insertBeforeCol >= 0) {
            rows[ourParams.row].insertBefore(yourElement, rows[ourParams.row].childNodes[ourParams.insertBeforeCol]);
        }
        else {
            rows[ourParams.row].appendChild(yourElement);
        }
        return true;
};

exports.addAnimationToElement = addAnimationToElement;
function addAnimationToElement(animName, element, infinite, callback /* 1 argument with the element you gave it - not sure if it'll be needed, but eh lol */) {
    element.classList.add("animated", animName);
    if(infinite) {
        element.classList.add("infinite");
    }
    else {
        element.addEventListener("animationend", function removeAnimation() {
            element.classList.remove("animated", animName);
            element.removeEventListener("animationend", removeAnimation);
            if(typeof callback == "function") {
                callback(element);
            }
        });
    }
    return element;
};

exports.textMoveCursorToEnd = textMoveCursorToEnd;
function textMoveCursorToEnd(e) {
    // use this as your "click" event listener function
    e.target.focus();
    const value = e.target.value;
    e.target.value = "";
    e.target.value = value;
};

exports.getElementByClassAndUUID = getElementByClassAndUUID;
function getElementByClassAndUUID(className, UUID) {
    return (typeof document.getElementById(uuid) != "undefined" && document.getElementById(uuid).classList.contains(className) ? document.getElementById(uuid) : undefined);
};

exports.createCardElement = createCardElement;
function createCardElement(params /* colour: "black" or "white" | text: yep. | packName: pack name, doesnt have to be unique | pickAmount: number, will not show if its white | blank: bool, will overwrite any text | submitCallback: what function to fire when the user submits this stupid card. takes 1 argument, with cardInfo. | existingUUID: string */) {
    const ourParams = {
        colour: (params.hasOwnProperty("colour") ? params.colour : "black"),
        text: (params.hasOwnProperty("text") ? params.text : "You nutsack. There was no text content given."),
        packName: (params.hasOwnProperty("packName") ? params.packName : "The idiot pack, by Sam"),
        pickAmount: (params.hasOwnProperty("pickAmount") ? params.pickAmount : 0),
        blank: (params.hasOwnProperty("blank") ? params.blank : false),
        submitCallback: (params.hasOwnProperty("submitCallback") ? params.submitCallback : undefined),
        existingUUID: (params.hasOwnProperty("existingUUID") ? params.existingUUID : undefined)
    };

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", (ourParams.colour === "white" || ourParams.colour === "black" ? ourParams.colour : "black"));
    cardDiv.id = (typeof ourParams.existingUUID == "undefined" ? createUUID() : ourParams.existingUUID);

    let blankInputDiv;
    let textDiv;

    if (ourParams.blank === true) {
        blankInputDiv = document.createElement("textarea");
        blankInputDiv.classList.add("blank-input");
        blankInputDiv.setAttribute("placeholder", consts.underline);
        blankInputDiv.addEventListener("click", textMoveCursorToEnd);
        cardDiv.appendChild(blankInputDiv);
    }
    else {
        textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.innerHTML = sanitizeString(ourParams.text);
        cardDiv.appendChild(textDiv);
    }

    const packNameDiv = document.createElement("div");
    packNameDiv.classList.add("pack-name");
    packNameDiv.innerHTML = sanitizeString(ourParams.packName);
    cardDiv.appendChild(packNameDiv);

    let pickAmountDiv;

    if (ourParams.colour === "black" && typeof ourParams.pickAmount != "undefined" && ourParams.pickAmount > 1) {
        pickAmountDiv = document.createElement("div");
        pickAmountDiv.classList.add("pick-amount");
        pickAmountDiv.innerHTML = ourParams.pickAmount;
        cardDiv.appendChild(pickAmountDiv);
    }

    if (typeof ourParams.submitCallback == "function") {
        const submitDiv = document.createElement("div");
        submitDiv.classList.add("submit");
        submitDiv.innerHTML = "Submit";
        submitDiv.addEventListener("click", function (e) {
            ourParams.submitCallback({
                colour: ourParams.colour,
                text: (ourParams.blank ? sanitizeString(blankInputDiv.value) : sanitizeString(textDiv.innerHTML)),
                packName: sanitizeString(packNameDiv.innerHTML), // TODO: get user-set stuff for these 2
                pickAmount: (typeof pickAmountDiv != "undefined" ? pickAmountDiv.innerHTML : ourParams.pickAmount),
                blank: ourParams.blank,
                uuid: cardDiv.id,
                cardDiv: cardDiv
            });
        });
        submitDiv.style.visibility = "hidden";
        cardDiv.appendChild(submitDiv);

        const cancelDiv = document.createElement("div");
        cancelDiv.classList.add("cancel");
        cancelDiv.innerHTML = "Cancel";
        cancelDiv.addEventListener("click", function (e) {
            cardDiv.classList.remove("selected");
            addAnimationToElement("slideOutUp", submitDiv, false, function () {
                submitDiv.style.visibility = "hidden";
            });
            addAnimationToElement("slideOutDown", cancelDiv, false, function () {
                cancelDiv.style.visibility = "hidden";
            });
        });
        cancelDiv.style.visibility = "hidden";
        cardDiv.appendChild(cancelDiv);

        const clickableDiv = document.createElement("div");
        clickableDiv.classList.add("clickable");
        clickableDiv.addEventListener("click", function (e) {
            if (!cardDiv.classList.contains("selected") && submitDiv.style.visibility !== "visible" && cancelDiv.style.visibility !== "visible") {
                cardDiv.classList.add("selected");
                submitDiv.style.visibility = "visible";
                cancelDiv.style.visibility = "visible";
                addAnimationToElement("slideInDown", submitDiv, false); // You could add a callback
                addAnimationToElement("slideInUp", cancelDiv, false);
            }
        });
        cardDiv.appendChild(clickableDiv);
    }

    return cardDiv;
}

exports.getInsult = getInsult;
function getInsult() {
    return consts.insults[Math.floor(Math.random() * consts.insults.length)];
}

// Helpers for these helper functions. nice lol
exports.getCorrectPath = getCorrectPath;
function getCorrectPath(filePath) {
    // A crappy hack, will utterly fail if the user decides to put their executable somewhere deep down where this string can be found in its filepath
    return (process.execPath.search(/(?=.*node_modules)(?=.*electron)(?=.*dist)(?=.*electron)/g) !== -1 ? filePath : process.resourcesPath + "/app/" + filePath.split("./").join(""));
}

exports.splitStringAtIndex = splitStringAtIndex;
function splitStringAtIndex(message, index) {
    return {
        first: message.substring(0, index),
        second: message.substring(index)
    };
}