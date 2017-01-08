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
        container.className = "container-fluid text-center";
        container.innerHTML = "<div class=\"row\"></div>";
        document.body.appendChild(container);
        
        (function addCards(leftToDo) {
            if(typeof leftToDo == "undefined") {
                leftToDo = 12;
            }
            setTimeout(() => {
                if(leftToDo > 0) {
                    const cardColour = (leftToDo % 2 === 0 ? "white" : "black");
                    helper.placeElementInContainer(container, helper.addAnimationToElement("fadeInRightBig", createCardElement(cardColour, "Hello ____! How <i>you</i> doin?", "The idiot pack, Fifth edition, with no expansions, thanks.", 3)), 0, 12);
                    addCards(leftToDo-1);
                }
            }, 100);
        })();

        helper.httpGetJSON("jsonplaceholder.typicode.com/posts/1", function(json) {
            console.log(JSON.stringify(json));
        }, function(err) {
            console.error(err);
        });
    }

    function createCardElement(colour, text, packName, pickAmount) {
        const card = document.createElement("div");
        card.classList.add("card", (colour === "white" || colour === "black" ? colour : "black"));

        const textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.innerHTML = helper.sanitizeString(text);
        card.appendChild(textDiv);

        const packNameDiv = document.createElement("div");
        packNameDiv.classList.add("pack-name");
        packNameDiv.innerHTML = helper.sanitizeString(packName);
        card.appendChild(packNameDiv);

        if(colour === "black" && typeof pickAmount != "undefined") {
            const pickAmountDiv = document.createElement("div");
            pickAmountDiv.classList.add("pick-amount");
            pickAmountDiv.innerHTML = "PICK " + pickAmount;
            card.appendChild(pickAmountDiv);
        }

        return card;
    }

})();