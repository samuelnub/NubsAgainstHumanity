(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");
    const Peer = require("peerjs");
    const PeerServer = require("peer").PeerServer;

    const nahGlobal = remote.getGlobal("nah");

    let peerServer;

    let myProfile;
    let initialTotalRounds;

    (function init() {
        helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.profileFileName, (myProfileLoaded) => {
            myProfile = myProfileLoaded
            initialTotalRounds = myProfile.stats.totalRounds;
            if (myProfile.nickname === null || myProfile.uuid === null) {
                createScreenWelcome();
            }
            else {
                createScreenGame();
            }
        }, (err) => {
            helper.debugMessageRenderer("Unable to read prfile!" + err);
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

        promptNewRound();
        /*
        (function initPeerServer() {
            if (!peerServer) { // TODO: maybe just overwrite it either way.
                peerServer = PeerServer({
                    port: (typeof nahGlobal.settings.defaultPort != "undefined" ? nahGlobal.settings.defaultPort : 9000),
                    path: (typeof nahGlobal.settings.defaultPath != "undefined" ? nahGlobal.settings.defaultPath : "/nah"),
                    proxied: (typeof nahGlobal.settings.proxied != "undefined" ? nahGlobal.settings.proxied : false),
                    debug: true
                });
            }

            peerServer.on("connection", function (id) {
                helper.debugMessageRenderer(id + " has connected lol");
            });
            peerServer.on("disconnect", function (id) {
                helper.debugMessageRenderer(id + " has disconnected :(");
            });
        })();



        const peer = new Peer("", {
            host: "192.168.0.12",
            port: nahGlobal.settings.defaultPort,
            path: "/nah",
            debug: 3
        });
        // oh hey. at this point it works lol*/
    }

    function promptNewRound() {
        const ourWhiteCards = [
            helper.createCardElement({
                colour: "white",
                text: "Host a new match.",
                submitCallback: (cardInfo) => {
                    
                }
            }),
            helper.createCardElement({
                colour: "white",
                text: "Join some other friend's match.",
                submitCallback: (cardInfo) => {

                }
            })
        ];

        if(myProfile.stats.totalRounds - initialTotalRounds > 0) {
            ourWhiteCards.push(helper.createCardElement({
                colour: "white",
                text: "Restart this match. I like these guys (or I was forced against my will to replay with them).",
                submitCallback: (cardInfo) => {

                }
            }));
        }

        helper.showPromptRenderer({
            parentElement: document.body,
            blackCard: helper.createCardElement({
                colour: "black",
                text: "Alright, " + helper.getInsult() + ", what do you want to do now?"
            }),
            whiteCards: ourWhiteCards
        });
    }
})();