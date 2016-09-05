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
    let ctrlCanvas = <HTMLCanvasElement>document.getElementById('controlCanvas');
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
    
    game.setChef(chef);
    game.setTileDrawer(new TileDrawer(drawCanvas, 'img/lttp-tiles.png', 'img/lttp-all.png'));
    game.setFOWDrawer(new FOWDrawer(fowCanvas));
    game.setSelectionDrawer(new SelectionDrawer(drawCanvas));
    game.setSelectionBoxDrawer(new SelectionBoxDrawer(drawCanvas));

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
    let canvas = <HTMLCanvasElement>document.getElementById('controlCanvas');
    interact(canvas, game.interact_canvas());

    let last_time = Date.now();

    function draw(time_passed: number) {
        if (game.connected) {
            let time_delta = (time_passed - last_time) / 100;
            game.draw(time_delta);
            last_time = time_passed;
            requestAnimationFrame(draw);
        }
    }

    draw(last_time);
}

main();