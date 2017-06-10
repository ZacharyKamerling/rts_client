class MinimapDrawer {
    private spriteMap: SpriteMap;
    private canvas: HTMLCanvasElement;
    private spriteTex: WebGLTexture;
    private buffer: WebGLBuffer;
    private program: MetaProgram;

    constructor(canvas: HTMLCanvasElement, spritemap: SpriteMap) {
        let self = this;
        this.canvas = canvas;
        let gl = <WebGLRenderingContext>this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, MinimapDrawer.vertexShader, MinimapDrawer.fragmentShader));
        this.spriteTex = gl.createTexture();
        this.spriteMap = spritemap;

        gl.bindTexture(gl.TEXTURE_2D, self.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }

    // (x,y) = minimap location on screen
    // (w,h) = size of minimap on screen
    // sprites = list of coords and spritemap ref { x: [0.0,1.0], y: [0.0,1.0], ref: 'wee_little_icon' }
    public draw(sprites: { x: number, y: number, ref: string }[]) {
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }

        let xm = SpriteMap.WIDTH / this.canvas.width;
        let ym = SpriteMap.HEIGHT / this.canvas.height;
        const FLOATS_PER_VERT = 4;
        const FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        let drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);

        for (let i = 0, n = 0; n < sprites.length; n++) {
            let sprite = sprites[n];
            let xywh = this.spriteMap.coords(sprite.ref);
            let hw = xywh.w; // Half width
            let hh = xywh.h; // Half height

            // Normalize X & Y
            // ScrnX = x * 2 - 1
            let normX = sprite.x * 2 - 1;
            let normY = sprite.y * 2 - 1;

            // Coordinates of each corner on the sprite
            let east = normX + hw;
            let north = normY + hh;
            let west = normX - hw;
            let south = normY - hh;

            // Fill array with scaled vertices
            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;

            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y + xywh.h;

            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;

            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - south) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;

            drawData[i++] = normX - (normX - east) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;

            drawData[i++] = normX - (normX - west) * xm;
            drawData[i++] = normY - (normY - north) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y;
        }

        let gl = <WebGLRenderingContext>this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.1,0.1,0.1,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_texture_coord']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 16, 8);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);

        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
        gl.disable(gl.BLEND);
    }

    private static vertexShader = [
        "precision highp float;",

        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",

        "varying vec2 v_texture_coord;",

        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");

    private static fragmentShader = [
        "precision highp float;",

        "varying vec2 v_texture_coord;",

        "uniform sampler2D u_sampler;",

        "void main() {",
        "    gl_FragColor = texture2D(u_sampler, v_texture_coord);",
        "}",
    ].join("\n");
}