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

    const PeerServer = require("peer").PeerServer;
    
    function createWelcomeScreen() {
        document.body.innerHTML = "";

        const container = document.createElement("div");
        container.className = "container-fluid";
        container.innerHTML = "<div class=\"row\"></div>";
        document.body.appendChild(container);
        
        for(let i = 0; i < 12; i++) {
            placeElementInContainer(container, createCardElement("black", "Hello ____!", "The idiot pack"), 0, 2);
        }
    }

    function createCardElement(colour, text, packName) {
        const card = document.createElement("div");
        card.classList.add("card", (colour === "white" || colour === "black" ? colour : "black"));
        
        const textDiv = document.createElement("div");
        textDiv.classList.add("text");
        textDiv.innerHTML = helper.sanitizeString(text);

        const packNameDiv = document.createElement("div");
        packNameDiv.classList.add("pack-name");
        packNameDiv.innerHTML = helper.sanitizeString(packName);

        card.appendChild(textDiv);
        card.appendChild(packNameDiv);

        return card;
    }

    function placeElementInContainer(parentContainer /* Pass an HTML element, or pass a string of the container element ID*/, yourElement, row, col) {
        parentContainer = (typeof parentContainer == "string" ? document.getElementById(parentContainer) : parentContainer);
        
        const rows = parentContainer.getElementsByClassName("row");
        if(rows.length === 0) {
            console.log("You tried putting an element into a container with no rows! You idiot!");
            return false;
        }
        row = (rows.length > row ? row : (rows.length - 1 >= 0 ? rows.length - 1 : 0));
        yourElement.classList.add("col-sm-" + col, "center-block"); // sm seems to be the right size, or else there's either too much empty room, or they're too squeezed
        rows[row].appendChild(yourElement);
        return true;
    }

})();