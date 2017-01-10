(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");

    (function init() {
        let button = document.createElement("button");
        button.innerHTML = "Change settings... oddly";
        button.className = "btn btn-default";
        button.addEventListener("click", function() {
            let w = remote.getGlobal("nah").settings.width;
            let h = remote.getGlobal("nah").settings.height;

            remote.getGlobal("nah").settings.width = (w !== 1280 ? 1280 : 400);
            remote.getGlobal("nah").settings.height = (h !== 720 ? 720 : 300);

            helper.JSONToFile("./app/resource/settings.json", remote.getGlobal("nah").settings); // Oh, so the filepaths are relative to the host process... huh, i guess that's a pro and a con.
        });
        document.body.appendChild(button);

        createWelcomeScreen();
    })();
    
    function createWelcomeScreen() {
        document.body.innerHTML = "";

        const container = document.createElement("div");
        container.className = "container-fluid";
        container.innerHTML = "<div class=\"row\"></div><div class=\"row\"></div>";
        container.id = "welcome-screen-container";
        document.body.appendChild(container);

        (function addCards(leftToDo) {
            if(typeof leftToDo == "undefined") {
                leftToDo = 12;
            }
            setTimeout(() => {
                if(leftToDo > 0) {
                    const cardColour = (leftToDo % 2 === 0 ? "white" : "black");
                    helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInRightBig", createCardElement({
                        colour: cardColour,
                        text: "Hello ______! How <i>you</i> doin?",
                        packName: "You cuck.",
                        pickAmount: 3,
                        blank: true
                    })), {
                        row: (leftToDo % 2 === 0 ? 0 : 1),
                        col: 12,
                        centred: true
                    });
                    addCards(leftToDo-1);
                }
            }, 100);
        })();
    }

    function createCardElement(params /* colour: "black" or "white" | text: yep. | packName: pack name, doesnt have to be unique | pickAmount: number, will not show if its white | blank: bool, will overwrite any text | submitCallback: what function to fire when the user submits this stupid card. takes 1 argument, with cardInfo. | existingUUID: string */) {
        const ourParams = {
            colour: (params.hasOwnProperty("colour") ? params.colour : "black"),
            text: (params.hasOwnProperty("text") ? params.text : "You nutsack. There was no text content given."),
            packName: (params.hasOwnProperty("packName") ? params.packName : "The idiot pack, by Sam"),
            pickAmount: (params.hasOwnProperty("pickAmount") ? params.pickAmount : 0),
            blank: (params.hasOwnProperty("blank") ? params.blankCallback : false),
            submitCallback: (params.hasOwnProperty("submitCallback") ? params.submitCallback : undefined),
            existingUUID: (params.hasOwnProperty("existingUUID") ? params.existingUUID : undefined)
        };
        
        const card = document.createElement("div");
        card.classList.add("card", (ourParams.colour === "white" || ourParams.colour === "black" ? ourParams.colour : "black"));
        card.id = (typeof ourParams.existingUUID == "undefined" ? helper.createUUID() : ourParams.existingUUID);

        if(ourParams.blank === false) {
            const textDiv = document.createElement("div");
            textDiv.classList.add("text");
            textDiv.innerHTML = helper.sanitizeString(ourParams.text);
            card.appendChild(textDiv);
        }
        else {
            const blankInputDiv = document.createElement("textarea");
            blankInputDiv.classList.add("blank-input");
            card.appendChild(blankInputDiv);
        }

        const packNameDiv = document.createElement("div");
        packNameDiv.classList.add("pack-name");
        packNameDiv.innerHTML = helper.sanitizeString(ourParams.packName);
        card.appendChild(packNameDiv);

        if(ourParams.colour === "black" && typeof ourParams.pickAmount != "undefined" && ourParams.pickAmount > 0) {
            const pickAmountDiv = document.createElement("div");
            pickAmountDiv.classList.add("pick-amount");
            pickAmountDiv.innerHTML = "PICK " + ourParams.pickAmount;
            card.appendChild(pickAmountDiv);
        }

        return card;
    }

})();