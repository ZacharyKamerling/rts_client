function main() {
    var tilemap = document.getElementById('tilemapCanvas');
    var unitCanvas = document.getElementById('actorCanvas');
    var tileDrawer = new TileDrawer(tilemap, 'img/lttp-tiles.png', 'img/lttp-all.png');
    var unitRefs = [
        { src: "img/basic_unit.png", ref: "basic" },
    ];
    var spritemap = new SpriteMap(unitRefs);
    var unitDrawer;
    var tileWidth = 16;
    var tileGridWidth = 512;
    var tileGridHeight = 256;
    var last_time = Date.now();
    var elapsed = 0.0;
    /*
    let sprites = [
        { x: 0, y: 0, ang: 0, ref: "basic" },
        { x: 8, y: -8, ang: 0, ref: "basic" },
        { x: 16, y: -16, ang: 0, ref: "basic" },
    ];
    */
    var sprites = new Array();
    for (var i = 0; i < 2048 * 4; i++) {
        var randX = Math.random() * tileGridWidth * tileWidth;
        var randY = Math.random() * tileGridHeight * tileWidth;
        var randA = Math.random() * Math.PI * 2;
        sprites.push({ x: randX, y: 0 - randY, ang: randA, ref: "basic" });
    }
    var drawLoop = function (time_passed) {
        var time_delta = (time_passed - last_time) / 100;
        elapsed += time_delta;
        var scale = Math.max(Math.min(Math.abs(Math.cos(elapsed / 60)) * 2.0, 1.5), 0.25);
        var tss = scale * scale;
        var mapW = tileWidth * tileGridWidth;
        var mapH = tileWidth * tileGridHeight;
        var xOff = mapW * Math.cos(elapsed / 100) / 2;
        var yOff = mapH * Math.sin(elapsed / 100) / 2;
        var centerX = mapW / 2;
        var centerY = mapH / 2;
        var x = (centerX + xOff);
        var y = (centerY + yOff);
        for (var i = 0; i < sprites.length; i++) {
            sprites[i].ang += 0.01;
        }
        tileDrawer.draw(x, y, 1);
        unitDrawer.draw(x, -y, 1, sprites);
        last_time = time_passed;
        requestAnimationFrame(drawLoop);
    };
    spritemap.onload = function (e) {
        unitDrawer = new UnitDrawer(unitCanvas, spritemap);
        drawLoop(last_time);
    };
}
;
main();
//# sourceMappingURL=main.js.map