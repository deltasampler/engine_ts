import {vec3_t} from "@cl/type.ts";
import {index2} from "@cl/math.ts";
import {vec3} from "@cl/vec3.ts";

export class texture_t {
    width: number;
    height: number;
    data: Uint8Array;
}

export function texture_new(width: number, height: number): texture_t {
    const out = new texture_t();
    out.width = width;
    out.height = height;
    out.data = new Uint8Array(width * height * 3);

    return out;
}

export function texture_set_point(texture: texture_t, x: number, y: number, color: vec3_t): void {
    const index = index2(x, y, texture.width) * 3;
    texture.data[index] = color[0];
    texture.data[index + 1] = color[1];
    texture.data[index + 2] = color[2];
}

export function texture_get_point(texture: texture_t, x: number, y: number): vec3_t {
    const index = index2(x, y, texture.width) * 3;

    return vec3(
        texture.data[index],
        texture.data[index + 1],
        texture.data[index + 2]
    );
}
