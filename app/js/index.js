(function nubsAgainstHumanity() {
    const remote = require("electron").remote;
    const helper = require("./helper");

    (function init() {
        createWelcomeScreen();
    })();
    
    function createWelcomeScreen() {
        document.body.innerHTML = "";

        const container = document.createElement("div");
        container.className = "container-fluid";
        container.innerHTML = "<div class=\"row\"></div><div class=\"row\"></div>";
        container.id = "welcome-screen-container";
        document.body.appendChild(container);

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

    function loadAllCardsFromFile() {

    }

})();