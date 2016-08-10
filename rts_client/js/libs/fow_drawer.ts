class FOWDrawer {
    private program: MetaProgram;
    private canvas: HTMLCanvasElement;
    private smallCanvas: HTMLCanvasElement;
    private buffer: WebGLBuffer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.smallCanvas = document.createElement('canvas');
        let gl = <WebGLRenderingContext>this.smallCanvas.getContext('webgl');
        this.program = new MetaProgram(gl, createProgram(gl, FOWDrawer.vertexShader, FOWDrawer.fragmentShader));
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
    }

    public draw(x: number, y: number, scale: number, circles: { x: number, y: number, r: number }[]) {
        x = Math.floor(x) / 4;
        y = Math.floor(y) / 4;
        scale = scale / 4;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.smallCanvas.width = this.canvas.offsetWidth / 4;
        this.smallCanvas.height = this.canvas.offsetHeight / 4;

        const FLOATS_PER_UNIT = 30;
        let drawData = new Float32Array(FLOATS_PER_UNIT * circles.length);
        let xm = Game.TILESIZE / this.smallCanvas.width;
        let ym = Game.TILESIZE / this.smallCanvas.height;

        for (let i = 0, n = 0; n < circles.length; n++) {
            let circle = circles[n];
            // Scale all coords to 1/4th their size (to match small canvas)
            // GL Coords go from -1 to 1
            // If they went from 0 to 1 we wouldn't need to double the radius
            circle.r = (circle.r / 4) * 2;
            circle.x = circle.x / 4;
            circle.y = circle.y / 4;

            // Normalize X & Y
            // ScrnX = ((x - ScrnL) / ScrnW) * 2 - 1
            let normX = ((circle.x - (x - this.smallCanvas.width / 2)) / this.smallCanvas.width) * 2 - 1;
            let normY = ((circle.y - (y - this.smallCanvas.height / 2)) / this.smallCanvas.height) * 2 - 1;
            
            // Coordinates of each corner on the sprite
            let east = normX + circle.r * xm;
            let north = normY + circle.r * ym;
            let west = normX - circle.r * xm;
            let south = normY - circle.r * ym;
            let radius = circle.r * xm;

            // Fill array with scaled vertices
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

        let gl = <WebGLRenderingContext>this.smallCanvas.getContext('webgl');
        gl.clearColor(0, 0, 0, 0.75);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.smallCanvas.width, this.smallCanvas.height);
        gl.useProgram(this.program.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawData, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.program.attribute['a_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_position']);
        gl.enableVertexAttribArray(this.program.attribute['a_circle_radius']);
        gl.vertexAttribPointer(this.program.attribute['a_position'], 2, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(this.program.attribute['a_circle_position'], 2, gl.FLOAT, false, 20, 8);
        gl.vertexAttribPointer(this.program.attribute['a_circle_radius'], 1, gl.FLOAT, false, 20, 16);
        gl.uniform1f(this.program.uniform['scaleY'], this.smallCanvas.width / this.smallCanvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6 * circles.length);

        let ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
        ctx.drawImage(this.smallCanvas, 0, 0, this.smallCanvas.width, this.smallCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
    }

    private static rotateAroundOrigin(cx: number, cy: number, x: number, y: number, ang: number): { x: number, y: number } {
        // translate point to origin
        let tempX = x - cx;
        let tempY = y - cy;
        let cos = Math.cos(ang);
        let sin = Math.sin(ang);

        // now apply rotation
        let rotatedX = tempX * cos - tempY * sin;
        let rotatedY = tempX * sin + tempY * cos;

        // translate back
        x = rotatedX + cx;
        y = rotatedY + cy;

        return { x: x, y: y };
    }

    private static vertexShader = [
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

    private static fragmentShader = [
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
}