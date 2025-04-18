import {gl, gl_link_program} from "@engine/gl.ts";
import {cam2_t} from "@cl/camera/cam2.ts";
import {vec3_clone, vec3_t} from "@cl/math/vec3.ts";

let program: WebGLProgram;
let u_lower_color: WebGLUniformLocation;
let u_upper_color: WebGLUniformLocation;
let u_position: WebGLUniformLocation;
let u_time: WebGLUniformLocation;

export class bg_rdata_t {
    lower_color: vec3_t;
    upper_color: vec3_t;
};

export function bg_rdata_new(lower_color: vec3_t, upper_color: vec3_t): bg_rdata_t {
    const background = new bg_rdata_t();
    background.lower_color = vec3_clone(lower_color);
    background.upper_color = vec3_clone(upper_color);

    return background;
}

export function bg_rend_init() {
    program = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            out vec2 v_tex_coord;

            const vec2 positions[4] = vec2[](
                vec2(-1.0, -1.0),
                vec2(1.0, -1.0),
                vec2(-1.0, 1.0),
                vec2(1.0, 1.0)
            );

            const vec2 tex_coords[4] = vec2[](
                vec2(0.0, 0.0),
                vec2(1.0, 0.0),
                vec2(0.0, 1.0),
                vec2(1.0, 1.0)
            );

            void main() {
                vec2 position = positions[gl_VertexID];
                gl_Position = vec4(position, 0.0, 1.0);
                v_tex_coord = tex_coords[gl_VertexID];
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            in vec2 v_tex_coord;
            uniform vec3 u_lower_color;
            uniform vec3 u_upper_color;
            uniform vec2 u_position;
            uniform float u_time;
            out vec4 o_frag_color;

            void main() {
                vec2 uv = v_tex_coord;
                vec3 color = mix(u_lower_color, u_upper_color, uv.y);

                o_frag_color = vec4(color, 1.0);
            }
        `
    })!;

    u_lower_color = gl.getUniformLocation(program, "u_lower_color")!;
    u_upper_color = gl.getUniformLocation(program, "u_upper_color")!;
    u_position = gl.getUniformLocation(program, "u_position")!;
    u_time = gl.getUniformLocation(program, "u_time")!;
}

export function bg_rend_render(bg_rdata: bg_rdata_t, camera: cam2_t, time: number) {
    gl.useProgram(program);
    gl.uniform2fv(u_position, camera.position);
    gl.uniform3fv(u_lower_color, bg_rdata.lower_color);
    gl.uniform3fv(u_upper_color, bg_rdata.upper_color);
    gl.uniform1f(u_time, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
