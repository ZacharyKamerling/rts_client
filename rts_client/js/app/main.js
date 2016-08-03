"use strict";
function main() {
    var connectBtn = document.getElementById('connectBtn');
    var connected = false;
    var thingsLoaded = 0;
    var conn = null;
    var game = new Game();
    var canvas = document.getElementById('drawCanvas');
    var fowCanvas = document.getElementById('fowCanvas');
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
    ];
    var spritemap = new SpriteMap(unitRefs);
    game.setTileDrawer(new TileDrawer(canvas, 'img/lttp-tiles.png', 'img/lttp-all.png'));
    game.setFOWDrawer(new FOWDrawer(fowCanvas));
    spritemap.onload = function (e) {
        game.setUnitDrawer(new UnitDrawer(canvas, spritemap));
    };
    connectBtn.onclick = function () {
        var nameFieldValue = document.getElementById('nameField').value;
        var passFieldValue = document.getElementById('passField').value;
        var addrFieldValue = document.getElementById('addrField').value;
        var portFieldValue = document.getElementById('portField').value;
        console.log('Attempting connection...');
        conn = new WebSocket('ws://[' + addrFieldValue + ']:' + portFieldValue);
        var chef = new Chef();
        conn.binaryType = "arraybuffer";
        conn.onopen = function () {
            conn.onmessage = function (event) {
                var c = new Cereal(new DataView(event.data));
                game.processPacket(c);
            };
            conn.onclose = function () {
                var mainMenu = document.getElementById('mainMenu');
                mainMenu.hidden = false;
                console.log('Connection closed.');
                game.disconnected();
            };
            console.log('Connection open.');
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            playGame(game, conn, spritemap);
        };
    };
}
;
function playGame(game, conn, spriteMap) {
    var mainMenu = document.getElementById('mainMenu');
    var content = document.getElementById('content');
    mainMenu.hidden = true;
    content.hidden = false;
    var canvas = document.getElementById('fowCanvas');
    game.setChef(new Chef());
    game.setConnection(conn);
    interact(canvas, game.interact_canvas());
    var last_time = Date.now();
    function draw(time_passed) {
        var time_delta = (time_passed - last_time) / 100;
        game.draw(time_delta);
        last_time = time_passed;
        requestAnimationFrame(draw);
    }
    draw(last_time);
}
main();
//# sourceMappingURL=main.js.map