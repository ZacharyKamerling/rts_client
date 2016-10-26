var SelectionDrawer = (function () {
    function SelectionDrawer(canvas) {
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, SelectionDrawer.vertexShader, SelectionDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    SelectionDrawer.prototype.draw = function (x, y, scale, circles) {
        x = Math.floor(x);
        y = Math.floor(y);
        scale = scale / 4;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var FLOATS_PER_UNIT = 48;
        var drawData = new Float32Array(FLOATS_PER_UNIT * circles.length);
        var xm = Game.TILESIZE / this.canvas.width;
        var ym = Game.TILESIZE / this.canvas.height;
        for (var i = 0, n = 0; n < circles.length; n++) {
            var circle = circles[n];
            // Scale all coords to 1/4th their size (to match small canvas)
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            circle.radius = circle.radius * 2;
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((circle.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((circle.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + circle.radius * xm;
            var north = normY + circle.radius * ym;
            var west = normX - circle.radius * xm;
            var south = normY - circle.radius * ym;
            var radius = circle.radius * xm;
            // Fill array with scaled vertices
            drawData[i++] = west;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
            drawData[i++] = east;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
            drawData[i++] = east;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
            drawData[i++] = west;
            drawData[i++] = south;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
            drawData[i++] = east;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
            drawData[i++] = west;
            drawData[i++] = north;
            drawData[i++] = normX;
            drawData[i++] = normY;
            drawData[i++] = radius;
            drawData[i++] = circle.r;
            drawData[i++] = circle.g;
            drawData[i++] = circle.b;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
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
        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);
    };
    SelectionDrawer.vertexShader = [
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
    SelectionDrawer.fragmentShader = [
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
    return SelectionDrawer;
})();
//# sourceMappingURL=selection_drawer.js.map