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
                        text: "Hello ______! How <i>you</i> doin? I'm doin' good, baby! Nice to see that someone else is also as big of a cuck as I am. Niiiiiiiiiice. Eggnog.",
                        packName: "You cuck.",
                        pickAmount: 3,
                        blank: true,
                        submitCallback: function() {
                            console.log("hi!");
                        }
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
            blank: (params.hasOwnProperty("blank") ? params.blank : false),
            submitCallback: (params.hasOwnProperty("submitCallback") ? params.submitCallback : undefined),
            existingUUID: (params.hasOwnProperty("existingUUID") ? params.existingUUID : undefined)
        };
        
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card", (ourParams.colour === "white" || ourParams.colour === "black" ? ourParams.colour : "black"));
        cardDiv.id = (typeof ourParams.existingUUID == "undefined" ? helper.createUUID() : ourParams.existingUUID);

        let blankInputDiv;
        let textDiv;

        if(ourParams.blank === true) {
            blankInputDiv = document.createElement("textarea");
            blankInputDiv.classList.add("blank-input");
            blankInputDiv.setAttribute("placeholder", "________");
            cardDiv.appendChild(blankInputDiv);
        }
        else {
            textDiv = document.createElement("div");
            textDiv.classList.add("text");
            textDiv.innerHTML = helper.sanitizeString(ourParams.text);
            cardDiv.appendChild(textDiv);
        }

        const packNameDiv = document.createElement("div");
        packNameDiv.classList.add("pack-name");
        packNameDiv.innerHTML = helper.sanitizeString(ourParams.packName);
        cardDiv.appendChild(packNameDiv);

        let pickAmountDiv;

        if(ourParams.colour === "black" && typeof ourParams.pickAmount != "undefined" && ourParams.pickAmount > 0) {
            pickAmountDiv = document.createElement("div");
            pickAmountDiv.classList.add("pick-amount");
            pickAmountDiv.innerHTML = ourParams.pickAmount;
            cardDiv.appendChild(pickAmountDiv);
        }

        if(typeof ourParams.submitCallback == "function") {
            const overlayDiv = document.createElement("div");
            overlayDiv.classList.add("overlay");

            const submitButton = document.createElement("button");
            submitButton.classList.add("submit");
            submitButton.innerHTML = "Submit";
            submitButton.addEventListener("click", function (e) {
                ourParams.submitCallback({
                    colour: ourParams.colour,
                    text: (ourParams.blank ? blankInputDiv.value : textDiv.innerHTML),
                    packName: packNameDiv.innerHTML, // TODO: get user-set stuff for these 2
                    pickAmount: (typeof pickAmountDiv != "undefined" ? pickAmountDiv.innerHTML : ourParams.pickAmount),
                    blank: ourParams.blank,
                    uuid: cardDiv.id,
                    cardDiv: cardDiv
                });
            });
            overlayDiv.appendChild(submitButton);
            overlayDiv.addEventListener("click", function (e) {

            });

            overlayDiv.style.visibility = "hidden";
            submitButton.style.visibility = "hidden";
            cardDiv.appendChild(overlayDiv);

            cardDiv.addEventListener("click", function (e) {
                if(!cardDiv.classList.contains("selected")) {
                    cardDiv.classList.add("selected");
                    overlayDiv.style.visibility = "visible";
                    submitButton.style.visibility = "visible";
                    helper.addAnimationToElement("slideInUp", overlayDiv, false, function () {
                    });
                }
                else {
                    cardDiv.classList.remove("selected");
                    // There'll be a visible "flash" of the button if i only animated the parent overlayDiv, so i gotta do it seperately for now
                    helper.addAnimationToElement("slideOutUp", submitButton, false, function () {
                        submitButton.style.visibility = "hidden";
                    });
                    helper.addAnimationToElement("slideOutDown", overlayDiv, false, function () {
                        overlayDiv.style.visibility = "hidden";
                    });
                }
            });
        }

        return cardDiv;
    }

})();