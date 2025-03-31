import {cam2_t} from "@cl/cam2.ts";
import {vec2_t, vec4_t} from "@cl/type.ts";
import {vec3_pack256} from "@cl/vec3";
import {gl, gl_link_program} from "@engine/gl.ts";

const line_prog = {} as {
    id: WebGLProgram,
    u_projection: WebGLUniformLocation,
    u_view: WebGLUniformLocation,
    u_cap_type: WebGLUniformLocation,
    u_join_type: WebGLUniformLocation,
    u_instance_count: WebGLUniformLocation
};
const capjoin_prog = {} as {
    id: WebGLProgram,
    u_projection: WebGLUniformLocation,
    u_view: WebGLUniformLocation,
    u_cap_type: WebGLUniformLocation,
    u_join_type: WebGLUniformLocation,
    u_instance_count: WebGLUniformLocation
};

let tbo: WebGLTexture;

const px_per_instance = 2;
const stride = 8;

export enum LINE_CAP_TYPE {
    NONE,
    SQUARE,
    TRIANGLE,
    ARROW,
    ROUND
};

export enum LINE_JOIN_TYPE {
    NONE,
    BEVEL,
    MITER,
    ROUND
};

export class line_rdata_t {
    data: Float32Array;
    size: number;
    instances: Float32Array[];
    cap_type: LINE_CAP_TYPE;
    join_type: LINE_JOIN_TYPE;
};

export function line_rdata_new(): line_rdata_t {
    const rdata = new line_rdata_t();
    rdata.data = new Float32Array(0);
    rdata.size = 0;
    rdata.instances = [];
    rdata.cap_type = LINE_CAP_TYPE.NONE;
    rdata.join_type = LINE_JOIN_TYPE.NONE;

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

export function line_rdata_instance(rdata: line_rdata_t, index: number, point: vec2_t, width: number, forward: number, color: vec4_t) {
    const instance = rdata.instances[index];

    instance[0] = point[0];
    instance[1] = point[1];
    instance[2] = width;
    instance[3] = 0.0;
    instance[4] = forward;
    instance[5] = 0;
    instance[6] = vec3_pack256(color[0], color[1], color[2]);
    instance[7] = color[3];
};

export function line_rend_init() {
    // line prog
    line_prog.id = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform int u_instance_count;
            uniform sampler2D u_texture;
            uniform int u_cap_type;
            uniform int u_join_type;
            out vec4 v_color;

            const int PX_PER_INSTANCE = 2;

            vec2 offsets[4] = vec2[](
                vec2(-0.5, 0.0),
                vec2(0.5, 0.0),
                vec2(-0.5, 1.0),
                vec2(0.5, 1.0)
            );

            vec3 unpack256(float value) {
                float r = mod(value, 256.0) / 255.0;
                float g = mod(floor(value / 256.0), 256.0) / 255.0;
                float b = mod(floor(value / 65536.0), 256.0) / 255.0;

                return vec3(r, g, b);
            }

            void main() {
                int curr = gl_InstanceID * PX_PER_INSTANCE;
                vec4 curr1 = texelFetch(u_texture, ivec2(curr + 1, 0), 0);

                if (curr1.x == 0.0) {
                    return;
                }

                vec4 curr0 = texelFetch(u_texture, ivec2(curr, 0), 0);

                int prev = ((gl_InstanceID - 1 + u_instance_count) % u_instance_count) * PX_PER_INSTANCE;
                vec4 prev0 = texelFetch(u_texture, ivec2(prev, 0), 0);
                vec4 prev1 = texelFetch(u_texture, ivec2(prev + 1, 0), 0);

                int next = ((gl_InstanceID + 1) % u_instance_count) * PX_PER_INSTANCE;
                vec4 next0 = texelFetch(u_texture, ivec2(next, 0), 0);
                vec4 next1 = texelFetch(u_texture, ivec2(next + 1, 0), 0);

                vec2 point_curr = curr0.xy;
                float width_curr = curr0.z;
                vec4 color_curr = vec4(unpack256(curr1.z), curr1.w);

                vec2 point_next = next0.xy;
                float width_next = next0.z;
                vec4 color_next = vec4(unpack256(next1.z), next1.w);

                vec2 dir = normalize(point_next - point_curr);
                vec2 perp = vec2(-dir.y, dir.x);

                float dx = offsets[gl_VertexID].x, dy = offsets[gl_VertexID].y;
                bool is_cap = !(curr1.x == 0.0 && next1.x == 0.0) && (curr1.x == 0.0 || next1.x == 0.0);
                vec2 offset = (is_cap && u_cap_type == 3) ? dir * width_next * 2.0 * dy : vec2(0.0);
                vec2 point = mix(point_curr, point_next, dy) - offset;
                float width = mix(width_curr, width_next, dy);
                vec4 color = mix(color_curr, color_next, dy);

                vec2 position = point + perp * width * dx;

                gl_Position = u_projection * u_view * vec4(position, 0.0, 1.0);
                v_color = color;
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            out vec4 o_frag_color;
            in vec4 v_color;

            void main() {
                o_frag_color = v_color;
            }
        `
    })!;

    line_prog.u_projection = gl.getUniformLocation(line_prog.id, "u_projection")!;
    line_prog.u_view = gl.getUniformLocation(line_prog.id, "u_view")!;
    line_prog.u_instance_count = gl.getUniformLocation(line_prog.id, "u_instance_count")!;
    line_prog.u_cap_type = gl.getUniformLocation(line_prog.id, "u_cap_type")!;
    line_prog.u_join_type = gl.getUniformLocation(line_prog.id, "u_join_type")!;

    // capjoin prog
    capjoin_prog.id = gl_link_program({
        [gl.VERTEX_SHADER]: `#version 300 es
            uniform mat4 u_projection;
            uniform mat4 u_view;
            uniform int u_instance_count;
            uniform int u_cap_type;
            uniform int u_join_type;
            uniform sampler2D u_texture;
            out vec4 v_color;
            out vec2 v_tex_coord;
            flat out int v_is_cap;
            flat out int v_is_join;

            const int PX_PER_INSTANCE = 2;

            vec2 offsets[4] = vec2[](
                vec2(-0.5, 0.0),
                vec2(0.5, 0.0),
                vec2(-0.5, 1.0),
                vec2(0.5, 1.0)
            );

            const vec2 tex_coords[4] = vec2[](
                vec2(0.0, 0.0),
                vec2(1.0, 0.0),
                vec2(0.0, 1.0),
                vec2(1.0, 1.0)
            );

            vec3 unpack256(float value) {
                float r = mod(value, 256.0) / 255.0;
                float g = mod(floor(value / 256.0), 256.0) / 255.0;
                float b = mod(floor(value / 65536.0), 256.0) / 255.0;

                return vec3(r, g, b);
            }

            void main() {
                int prev = ((gl_InstanceID - 1 + u_instance_count) % u_instance_count) * PX_PER_INSTANCE;
                int curr = gl_InstanceID * PX_PER_INSTANCE;

                vec4 prev1 = texelFetch(u_texture, ivec2(prev + 1, 0), 0);
                vec4 curr1 = texelFetch(u_texture, ivec2(curr + 1, 0), 0);

                if (prev1.x == 0.0 && curr1.x == 0.0) {
                    return;
                }

                int next = ((gl_InstanceID + 1) % u_instance_count) * PX_PER_INSTANCE;

                vec4 prev0 = texelFetch(u_texture, ivec2(prev, 0), 0);
                vec4 curr0 = texelFetch(u_texture, ivec2(curr, 0), 0);
                vec4 next0 = texelFetch(u_texture, ivec2(next, 0), 0);

                vec2 point_prev = prev0.xy;

                vec2 point_curr = curr0.xy;
                float width_curr = curr0.z;
                vec4 color_curr = vec4(unpack256(curr1.z), curr1.w);

                vec2 point_next = next0.xy;

                vec2 position;
                vec4 color;
                vec2 tex_coord;

                // cap or join
                if (prev1.x == 0.0 || curr1.x == 0.0) {
                    vec2 point_adj = prev1.x == 0.0 ? point_next : point_prev;
                    vec2 dir = normalize(point_curr - point_adj);
                    vec2 perp = vec2(-dir.y, dir.x);
                    float dx = offsets[gl_VertexID].x, dy = offsets[gl_VertexID].y;

                    if (u_cap_type == 1) {
                        vec2 point = mix(point_curr, point_curr + dir * width_curr / 2.0, dy);

                        position = point + perp * width_curr * dx;
                    } else if (u_cap_type == 2) {
                        vec2 point = mix(point_curr, point_curr + dir * width_curr / 2.0, dy);
                        float factor = gl_VertexID < 2 ? 1.0 : 0.0;

                        position = point + perp * width_curr * dx * factor;
                    } else if (u_cap_type == 3 && prev1.x == 1.0) {
                        vec2 point = mix(point_curr - dir * width_curr * 2.0, point_curr, dy);
                        float factor = gl_VertexID < 2 ? 1.0 : 0.0;

                        position = point + perp * width_curr * dx * factor * 2.0;
                    } else if (u_cap_type == 4) {
                        vec2 point = mix(point_curr - dir * width_curr / 2.0, point_curr + dir * width_curr / 2.0, dy);

                        position = point + perp * width_curr * dx;
                        tex_coord = tex_coords[gl_VertexID];
                    }

                    color = color_curr;
                    v_is_cap = 1;
                } else {
                    vec2 dir_prev = normalize(point_curr - point_prev);
                    vec2 perp_prev = vec2(-dir_prev.y, dir_prev.x);
                    vec2 dir_curr = normalize(point_next - point_curr);
                    vec2 perp_curr = vec2(-dir_curr.y, dir_curr.x);
                    float width = width_curr / 2.0;
                    float sigma = sign(dot(dir_prev, perp_curr));
                    vec2 point0 = point_curr + perp_prev * width * sigma;
                    vec2 point1 = point_curr + perp_curr * width * sigma;
                    float dx = offsets[gl_VertexID].x, dy = offsets[gl_VertexID].y;

                    if (u_join_type == 1) {
                        offsets[0] = point_curr;
                        offsets[1] = point0;
                        offsets[2] = point1;
                        offsets[3] = point_curr;

                        position = offsets[gl_VertexID];
                        color = color_curr;
                    } else if (u_join_type == 2) {
                        vec2 miter_dir = normalize(dir_prev - dir_curr);
                        float miter_length = width / dot(miter_dir, perp_prev);
                        vec2 miter = point_curr + miter_dir * miter_length * sigma;

                        offsets[0] = point_curr;
                        offsets[1] = point0;
                        offsets[2] = point1;
                        offsets[3] = miter;

                        position = offsets[gl_VertexID];
                        color = color_curr;
                    } else if (u_join_type == 3) {
                        vec2 point = mix(point_curr - dir_curr * width, point_curr + dir_curr * width, dy);
                        position = point + perp_curr * width_curr * dx;

                        color = color_curr;
                        tex_coord = tex_coords[gl_VertexID];
                    }

                    color = color_curr;
                    v_is_join = 1;
                }

                gl_Position = u_projection * u_view * vec4(position, 0.0, 1.0);
                v_color = color;
                v_tex_coord = tex_coord;
            }
        `,
        [gl.FRAGMENT_SHADER]: `#version 300 es
            precision highp float;
            out vec4 o_frag_color;
            in vec2 v_tex_coord;
            in vec4 v_color;
            flat in int v_is_cap;
            flat in int v_is_join;
            uniform highp int u_cap_type;
            uniform highp int u_join_type;
            uniform sampler2D u_texture;

            void main() {
                if (v_is_cap == 1 && u_cap_type == 4 || v_is_join == 1 && u_join_type == 3) {
                    vec2 uv = v_tex_coord;
                    vec2 cp = uv * 2.0 - 1.0;

                    if (cp.x * cp.x + cp.y * cp.y > 1.0) {
                        discard;
                    }
                }

                o_frag_color = v_color;
            }
        `
    })!;

    capjoin_prog.u_projection = gl.getUniformLocation(capjoin_prog.id, "u_projection")!;
    capjoin_prog.u_view = gl.getUniformLocation(capjoin_prog.id, "u_view")!;
    capjoin_prog.u_instance_count = gl.getUniformLocation(capjoin_prog.id, "u_instance_count")!;
    capjoin_prog.u_cap_type = gl.getUniformLocation(capjoin_prog.id, "u_cap_type")!;
    capjoin_prog.u_join_type = gl.getUniformLocation(capjoin_prog.id, "u_join_type")!;
}

export function line_rend_build(rdata: line_rdata_t) {
    tbo = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tbo);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, rdata.size * px_per_instance, 1, 0, gl.RGBA, gl.FLOAT, rdata.data);
}

export function line_rend_render(rdata: line_rdata_t, camera: cam2_t): void {
    gl.bindTexture(gl.TEXTURE_2D, tbo);

    gl.useProgram(line_prog.id);
    gl.uniformMatrix4fv(line_prog.u_projection, false, camera.projection);
    gl.uniformMatrix4fv(line_prog.u_view, false, camera.view);
    gl.uniform1i(line_prog.u_instance_count, rdata.size);
    gl.uniform1i(line_prog.u_cap_type, rdata.cap_type);
    gl.uniform1i(line_prog.u_join_type, rdata.join_type);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rdata.size);

    gl.useProgram(capjoin_prog.id);
    gl.uniformMatrix4fv(capjoin_prog.u_projection, false, camera.projection);
    gl.uniformMatrix4fv(capjoin_prog.u_view, false, camera.view);
    gl.uniform1i(capjoin_prog.u_instance_count, rdata.size);
    gl.uniform1i(capjoin_prog.u_cap_type, rdata.cap_type);
    gl.uniform1i(capjoin_prog.u_join_type, rdata.join_type);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, rdata.size);
}
