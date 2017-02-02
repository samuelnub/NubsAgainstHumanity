(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");
    const Peer = require("simple-peer");
    const OAuth = require("oauth").OAuth; // you know what I want? proper documentation for this
    const Twit = require("twit");

    const nahGlobal = remote.getGlobal("nah");
    const settings = nahGlobal.settings; // lazy

    let myProfile;
    let myKeys; // should be loaded discreetly
    let initialTotalRounds; // Don't change this lol

    let playAreaElement;
    let chatAreaElement;
    let navBarElement;

    let myPeers = [];
    let myTwit;

    (function init() {
        helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.profileFileName, (myProfileLoaded) => {
            myProfile = myProfileLoaded
            initialTotalRounds = myProfile.stats.totalRounds;

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
                    totalRounds: 0
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
            packName: "Nubs Against Humanity",
            pickAmount: 1,
            blank: false
        });

        const whiteCard = helper.createCardElement({
            colour: "white",
            text: (myProfile.nickname !== null && myProfile.uuid !== null ? "Let me in, you " + helper.getInsult() + "!" : "I'm the nameless creature"),
            packName: "Nubs Against Humanity",
            pickAmount: 0,
            blank: (myProfile.nickname !== null && myProfile.uuid !== null ? false : true),
            submitCallback: (cardInfo) => {
                if (cardInfo.blank) {
                    myProfile.nickname = cardInfo.text;
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
        welcomeHeader.innerHTML = (myProfile.nickname === null || myProfile.uuid === null ? "Welcome to Hell." : "Welcome back.");
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
                if(chatBoxTextarea.value == "") {
                    return;
                }
                const messageCharLimit = 420; // ha ha look it's the weed number
                if(chatBoxTextarea.value.length > messageCharLimit) {
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
                if(navBarCurrentlyRevealed) {
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
            appNameHeader.innerHTML = helper.consts.appName + "<hr>";
            appNameHeader.style.padding = "var(--cah-small-length)";
            appNameHeader.style.userSelect = "none";
            appNameHeader.style.cursor = "default";
            appNameHeader.addEventListener("click", (e) => {
                clickedTimes++;
                if(clickedTimes > 10) {
                    clickedTimes = 0;
                    clickedCycles++;
                    if(clickedCycles === 5) {
                        appNameHeader.innerHTML = helper.consts.appName + " ಠ_ಠ" + "<hr>";
                    }
                    helper.addAnimationToElement("tada", appNameHeader, false);
                }

            });

            navBarInnerDiv.appendChild(appNameHeader);

            navBarDiv.appendChild(navBarTogglerButton);
            navBarDiv.appendChild(navBarInnerDiv);
            document.body.appendChild(navBarDiv);
            navBarElement = navBarDiv;
        })();




        document.body.appendChild(container);
        promptTwitterAuth(false);
        document.body.appendChild(helper.createPopupMenuElement());
    }

    function promptNewRound() {
        const ourWhiteCards = [
            helper.createCardElement({
                colour: "white",
                text: "Host a new match.",
                submitCallback: (cardInfo) => {
                    (function hostNewMatch() {
                        clearPeers();

                        const initialPeer = new Peer({
                            initiator: true,
                            reconnectTimer: helper.consts.timeoutTime,
                            trickle: false
                        });
                        myPeers.push(initialPeer);

                        const myIdCard = helper.createCardElement({
                            colour: "white",
                            blank: true
                        });

                        const theirIdCard = helper.createCardElement({
                            colour: "white",
                            blank: true,
                            submitCallback: (cardInfo) => {
                                try {
                                    initialPeer.signal(cardInfo.text);
                                }
                                catch (err) {
                                    helper.debugMessageRenderer("Error when trying to signal peer: " + err);
                                }
                            }
                        });

                        initialPeer.on("signal", (data) => {
                            myIdCard.getElementsByClassName("blank-input")[0].value = JSON.stringify(data); // This function is just beautiful.
                            myIdCard.getElementsByClassName("blank-input")[0].focus();
                            myIdCard.getElementsByClassName("blank-input")[0].select();
                        });

                        initialPeer.on("connect", () => {
                            helper.debugMessageRenderer("You; the initiator, have successfully connected to your peer. Congrats.");
                        });

                        helper.showPromptRenderer({
                            blackCard: helper.createCardElement({
                                colour: "black",
                                text: "Grab your ID from the top white card, and then paste your buddy's ID in the bottom one, then submit!"
                            }),
                            whiteCards: [
                                myIdCard,
                                theirIdCard
                            ]
                        });


                    })();
                }
            }),
            helper.createCardElement({
                colour: "white",
                text: "Join some other friend's match.",
                submitCallback: (cardInfo) => {
                    (function joinOtherMatch() {
                        clearPeers();
                        const joiningPeer = new Peer({
                            initiator: false,
                            reconnectTimer: helper.consts.timeoutTime,
                            trickle: false
                        });
                        myPeers.push(joiningPeer);

                        const theirIdCard = helper.createCardElement({
                            colour: "white",
                            blank: true,
                            submitCallback: (cardInfo) => {
                                try {
                                    joiningPeer.signal(cardInfo.text);
                                }
                                catch (err) {
                                    helper.debugMessageRenderer("Error when trying to signal peer: " + err);
                                }
                            },
                            promptSubmitCloses: false
                        });

                        const myIdCard = helper.createCardElement({
                            colour: "white",
                            blank: true
                        });

                        joiningPeer.on("signal", (data) => {
                            myIdCard.getElementsByClassName("blank-input")[0].value = JSON.stringify(data);
                            myIdCard.getElementsByClassName("blank-input")[0].focus();
                            myIdCard.getElementsByClassName("blank-input")[0].select();
                        });

                        joiningPeer.on("connect", () => {
                            helper.debugMessageRenderer("You have successfully connected to your peer. Congrats.");
                        });

                        helper.showPromptRenderer({
                            blackCard: helper.createCardElement({
                                colour: "black",
                                text: "Your buddy should've passed you their ID, paste it into the top one, submit, and then copy your generated one and give it to them!"
                            }),
                            whiteCards: [
                                theirIdCard,
                                myIdCard
                            ]
                        });

                    })();
                }
            })
        ];

        if (myProfile.stats.totalRounds - initialTotalRounds > 0) {
            ourWhiteCards.push(helper.createCardElement({
                colour: "white",
                text: "Restart this match. I like these guys (or I was forced against my will to replay with them).",
                submitCallback: (cardInfo) => {
                    (function restartMatch() {

                    })();
                }
            }));
        }

        function clearPeers() {
            myPeers.splice(0, myPeers.length);
        }

        helper.showPromptRenderer({
            parentElement: document.body,
            blackCard: helper.createCardElement({
                colour: "black",
                text: "Alright, you " + helper.getInsult() + ", what do you want to do now?"
            }),
            whiteCards: ourWhiteCards
        });
    }

    function promptTwitterAuth(force) {
        try {
            if(myKeys.twitterConKey === null || myKeys.twitterConSec === null) {
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
            if (myKeys.twitterAccTok !== null && myKeys.twitterAccSec !== null && !force) {
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
                                promptTwitterAuth();
                            }, (err) => {
                                helper.debugMessageRenderer("Couldn't write to keys file. " + err);
                            });
                        }
                        else {
                            console.log("Hey, tell Sam not to prompt this sign-in bahooga when you're already signed in. Sorry man.");
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
                                                setTimeout(promptTwitterAuth, helper.consts.timeoutTime);
                                            }
                                            else {
                                                myKeys.twitterAccTok = oauthTok;
                                                myKeys.twitterAccSec = oauthSec;
                                                helper.JSONToFileAsync(helper.consts.resRootPath + helper.consts.keysFileName, myKeys, () => {
                                                    console.log("hell yea, got the keys!");
                                                    twitterSignInWindow.close();
                                                }, (err) => {
                                                    helper.debugMessageRenderer("Couldn't write keys to file, reattempting sign in... " + err);
                                                    setTimeout(promptTwitterAuth, helper.consts.timeoutTime);
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
        }
        catch (err) {
            helper.debugMessageRenderer("Error when trying to authenticate you with Twitter: " + err);
        }
        // hey, it works lmao
    }



})();