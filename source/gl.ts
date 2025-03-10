export let gl: WebGL2RenderingContext;

export function gl_init(canvas_el: HTMLCanvasElement): WebGL2RenderingContext {
    return gl = canvas_el.getContext("webgl2") as WebGL2RenderingContext;
}

export function gl_compile_shader(type: GLenum, source: string): WebGLShader|null {
    const shader = gl.createShader(type);

    if (!shader) {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const compile_status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!compile_status) {
        const info_log = gl.getShaderInfoLog(shader);
        console.error(info_log);
        gl.deleteShader(shader);

        return null;
    }

    return shader;
}

export function gl_link_program(shaders: {[type: GLenum]: string}): WebGLProgram|null {
    const program = gl.createProgram();
    const compiled_shaders: WebGLShader[] = [];

    for (const type in shaders) {
        const source = shaders[type];
        const shader = gl_compile_shader(parseInt(type), source);

        if (!shader) {
            for (const shader of compiled_shaders) {
                gl.deleteShader(shader);
            }

            return null;
        }

        compiled_shaders.push(shader);
    }

    for (const shader of compiled_shaders) {
        gl.attachShader(program, shader);
    }

    gl.linkProgram(program);

    for (const shader of compiled_shaders) {
        gl.detachShader(program, shader);
        gl.deleteShader(shader);
    }

    const link_status = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (!link_status) {
        const info_log = gl.getProgramInfoLog(program);
        console.error(info_log);
        gl.deleteProgram(program);

        return null;
    }

    return program;
}
