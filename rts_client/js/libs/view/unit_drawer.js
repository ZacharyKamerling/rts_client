var UnitDrawer = (function () {
    function UnitDrawer(canvas, spritemap) {
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, UnitDrawer.vertexShader, UnitDrawer.fragmentShader));
        this.spriteTex = gl.createTexture();
        this.spriteMap = spritemap;
        gl.bindTexture(gl.TEXTURE_2D, self.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    UnitDrawer.prototype.draw = function (x, y, scale, sprites) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (this.canvas.width !== this.canvas.offsetWidth || this.canvas.height !== this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_VERT = 7;
        var FLOATS_PER_UNIT = FLOATS_PER_VERT * 6;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprite.ref);
            var hw = xywh.w; // Half width
            var hh = xywh.h; // Half height
            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            var normX = ((sprite.x - (x - this.canvas.width / 2)) / this.canvas.width) * 2 - 1;
            var normY = ((sprite.y - (y - this.canvas.height / 2)) / this.canvas.height) * 2 - 1;
            // Coordinates of each corner on the sprite
            var east = normX + hw;
            var north = normY + hh;
            var west = normX - hw;
            var south = normY - hh;
            var ne = Misc.rotateAroundOrigin(normX, normY, east, north, sprite.ang);
            var sw = Misc.rotateAroundOrigin(normX, normY, west, south, sprite.ang);
            var nw = Misc.rotateAroundOrigin(normX, normY, west, north, sprite.ang);
            var se = Misc.rotateAroundOrigin(normX, normY, east, south, sprite.ang);
            var red = sprite.teamColor.red;
            var green = sprite.teamColor.green;
            var blue = sprite.teamColor.blue;
            // Fill array with scaled vertices
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
            drawData[i++] = normX - (normX - se.x) * xm;
            drawData[i++] = normY - (normY - se.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
            drawData[i++] = normX - (normX - sw.x) * xm;
            drawData[i++] = normY - (normY - sw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y + xywh.h;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
            drawData[i++] = normX - (normX - ne.x) * xm;
            drawData[i++] = normY - (normY - ne.y) * ym;
            drawData[i++] = xywh.x + xywh.w;
            drawData[i++] = xywh.y;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
            drawData[i++] = normX - (normX - nw.x) * xm;
            drawData[i++] = normY - (normY - nw.y) * ym;
            drawData[i++] = xywh.x;
            drawData[i++] = xywh.y;
            drawData[i++] = red;
            drawData[i++] = green;
            drawData[i++] = blue;
        }
        var gl = this.canvas.getContext('webgl');
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_texture_coord']);
        gl.enableVertexAttribArray(this.program.attribute['a_rgb']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 28, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 28, 8);
        gl.vertexAttribPointer(this.program.attribute['a_rgb'], 3, gl.FLOAT, false, 28, 16);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.program.uniform['sprites'], 0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
        gl.disable(gl.BLEND);
    };
    UnitDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "attribute vec3 a_rgb;",
        "varying vec2 v_texture_coord;",
        "varying vec3 v_rgb;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "    v_rgb = a_rgb;",
        "}",
    ].join("\n");
    UnitDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "varying vec3 v_rgb;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    vec3 tc = v_rgb;",
        "    vec4 rgba = texture2D(u_sampler, v_texture_coord);",
        "    if (rgba.x == 1.0) {",
        "        gl_FragColor = vec4(tc.x * rgba.y, tc.y * rgba.y, tc.z * rgba.y, rgba.w);",
        "    } else {",
        "        gl_FragColor = rgba;",
        "    }",
        "}",
    ].join("\n");
    return UnitDrawer;
}());
//# sourceMappingURL=unit_drawer.js.map