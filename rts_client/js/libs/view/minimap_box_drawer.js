var MinimapBoxDrawer = (function () {
    function MinimapBoxDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, MinimapBoxDrawer.vertexShader, MinimapBoxDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    MinimapBoxDrawer.prototype.draw = function (x, y, x2, y2) {
        var drawData = new Float32Array(8);
        var west = Math.min(x, x2);
        var east = Math.max(x, x2);
        var south = Math.min(y, y2);
        var north = Math.max(y, y2);
        drawData[0] = west;
        drawData[1] = south;
        drawData[2] = west;
        drawData[3] = north;
        drawData[4] = east;
        drawData[5] = north;
        drawData[6] = east;
        drawData[7] = south;
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    };
    MinimapBoxDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "}",
    ].join("\n");
    MinimapBoxDrawer.fragmentShader = [
        "precision highp float;",
        "void main() {",
        "    gl_FragColor = vec4(1, 1, 0, 1);",
        "}",
    ].join("\n");
    return MinimapBoxDrawer;
}());
