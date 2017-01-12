(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");

    (function init() {
        helper.fileToJSONAsync(helper.consts.resRootPath + helper.consts.profileFileName, createWelcomeScreen, (err) => {
            helper.debugMessageRenderer("Unable to read prfile!" + err);
        });
    })();
    
    function createWelcomeScreen(loadedProfile) {
        document.body.innerHTML = "";

        const container = document.createElement("div");
        container.classList.add("container");
        container.id = "welcome-screen-container";

        for(let i = 0; i < 3; i++) {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("row");
            container.appendChild(rowDiv);
        }
        document.body.appendChild(container);

        const blackCard = helper.createCardElement({
            colour: "black",
            text: (loadedProfile.nickname === null || loadedProfile.uuid === null ? "I'm a " + helper.getInsult() + ", and my name's " + helper.consts.underline + "." : "Hey there, " + loadedProfile.nickname),
            packName: "Nubs Against Humanity",
            pickAmount: 1,
            blank: false
        });

        const whiteCard = helper.createCardElement({
           colour: "white",
           text: (loadedProfile.nickname !== null && loadedProfile.uuid !== null ? loadedProfile.nickname : "I'm the nameless creature"),
           packName: "Nubs Against Humanity",
           pickAmount: 0,
           blank: (loadedProfile.nickname !== null && loadedProfile.uuid !== null ? false : true),
           submitCallback: (cardInfo) => {
               helper.debugMessageRenderer(cardInfo.text);
           }
        });

        

        helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInRightBig", blackCard, false), {
            row: 1,
            col: 12,
            centred: true
        });

        helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInLeftBig", whiteCard, false), {
            row: 2,
            col: 12,
            centred: true
        });
        


        function addCards(leftToDo) {
            if(typeof leftToDo == "undefined") {
                leftToDo = 12;
            }
            setTimeout(() => {
                if(leftToDo > 0) {
                    const cardColour = (leftToDo % 2 === 0 ? "white" : "black");
                    helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInRightBig", helper.createCardElement({
                        colour: cardColour,
                        text: "Hello ______! How <i>you</i> doin? I'm doin' good, baby! Nice to see that someone else is also as big of a cuck as I am. Niiiiiiiiiice. Eggnog.",
                        packName: "You cuck.",
                        pickAmount: 3,
                        blank: (leftToDo % 2 === 0 ? true : false),
                        submitCallback: function(cardInfo) {
                            helper.debugMessageRenderer("Hey! " + leftToDo + ", from card: " + cardInfo.text);
                        }
                    })), {
                        row: (leftToDo % 2 === 0 ? 0 : 1),
                        col: 12,
                        centred: false
                    });
                    addCards(leftToDo-1);
                }
            }, 100);
        }


    }
})();