class SelectionDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, SelectionDrawer.vertexShader, SelectionDrawer.fragmentShader));
        this.programDashed = new MetaProgram(gl, createProgram(gl, SelectionDrawer.vertexShader, SelectionDrawer.fragmentShaderDashed));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    draw(dashed, x, y, scale, circles) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        let xm = 1 / this.canvas.width;
        let ym = 1 / this.canvas.height;
        const BYTES_PER_VERTEX = 24;
        var drawData = new ArrayBuffer(6 * BYTES_PER_VERTEX * circles.length);
        var floatView = new Float32Array(drawData);
        var uint8View = new Uint8Array(drawData);
        for (let n = 0; n < circles.length; n++) {
            let circle = circles[n];
            circle.x *= scale;
            circle.y *= scale;
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            circle.radius *= 2 * scale;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            let normX = ((circle.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            let normY = ((circle.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            let east = normX + circle.radius * xm;
            let north = normY + circle.radius * ym;
            let west = normX - circle.radius * xm;
            let south = normY - circle.radius * ym;
            let radius = circle.radius * xm;
            // Fill array with scaled vertices
            let vertFloatOff = n * 6 * BYTES_PER_VERTEX / 4;
            let vertUInt8Off = n * 6 * BYTES_PER_VERTEX + 20;
            let floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 0;
            let colorOff = vertUInt8Off + BYTES_PER_VERTEX * 0;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 1;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 1;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 2;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 2;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 3;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 3;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 4;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 4;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 5;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 5;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = normX;
            floatView[floatOff + 3] = normY;
            floatView[floatOff + 4] = radius;
            uint8View[colorOff + 0] = circle.r;
            uint8View[colorOff + 1] = circle.g;
            uint8View[colorOff + 2] = circle.b;
            uint8View[colorOff + 3] = circle.a;
        }
        let gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        let att;
        let uni;
        if (dashed) {
            gl.useProgram(this.programDashed.program);
            att = this.programDashed.attribute;
            uni = this.programDashed.uniform;
        }
        else {
            gl.useProgram(this.program.program);
            att = this.program.attribute;
            uni = this.program.uniform;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(att['a_position']);
        gl.enableVertexAttribArray(att['a_circle_position']);
        gl.enableVertexAttribArray(att['a_circle_radius']);
        gl.enableVertexAttribArray(att['a_circle_color']);
        gl.vertexAttribPointer(att['a_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
        gl.vertexAttribPointer(att['a_circle_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
        gl.vertexAttribPointer(att['a_circle_radius'], 1, gl.FLOAT, false, BYTES_PER_VERTEX, 16);
        gl.vertexAttribPointer(att['a_circle_color'], 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 20);
        gl.uniform1f(uni['scaleY'], this.canvas.width / this.canvas.height);
        gl.uniform1f(uni['scale'], 2 / this.canvas.width);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);
    }
}
SelectionDrawer.vertexShader = [
    "precision highp float;",
    "attribute vec2 a_position;",
    "attribute vec2 a_circle_position;",
    "attribute float a_circle_radius;",
    "attribute vec4 a_circle_color;",
    "varying vec2 v_circle_position;",
    "varying vec2 v_frag_position;",
    "varying float v_circle_radius;",
    "varying vec4 v_circle_color;",
    "uniform float scaleY;",
    "void main() {",
    "    gl_Position = vec4(a_position, 0.0, 1.0);",
    "    v_circle_position = a_circle_position;",
    "    v_frag_position = a_position;",
    "    v_circle_radius = a_circle_radius;",
    "    v_circle_color = a_circle_color;",
    "}",
].join("\n");
SelectionDrawer.fragmentShader = [
    "precision highp float;",
    "varying vec2 v_circle_position;",
    "varying vec2 v_frag_position;",
    "varying float v_circle_radius;",
    "varying vec4 v_circle_color;",
    "uniform float scaleY;",
    "uniform float scale;",
    "void main() {",
    "    float xDif = v_frag_position.x - v_circle_position.x;",
    "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
    "    float dist = xDif * xDif + yDif * yDif;",
    "    float radi = v_circle_radius - scale;",
    "    if (dist <= (v_circle_radius * v_circle_radius) && dist >= (radi * radi)) {",
    "        gl_FragColor = v_circle_color;",
    "    } else {",
    "        discard;",
    "    }",
    "}",
].join("\n");
SelectionDrawer.fragmentShaderDashed = [
    "precision highp float;",
    "varying vec2 v_circle_position;",
    "varying vec2 v_frag_position;",
    "varying float v_circle_radius;",
    "varying vec4 v_circle_color;",
    "uniform float scaleY;",
    "uniform float scale;",
    "void main() {",
    "    float xDif = v_frag_position.x - v_circle_position.x;",
    "    float yDif = (v_frag_position.y - v_circle_position.y) / scaleY;",
    "    float angl = atan(yDif, xDif);",
    "    float dist = xDif * xDif + yDif * yDif;",
    "    float radi = v_circle_radius - scale;",
    "    if (dist <= (v_circle_radius * v_circle_radius) && dist >= (radi * radi) && mod(angl, 0.39269908169872415480783042290994) >= 0.19634954084936207740391521145497) {",
    "        gl_FragColor = v_circle_color;",
    "    } else {",
    "        discard;",
    "    }",
    "}",
].join("\n");
//# sourceMappingURL=selection_drawer.js.map