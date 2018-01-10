"use strict";
function main() {
    let mainMenu = document.getElementById('mainMenu');
    let content = document.getElementById('content');
    let chef = new Chef();
    let connectBtn = document.getElementById('connectBtn');
    let connected = false;
    let thingsLoaded = 0;
    let conn = null;
    let game = new Game();
    let fowCanvas = document.getElementById('fowCanvas');
    let drawCanvas = document.getElementById('drawCanvas');
    let minimapCanvas = document.getElementById('minimapCanvas');
    let ctrlDiv = document.getElementById('controlDiv');
    game.chef = chef;
    game.inputState = new UserInput.InputState();
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/tileset.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.minimapBoxDrawer = new MinimapBoxDrawer(minimapCanvas);
    game.statusBarDrawer = new StatusBarDrawer(drawCanvas);
    game.commandPanel = commands(game);
    let spritemap = new SpriteMap(spriteRefs(game.teamColors));
    spritemap.onload = function (e) {
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
        game.minimapDrawer = new MinimapDrawer(minimapCanvas, spritemap);
        game.buildPlacementDrawer = new BuildPlacementDrawer(drawCanvas, spritemap);
        mainMenu.appendChild(spritemap.spriteSheet);
    };
    connectBtn.onclick = function () {
        let nameFieldValue = document.getElementById('nameField').value;
        let passFieldValue = document.getElementById('passField').value;
        let addrFieldValue = document.getElementById('addrField').value;
        let portFieldValue = document.getElementById('portField').value;
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
            chef.putU8(Interaction.Core.ServerMessage.UnitInfoRequest);
            chef.putU32(game.orderID++);
            conn.send(chef.done());
            game.connected = true;
            game.inputState.addListener(minimapCanvas, Interaction.Minimap.interact(game));
            game.inputState.addListener(ctrlDiv, Interaction.Core.interact(game));
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
function commands(game) {
    let cmdDiv = document.getElementById('commandDiv');
    let cmds = new CommandPanel(cmdDiv, game.commandPanelHandler());
    cmds.addCommand("attack", { src: "img/attack.png", tooltip: "[A] Attack" });
    cmds.addCommand("move", { src: "img/move.png", tooltip: "[M] Move" });
    cmds.addCommand("stop", { src: "img/stop.png", tooltip: "[S] Stop" });
    return cmds;
}
function spriteRefs(colors) {
    let tc_imgs = [
        {
            src: "img/basic_missile.png",
            ref: "basic_missile"
        },
        {
            src: "img/platform1.png",
            ref: "platform1"
        },
        {
            src: "img/platform2.png",
            ref: "platform2"
        },
        {
            src: "img/extractor_blade1.png",
            ref: "extractor_blade1"
        },
        {
            src: "img/artillery_wpn1.png",
            ref: "artillery_wpn1"
        },
        {
            src: "img/artillery_wpn2.png",
            ref: "artillery_wpn2"
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
            src: "img/fast1.png",
            ref: "fast1"
        },
        {
            src: "img/fast_wpn1.png",
            ref: "fast_wpn1"
        },
        {
            src: "img/fast_msl1.png",
            ref: "fast_msl1"
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
    let list = new Array();
    for (let i = 0; i < colors.length; i++) {
        let color = colors[i];
        for (let n = 0; n < tc_imgs.length; n++) {
            let src = tc_imgs[n].src;
            let ref = tc_imgs[n].ref + color.name;
            list.push({ src: src, ref: ref, color: color });
        }
    }
    list.push({
        src: "img/Prime_deposit.png",
        ref: "prime_node",
        color: new TeamColor(),
    });
    return list;
}
main();
