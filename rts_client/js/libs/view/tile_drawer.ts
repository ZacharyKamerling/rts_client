/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// Not original source.
class TileDrawer {
    private canvas: HTMLCanvasElement;
    private ctx: WebGLRenderingContext;
    private buffer: WebGLBuffer;
    private program: MetaProgram;
    private tileTexture: WebGLTexture;
    private spriteSheet: WebGLTexture;
    private tileSize: number;
    private spriteSheetScaleX: number;
    private spriteSheetScaleY: number;
    private tileTextureScaleX: number;
    private tileTextureScaleY: number;
    private mapWidth: number;
    private mapHeight: number;

    constructor(canvas: HTMLCanvasElement, spriteSrc: string, tileSrc: string) {
        this.canvas = canvas;
        this.ctx = <WebGLRenderingContext>this.canvas.getContext('webgl');
        let gl = this.ctx;
        this.program = new MetaProgram(gl, createProgram(gl, TileDrawer.vertexShader, TileDrawer.fragmentShader));
        this.tileTexture = gl.createTexture();
        this.spriteSheet = gl.createTexture();
        this.tileSize = 20;

        let self = this;
        let sprts = new Image();
        let tiles = new Image();

        sprts.onerror = function (e: Event) {
            console.log('Failed to load ' + spriteSrc);
        };

        sprts.onload = function (e: Event) {
            console.log('Loaded ' + spriteSrc);
            gl.bindTexture(gl.TEXTURE_2D, self.spriteSheet);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sprts);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            self.spriteSheetScaleX = 1 / sprts.width;
            self.spriteSheetScaleY = 1 / sprts.height;
        };

        sprts.src = spriteSrc;

        tiles.onerror = function (e: Event) {
            console.log('Failed to load ' + tileSrc);
        };

        tiles.onload = function (e: Event) {
            console.log('Loaded ' + tileSrc);
            gl.bindTexture(gl.TEXTURE_2D, self.tileTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            self.tileTextureScaleX = 1 / tiles.width;
            self.tileTextureScaleY = 1 / tiles.height;
            self.mapWidth = tiles.width;
            self.mapHeight = tiles.height;
        };

        tiles.src = tileSrc;

        let buffer = [
            //x  y  u  v
            -1, -1, 0, 1,
             1, -1, 1, 1,
             1,  1, 1, 0,

            -1, -1, 0, 1,
             1,  1, 1, 0,
            -1,  1, 0, 0
        ];

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
    }

    setTiles(tiles: HTMLImageElement) {
        let gl = this.ctx;
        console.log('Loaded New Tiles');
        gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.tileTextureScaleX = 1 / tiles.width;
        this.tileTextureScaleY = 1 / tiles.height;
        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height;
    }

    draw(x: number, y: number, scale: number) {
        let ss = scale * scale;
        y = this.mapHeight * this.tileSize - y;
        x = x / scale - this.canvas.offsetWidth / 2 / ss;
        y = y / scale - this.canvas.offsetHeight / 2 / ss;

        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        let gl = this.ctx;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.enableVertexAttribArray(this.program.attribute['position']);
        gl.enableVertexAttribArray(this.program.attribute['texture']);
        gl.vertexAttribPointer(this.program.attribute['position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['texture'], 2, gl.FLOAT, false, 16, 8);

        gl.uniform2f(this.program.uniform['viewportSize'], Math.floor(this.canvas.offsetWidth / scale), Math.floor(this.canvas.offsetHeight / scale));
        gl.uniform2f(this.program.uniform['inverseSpriteTextureSize'], this.spriteSheetScaleX, this.spriteSheetScaleY);
        gl.uniform2f(this.program.uniform['viewOffset'], Math.floor(x * scale), Math.floor(y * scale));
        gl.uniform2f(this.program.uniform['inverseTileTextureSize'], this.tileTextureScaleX, this.tileTextureScaleY);
        gl.uniform1f(this.program.uniform['tileSize'], this.tileSize);
        gl.uniform1f(this.program.uniform['inverseTileSize'], 1 / this.tileSize);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(this.program.uniform['tiles'], 1);
        gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.BLEND);
    }

    private static vertexShader = [
        "attribute vec2 position;",
        "attribute vec2 texture;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform vec2 viewOffset;",
        "uniform vec2 viewportSize;",
        "uniform vec2 inverseTileTextureSize;",
        "uniform float inverseTileSize;",

        "void main(void) {",
        "   pixelCoord = (texture * viewportSize) + viewOffset;",
        "   texCoord = pixelCoord * inverseTileTextureSize * inverseTileSize;",
        "   gl_Position = vec4(position, 0.0, 1.0);",
        "}"
    ].join("\n");

    private static fragmentShader = [
        "precision highp float;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform sampler2D tiles;",
        "uniform sampler2D sprites;",

        "uniform vec2 inverseTileTextureSize;",
        "uniform vec2 inverseSpriteTextureSize;",
        "uniform float tileSize;",

        "void main(void) {",
        "   if(texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0) { discard; }",
        "   vec4 tile = texture2D(tiles, texCoord);",
        "   if(tile.x == 1.0 && tile.y == 1.0) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
        "   vec2 spriteCoord = mod(pixelCoord, tileSize);",
        "   gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        "}"
    ].join("\n");
}