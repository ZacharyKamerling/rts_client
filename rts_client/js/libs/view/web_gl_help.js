function createProgram(ctx, vertShaderSrc, fragShaderSrc) {
    var createShader = function (ctx, shaderSrc, shaderType) {
        var shader = ctx.createShader(shaderType);
        ctx.shaderSource(shader, shaderSrc);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
            console.error(ctx.getShaderInfoLog(shader));
            ctx.deleteShader(shader);
            return null;
        }
        return shader;
    };
    var program = ctx.createProgram();
    var vertShader = createShader(ctx, vertShaderSrc, ctx.VERTEX_SHADER);
    var fragShader = createShader(ctx, fragShaderSrc, ctx.FRAGMENT_SHADER);
    ctx.attachShader(program, vertShader);
    ctx.attachShader(program, fragShader);
    ctx.linkProgram(program);
    if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        console.error("Program Link error:", ctx.getProgramInfoLog(program));
        ctx.deleteProgram(program);
        ctx.deleteShader(vertShader);
        ctx.deleteShader(fragShader);
        return null;
    }
    return program;
}
var MetaProgram = (function () {
    function MetaProgram(gl, program) {
        this.program = program;
        this.attribute = {};
        this.uniform = {};
        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < count; i++) {
            var attrib = gl.getActiveAttrib(program, i);
            this.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
        }
        count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < count; i++) {
            var uniform = gl.getActiveUniform(program, i);
            var name_1 = uniform.name.replace("[0]", "");
            this.uniform[name_1] = gl.getUniformLocation(program, name_1);
        }
    }
    return MetaProgram;
}());
