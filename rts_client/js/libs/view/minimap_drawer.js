var MinimapDrawer = (function () {
    function MinimapDrawer(canvas, spritemap) {
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
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
    MinimapDrawer.prototype.draw = function (sprites) {
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_VERT = 4;
        var FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprite.ref);
            var hw = xywh.w; // Half width
            var hh = xywh.h; // Half height
            // Normalize X & Y
            // ScrnX = x * 2 - 1
            var normX = sprite.x * 2 - 1;
            var normY = sprite.y * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + hw;
            var north = normY + hh;
            var west = normX - hw;
            var south = normY - hh;
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
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
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
    };
    MinimapDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "varying vec2 v_texture_coord;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");
    MinimapDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    gl_FragColor = texture2D(u_sampler, v_texture_coord);",
        "}",
    ].join("\n");
    return MinimapDrawer;
}());
//# sourceMappingURL=minimap_drawer.js.map