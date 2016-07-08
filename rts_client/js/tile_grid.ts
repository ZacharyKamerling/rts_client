"use strict";

class TileGrid {
    private canvas: HTMLCanvasElement;
    private ctx: WebGLRenderingContext;
    private quadVerts: WebGLBuffer;
    private program: MetaProgram;
    private tileTexture: WebGLTexture;
    private spriteSheet: WebGLTexture;
    private viewSizeX: number;
    private viewSizeY: number;
    private viewScaleX: number;
    private viewScaleY: number;
    private tileSize: number;
    private tileScale: number;
    private spriteSheetScaleX: number;
    private spriteSheetScaleY: number;
    private tileTextureScaleX: number;
    private tileTextureScaleY: number;

    constructor(parent: HTMLElement, spriteSrc: string, tileSrc: string) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
        this.ctx = <WebGLRenderingContext>this.canvas.getContext('webgl');
        this.ctx.viewport(0, 0, parent.offsetWidth, parent.offsetHeight);
        this.program = new MetaProgram(this.ctx, this.createProgram(TileGrid.tilemapVertexShader, TileGrid.tilemapFragmentShader));
        this.tileTexture = this.ctx.createTexture();
        this.spriteSheet = this.ctx.createTexture();
        this.viewSizeX = parent.offsetWidth;
        this.viewSizeY = parent.offsetHeight;
        this.tileSize = 16;
        this.tileScale = 1.0;
        this.viewScaleX = parent.offsetWidth / this.tileScale;
        this.viewScaleY = parent.offsetHeight / this.tileScale;

        let self = this;
        let sprts = new Image();
        let tiles = new Image();

        sprts.onerror = function (e: Event) {
            console.log('Failed to load ' + spriteSrc);
        };

        sprts.onload = function (e: Event) {
            console.log('Loaded ' + spriteSrc);
            self.ctx.bindTexture(self.ctx.TEXTURE_2D, self.spriteSheet);
            self.ctx.texImage2D(self.ctx.TEXTURE_2D, 0, self.ctx.RGBA, self.ctx.RGBA, self.ctx.UNSIGNED_BYTE, sprts);

            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_MAG_FILTER, self.ctx.NEAREST);
            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_MIN_FILTER, self.ctx.NEAREST);

            self.spriteSheetScaleX = 1 / sprts.width;
            self.spriteSheetScaleY = 1 / sprts.height;
        };

        sprts.src = spriteSrc;

        tiles.onerror = function (e: Event) {
            console.log('Failed to load ' + tileSrc);
        };

        tiles.onload = function (e: Event) {
            console.log('Loaded ' + tileSrc);
            self.ctx.bindTexture(self.ctx.TEXTURE_2D, self.tileTexture);
            self.ctx.texImage2D(self.ctx.TEXTURE_2D, 0, self.ctx.RGBA, self.ctx.RGBA, self.ctx.UNSIGNED_BYTE, tiles);

            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_MAG_FILTER, self.ctx.NEAREST);
            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_MIN_FILTER, self.ctx.NEAREST);

            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_WRAP_S, self.ctx.CLAMP_TO_EDGE);
            self.ctx.texParameteri(self.ctx.TEXTURE_2D, self.ctx.TEXTURE_WRAP_T, self.ctx.CLAMP_TO_EDGE);

            self.tileTextureScaleX = 1 / tiles.width;
            self.tileTextureScaleY = 1 / tiles.height;
        };

        tiles.src = tileSrc;

        let quadVerts = [
            //x  y  u  v
            -1, -1, 0, 1,
            1, -1, 1, 1,
            1, 1, 1, 0,

            -1, -1, 0, 1,
            1, 1, 1, 0,
            -1, 1, 0, 0
        ];

        this.quadVerts = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.quadVerts);
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(quadVerts), this.ctx.STATIC_DRAW);
        parent.appendChild(self.canvas);
    }

    private createProgram(vertShaderSrc: string, fragShaderSrc: string): WebGLProgram {
        let program = this.ctx.createProgram();
        let vertShader = this.createShader(vertShaderSrc, this.ctx.VERTEX_SHADER);
        let fragShader = this.createShader(fragShaderSrc, this.ctx.FRAGMENT_SHADER);

        this.ctx.attachShader(program, vertShader);
        this.ctx.attachShader(program, fragShader);
        this.ctx.linkProgram(program);

        if (!this.ctx.getProgramParameter(program, this.ctx.LINK_STATUS)) {
            console.error("Program Link error:", this.ctx.getProgramInfoLog(program));
            this.ctx.deleteProgram(program);
            this.ctx.deleteShader(vertShader);
            this.ctx.deleteShader(fragShader);
            return null;
        }

        return program;
    }

    private createShader(shaderSrc: string, shaderType: number): WebGLShader {
        let shader = this.ctx.createShader(shaderType);

        this.ctx.shaderSource(shader, shaderSrc);
        this.ctx.compileShader(shader);

        if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
            console.error(this.ctx.getShaderInfoLog(shader));
            this.ctx.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setScale(scale: number) {
        this.tileScale = scale;
        this.viewScaleX = this.viewSizeX / this.tileScale;
        this.viewScaleY = this.viewSizeY / this.tileScale;
    }

    resizeViewport(width: number, height: number) {
        this.ctx.viewport(0, 0, width, height);

        this.viewSizeX = width;
        this.viewSizeY = height;

        this.viewScaleX = width / this.tileScale;
        this.viewScaleY = height / this.tileScale;
    }

    draw(x: number, y: number) {
        let gl = this.ctx;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVerts);

        gl.enableVertexAttribArray(this.program.attribute['position']);
        gl.enableVertexAttribArray(this.program.attribute['texture']);
        gl.vertexAttribPointer(this.program.attribute['position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['texture'], 2, gl.FLOAT, false, 16, 8);

        let viewportScales = new Float32Array(2);
        viewportScales[0] = this.viewScaleX;
        viewportScales[1] = this.viewScaleY;

        let spriteSheetScales = new Float32Array(2);
        spriteSheetScales[0] = this.spriteSheetScaleX;
        spriteSheetScales[1] = this.spriteSheetScaleY;

        let tileTexArray = new Float32Array(2);
        tileTexArray[0] = this.tileTextureScaleX;
        tileTexArray[1] = this.tileTextureScaleY;

        gl.uniform2fv(this.program.uniform['viewportSize'], viewportScales);
        gl.uniform2fv(this.program.uniform['inverseSpriteTextureSize'], spriteSheetScales);
        gl.uniform2f(this.program.uniform['viewOffset'], Math.floor(x * this.tileScale), Math.floor(y * this.tileScale));
        gl.uniform2fv(this.program.uniform['inverseTileTextureSize'], tileTexArray);
        gl.uniform1f(this.program.uniform['tileSize'], this.tileSize);
        gl.uniform1f(this.program.uniform['inverseTileSize'], 1 / this.tileSize);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteSheet);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(this.program.uniform['tiles'], 1);
        gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private static tilemapVertexShader = [
        "precision mediump float;",

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

    private static tilemapFragmentShader = [
        "precision mediump float;",

        "varying vec2 pixelCoord;",
        "varying vec2 texCoord;",

        "uniform sampler2D tiles;",
        "uniform sampler2D sprites;",

        "uniform vec2 inverseTileTextureSize;",
        "uniform vec2 inverseSpriteTextureSize;",
        "uniform float tileSize;",

        "void main(void) {",
        "   vec4 tile = texture2D(tiles, texCoord);",
        "   if (texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0 || (tile.x == 1.0 && tile.y == 1.0)) { discard; }",
        "   vec2 spriteOffset = floor(tile.xy * 256.0) * tileSize;",
        "   vec2 spriteCoord = mod(pixelCoord, tileSize);",
        "   gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * inverseSpriteTextureSize);",
        "}"
    ].join("\n");
}

class MetaProgram {
    public program: WebGLProgram;
    public attribute: { [index: string]: number };
    public uniform: { [index: string]: WebGLUniformLocation };

    constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
        this.program = program;
        this.attribute = {};
        this.uniform = {};
        let count: number = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (let i = 0; i < count; i++) {
            let attrib = gl.getActiveAttrib(program, i);
            this.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }

        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            let uniform = gl.getActiveUniform(program, i);
            let name = uniform.name.replace("[0]", "");
            this.uniform[name] = gl.getUniformLocation(program, name);
        }
    }
}