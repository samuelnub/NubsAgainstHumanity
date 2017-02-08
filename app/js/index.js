(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");
    const SimplePeer = require("simple-peer");
    const OAuth = require("oauth").OAuth; // you know what I want? proper documentation for this
    const Twit = require("twit");
    
    const nahGlobal = remote.getGlobal("nah");
    const settings = nahGlobal.settings; // lazy

    let myProfile;
    let myKeys; // should be loaded discreetly

    let playAreaElement;
    let chatAreaElement;
    let navBarElement;

    let myTwit = {
        client: null,
        stream: null
    };
    let myPeers = []; // Don't keep a bunch of peer objects, keep an array of general objects, and nest the peer object inside. name each peer based on twitter handle, by the way
    let myInvites = []; // if you're the type of person who likes to wait for invites instead

    const myState = {
        inGame: null
    };

    (function init() {
        helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.profileFileName, (myProfileLoaded) => {
            myProfile = myProfileLoaded;

            (function loadKeysAndProgress() {
                helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.keysFileName, (myKeysLoaded) => {
                    myKeys = myKeysLoaded;

                    if (myProfile.nickname === null || myProfile.uuid === null) {
                        createScreenWelcome();
                    }
                    else {
                        createScreenGame();
                    }
                }, (err) => {
                    helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.keysFileName, {
                        twitterConKey: null, // TODO: on release builds, put the god damn consumer keys here. i dont care.
                        twitterConSec: null,
                        twitterAccTok: null,
                        twitterAccSec: null
                    }, () => {
                        loadKeysAndProgress();
                    }, (err) => {
                        helper.debugMessageRenderer("Couldn't write default keys... Uh, abandon ship. " + err);
                    });
                });
            })();
        }, (err) => {
            helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.profileFileName, {
                uuid: null,
                nickname: null,
                twitterHandle: null,
                stats: {
                    totalPoints: 0,
                    totalGames: 0
                }
            }, () => {
                init();
            }, (err) => {
                helper.debugMessageRenderer("Couldn't write default profile... You're screwed man. " + err);
            });
        });
    })();

    function createScreenWelcome() {
        document.body.innerHTML = "";

        const container = helper.createContainerElement(false, 3);

        const blackCard = helper.createCardElement({
            colour: "black",
            text: (myProfile.nickname === null || myProfile.uuid === null ? "I'm a " + helper.getInsult() + ", and they call me " + helper.consts.underline + "." : "Hey there, " + myProfile.nickname),
            packName: helper.consts.appName,
            pickAmount: 1,
            blank: false
        });

        const whiteCard = helper.createCardElement({
            colour: "white",
            text: (myProfile.nickname !== null && myProfile.uuid !== null ? "Let me in, you " + helper.getInsult() + "!" : "I'm the nameless creature"),
            packName: helper.consts.appName,
            pickAmount: 0,
            blank: (myProfile.nickname !== null && myProfile.uuid !== null ? false : true),
            submitCallback: (cardInfo) => {
                if (cardInfo.blank) {
                    myProfile.nickname = helper.sanitizeString(cardInfo.text, helper.consts.charLimit);
                    myProfile.uuid = helper.createUUID();
                    helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.profileFileName, myProfile, () => {
                        helper.addAnimationToElement("fadeOutUpBig", container, false, () => {
                            createScreenGame();
                        });
                    }, () => {
                        helper.debugMessageRenderer("Unable to write to profile.json file");
                    });
                }
                helper.addAnimationToElement("fadeOutUpBig", container, false, () => {
                    createScreenGame();
                });
            }
        });

        const welcomeHeader = document.createElement("h1");
        welcomeHeader.id = "welcome-header";
        welcomeHeader.innerHTML = (myProfile.nickname === null || myProfile.uuid === null ? "Welcome to " + helper.consts.appName : "Welcome back.");
        helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInDown", welcomeHeader, false), {
            row: 0,
            col: 12,
            centred: true
        });

        helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInRightBig", blackCard, false), {
            row: 1,
            col: 12,
            centred: true
        });

        helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInLeftBig", whiteCard, false, () => {
            if (myProfile.nickname !== null && myProfile.uuid !== null) {
                return;
            }
            setTimeout(() => {
                const clickableDiv = whiteCard.getElementsByClassName("clickable")[0];
                if (typeof clickableDiv == "undefined") {
                    return;
                }
                clickableDiv.innerHTML = "Press here to confirm. Press the top/bottom parts to input whatever hogwash you want (if it's available, of course).";
                clickableDiv.style = "background-color: var(--cah-shadow);";
                clickableDiv.addEventListener("click", function clickRemoveStyling(e) {
                    clickableDiv.innerHTML = "";
                    clickableDiv.removeAttribute("style");
                    clickableDiv.removeEventListener("click", clickRemoveStyling);
                });
            }, 1000);
        }), {
                row: 2,
                col: 12,
                centred: true
            });

        document.body.appendChild(container);
    }

    function createScreenGame() {
        document.body.innerHTML = "";

        const container = helper.createContainerElement(true, 1);

        const playAreaColWidth = 9;
        const chatAreaColWidth = 12 - playAreaColWidth;

        const playAreaDiv = helper.createContainerElement(true, 2);
        playAreaDiv.classList.add("game-play-area");
        helper.placeElementInContainer(container, playAreaDiv, {
            row: 0,
            col: playAreaColWidth,
            centred: false
        });

        const chatAreaDiv = document.createElement("div");
        chatAreaDiv.classList.add("game-chat-area");
        helper.placeElementInContainer(container, chatAreaDiv, {
            row: 0,
            col: chatAreaColWidth,
            centred: false
        });

        (function setupPlayArea() {
            // this is just the first-time-launch version. at the end when the user finishes making a new game within the popup menu, it should totally change this
            const bigNewGameButton = document.createElement("button");
            bigNewGameButton.classList.add("big-new-game-button");
            bigNewGameButton.appendChild(helper.createFontAwesomeElement({
                icon: "plus",
                enlarge: "5x"
            }));
            bigNewGameButton.addEventListener("click", (e) => {
                showNewGamePopupMenu();
            });
            bigNewGameButton.title = "Create a new game";
            playAreaDiv.appendChild(bigNewGameButton);

            playAreaElement = playAreaDiv;
        })();

        (function setupChatArea() {
            const chatMessagesDiv = document.createElement("div");
            chatMessagesDiv.classList.add("chat-messages");

            const chatBoxTextarea = document.createElement("textarea");
            chatBoxTextarea.classList.add("chat-box");
            chatBoxTextarea.placeholder = "Type your stupid message here";

            const chatSubmitButton = document.createElement("button");
            chatSubmitButton.classList.add("chat-submit");
            chatSubmitButton.title = "Send your stupid message";
            chatSubmitButton.appendChild(helper.createFontAwesomeElement({
                icon: "arrow-right",
                enlarge: "2x"
            })); // that's pretty awesome
            chatSubmitButton.addEventListener("click", (e) => {
                // should make this a seperate function so it can be called whenever y'need it
                // TODO: sending messages should do a whole lot more than just dumping it in the messages list
                if (chatBoxTextarea.value === "") {
                    return;
                }
                const messageCharLimit = 420; // ha ha look it's the weed number
                if (chatBoxTextarea.value.length > messageCharLimit) {
                    helper.debugMessageRenderer("Your message was too long. Sorry man. Being too well-endowed has its tradeoffs.");
                    return;
                }
                const chatMessageDiv = document.createElement("div");

                chatMessageDiv.classList.add("chat-message");
                chatMessageDiv.innerHTML = helper.sanitizeString(chatBoxTextarea.value, messageCharLimit);
                chatBoxTextarea.value = "";
                chatMessagesDiv.appendChild(chatMessageDiv);
            });

            chatAreaDiv.appendChild(chatMessagesDiv);
            chatAreaDiv.appendChild(chatBoxTextarea);
            chatAreaDiv.appendChild(chatSubmitButton);

            chatAreaElement = chatAreaDiv;
        })();

        (function setupNavBar() {
            let navBarCurrentlyRevealed = true;
            const navBarDiv = document.createElement("div");
            navBarDiv.classList.add("nav-bar");

            const navBarTogglerButton = document.createElement("button");
            navBarTogglerButton.classList.add("toggler");
            navBarTogglerButton.appendChild(helper.createFontAwesomeElement({
                icon: "bars",
                enlarge: "2x"
            }));
            navBarTogglerButton.addEventListener("click", (e) => {
                if (navBarCurrentlyRevealed) {
                    helper.addAnimationToElement("slideOutLeft", navBarDiv, false, () => {
                        navBarDiv.classList.add("stowed");
                    });
                }
                else {
                    navBarDiv.classList.remove("stowed");
                    helper.addAnimationToElement("slideInLeft", navBarDiv, false, () => {

                    });
                }
                navBarCurrentlyRevealed = !navBarCurrentlyRevealed;
            });

            const navBarInnerDiv = document.createElement("div");
            navBarInnerDiv.classList.add("inner");

            let clickedTimes = 0;
            let clickedCycles = 0;
            const appNameHeader = document.createElement("h3");
            appNameHeader.classList.add("app-name"); // in case you wanna do stuff. idk. this is probably just a one time thing.
            appNameHeader.innerHTML = helper.consts.appName;
            appNameHeader.style.position = "relative";
            appNameHeader.style.padding = "var(--cah-small-length)";
            appNameHeader.style.paddingBottom = "calc(var(--cah-small-length) * 4)"
            appNameHeader.style.userSelect = "none";
            appNameHeader.style.cursor = "default";
            appNameHeader.addEventListener("click", (e) => {
                clickedTimes++;
                if (clickedTimes > 10) {
                    clickedTimes = 0;
                    clickedCycles++;
                    if (clickedCycles === 5) {
                        appNameHeader.innerHTML = helper.consts.appName + " ಠ_ಠ";
                    }
                    helper.addAnimationToElement("tada", appNameHeader, false);
                }

            });

            navBarInnerDiv.appendChild(appNameHeader);

            addButtonToNavBar("New game", showNewGamePopupMenu);
            addButtonToNavBar("Join game", showJoinGamePopupMenu);

            function addButtonToNavBar(text, callback) {
                const button = document.createElement("button");
                // button.classList.add(); // if you need it
                button.innerHTML = text;
                button.addEventListener("click", (e) => {
                    callback();
                });
                navBarInnerDiv.appendChild(button);
            }

            navBarDiv.appendChild(navBarTogglerButton);
            navBarDiv.appendChild(navBarInnerDiv);
            document.body.appendChild(navBarDiv);
            navBarElement = navBarDiv;
        })();

        function showNewGamePopupMenu() {
            const minOtherPeers = 1; // should be two for a regular game, but i don't have friends. im sorry
            const myPeersTemp = [];
            let canAdd = true; // we don't want too many dupes
            const popupMenuElement = helper.createPopupMenuElement({
                title: "Create New Game", 
                closeCallback: (element) => {
                    for (tempPeer of myPeersTemp) {
                        helper.arrayRemoveBySubItems(myPeers, {
                            twitterHandle: tempPeer.twitterHandle,
                            inGame: false,
                        }, false, true);
                    }
                }
            });
            const innerDiv = helper.getElementByClassName("inner", popupMenuElement);

            const twitterHandlesDiv = document.createElement("div");
            twitterHandlesDiv.classList.add("twitter-handles");

            const gameCommenceButton = document.createElement("button");
            gameCommenceButton.classList.add("game-commence");
            gameCommenceButton.disabled = (myPeersTemp.length < minOtherPeers ? true : false);
            gameCommenceButton.innerHTML = "Commence";
            gameCommenceButton.addEventListener("click", (e) => {
                gameCommenceButton.disabled = true;
                for (peerTemp of myPeersTemp) {
                    connectPeerViaTwitterAndAdd(peerTemp, () => {
                        if (myPeersTemp.indexOf(peerTemp) === myPeersTemp.length - 1) {
                            gameCommenceButton.disabled = (myPeersTemp.length < minOtherPeers ? true : false);
                        }
                    });
                }
            });

            const twitterHandleInput = document.createElement("input");
            twitterHandleInput.type = "text";
            twitterHandleInput.placeholder = "Twitter @handle to invite";
            twitterHandleInput.addEventListener("keyup", (e) => {
                if (e.which !== 13) {
                    return;
                }
                if (twitterHandleInput.value === "") {
                    return;
                }
                (function addTwitterHandleToList() {
                    if (!canAdd) {
                        return;
                    }
                    if (myPeersTemp.length >= 10) { // TODO: make it a user-settable limit
                        helper.debugMessageRenderer("You sure? Adding over 10 people ain't the brightest idea. It might require <i>more social interaction</i>");
                        return;
                    }
                    const handleText = twitterHandleInput.value.split("@").join("");
                    const peerToConsider = {
                        twitterHandle: handleText,
                        inGame: false
                    };
                    if (handleText.toLowerCase() === myProfile.twitterHandle.toLowerCase()) {
                        helper.debugMessageRenderer("You uh... can't add yourself. Sorry man.");
                        return;
                    }
                    if (helper.arraySearchBySubItems(myPeersTemp, peerToConsider, true, true)) {
                        // already exists, no dupes
                        return;
                    }
                    const twitterHandleDiv = document.createElement("div");
                    twitterHandleDiv.classList.add("twitter-handle");

                    const handleNameText = document.createElement("p");
                    handleNameText.classList.add("handle-name");
                    handleNameText.innerHTML = "@" + handleText;

                    const profilePicImg = document.createElement("img");
                    profilePicImg.classList.add("profile-pic", "add-backdrop");

                    try {
                        canAdd = false;
                        myTwit.client.get("users/show", { screen_name: handleText }, (err, data, res) => {
                            if (err) {
                                profilePicImg.src = helper.consts.resImagesPath + "question-mark.png";
                                profilePicImg.title = "Unknown handle";
                            }
                            else {
                                profilePicImg.src = data.profile_image_url;
                                profilePicImg.addEventListener("click", (e) => {
                                    remote.shell.openExternal(helper.consts.twitterUrl + handleText);
                                });

                                myTwit.client.get("friendships/show", { source_screen_name: myProfile.twitterHandle, target_screen_name: handleText }, (err, data, res) => {
                                    if (err) {
                                        throw "Trouble getting your relationship between you and " + handleText;
                                    }
                                    else if (data.relationship.source.can_dm && data.relationship.source.followed_by && data.relationship.source.following /* so they can DM me back */) {
                                        if (helper.arraySearchBySubItems(myPeersTemp, peerToConsider, true, true) === 0) { // at this point, we're async, so there might be an entry already
                                            myPeersTemp.push(peerToConsider);
                                            gameCommenceButton.disabled = (myPeersTemp.length < minOtherPeers ? true : false);
                                        }
                                    }
                                    else {
                                        const warningLink = document.createElement("a");
                                        warningLink.classList.add("unstyle");
                                        warningLink.appendChild(helper.createFontAwesomeElement({
                                            icon: "exclamation",
                                            enlarge: "2x"
                                        }));
                                        warningLink.title = "You two are not following each other! You/they probably won't be able to receive direct messages";
                                        warningLink.addEventListener("click", (e) => {
                                            remote.shell.openExternal(helper.consts.twitterUrl + handleText);
                                        });
                                        twitterHandleDiv.appendChild(warningLink);
                                    }
                                    canAdd = true; // petty semaphore
                                });
                            }
                            twitterHandleDiv.appendChild(profilePicImg);
                        });
                    }
                    catch (err) {
                        helper.debugMessageRenderer("Couldn't make Twitter API calls! " + err);
                    }

                    const removeButton = document.createElement("button");
                    removeButton.classList.add("unstyle");
                    removeButton.appendChild(helper.createFontAwesomeElement({
                        icon: "times", // y'know, like, times, the multiplication sign. In case you were confused
                        enlarge: "2x"
                    }));
                    removeButton.addEventListener("click", (e) => {
                        helper.arrayRemoveBySubItems(myPeersTemp, peerToConsider, true, true);
                        gameCommenceButton.disabled = (myPeersTemp.length < minOtherPeers ? true : false);
                        twitterHandlesDiv.removeChild(twitterHandleDiv);
                    });

                    twitterHandleDiv.appendChild(handleNameText);
                    twitterHandleDiv.appendChild(removeButton);

                    twitterHandlesDiv.appendChild(twitterHandleDiv);
                })();
            });

            innerDiv.appendChild(twitterHandleInput);
            innerDiv.appendChild(twitterHandlesDiv);
            innerDiv.appendChild(gameCommenceButton);

            document.body.appendChild(helper.addAnimationToElement("fadeInDown", popupMenuElement, false));
        }

        function showJoinGamePopupMenu() {
            helper.debugMessageRenderer("hey, TODO");
            let setIntervalId;
            const popupMenuElement = helper.createPopupMenuElement({
                title: "Join game",
                closeCallback: (element) => {
                    clearInterval(setIntervalId);
                }
            });
            const innerDiv = helper.getElementByClassName("inner", popupMenuElement);

            const twitterHandlesDiv = document.createElement("div");
            twitterHandlesDiv.classList.add("twitter-handles");

            const intervalTime = helper.consts.waitTime * 2;
            setIntervalId = setInterval(showInvites, intervalTime);
            let myInvitesTemp = myInvites.slice(0);
            showInvites();
            function showInvites() {
                if(JSON.stringify(myInvitesTemp) === JSON.stringify(myInvites)) {
                    return; // currently my cheap method for comparing arrays/anything at all
                }
                myInvitesTemp = myInvites.slice(0);
                for(invite of myInvitesTemp) {
                    const twitterHandleDiv = document.createElement("div");
                    twitterHandleDiv.classList.add("twitter-handle");

                    const handleNameText = document.createElement("p");
                    handleNameText.classList.add("handle-name");
                    handleNameText.innerHTML = invite.profile.twitterHandle;


                    // TODO
                }
            }

            document.body.appendChild(helper.addAnimationToElement("fadeInDown", popupMenuElement, false));
        }

        document.body.appendChild(container);
        setupTwitter(false);
    }

    function connectPeerViaTwitterAndAdd(peer, callback) {
        try {
            const myPeer = new SimplePeer({
                initiator: true,
                trickle: false,
                reconnectTimer: helper.consts.reconnectTimer
            });
            myPeer.on("signal", (signalData) => {
                const myMessage = JSON.stringify({
                    appName: helper.consts.appName, // just so i know.
                    profile: myProfile,
                    isHost: true,
                    signalData: signalData
                });
                myTwit.client.post("direct_messages/new", { screen_name: peer.twitterHandle, text: myMessage }, (err, data, res) => {
                    if (err) {
                        helper.debugMessageRenderer("Couldn't direct message " + peer.twitterHandle + ", " + err);
                    }
                    else {
                        console.log(data);
                        // if errorless, wait for the other guy's stream to accept it, generate a response signal and send it back, then we can negotiate a connection and we both can add our peer objects to the myPeers array
                        // TODO: for now, let's just call the callback.
                        // The recepient should delete this DM from their side when they receive it and process it, and you should do the same to theirs
                        if (typeof callback == "function") {
                            callback(/* could have stuff passed in. will flesh out */);
                        }
                    }
                });
            });
        }
        catch (err) {
            helper.debugMessageRenderer("Error trying to connect with peer. " + err);
        }
    }

    function setupReceiverTwitterStream() {
        try {
            myTwit.stream.on("direct_message", (message) => {
                if(message.direct_message.text.search(helper.consts.appName) === -1) {
                    return;
                }
                else {
                    let textParsed;
                    try {
                        textParsed = JSON.parse(message.direct_message.text);
                    }
                    catch (err) {
                        console.log("got a dm containing our app name... but we can't parse it. it's either someone saying it, or the json's corrupted lol");
                    }
                    if(!textParsed.hasOwnProperty("appName") || !textParsed.hasOwnProperty("profile") || !textParsed.hasOwnProperty("isHost") || !textParsed.hasOwnProperty("signalData")) {
                        return;
                    }
                    else {
                        if(textParsed.isHost === true) {
                            // they invited you. store it in the invites array and generate a response when the user opens up the "join game" menu and selects it
                            myInvites.push(textParsed);
                            console.log(myInvites);
                            const inviteExpiryTime = 1000 * 60 * 5;
                            setTimeout(() => {
                                myInvites.splice(myInvites.indexOf(textParsed), 1);
                            }, inviteExpiryTime);
                        }
                        else if(textParsed.isHost === false) {
                            // they heard your invite and this is their response, connect automatically
                            const peer = helper.arrayGetMatchBySubItems(myPeers, { twitterHandle: textParsed.profile.twitterHandle }, true);
                            peer.signal(textParsed.signalData);
                            peer.on("connect", () => {
                                helper.debugMessageRenderer("Wowzers, just connected with " + textParsed.profile.twitterHandle);
                                // TODO: a whole lot more
                            });
                        }
                        else {
                            return;
                        }
                    }
                }
            });
        }
        catch (err) {
            helper.debugMessageRenderer("Error receiving invites! " + err);
        }
    }

    function setupTwitter(force) {
        try {
            if (myKeys.twitterConKey === null || myKeys.twitterConSec === null) {
                helper.debugMessageRenderer("Hey. This app's Twitter consumer keys are missing. Shoot.");
                return;
            }
            const twitterApiUrl = "https://api.twitter.com/";
            const oauth = new OAuth(
                twitterApiUrl + "oauth/request_token",
                twitterApiUrl + "oauth/access_token",
                myKeys.twitterConKey,
                myKeys.twitterConSec,
                "1.0",
                "oob",
                "HMAC-SHA1"
            );
            if ((myKeys.twitterAccTok !== null || myKeys.twitterAccSec !== null) && !force) {
                // we've already got our user auth
                oauth.get(
                    twitterApiUrl + "/1.1/account/verify_credentials.json",
                    myKeys.twitterAccTok,
                    myKeys.twitterAccSec,
                    (err, data, res) => {
                        if (err) {
                            // yea, we've got the access tokens, but they're not valid.
                            myKeys.twitterAccTok = null;
                            myKeys.twitterAccSec = null;
                            helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.keysFileName, myKeys, (err) => {
                                setupTwit();
                            }, (err) => {
                                helper.debugMessageRenderer("Couldn't write to keys file. " + err);
                            });
                        }
                        else {
                            console.log("Hey, tell Sam not to prompt this sign-in bahooga when you're already signed in. Sorry man.");
                            setupTwit(force);
                            return;
                        }
                    });
            }
            else {
                // http://stackoverflow.com/questions/12873463/how-to-send-the-oauth-request-in-node
                // hello yes i would like to order a triple deluxue variable name
                (function getRequestTokenAndThenDoTheRestOfThePrompt() {
                    oauth.getOAuthRequestToken((err, oauthTok, oauthSec, res) => {
                        console.log(err);
                        console.log(oauthTok);
                        console.log(oauthSec);
                        let twitterReqKey = oauthTok;
                        let twitterReqSec = oauthSec;

                        // open a window with twitter authenticate page 'round here
                        let twitterSignInWindow = new remote.BrowserWindow({ width: Math.ceil(settings.width / 2), height: Math.ceil(settings.height / 1.5) });
                        twitterSignInWindow.on("closed", () => {
                            twitterSignInWindow = null;
                        });
                        twitterSignInWindow.loadURL(twitterApiUrl + "oauth/authenticate" + "?" + "oauth_token=" + twitterReqKey);

                        helper.showPromptRenderer({
                            blackCard: helper.createCardElement({
                                colour: "black",
                                text: "Sign in with Twitter. Enter the PIN you get into the white card below!"
                            }),
                            whiteCards: [
                                helper.createCardElement({
                                    colour: "white",
                                    blank: true,
                                    submitCallback: (cardInfo) => {
                                        oauth.getOAuthAccessToken(twitterReqKey, twitterReqSec, cardInfo.text, (err, oauthTok, oauthSec, res) => {
                                            console.log("---Got the (or tried to) access token:---");
                                            if (err) {
                                                helper.debugMessageRenderer("An error occurred when trying to authorize with twitter! " + helper.sanitizeString(err));
                                                setTimeout(setupTwitter, helper.consts.waitTime);
                                            }
                                            else {
                                                myKeys.twitterAccTok = oauthTok;
                                                myKeys.twitterAccSec = oauthSec;
                                                helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.keysFileName, myKeys, () => {
                                                    console.log("hell yea, got the keys!");
                                                    twitterSignInWindow.close();
                                                    setupTwit(force);
                                                }, (err) => {
                                                    helper.debugMessageRenderer("Couldn't write keys to file, reattempting sign in... " + err);
                                                    setTimeout(setupTwitter, helper.consts.waitTime);
                                                });
                                            }
                                        });
                                    }
                                })
                            ],
                            closable: !force
                        });
                    });
                })();
            }

            function setupTwit(force) {
                if ((myTwit.client !== null || myTwit.stream !== null) && !force) {
                    return;
                }
                myTwit.client = new Twit({
                    consumer_key: myKeys.twitterConKey,
                    consumer_secret: myKeys.twitterConSec,
                    access_token: myKeys.twitterAccTok,
                    access_token_secret: myKeys.twitterAccSec,
                    timeout_ms: helper.consts.reconnectTimer 
                });

                myTwit.stream = myTwit.client.stream("user", { track: "#" + helper.consts.appNamePascal });
                myTwit.stream.on("limit", (limitMsg) => {
                    helper.debugMessageRenderer("Woah there nelly! Twitter doesn't like the number of requests we're sending them! " + limitMsg);
                });
                myTwit.stream.on("connected", (res) => {
                    console.log("Connected to twitter stream! " + res);
                });
                myTwit.stream.on("reconnect", (req, res, conInterval) => {
                    console.log("Attempting to reconnect to Twitter... with reconnect time of: " + conInterval);
                });
                myTwit.stream.on("warning", (warning) => {
                    helper.debugMessageRenderer("Oh boy! Your internet connection's getting choppy, according to Twitter. " + warning);
                });
                myTwit.client.get("account/verify_credentials", { skip_status: true }, (err, data, res) => {
                    if (err) {
                        helper.debugMessageRenderer("Couldn't get our own Twitter profile " + err);
                    }
                    myProfile.twitterHandle = data.screen_name;
                    console.log(myProfile.twitterHandle);
                });
                (function otherStreamListeners() {
                    setupReceiverTwitterStream(); // TODO
                })();
            }
        }
        catch (err) {
            helper.debugMessageRenderer("Error when trying to setup Twitter stuff: " + err);
        }
        // hey, it works lmao
    }

    window.onbeforeunload = (e) => { // save up boyz
        helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.profileFileName, myProfile, () => {
            // hell yea
        }, (err) => {
        });
        helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.settingsFileName, settings, () => {
            // yip
        }, (err) => {
        });
    }
})();