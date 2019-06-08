class MinimapBoxDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        let gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, MinimapBoxDrawer.vertexShader, MinimapBoxDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    draw(x, y, x2, y2) {
        let drawData = new Float32Array(8);
        let west = Math.min(x, x2);
        let east = Math.max(x, x2);
        let south = Math.min(y, y2);
        let north = Math.max(y, y2);
        // Fill array with vertices
        drawData[0] = west;
        drawData[1] = south;
        drawData[2] = west;
        drawData[3] = north;
        drawData[4] = east;
        drawData[5] = north;
        drawData[6] = east;
        drawData[7] = south;
        let gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 8, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    }
}
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
//# sourceMappingURL=minimap_box_drawer.js.map