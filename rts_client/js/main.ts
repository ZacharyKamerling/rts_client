function main() {
    let tilemap = <HTMLCanvasElement>document.getElementById('tilemapCanvas');
    let unitCanvas = <HTMLCanvasElement>document.getElementById('actorCanvas');
    let tileDrawer = new TileDrawer(tilemap, 'img/lttp-tiles.png', 'img/lttp-all.png');
    let unitRefs = [
        { src: "img/basic_unit.png", ref: "basic" },
    ];

    let spritemap = new SpriteMap(unitRefs);
    let unitDrawer: UnitDrawer;

    let tileWidth = 16;
    let tileGridWidth = 512;
    let tileGridHeight = 256;

    let last_time = Date.now();
    let elapsed = 0.0;

    /*
    let sprites = [
        { x: 0, y: 0, ang: 0, ref: "basic" },
        { x: 8, y: -8, ang: 0, ref: "basic" },
        { x: 16, y: -16, ang: 0, ref: "basic" },
    ];
    */

    let sprites = new Array();
    for (let i = 0; i < 2048 * 4; i++) {
        let randX = Math.random() * tileGridWidth * tileWidth;
        let randY = Math.random() * tileGridHeight * tileWidth;
        let randA = Math.random() * Math.PI * 2;
        sprites.push({ x: randX, y: 0-randY, ang: randA, ref: "basic" });
    }

    let drawLoop = function (time_passed: number) {
        let time_delta = (time_passed - last_time) / 100;
        elapsed += time_delta;
        let scale = Math.max(Math.min(Math.abs(Math.cos(elapsed / 60)) * 2.0, 1.5), 0.25);
        let tss = scale * scale;
        let mapW = tileWidth * tileGridWidth;
        let mapH = tileWidth * tileGridHeight;
        let xOff = mapW * Math.cos(elapsed / 100) / 2;
        let yOff = mapH * Math.sin(elapsed / 100) / 2;
        let centerX = mapW / 2;
        let centerY = mapH / 2;
        let x = (centerX + xOff);
        let y = (centerY + yOff);

        for (let i = 0; i < sprites.length; i++) {
            sprites[i].ang += 0.01;
        }

        tileDrawer.draw(x, y, 1);
        unitDrawer.draw(x, -y, 1, sprites);

        last_time = time_passed;
        requestAnimationFrame(drawLoop);
    };

    spritemap.onload = function (e: Event) {
        unitDrawer = new UnitDrawer(unitCanvas, spritemap);
        drawLoop(last_time);
    };
};

main();