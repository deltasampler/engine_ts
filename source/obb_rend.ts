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
layout_attrib(layout, ATTRIB_TYPE.F32, 2);
layout_attrib(layout, ATTRIB_TYPE.F32, 2);
layout_attrib(layout, ATTRIB_TYPE.F32, 1);
layout_attrib(layout, ATTRIB_TYPE.S32, 1);
layout_attrib(layout, ATTRIB_TYPE.S32, 1);
layout_attrib(layout, ATTRIB_TYPE.F32, 1);

export class obb_rdata_t {
    data: ArrayBuffer;
    size: number;
    instances: DataView[];
};

export function obb_rdata_new(): obb_rdata_t {
    const rdata = new obb_rdata_t();
    rdata.data = new ArrayBuffer(0);
    rdata.size = 0;
    rdata.instances = [];

    return rdata;
}

export function obb_rdata_build(rdata: obb_rdata_t, size: number): void {
    const data = new ArrayBuffer(size * layout.stride);
    const instances: DataView[] = [];

    for (let i = 0; i < size; i += 1) {
        instances.push(new DataView(data, i * layout.stride, layout.stride));
    }

    rdata.data = data;
    rdata.size = size;
    rdata.instances = instances;
}

export function obb_rdata_instance(rdata: obb_rdata_t, index: number, position: vec2_t, size: vec2_t, rotation: number, inner_color: vec4_t, outer_color: vec4_t, outline: number) {
    const instance = rdata.instances[index];

    instance.setFloat32(0, position[0], true);
    instance.setFloat32(4, position[1], true);
    instance.setFloat32(8, size[0], true);
    instance.setFloat32(12, size[1], true);
    instance.setFloat32(16, rotation, true);
    instance.setInt32(20, vec4_bitpack256v(inner_color), true);
    instance.setInt32(24, vec4_bitpack256v(outer_color), true);
    instance.setFloat32(28, outline, true);
};

export function obb_rend_init() {
    program = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            layout(location = 0) in vec2 i_position;
            layout(location = 1) in vec2 i_size;
            layout(location = 2) in float i_rotation;
            layout(location = 3) in int i_inner_color;
            layout(location = 4) in int i_outer_color;
            layout(location = 5) in float i_outline;
            out vec2 v_size;
            flat out int v_inner_color;
            flat out int v_outer_color;
            flat out float v_outline;
            out vec2 v_tex_coord;
            uniform mat4 u_projection;
            uniform mat4 u_view;

            const vec2 positions[4] = vec2[](
                vec2(-0.5, -0.5),
                vec2(0.5, -0.5),
                vec2(-0.5, 0.5),
                vec2(0.5, 0.5)
            );

            const vec2 tex_coords[4] = vec2[](
                vec2(0.0, 0.0),
                vec2(1.0, 0.0),
                vec2(0.0, 1.0),
                vec2(1.0, 1.0)
            );

            vec2 rotate(vec2 p, float r) {
                float c = cos(r), s = sin(r);

                return vec2(
                    p.x * c - p.y * s,
                    p.x * s + p.y * c
                );
            }

            void main() {
                vec2 position = rotate(positions[gl_VertexID] * i_size, i_rotation) + i_position;

                gl_Position = u_projection * u_view * vec4(position, 0.0, 1.0);
                v_size = i_size;
                v_inner_color = i_inner_color;
                v_outer_color = i_outer_color;
                v_outline = i_outline;
                v_tex_coord = tex_coords[gl_VertexID];
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            out vec4 o_frag_color;
            in vec2 v_size;
            in vec2 v_tex_coord;
            flat in int v_inner_color;
            flat in int v_outer_color;
            flat in float v_outline;
            in vec3 v_params;

            vec4 unpack256(int packed) {
                return vec4(
                    (packed >> 24) & 0xFF,
                    (packed >> 16) & 0xFF,
                    (packed >> 8) & 0xFF,
                    packed & 0xFF
                ) / 255.0;
            }

            float uv_border_width(vec2 uv, vec2 size) {
                float left = smoothstep(0.0, size.x, uv.x);
                float right = smoothstep(0.0, size.x, 1.0 - uv.x);
                float bottom = smoothstep(0.0, size.y, 1.0 - uv.y);
                float top = smoothstep(0.0, size.y, uv.y);

                return min(min(left, right), min(top, bottom));
            }

            void main() {
                vec2 uv = v_tex_coord;
                vec4 inner_color = unpack256(v_inner_color);
                vec4 outer_color = unpack256(v_outer_color);
                float mask = v_outline == 0.0 ? 1.0 : uv_border_width(uv, v_outline / v_size);
                vec4 color = mix(vec4(outer_color.xyz, 1.0), inner_color, mask);

                o_frag_color = color;
            }
        `
    })!;

    u_projection = gl.getUniformLocation(program, "u_projection")!;
    u_view = gl.getUniformLocation(program, "u_view")!;
}

export function obb_rend_build(rdata: obb_rdata_t) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rdata.data), gl.STATIC_DRAW);

    layout_build_gl(layout, true);
}

export function obb_rend_render(rdata: obb_rdata_t, camera: cam2_t): void {
    gl.useProgram(program);
    gl.uniformMatrix4fv(u_projection, false, camera.projection);
    gl.uniformMatrix4fv(u_view, false, camera.view);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, rdata.data);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rdata.size);
}
