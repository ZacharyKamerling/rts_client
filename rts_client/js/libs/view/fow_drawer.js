class FOWDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, FOWDrawer.vertexShader, FOWDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    draw(x, y, scale, circles) {
        const QUALITY = 1 / 4;
        x = Math.floor(x * QUALITY * scale);
        y = Math.floor(y * QUALITY * scale);
        this.canvas.width = Math.floor(this.canvas.offsetWidth * QUALITY);
        this.canvas.height = Math.floor(this.canvas.offsetHeight * QUALITY);
        const FLOATS_PER_UNIT = 30;
        let drawData = new Float32Array(FLOATS_PER_UNIT * circles.length);
        let xm = Game.TILESIZE / this.canvas.width;
        let ym = Game.TILESIZE / this.canvas.height;
        for (let i = 0, n = 0; n < circles.length; n++) {
            let circle = circles[n];
            circle.r = (circle.r * QUALITY) * 2 * scale;
            circle.x = circle.x * QUALITY * scale;
            circle.y = circle.y * QUALITY * scale;
            let normX = ((circle.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            let normY = ((circle.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            let east = normX + circle.r * xm;
            let north = normY + circle.r * ym;
            let west = normX - circle.r * xm;
            let south = normY - circle.r * ym;
            let radius = circle.r * xm;
            drawData[i + 0] = west;
            drawData[i + 1] = south;
            drawData[i + 2] = normX;
            drawData[i + 3] = normY;
            drawData[i + 4] = radius;
            drawData[i + 5] = east;
            drawData[i + 6] = south;
            drawData[i + 7] = normX;
            drawData[i + 8] = normY;
            drawData[i + 9] = radius;
            drawData[i + 10] = east;
            drawData[i + 11] = north;
            drawData[i + 12] = normX;
            drawData[i + 13] = normY;
            drawData[i + 14] = radius;
            drawData[i + 15] = west;
            drawData[i + 16] = south;
            drawData[i + 17] = normX;
            drawData[i + 18] = normY;
            drawData[i + 19] = radius;
            drawData[i + 20] = east;
            drawData[i + 21] = north;
            drawData[i + 22] = normX;
            drawData[i + 23] = normY;
            drawData[i + 24] = radius;
            drawData[i + 25] = west;
            drawData[i + 26] = north;
            drawData[i + 27] = normX;
            drawData[i + 28] = normY;
            drawData[i + 29] = radius;
            i += FLOATS_PER_UNIT;
        }
        let gl = this.canvas.getContext('webgl');
        gl.clearColor(0, 0, 0, 0.75);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_radius']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(this.program.attribute['a_circle_position'], 2, gl.FLOAT, false, 20, 8);
        gl.vertexAttribPointer(this.program.attribute['a_circle_radius'], 1, gl.FLOAT, false, 20, 16);
        gl.uniform1f(this.program.uniform['scaleY'], this.canvas.width / this.canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);
    }
}
FOWDrawer.vertexShader = [
    "precision highp float;",
    "attribute vec2 a_position;",
    "attribute vec2 a_circle_position;",
    "attribute float a_circle_radius;",
    "varying vec2 v_circle_position;",
    "varying vec2 v_frag_position;",
    "varying float v_circle_radius;",
    "uniform float scaleY;",
    "void main() {",
    "    gl_Position = vec4(a_position, 0.0, 1.0);",
    "    v_circle_position = a_circle_position;",
    "    v_frag_position = a_position;",
    "    v_circle_radius = a_circle_radius;",
    "}",
].join("\n");
FOWDrawer.fragmentShader = [
    "precision highp float;",
    "varying vec2 v_circle_position;",
    "varying vec2 v_frag_position;",
    "varying float v_circle_radius;",
    "uniform float scaleY;",
    "void main() {",
    "    float xDif = v_frag_position.x - v_circle_position.x;",
    "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
    "    float dist = xDif * xDif + yDif * yDif;",
    "    if (dist < (v_circle_radius * v_circle_radius)) {",
    "        gl_FragColor = vec4(0, 0, 0, 0.0);",
    "    } else {",
    "        discard;",
    "    }",
    "}",
].join("\n");
