/*
cap
    none
    square
    triangle
    arrow
    round
join
    none
    bevel
    miter
    round
*/

import {cam2_t} from "@cl/cam2.ts";
import {vec2_t, vec4_t} from "@cl/type.ts";
import { vec3_pack256 } from "@cl/vec3";
import {gl, gl_link_program} from "@engine/gl.ts";

let program: WebGLProgram;
let u_projection: WebGLUniformLocation;
let u_view: WebGLUniformLocation;
let u_instance_count: WebGLUniformLocation;

let tbo: WebGLTexture;

const px_per_instance = 2;
const stride = 6;

export class line_rdata_t {
    data: Float32Array;
    size: number;
    instances: Float32Array[];
};

export function line_rdata_new(): line_rdata_t {
    const rdata = new line_rdata_t();
    rdata.data = new Float32Array(0);
    rdata.size = 0;
    rdata.instances = [];

    return rdata;
}

export function line_rdata_build(rdata: line_rdata_t, size: number): void {
    const data = new Float32Array(size * stride);
    const instances: Float32Array[] = [];

    for (let i = 0; i < size; i += 1) {
        instances.push(new Float32Array(data.buffer, i * stride * 4, stride));
    }

    rdata.data = data;
    rdata.size = size;
    rdata.instances = instances;
}

export function line_rdata_instance(rdata: line_rdata_t, index: number, point: vec2_t, width: number, option: number, color: vec4_t) {
    const instance = rdata.instances[index];

    instance[0] = point[0];
    instance[1] = point[1];
    instance[2] = width;
    instance[3] = option;
    instance[4] = vec3_pack256(color[0], color[1], color[2]);
    instance[5] = color[3];
};

export function line_rend_init() {
    program = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform sampler2D u_texture;
            uniform int u_instance_count;
            out vec2 v_tex_coord;
            out vec4 v_color;

            const vec2 positions[4] = vec2[4](
                vec2(-0.5, -0.5),
                vec2(-0.5, 0.5),
                vec2(0.5, -0.5),
                vec2(0.5, 0.5)
            );

            const vec2 tex_coords[4] = vec2[4](
                vec2(0.0, 0.0),
                vec2(0.0, 1.0),
                vec2(1.0, 0.0),
                vec2(1.0, 1.0)
            );

            vec3 unpack256(float value) {
                float r = mod(value, 256.0) / 255.0;
                float g = mod(floor(value / 256.0), 256.0) / 255.0;
                float b = mod(floor(value / 65536.0), 256.0) / 255.0;

                return vec3(r, g, b);
            }

            void main() {
                int curr = gl_InstanceID * 2;
                int next = ((gl_InstanceID + 1) % u_instance_count) * 2;

                // prevent loop
                if (gl_InstanceID == u_instance_count - 1) {
                    return;
                }

                vec4 a0 = texelFetch(u_texture, ivec2(curr, 0), 0);
                vec4 a1 = texelFetch(u_texture, ivec2(curr + 1, 0), 0);
                vec4 b0 = texelFetch(u_texture, ivec2(next, 0), 0);
                vec4 b1 = texelFetch(u_texture, ivec2(next + 1, 0), 0);

                vec2 point0 = a0.xy;
                float width0 = a0.z;
                vec4 color0 = vec4(unpack256(a1.y), a1.z);

                vec2 point1 = b0.xy;
                float width1 = b0.z;
                vec4 color1 = vec4(unpack256(b1.y), b1.z);

                vec2 dir = normalize(point1 - point0);
                vec2 perp = vec2(-dir.y, dir.x);

                vec2 p = vec2(0.0);

                if (gl_VertexID == 0) {
                    p = point0 - perp / 2.0 * width0;
                    v_color = color0;
                } else if (gl_VertexID == 1) {
                    p = point1 - perp / 2.0 * width1;
                    v_color = color1;
                } else if (gl_VertexID == 2) {
                    p = point0 + perp / 2.0 * width0;
                    v_color = color0;
                } else {
                    p = point1 + perp / 2.0 * width1;
                    v_color = color1;
                }

                gl_Position = u_projection * u_view * vec4(p, 0.0, 1.0);
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            out vec4 o_frag_color;
            in vec2 v_tex_coord;
            in vec4 v_color;
            uniform sampler2D u_texture;

            void main() {
                o_frag_color = v_color;
            }
        `
    })!;

    u_projection = gl.getUniformLocation(program, "u_projection")!;
    u_view = gl.getUniformLocation(program, "u_view")!;
    u_instance_count = gl.getUniformLocation(program, "u_instance_count")!;
}

export function line_rend_build(rdata: line_rdata_t) {
    tbo = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tbo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, rdata.size * px_per_instance, 1, 0, gl.RGB, gl.FLOAT, rdata.data);
}

export function line_rend_render(rdata: line_rdata_t, camera: cam2_t): void {
    gl.bindTexture(gl.TEXTURE_2D, tbo);
    gl.useProgram(program);
    gl.uniformMatrix4fv(u_projection, false, camera.projection);
    gl.uniformMatrix4fv(u_view, false, camera.view);
    gl.uniform1i(u_instance_count, rdata.size);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rdata.size);
}
