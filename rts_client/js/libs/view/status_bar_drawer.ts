﻿/*
class StatusBarDrawer {
    private program: MetaProgram;
    private canvas: HTMLCanvasElement;
    private buffer: WebGLBuffer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        let gl = <WebGLRenderingContext>this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, StatusBarDrawer.vertexShader, StatusBarDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }

    public draw(x: number, y: number, scale: number, bars: { x: number, y: number, w: number, h: number, v: number, r: number, g: number, b: number }[]) {
        x = Math.floor(x);
        y = Math.floor(y);
        scale = scale / 4;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        const FLOATS_PER_UNIT = 48;
        let drawData = new Float32Array(FLOATS_PER_UNIT * bars.length);
        let xm = Game.TILESIZE / this.canvas.width;
        let ym = Game.TILESIZE / this.canvas.height;

        for (let i = 0, n = 0; n < bars.length; n++) {
            let bar = bars[n];
            // Scale all coords to 1/4th their size (to match small canvas)
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            bar.w = bar.w * 2;
            bar.h = bar.h * 2;

            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            let normX = ((bar.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            let normY = ((bar.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            
            // Coordinates of each corner on the sprite
            let east = normX + bar.w * xm;
            let north = normY + bar.h * ym;
            let west = normX - bar.w * xm;
            let south = normY - bar.h * ym;

            // Fill array with scaled vertices
            drawData[i++] = west;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = bar.w;
            drawData[i++] = bar.h;
            drawData[i++] = bar.v;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;

            drawData[i++] = east;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;

            drawData[i++] = east;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;

            drawData[i++] = west;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;

            drawData[i++] = east;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;

            drawData[i++] = west;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = bar.r;
            drawData[i++] = bar.g;
            drawData[i++] = bar.b;
        }

        let gl = <WebGLRenderingContext>this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        let aaa = new Uint8Array(100);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_radius']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_color']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(this.program.attribute['a_circle_position'], 2, gl.FLOAT, false, 32, 8);
        gl.vertexAttribPointer(this.program.attribute['a_circle_radius'], 1, gl.FLOAT, false, 32, 16);
        gl.vertexAttribPointer(this.program.attribute['a_circle_color'], 3, gl.FLOAT, false, 32, 20);
        gl.uniform1f(this.program.uniform['scaleY'], this.canvas.width / this.canvas.height);
        gl.uniform1f(this.program.uniform['scale'], 2 / this.canvas.width);

        gl.drawArrays(gl.TRIANGLES, 0, 6 * bars.length);
    }

    private static vertexShader = [
        "precision highp float;",

        "attribute vec2 a_position;",
        "attribute vec2 a_circle_position;",
        "attribute float a_circle_radius;",
        "attribute vec3 a_circle_color;",

        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "varying vec3 v_circle_color;",

        "uniform float scaleY;",

        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_circle_position = a_circle_position;",
        "    v_frag_position = a_position;",
        "    v_circle_radius = a_circle_radius;",
        "    v_circle_color = a_circle_color;",
        "}",
    ].join("\n");

    private static fragmentShader = [
        "precision highp float;",

        "varying vec2 v_circle_position;",
        "varying vec2 v_frag_position;",
        "varying float v_circle_radius;",
        "varying vec3 v_circle_color;",

        "uniform float scaleY;",
        "uniform float scale;",

        "void main() {",
        "    float xDif = v_frag_position.x - v_circle_position.x;",
        "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
        "    float dist = xDif * xDif + yDif * yDif;",
        "    if (dist <= (v_circle_radius * v_circle_radius) && dist >= ((v_circle_radius - scale) * (v_circle_radius - scale))) {",
        "        gl_FragColor = vec4(v_circle_color, 1);",
        "    } else {",
        "        discard;",
        "    }",
        "}",
    ].join("\n");
}
*/