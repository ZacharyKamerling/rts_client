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

    let unitRefs = [
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
    ];

    let cmds: { [index: string]: { src: string, tooltip: string } } = {};
    cmds["attack"] = { src: "img/fighter1.png", tooltip: "Attack" };
    cmds["move"] = { src: "img/bomber1.png", tooltip: "Move" };
    cmds["build"] = { src: "img/wall0.png", tooltip: "Build" };
    
    game.setChef(chef);
    game.setTileDrawer(new TileDrawer(drawCanvas, 'img/lttp-tiles.png', 'img/lttp-all.png'));
    game.setFOWDrawer(new FOWDrawer(fowCanvas));
    game.setSelectionDrawer(new SelectionDrawer(drawCanvas));
    game.setSelectionBoxDrawer(new SelectionBoxDrawer(drawCanvas));
    game.setCommandPanel(new CommandPanel(cmdDiv, cmds, game.commandHandler));

    let spritemap = new SpriteMap(unitRefs);
    spritemap.onload = function (e: Event) {
        game.setUnitDrawer(new UnitDrawer(drawCanvas, spritemap));
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
        game.setConnection(conn);

        conn.onclose = function () {
            console.log('Connection closed.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        }

        conn.onmessage = function (event) {
            game.processPacket(new Cereal(new DataView(event.data)));
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
    let ctrlDiv = <HTMLCanvasElement>document.getElementById('controlDiv');
    interact(ctrlDiv, game.interact());

    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }

    draw();
}
main();