const fs = require("fs");
const http = require("http");

const consts = {
    appName: "Nubs Against Humanity",
    appNameCamel: "nubsAgainstHumanity",
    appNamePascal: "NubsAgainstHumanity",

    resRootPath: "./app/resource/",
    resCardsPath: "./app/resource/cards/",
    resImagesPath: "../app/resource/images/", 

    profileFileName: "profile.json",
    settingsFileName: "settings.json",
    keysFileName: "keys.json",

    twitterUrl: "https://twitter.com/",

    waitTime: 1000 * 5,
    charLimit: 120,

    stateNames: {
        peerInConnection: "peer-in-connection",
        gameInProgress: "game-in-progress",
        amHost: "am-host",
        amGuest: "am-guest"
    },
    eventNames: {
        peerConnect: "peer-connect",
        peerClose: "peer-close",
        gameCommence: "game-commence",
        gameTerminate: "game-terminate"
    },
    peerDataTypes: {
        debug: "debug",
        chatMessage: "chat-message",
        response: "response" // a confirmation
    },

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
        "gas-guzzler",
        "wumbo",
        "wing-dingly fingle-bob",
        "skadouche-bag",
        "sub-human scum",
        "dried up remnant within an unsanitized toilet bowl",
        "sick pterodactyl",
        "homo sapien, sans the sapien",
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
    catch (err) {
        console.error("Encountered an error when trying to read file");
        console.error(err);
        return JSON.parse("{ \"lol\": \"you're not very good at this\" }");
    }
};

exports.JSONToFile = function (filePath, json) {
    try {
        if (typeof json == "undefined") {
            return;
        }
        fs.writeFileSync(getCorrectPath(filePath), JSON.stringify(json, null, 4));
    }
    catch (err) {
        console.error("Encountered an error when trying to write file");
        console.error(err);
    }
}

exports.fileToJSONAsync = fileToJSONAsync;
function fileToJSONAsync(filePath, callback /* Should have 1 argument, the returned parsed JSON object */, failureCallback) {
    fs.readFile(getCorrectPath(filePath), (err, data) => {
        if (err) {
            console.error("Encountered an error when trying to read file asynchronously");
            console.error(err);
            if (typeof failureCallback == "function") {
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
    fs.writeFile(getCorrectPath(filePath), JSON.stringify(json, null, 4), (err) => {
        if (err) {
            console.error("Encountered an error when trying to write file asynchronously");
            console.error(err);
            if (typeof failureCallback == "function") {
                failureCallback(err);
            }
        }
        else {
            callback();
        }
    });
};

exports.dirToFileNamesAsync = dirToFileNamesAsync;
function dirToFileNamesAsync(dirPath, callback, failureCallback) {
    fs.readdir(getCorrectPath(dirPath), (err, files) => {
        if(err) {
            console.error("Encountered an error when trying to read directory asynchronously");
            console.error(err);
            if(typeof failureCallback == "function") {
                failureCallback(err);
            }
        }
        else {
            callback(files); // array of strings with filenmes. idiot.
        }
    });
}

exports.httpGetJSON = httpGetJSON;
function httpGetJSON(url /* No http://, just example www.google.com/boots_and_cats */, callback /* Also should take 1 argument, with the parsed JSON */, failureCallback) {
    http.get({
        host: splitStringAtIndex(url, url.search("/")).first,
        path: splitStringAtIndex(url, url.search("/")).second
    }, function (res) {
        let resBody = "";
        res.on("data", function (d) {
            resBody += d;
        });
        res.on("error", function (err) {
            console.error("Encountered an error when trying to make a HTTP get");
            console.error(err);
            if (typeof failureCallback == "function") {
                failureCallback(err);
            }
        });
        res.on("end", function () {
            try {
                const parsed = JSON.parse(resBody);
                callback(parsed);
            }
            catch (err) {
                console.error("Encountered an error when trying to parse JSON");
                console.error(err);
                if (typeof failureCallback == "function") {
                    failureCallback(err);
                }
            }
        });
    });
};

exports.createUUID = createUUID;
function createUUID() {
    // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

exports.sanitizeString = sanitizeString;
function sanitizeString(message, charLimit) {
    if (typeof message == "object") {
        message = JSON.stringify(message);
    }
    if (typeof message != "object" && typeof message != "string") {
        return "Hey, someone tried to sanitize some hogwash.";
    }
    if (charLimit) {
        message.slice(0, charLimit);
    }
    return message.replace(/<(?!b|\/b|em|\/em|i|\/i|small|\/small|strong|\/strong|sub|\/sub|sup|\/sup|ins|\/ins|del|\/del|mark|\/mark|a|\/a|img|\/img|li|\/li|h|\/h|p|\/p|tt|\/tt|code|\/code|br|\/br|video|\/video|source|\/source)/g, "&lt;"); // TODO: either whitelist acceptable formatting tags, or blacklist bad ones
};

exports.debugMessageRenderer = function (message) {
    console.log("Debug message:");
    console.log(message);
    const stillThereAnimName = "shake";
    if (!document.getElementById("debug-banner") || (document.getElementById("debug-banner") && document.getElementById("debug-banner").classList.contains("animated") && !document.getElementById("debug-banner").classList.contains(stillThereAnimName))) {
        if (document.getElementById("debug-banner")) {
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
        closeButton.addEventListener("click", function (e) {
            addAnimationToElement("slideOutUp", debugDiv, false, function () {
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

    if (ourParams.centred) {
        yourElement.classList.add("centred");
    }

    const rows = parentContainer.getElementsByClassName("row");
    if (rows.length === 0) {
        console.error("You tried putting an element into a container with no rows! You idiot!");
        return false;
    }

    ourParams.row = (ourParams.row < rows.length && ourParams.row >= 0 ? ourParams.row : 0);
    yourElement.classList.add("col-" + ourParams.deviceSize + "-" + ourParams.col, "center-block"); // sm seems to be the right size, or else there's either too much empty room, or they're too squeezed

    if (ourParams.insertBeforeCol < rows[ourParams.row].childNodes.length && ourParams.insertBeforeCol >= 0) {
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
    if (infinite) {
        element.classList.add("infinite");
    }
    else {
        element.addEventListener("animationend", function removeAnimation() {
            element.classList.remove("animated", animName);
            element.removeEventListener("animationend", removeAnimation);
            if (typeof callback == "function") {
                callback(element);
            }
        });
    }
    return element;
};

exports.createFontAwesomeElement = createFontAwesomeElement;
function createFontAwesomeElement(params /* you can omit all the "fa" prefixes */) {
    const ourParams = {
        icon: (params.hasOwnProperty("icon") ? params.icon : "exclamation-triangle"),
        enlarge: (params.hasOwnProperty("enlarge") ? params.enlarge : undefined),
        spin: (params.hasOwnProperty("spin") ? params.spin : false),
        rotate: (params.hasOwnProperty("rotate") ? params.rotate : undefined),
        flip: (params.hasOwnProperty("flip") ? params.flip : undefined)
    };
    const ourIcon = document.createElement("i");
    ourIcon.classList.add("fa", "fa-" + ourParams.icon);
    if (ourParams.enlarge) {
        ourIcon.classList.add("fa-" + ourParams.enlarge);
    }
    if (ourParams.spin) {
        ourIcon.classList.add("fa-" + "spin");
    }
    if (ourParams.rotate) {
        ourIcon.classList.add("fa-" + rotate);
    }
    if (ourParams.flip) {
        ourIcon.classList.add("fa-" + (ourParams.flip === "h" ? "horizontal" : "vertical"));
    }
    return ourIcon;
}

exports.textMoveCursorToEnd = textMoveCursorToEnd;
function textMoveCursorToEnd(e) {
    // use this as your "click" event listener function
    e.target.focus();
    const value = e.target.value;
    e.target.value = "";
    e.target.value = value;
};

exports.getElementByClassAndUUID = getElementByClassAndUUID;
function getElementByClassAndUUID(className, UUID, parentElement) {
    const element = (parentElement ? parentElement : document);
    return (typeof element.getElementById(uuid) != "undefined" && element.getElementById(uuid).classList.contains(className) ? element.getElementById(uuid) : undefined);
};

exports.getElementByClassName = getElementByClassName;
function getElementByClassName(className, parentElement) {
    // I'm really lazy and i dont like having to access the first element each time. use this when you're sure you've only got one instance of your stupid class
    const element = (parentElement ? parentElement : document);
    return element.getElementsByClassName(className)[0];
};

exports.createCardElement = createCardElement;
function createCardElement(params /* colour: "black" or "white" | text: yep. | packName: pack name, doesnt have to be unique | pickAmount: number, will not show if its white | blank: bool, will overwrite any text | submitCallback: what function to fire when the user submits this stupid card. takes 1 argument, with cardInfo. | existingUUID: string */) {
    const ourParams = {
        colour: (params.hasOwnProperty("colour") ? params.colour : "black"),
        text: (params.hasOwnProperty("text") ? params.text : "You nutsack. There was no text content given."),
        packName: (params.hasOwnProperty("packName") ? params.packName : "Nubs Against Humanity"),
        pickAmount: (params.hasOwnProperty("pickAmount") ? params.pickAmount : 0),
        blank: (params.hasOwnProperty("blank") ? params.blank : false),
        submitCallback: (params.hasOwnProperty("submitCallback") ? params.submitCallback : undefined),
        existingUUID: (params.hasOwnProperty("existingUUID") ? params.existingUUID : undefined),
        promptSubmitCloses: (params.hasOwnProperty("promptSubmitCloses") ? params.promptSubmitCloses : true)
    };

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", (ourParams.colour === "white" || ourParams.colour === "black" ? ourParams.colour : "black"));
    cardDiv.id = (typeof ourParams.existingUUID == "undefined" ? createUUID() : ourParams.existingUUID);

    let blankInputElement;
    let textDiv;

    if (ourParams.blank === true) {
        blankInputElement = document.createElement("textarea");
        blankInputElement.classList.add("blank-input");
        blankInputElement.setAttribute("placeholder", consts.underline);
        blankInputElement.addEventListener("click", textMoveCursorToEnd);
        cardDiv.appendChild(blankInputElement);
    }
    else {
        textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.innerHTML = sanitizeString(ourParams.text);
        textDiv.title = "Input your stupid text";
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
                text: (ourParams.blank ? sanitizeString(blankInputElement.value) : sanitizeString(textDiv.innerHTML)),
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
        clickableDiv.title = "Submit this stupid card";
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

    if (ourParams.promptSubmitCloses) {
        cardDiv.classList.add("prompt-submit-closes");
    }

    return cardDiv;
}

exports.createPopupMenuElement = createPopupMenuElement;
function createPopupMenuElement(params) {
    const ourParams = {
        title: (params.hasOwnProperty("title") ? params.title : "Untitled Popup Menu"),
        closeCallback: (params.hasOwnProperty("closeCallback") ? params.closeCallback : undefined)
    };

    const popupMenuDiv = document.createElement("div");
    popupMenuDiv.classList.add("popup-menu");

    const closeButton = document.createElement("button");
    closeButton.classList.add("dot", "red");
    closeButton.addEventListener("click", (e) => {
        addAnimationToElement("fadeOutUpBig", popupMenuDiv, false, (element) => {
            if (typeof ourParams.closeCallback == "function") {
                ourParams.closeCallback(element);
            }
            document.body.removeChild(element);
        })
    });

    const titleP = document.createElement("p");
    titleP.classList.add("title");
    titleP.innerHTML = sanitizeString(ourParams.title);

    const popupMenuInnerDiv = document.createElement("div");
    popupMenuInnerDiv.classList.add("inner");

    popupMenuDiv.appendChild(closeButton);
    popupMenuDiv.appendChild(titleP);
    popupMenuDiv.appendChild(popupMenuInnerDiv);
    return popupMenuDiv;
}

exports.showPromptRenderer = showPromptRenderer;
function showPromptRenderer(params) {
    const ourParams = {
        parentElement: (params.hasOwnProperty("parentElement") ? params.parentElement : document.body),
        blackCard: (params.hasOwnProperty("blackCard") ? params.blackCard : createCardElement({
            colour: "black",
            text: "Hey. Tell the guy who made this that there's nothing here.",
            packName: "The 'You forgot how to do this' Pack",
            pickAmount: 1,
            blank: false,
            submitCallback: null
        })),
        whiteCards: (params.hasOwnProperty("whiteCards") ? params.whiteCards : [
            createCardElement({
                colour: "white",
                text: "Hey. Tell the guy who made this that there's nothing here.",
                packName: "The 'You forgot how to do this' Pack",
                pickAmount: 1,
                blank: true,
                submitCallback: (cardInfo) => {
                    debugMessageRenderer("Prompt. " + cardInfo.text);
                }
            })
        ]),
        closable: (params.hasOwnProperty("closable") ? params.closable : true)
    };

    const overlayDiv = document.createElement("div");
    overlayDiv.classList.add("overlay");

    const overlayContainerDiv = createContainerElement(false, 2);

    placeElementInContainer(overlayContainerDiv, ourParams.blackCard, {
        row: 0,
        col: 12,
        centred: true
    });

    for (whiteCard of ourParams.whiteCards) {
        if (whiteCard.getElementsByClassName("submit").length !== 0 && whiteCard.classList.contains("prompt-submit-closes")) {
            whiteCard.getElementsByClassName("submit")[0].addEventListener("click", removeOurPrompt);
        }
        placeElementInContainer(overlayContainerDiv, whiteCard, {
            row: 1,
            col: 12,
            centred: true
        });
    }
    overlayDiv.appendChild(overlayContainerDiv);

    if (ourParams.closable) {
        const closeButton = document.createElement("button");
        closeButton.classList.add("close-button");
        closeButton.innerHTML = "Close";
        closeButton.addEventListener("click", removeOurPrompt);
        overlayDiv.appendChild(closeButton);
    }

    function removeOurPrompt(e) {
        addAnimationToElement("fadeOutUpBig", overlayDiv, false, (element) => {
            ourParams.parentElement.removeChild(element);
        });
    }

    ourParams.parentElement.appendChild(overlayDiv);
    addAnimationToElement("fadeInDownBig", overlayDiv, false);
}

exports.getInsult = getInsult;
function getInsult() {
    return consts.insults[Math.floor(Math.random() * consts.insults.length)];
}

exports.createPeerObject = createPeerObject;
function createPeerObject(profile, connected, twitterHandle, twitterProfilePicUrl, peer) { // just so i know what's involved
    return {
        profile: profile || null,
        connected: connected || null,
        twitterHandle: twitterHandle || null,
        twitterProfilePicUrl: twitterProfilePicUrl || null,
        peer: peer || null
    };
}

exports.createPeerDataObject = createPeerDataObject;
function createPeerDataObject(type, contents) {
    return {
        type: type || consts.peerDataTypes.debug, // just the different types
        contents: contents || {} // often not plain text
    };
}

exports.StateMachine = StateMachine;
function StateMachine(logChanges) {
    const self = this;
    self.statesElement = document.createElement("div");
    self.logChanges = logChanges;

    self.set = (stateName, value) => {
        self.statesElement.setAttribute(stateName, (typeof value != "undefined" ? value : true)); // I assume you just want it to be a true value
        log();
    };

    self.remove = (stateName) => {
        self.statesElement.removeAttribute(stateName);
        log();
    };

    self.get = (stateName) => {
        return self.statesElement.getAttribute(stateName);
        log();
    };

    self.emit = (eventName, emitData) => {
        const event = new CustomEvent(eventName, { detail: emitData });
        self.statesElement.dispatchEvent(event);
        log();
    };

    self.on = (eventName, callback /* 1 argument with the event.detail */) => {
        self.statesElement.addEventListener(eventName, (e) => {
            if(typeof callback == "function") {
                callback(e.detail);
            }
        });
        log();
    };

    self.off = (eventName, callback) => {
        self.statesElement.removeEventListener(eventName, callback);
        log();
    };

    function log(message) {
        // TODO: debug log if you're really verbose
    };
}

// Helpers for these helper functions. nice lol
exports.getCorrectPath = getCorrectPath;
function getCorrectPath(filePath) {
    // A crappy hack, will utterly fail if the user decides to put their executable somewhere deep down where this string can be found in its filepath
    return (process.execPath.search(/(?=.*node_modules)(?=.*electron)(?=.*dist)(?=.*electron)/g) !== -1 ? filePath : process.resourcesPath + "/app/" + filePath.split("./").join(""));
}

exports.getTwitterURLfromHandle = getTwitterURLfromHandle;
function getTwitterURLfromHandle(handle) {
    return consts.twitterUrl + sanitizeString(handle.split("@").join(""));
}

exports.splitStringAtIndex = splitStringAtIndex;
function splitStringAtIndex(message, index) {
    return {
        first: message.substring(0, index),
        second: message.substring(index)
    };
}

exports.getStringPrefixed = getStringPrefixed;
function getStringPrefixed(prefix, message) {
    // this'll also get rid of any instances of the prefix in the substring. useful for twitter #hashtags/@handles
    return prefix + message.split(prefix).join("");
}

exports.arrayGetMatchesBySubItems = arrayGetMatchesBySubItems;
function arrayGetMatchesBySubItems(params) { // oh boy, i wonder what the big O rating for this is.
    const ourParams = {
        array: (params.hasOwnProperty("array") ? params.array : []),
        subItems: (params.hasOwnProperty("subItems") ? params.subItems : {}),
        stopAtFirstMatch: (params.hasOwnProperty("stopAtFirstMatch") ? params.stopAtFirstMatch : true),
        ignoreCaseValue: (params.hasOwnProperty("ignoreCaseValue") ? params.ignoreCaseValue : false),
        foreachCallback: (params.hasOwnProperty("foreachCallback") ? params.foreachCallback : undefined)
    };
    const subItemsToMatchCount = Object.keys(ourParams.subItems).length;
    const matches = [];
    for (arrayElement of ourParams.array) {
        let currentSubItemMatchesCount = 0;
        for (item in ourParams.subItems) {
            if (arrayElement.hasOwnProperty(item) && (ourParams.ignoreCaseValue && typeof arrayElement[item] == "string" && typeof ourParams.subItems[item] == "string" ? arrayElement[item].toLowerCase() === ourParams.subItems[item].toLowerCase() : arrayElement[item] === ourParams.subItems[item])) {
                currentSubItemMatchesCount++;
            }
            if (currentSubItemMatchesCount === subItemsToMatchCount) {
                if (typeof ourParams.foreachCallback != "function") {
                    matches.push(arrayElement);
                }
                else {
                    ourParams.foreachCallback(arrayElement);
                }
            }
            if (ourParams.stopAtFirstMatch && typeof ourParams.foreachCallback != "function") {
                return matches;
            }
        }
    }
    if (typeof ourParams.foreachCallback != "function") {
        return matches;
    }
}

exports.arrayGetMatchBySubItems = arrayGetMatchBySubItems;
function arrayGetMatchBySubItems(array, subItems, ignoreCaseValue) {
    let match;
    arrayGetMatchesBySubItems({
        array: array,
        subItems: subItems,
        stopAtFirstMatch: true,
        ignoreCaseValue: ignoreCaseValue,
        foreachCallback: (arrayElement) => {
            match = arrayElement;
        }
    });
    return match;
}

exports.arraySearchBySubItems = arraySearchBySubItems;
function arraySearchBySubItems(array, subItems, stopAtFirstMatch, ignoreCaseValue) {
    let matches = 0;
    arrayGetMatchesBySubItems({
        array: array,
        subItems: subItems,
        stopAtFirstMatch: stopAtFirstMatch,
        ignoreCaseValue: ignoreCaseValue,
        foreachCallback: (arrayElement) => {
            matches++;
        }
    });
    return matches;
}

exports.arrayRemoveBySubItems = arrayRemoveBySubItems;
function arrayRemoveBySubItems(array, subItems, stopAtFirstMatch, ignoreCaseValue) {
    arrayGetMatchesBySubItems({
        array: array,
        subItems: subItems,
        stopAtFirstMatch: stopAtFirstMatch,
        ignoreCaseValue: ignoreCaseValue,
        foreachCallback: (arrayElement) => {
            array.splice(array.indexOf(arrayElement), 1);
        }
    });
}