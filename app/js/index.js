(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");
    const Peer = require("simple-peer");
    const passport = require("passport");
    const PassportTwitterStrategy = require("passport-twitter").Strategy;
    const Twit = require("twit");

    const nahGlobal = remote.getGlobal("nah");
    const settings = nahGlobal.settings; // lazy

    let myProfile;
    let myKeys; // should be loaded discreetly
    let initialTotalRounds; // Don't change this lol

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
                        twitterConKey: null,
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

        const playAreaContainer = helper.createContainerElement(true, 2);
        playAreaContainer.classList.add("game-play-area");
        helper.placeElementInContainer(container, playAreaContainer, {
            row: 0,
            col: playAreaColWidth,
            centred: false
        });

        const chatAreaContainer = document.createElement("div");
        chatAreaContainer.classList.add("game-chat-area");
        helper.placeElementInContainer(container, chatAreaContainer, {
            row: 0,
            col: chatAreaColWidth,
            centred: false
        });
        document.body.appendChild(container);
        promptTwitterAuth();
        promptNewRound();
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
                            reconnectTimer: helper.consts.reconnectTime,
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
                            reconnectTimer: helper.consts.reconnectTime,
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

    function promptTwitterAuth() {
        if(myKeys.twitterAccTok === null || myKeys.twitterAccSec === null) {
            passport.use(new PassportTwitterStrategy({
                consumerKey: myKeys.twitterConKey || "ohNo",
                consumerSecret: myKeys.twitterConSec || "ohNOOO",
                callbackURL: "oob"
            }, (token, tokenSec, profile, done) => {
                // http://passportjs.org/docs/twitter
                helper.debugMessageRenderer(token);
            }));
            // needs express
            // passport.authenticate("twitter");
        }

    }

})();