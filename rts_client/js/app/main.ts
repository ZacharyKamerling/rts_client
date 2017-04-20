"use strict";

function main() {
    let mainMenu = document.getElementById('mainMenu');
    let content = document.getElementById('content');
    let chef = new Chef();
    let connectBtn = document.getElementById('connectBtn');
    let connected = false;
    let thingsLoaded = 0;
    let conn: WebSocket = null;
    let game: Game = new Game();
    let fowCanvas = <HTMLCanvasElement>document.getElementById('fowCanvas');
    let drawCanvas = <HTMLCanvasElement>document.getElementById('drawCanvas');
    let ctrlDiv = <HTMLElement>document.getElementById('controlDiv');
    let cmdDiv = <HTMLElement>document.getElementById('commandDiv');
    let cmds = commands();
    
    game.chef = chef;
    game.inputState = new UserInput.InputState(ctrlDiv, Interaction.Core.interact(game));
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/lttp-tiles.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.statusBarDrawer = new StatusBarDrawer(drawCanvas);
    game.commandPanel = new CommandPanel(cmdDiv, cmds, game.commandPanelHandler());

    let spritemap = new SpriteMap(spriteRefs());
    spritemap.onload = function (e: Event) {
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
        mainMenu.appendChild(spritemap.spriteSheet);
    };

    connectBtn.onclick = function () {
        let nameFieldValue = (<HTMLInputElement>document.getElementById('nameField')).value;
        let passFieldValue = (<HTMLInputElement>document.getElementById('passField')).value;
        let addrFieldValue = (<HTMLInputElement>document.getElementById('addrField')).value;
        let portFieldValue = (<HTMLInputElement>document.getElementById('portField')).value;
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
        }

        conn.onmessage = function (event) {
            Decoding.processPacket(game, new Cereal(new DataView(event.data)));
        }

        conn.onopen = function () {
            console.log('Connection open.');
            mainMenu.hidden = true;
            content.hidden = false;
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            game.connected = true;
            playGame(game);
        }

        conn.onerror = function () {
            console.log('Connection Error.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        }
    };
};

function playGame(game: Game) {
    let mainMenu = document.getElementById('mainMenu');
    let content = document.getElementById('content');
    

    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }

    draw();
}

function commands(): { [index: string]: { src: string, tooltip: string } } {
    let cmds: { [index: string]: { src: string, tooltip: string } } = {};
    cmds["attack"] = { src: "img/attack.png", tooltip: "[A] Attack" };
    cmds["move"] = { src: "img/move.png", tooltip: "[M] Move" };
    cmds["build"] = { src: "img/build.png", tooltip: "[B] Build" };

    return cmds;
}

function spriteRefs(): { src: string, ref: string }[] {
    return [
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
            src: "img/basic_structure.png",
            ref: "basic_structure"
        },
        {
            src: "img/fighter1.png",
            ref: "fighter1"
        },
        {
            src: "img/bomber1.png",
            ref: "bomber1"
        },
    ];
}

main();