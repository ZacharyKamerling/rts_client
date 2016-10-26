"use strict";
function main() {
    var mainMenu = document.getElementById('mainMenu');
    var content = document.getElementById('content');
    var chef = new Chef();
    var connectBtn = document.getElementById('connectBtn');
    var connected = false;
    var thingsLoaded = 0;
    var conn = null;
    var game = new Game();
    var fowCanvas = document.getElementById('fowCanvas');
    var drawCanvas = document.getElementById('drawCanvas');
    var ctrlDiv = document.getElementById('controlDiv');
    var cmdDiv = document.getElementById('commandDiv');
    var cmds = {};
    cmds["attack"] = { src: "img/attack.png", tooltip: "[A] Attack" };
    cmds["move"] = { src: "img/move.png", tooltip: "[M] Move" };
    cmds["build"] = { src: "img/build.png", tooltip: "[B] Build" };
    game.chef = chef;
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/lttp-tiles.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.commandPanel = new CommandPanel(cmdDiv, cmds, game.commandPanelHandler());
    var unitRefs = [
        {
            src: "img/basic_unit.png",
            ref: "basic_unit"
        },
        {
            src: "img/basic_wpn.png",
            ref: "basic_wpn"
        },
        {
            src: "img/basic_missile.png",
            ref: "basic_missile"
        },
        {
            src: "img/basic_structure.png",
            ref: "basic_structure"
        },
    ];
    var spritemap = new SpriteMap(unitRefs);
    spritemap.onload = function (e) {
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
    };
    connectBtn.onclick = function () {
        var nameFieldValue = document.getElementById('nameField').value;
        var passFieldValue = document.getElementById('passField').value;
        var addrFieldValue = document.getElementById('addrField').value;
        var portFieldValue = document.getElementById('portField').value;
        console.log('Attempting connection...');
        if (addrFieldValue === "localhost") {
            conn = new WebSocket('ws://localhost:' + portFieldValue);
        }
        else {
            conn = new WebSocket('ws://[' + addrFieldValue + ']:' + portFieldValue);
        }
        conn.binaryType = "arraybuffer";
        game.connection = conn;
        conn.onclose = function () {
            console.log('Connection closed.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        };
        conn.onmessage = function (event) {
            Decoding.processPacket(game, new Cereal(new DataView(event.data)));
        };
        conn.onopen = function () {
            console.log('Connection open.');
            mainMenu.hidden = true;
            content.hidden = false;
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            game.connected = true;
            playGame(game);
        };
        conn.onerror = function () {
            console.log('Connection Error.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        };
    };
}
;
function playGame(game) {
    var mainMenu = document.getElementById('mainMenu');
    var content = document.getElementById('content');
    var ctrlDiv = document.getElementById('controlDiv');
    interact(ctrlDiv, Interaction.Core.interact(game));
    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }
    draw();
}
main();
//# sourceMappingURL=main.js.map