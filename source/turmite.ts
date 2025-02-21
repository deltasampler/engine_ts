import {vec2_t, vec3_t} from "@cl/type.ts";
import {cl_vec2} from "@cl/vec2.ts";

export const DIRS: vec2_t[] = [
    cl_vec2(0.0, 1.0),
    cl_vec2(1.0, 1.0),
    cl_vec2(1.0, 0.0),
    cl_vec2(1.0, -1.0),
    cl_vec2(0.0, -1.0),
    cl_vec2(-1.0, -1.0),
    cl_vec2(-1.0, 0.0),
    cl_vec2(-1.0, 1.0)
];

export type turmite_table_t = {
    [key: string]: {
        next_state: number;
        next_color: vec3_t;
        turn: number;
    };
};

export function turmite_hash_rgb(index: number, r: number, g: number, b: number): string {
    return `${index}_${r}_${g}_${b}`;
}

export function turmite_hash_vec(index: number, color: vec3_t): string {
    return `${index}_${color[0]}_${color[1]}_${color[2]}`;
}

export function turmite_state(table: turmite_table_t, index: number, color: vec3_t, next_state: number, next_color: vec3_t, turn: number): void {
    table[turmite_hash_vec(index, color)] = {
        next_state,
        next_color,
        turn
    };
}

export class turmite_t {
    x: number;
    y: number;
    dir: number;
    state: number;
    table: turmite_table_t;
};

export function turmite_new(x: number, y: number, dir: number, state: number, table: turmite_table_t): turmite_t {
    const out = new turmite_t();
    out.x = x;
    out.y = y;
    out.dir = dir;
    out.state = state;
    out.table = table;

    return out;
}
