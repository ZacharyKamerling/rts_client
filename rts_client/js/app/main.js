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
    var minimapCanvas = document.getElementById('minimapCanvas');
    var ctrlDiv = document.getElementById('controlDiv');
    var cmdDiv = document.getElementById('commandDiv');
    var cmds = commands();
    game.chef = chef;
    game.inputState = new UserInput.InputState();
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/tileset.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.statusBarDrawer = new StatusBarDrawer(drawCanvas);
    game.commandPanel = new CommandPanel(cmdDiv, cmds, game.commandPanelHandler());
    var spritemap = new SpriteMap(spriteRefs(game.teamColors));
    spritemap.onload = function (e) {
        game.inputState.addListener(ctrlDiv, Interaction.Core.interact(game));
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
        game.minimapDrawer = new MinimapDrawer(minimapCanvas, spritemap);
        game.buildPlacementDrawer = new BuildPlacementDrawer(drawCanvas, spritemap);
        mainMenu.appendChild(spritemap.spriteSheet);
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
            chef.putU8(Interaction.Core.ServerMessage.MapInfoRequest);
            chef.putU32(game.orderID++);
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
    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }
    draw();
}
function commands() {
    var cmds = {};
    cmds["attack"] = { src: "img/attack.png", tooltip: "[A] Attack" };
    cmds["move"] = { src: "img/move.png", tooltip: "[M] Move" };
    cmds["build"] = { src: "img/build.png", tooltip: "[B] Build" };
    return cmds;
}
function spriteRefs(colors) {
    var tc_imgs = [
        {
            src: "img/basic_missile.png",
            ref: "basic_missile"
        },
        {
            src: "img/artillery_platform1.png",
            ref: "artillery_platform1"
        },
        {
            src: "img/artillery_wpn1.png",
            ref: "artillery_wpn1"
        },
        {
            src: "img/missile1.png",
            ref: "missile1"
        },
        {
            src: "img/basic_unit.png",
            ref: "basic_unit"
        },
        {
            src: "img/basic_wpn.png",
            ref: "basic_wpn"
        },
        {
            src: "img/fighter1.png",
            ref: "fighter1"
        },
        {
            src: "img/bomber1.png",
            ref: "bomber1"
        },
        {
            src: "img/minimap_unit.png",
            ref: "minimap_unit"
        },
    ];
    var list = new Array();
    for (var i = 0; i < colors.length; i++) {
        var color = colors[i];
        for (var n = 0; n < tc_imgs.length; n++) {
            var src = tc_imgs[n].src;
            var ref = tc_imgs[n].ref + color.name;
            list.push({ src: src, ref: ref, color: color });
        }
    }
    return list;
}
main();
