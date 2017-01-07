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
    })();

    const PeerServer = require("peer").PeerServer;
    
})();