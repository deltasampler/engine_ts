import {vec2_t, vec3_t} from "@cl/type.ts";
import { cl_vec2 } from "@cl/vec2";
export let d2: CanvasRenderingContext2D;

export function d2_init(canvas_el: HTMLCanvasElement): CanvasRenderingContext2D {
    return d2 = canvas_el.getContext("2d") as CanvasRenderingContext2D;
}

export function d2_rgb_str(r: number, g: number, b: number): string {
    return `rgb(${r},${g},${b})`;
}

export function d2_vrgb_str(v: vec3_t): string {
    return `rgb(${v[0]},${v[1]},${v[2]})`;
}

export function d2_clear_color_rgb(r: number, g: number, b: number): void {
    d2.rect(0, 0, d2.canvas.width, d2.canvas.height);
    d2.fillStyle = d2_rgb_str(r, g, b);
    d2.fill();
}

export function d2_clear_color_vrgb(color: vec3_t): void {
    d2.rect(0, 0, d2.canvas.width, d2.canvas.height);
    d2.fillStyle = d2_vrgb_str(color);
    d2.fill();
}

export function d2_move_to(v: vec2_t): void {
    d2.moveTo(v[0], v[1]);
}

export function d2_line_to(v: vec2_t): void {
    d2.lineTo(v[0], v[1]);
}

export function d2_polygon(points: vec2_t[]): void {
    d2.beginPath();
    d2_move_to(points[0])

    for (let i = 1; i < points.length; i++) {
        d2_line_to(points[i]);
    }

    d2.closePath();
}

export function d2_line(a: vec2_t, b: vec2_t): void {
    d2.beginPath();
    d2_move_to(a);
    d2_line_to(b);
    d2.closePath();
}

export function d2_aabb(min: vec2_t, max: vec2_t): void {
    d2.beginPath();
    d2.rect(min[0], min[1], max[0] - min[0], max[1] - min[1]);
    d2.closePath();
}

export function d2_fill(color: vec3_t): void {
    d2.fillStyle = d2_vrgb_str(color);
    d2.fill();
}

export function d2_stroke(color: vec3_t, width: number): void {
    d2.strokeStyle = d2_vrgb_str(color);
    d2.lineWidth = width;
    d2.stroke();
}

export function d2_mouse_pos(x: number, y: number): vec2_t {
    const rect = d2.canvas.getBoundingClientRect()
    const scaled_x = x * d2.canvas.width / rect.width
    const scaled_y = y * d2.canvas.height / rect.height
    const matrix = d2.getTransform().invertSelf()
    const out = cl_vec2();

    out[0] = scaled_x * matrix.a + scaled_y * matrix.c + matrix.e;
    out[1] = scaled_x * matrix.b + scaled_y * matrix.d + matrix.f;

    return out;
}
