import {cam2_t} from "@cl/cam2.ts";
import {vec2_t, vec4_t} from "@cl/type.ts";
import {vec4_bitpack256v} from "@cl/vec4.ts";
import {gl, gl_link_program} from "@engine/gl.ts";
import {ATTRIB_TYPE, layout_attrib, layout_build_gl, layout_new} from "@engine/layout.ts";

let program: WebGLProgram;
let u_projection: WebGLUniformLocation;
let u_view: WebGLUniformLocation;

let vao: WebGLVertexArrayObject;
let vbo: WebGLBuffer;

const layout = layout_new();
layout_attrib(layout, ATTRIB_TYPE.F32, 3);
layout_attrib(layout, ATTRIB_TYPE.F32, 1);
layout_attrib(layout, ATTRIB_TYPE.S32, 1);
layout_attrib(layout, ATTRIB_TYPE.S32, 1);
layout_attrib(layout, ATTRIB_TYPE.F32, 1);

export class circle_rdata_t {
    data: ArrayBuffer;
    len: number;
    cap: number;
    instances: DataView[];
};

export function circle_rdata_new(): circle_rdata_t {
    const rdata = new circle_rdata_t();
    rdata.data = new ArrayBuffer(0);
    rdata.len = 0;
    rdata.cap = 0;
    rdata.instances = [];

    return rdata;
}

export function circle_rdata_build(rdata: circle_rdata_t, cap: number): void {
    const data = new ArrayBuffer(cap * layout.stride);
    const instances: DataView[] = [];

    for (let i = 0; i < cap; i += 1) {
        instances.push(new DataView(data, i * layout.stride, layout.stride));
    }

    rdata.data = data;
    rdata.len = cap;
    rdata.cap = cap;
    rdata.instances = instances;
}

export function circle_rdata_instance(rdata: circle_rdata_t, index: number, position: vec2_t, radius: number, zindex: number, inner_color: vec4_t, outer_color: vec4_t, outline: number) {
    const instance = rdata.instances[index];

    instance.setFloat32(0, position[0], true);
    instance.setFloat32(4, position[1], true);
    instance.setFloat32(8, zindex, true);
    instance.setFloat32(12, radius, true);
    instance.setInt32(16, vec4_bitpack256v(inner_color), true);
    instance.setInt32(20, vec4_bitpack256v(outer_color), true);
    instance.setFloat32(24, outline, true);
};

export function circle_rend_init() {
    program = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            layout(location = 0) in vec3 i_position;
            layout(location = 1) in float i_radius;
            layout(location = 2) in int i_inner_color;
            layout(location = 3) in int i_outer_color;
            layout(location = 4) in float i_outline;
            flat out float v_radius;
            flat out int v_inner_color;
            flat out int v_outer_color;
            flat out float v_outline;
            out vec2 v_tex_coord;
            uniform mat4 u_projection;
            uniform mat4 u_view;

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
                vec2 position = positions[gl_VertexID] * i_radius + i_position.xy;

                gl_Position = u_projection * u_view * vec4(position, i_position.z, 1.0);
                v_radius = i_radius;
                v_inner_color = i_inner_color;
                v_outer_color = i_outer_color;
                v_outline = i_outline;
                v_tex_coord = tex_coords[gl_VertexID];
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            out vec4 o_frag_color;
            flat in float v_radius;
            flat in int v_inner_color;
            flat in int v_outer_color;
            flat in float v_outline;
            in vec2 v_tex_coord;

            vec4 unpack256(int packed) {
                return vec4(
                    (packed >> 24) & 0xFF,
                    (packed >> 16) & 0xFF,
                    (packed >> 8) & 0xFF,
                    packed & 0xFF
                ) / 255.0;
            }

            void main() {
                vec2 uv = v_tex_coord;
                vec2 cp = uv * 2.0 - 1.0;
                float l = length(cp);
                vec4 inner_color = unpack256(v_inner_color);
                vec4 outer_color = unpack256(v_outer_color);
                float alias_width = fwidth(l);
                float inner_mask = smoothstep(1.0 - v_outline / v_radius, 1.0 - alias_width, l);
                vec4 color = mix(inner_color, outer_color, inner_mask);
                color.w *= smoothstep(1.0, 1.0 - alias_width, l);

                o_frag_color = color;
            }
        `
    })!;

    u_projection = gl.getUniformLocation(program, "u_projection")!;
    u_view = gl.getUniformLocation(program, "u_view")!;
}

export function circle_rend_build(rdata: circle_rdata_t) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, rdata.data, gl.STATIC_DRAW);

    layout_build_gl(layout, true);
}

export function circle_rend_render(rdata: circle_rdata_t, camera: cam2_t): void {
    gl.useProgram(program);
    gl.uniformMatrix4fv(u_projection, false, camera.projection);
    gl.uniformMatrix4fv(u_view, false, camera.view);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, rdata.data);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rdata.len);
}
