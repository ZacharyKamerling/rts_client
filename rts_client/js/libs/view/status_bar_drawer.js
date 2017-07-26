var StatusBarDrawer = (function () {
    function StatusBarDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, StatusBarDrawer.vertexShader, StatusBarDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    StatusBarDrawer.prototype.draw = function (x, y, scale, bars) {
        x = Math.floor(x * scale);
        y = Math.floor(y * scale);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var xm = 1 / this.canvas.width;
        var ym = 1 / this.canvas.height;
        var BYTES_PER_VERTEX = 16;
        var drawData = new ArrayBuffer(6 * BYTES_PER_VERTEX * bars.length);
        var floatView = new Float32Array(drawData);
        var uint8View = new Uint8Array(drawData);
        for (var n = 0; n < bars.length; n++) {
            var bar = bars[n];
            bar.x *= scale;
            bar.y *= scale;
            bar.w *= scale * 2;
            bar.h *= scale * 2;
            var normX = ((bar.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((bar.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            var east = normX + bar.w * xm;
            var north = normY + bar.h * ym;
            var west = normX - bar.w * xm;
            var south = normY - bar.h * ym;
            var value = west + (east - west) * bar.v;
            var vertFloatOff = n * 6 * BYTES_PER_VERTEX / 4;
            var vertUInt8Off = n * 6 * BYTES_PER_VERTEX + 12;
            var floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 0;
            var colorOff = vertUInt8Off + BYTES_PER_VERTEX * 0;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 1;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 1;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 2;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 2;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 3;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 3;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = south;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 4;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 4;
            floatView[floatOff + 0] = east;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
            floatOff = vertFloatOff + BYTES_PER_VERTEX / 4 * 5;
            colorOff = vertUInt8Off + BYTES_PER_VERTEX * 5;
            floatView[floatOff + 0] = west;
            floatView[floatOff + 1] = north;
            floatView[floatOff + 2] = value;
            uint8View[colorOff + 0] = bar.r;
            uint8View[colorOff + 1] = bar.g;
            uint8View[colorOff + 2] = bar.b;
            uint8View[colorOff + 3] = bar.a;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_bar_value']);
        gl.enableVertexAttribArray(this.program.attribute['a_bar_color']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
        gl.vertexAttribPointer(this.program.attribute['a_value'], 1, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
        gl.vertexAttribPointer(this.program.attribute['a_color'], 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 12);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * bars.length);
    };
    StatusBarDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute float a_value;",
        "attribute vec4 a_color;",
        "varying float v_position;",
        "varying float v_value;",
        "varying vec4 v_color;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_position = a_position.x;",
        "    v_value = a_value;",
        "    v_color = a_color;",
        "}",
    ].join("\n");
    StatusBarDrawer.fragmentShader = [
        "precision highp float;",
        "varying float v_position;",
        "varying float v_value;",
        "varying vec4 v_color;",
        "void main() {",
        "    if (v_position <= v_value) {",
        "        gl_FragColor = v_color;",
        "    } else {",
        "        gl_FragColor = vec4(0,0,0,v_color.a);",
        "    }",
        "}",
    ].join("\n");
    return StatusBarDrawer;
}());
