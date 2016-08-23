"use strict";

function main() {
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
    let spritemap = new SpriteMap(unitRefs);

    game.setTileDrawer(new TileDrawer(drawCanvas, 'img/lttp-tiles.png', 'img/lttp-all.png'));
    game.setFOWDrawer(new FOWDrawer(fowCanvas));
    game.setSelectionDrawer(new SelectionDrawer(drawCanvas));

    spritemap.onload = function (e: Event) {
        game.setUnitDrawer(new UnitDrawer(drawCanvas, spritemap));
    };

    connectBtn.onclick = function () {
        let nameFieldValue = (<HTMLInputElement>document.getElementById('nameField')).value;
        let passFieldValue = (<HTMLInputElement>document.getElementById('passField')).value;
        let addrFieldValue = (<HTMLInputElement>document.getElementById('addrField')).value;
        let portFieldValue = (<HTMLInputElement>document.getElementById('portField')).value;
        console.log('Attempting connection...');
        conn = new WebSocket('ws://[' + addrFieldValue + ']:' + portFieldValue);
        let chef = new Chef();

        conn.binaryType = "arraybuffer";

        conn.onopen = function () {

            conn.onmessage = function (event) {
                let c = new Cereal(new DataView(event.data));
                game.processPacket(c);
            }

            conn.onclose = function () {
                let mainMenu = document.getElementById('mainMenu');
                mainMenu.hidden = false;
                console.log('Connection closed.');
                game.disconnected();
            }

            console.log('Connection open.');
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            playGame(game, conn, spritemap);
        }
    };
};

function playGame(game: Game, conn: WebSocket, spriteMap: SpriteMap) {
    let mainMenu = document.getElementById('mainMenu');
    let content = document.getElementById('content');
    mainMenu.hidden = true;
    content.hidden = false;

    let canvas = <HTMLCanvasElement>document.getElementById('controlCanvas');

    game.setChef(new Chef());
    game.setConnection(conn);
    interact(canvas, game.interact_canvas());

    let last_time = Date.now();

    function draw(time_passed: number) {
        let time_delta = (time_passed - last_time) / 100;
        game.draw(time_delta);
        last_time = time_passed;
        requestAnimationFrame(draw);
    }

    draw(last_time);
}

main();