var UnitDrawer = (function () {
    function UnitDrawer(canvas, spritemap) {
        this.atlasWidth = 0;
        this.atlasHeight = 0;
        var self = this;
        this.canvas = canvas;
        var gl = this.canvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, UnitDrawer.vertexShader, UnitDrawer.fragmentShader));
        this.spriteAtlas = gl.createTexture();
        this.spriteMap = spritemap;
        this.spriteSheet = spritemap.spriteSheet;
        gl.bindTexture(gl.TEXTURE_2D, self.spriteAtlas);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spritemap.spriteSheet);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }
    UnitDrawer.prototype.draw = function (x, y, scale, sprites) {
        x = Math.floor(x);
        y = Math.floor(y);
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        var xm = SpriteMap.WIDTH / this.canvas.width;
        var ym = SpriteMap.HEIGHT / this.canvas.height;
        var FLOATS_PER_UNIT = 24;
        var drawData = new Float32Array(FLOATS_PER_UNIT * sprites.length);
        for (var i = 0, n = 0; n < sprites.length; n++) {
            var sprite = sprites[n];
            var xywh = this.spriteMap.coords(sprites[n].ref);
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
            var ne = UnitDrawer.rotateAroundOrigin(normX, normY, east, north, sprite.ang);
            var sw = UnitDrawer.rotateAroundOrigin(normX, normY, west, south, sprite.ang);
            var nw = UnitDrawer.rotateAroundOrigin(normX, normY, west, north, sprite.ang);
            var se = UnitDrawer.rotateAroundOrigin(normX, normY, east, south, sprite.ang);
            // Fill array with scaled vertices
            drawData[i + 0] = normX - (normX - sw.x) * xm;
            drawData[i + 1] = normY - (normY - sw.y) * ym;
            drawData[i + 2] = xywh.x;
            drawData[i + 3] = xywh.y + xywh.h;
            drawData[i + 4] = normX - (normX - se.x) * xm;
            drawData[i + 5] = normY - (normY - se.y) * ym;
            drawData[i + 6] = xywh.x + xywh.w;
            drawData[i + 7] = xywh.y + xywh.h;
            drawData[i + 8] = normX - (normX - ne.x) * xm;
            drawData[i + 9] = normY - (normY - ne.y) * ym;
            drawData[i + 10] = xywh.x + xywh.w;
            drawData[i + 11] = xywh.y;
            drawData[i + 12] = normX - (normX - sw.x) * xm;
            drawData[i + 13] = normY - (normY - sw.y) * ym;
            drawData[i + 14] = xywh.x;
            drawData[i + 15] = xywh.y + xywh.h;
            drawData[i + 16] = normX - (normX - ne.x) * xm;
            drawData[i + 17] = normY - (normY - ne.y) * ym;
            drawData[i + 18] = xywh.x + xywh.w;
            drawData[i + 19] = xywh.y;
            drawData[i + 20] = normX - (normX - nw.x) * xm;
            drawData[i + 21] = normY - (normY - nw.y) * ym;
            drawData[i + 22] = xywh.x;
            drawData[i + 23] = xywh.y;
            i += FLOATS_PER_UNIT;
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
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(this.program.attribute['a_texture_coord'], 2, gl.FLOAT, false, 16, 8);
        gl.uniform2f(this.program.uniform['viewOffset'], x * xm, y * ym);
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(this.program.uniform['sprites'], 2);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteAtlas);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * sprites.length);
    };
    UnitDrawer.rotateAroundOrigin = function (cx, cy, x, y, ang) {
        // translate point to origin
        var tempX = x - cx;
        var tempY = y - cy;
        var cos = Math.cos(ang);
        var sin = Math.sin(ang);
        // now apply rotation
        var rotatedX = tempX * cos - tempY * sin;
        var rotatedY = tempX * sin + tempY * cos;
        // translate back
        x = rotatedX + cx;
        y = rotatedY + cy;
        return { x: x, y: y };
    };
    UnitDrawer.vertexShader = [
        "precision highp float;",
        "attribute vec2 a_position;",
        "attribute vec2 a_texture_coord;",
        "varying vec2 v_texture_coord;",
        "void main() {",
        "    gl_Position = vec4(a_position, 0.0, 1.0);",
        "    v_texture_coord = a_texture_coord;",
        "}",
    ].join("\n");
    UnitDrawer.fragmentShader = [
        "precision highp float;",
        "varying vec2 v_texture_coord;",
        "uniform sampler2D u_sampler;",
        "void main() {",
        "    gl_FragColor = texture2D(u_sampler, v_texture_coord);",
        "}",
    ].join("\n");
    return UnitDrawer;
})();
//# sourceMappingURL=unit_drawer.js.map