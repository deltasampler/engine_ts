import {vec2_t, vec3_t} from "@cl/type.ts";
import {vec2} from "@cl/vec2.ts";
import {vec3} from "@cl/vec3";

export let d2: CanvasRenderingContext2D;

export function d2_init(canvas_el: HTMLCanvasElement): CanvasRenderingContext2D {
    return d2 = canvas_el.getContext("2d") as CanvasRenderingContext2D;
}

let draw_mode = 0;
let fill_color = vec3();
let stroke_color = vec3();
let line_width = 1.0;
let font_size = 16;
let font_family = "monospace";
let text_align = "center";
let text_baseline = "middle";

export function d2_rgb_str(r: number, g: number, b: number): string {
    return `rgb(${r},${g},${b})`;
}

export function d2_rgb_vec_str(v: vec3_t): string {
    return `rgb(${v[0]},${v[1]},${v[2]})`;
}

export function d2_fill(r: number, g: number, b: number): void {
    draw_mode = 0;
    fill_color[0] = r;
    fill_color[1] = g;
    fill_color[2] = b;
}

export function d2_fill_vec(v: vec3_t): void {
    draw_mode = 0;
    fill_color[0] = v[0];
    fill_color[1] = v[1];
    fill_color[2] = v[2];
}

export function d2_stroke(r: number, g: number, b: number, w: number): void {
    draw_mode = 1;
    stroke_color[0] = r;
    stroke_color[1] = g;
    stroke_color[2] = b;
    line_width = w;
}

export function d2_stroke_vec(v: vec3_t, w: number): void {
    draw_mode = 1;
    stroke_color[0] = v[0];
    stroke_color[1] = v[1];
    stroke_color[2] = v[2];
    line_width = w;
}

export function d2_draw(): void {
    if (draw_mode === 0) {
        d2.fillStyle = d2_rgb_vec_str(fill_color);
        d2.fill();
    } else {
        d2.strokeStyle = d2_rgb_vec_str(stroke_color);
        d2.lineWidth = line_width;
        d2.stroke();
    }
}

export function d2_clear_color(r: number, g: number, b: number): void {
    d2.fillStyle = d2_rgb_str(r, g, b);
    d2.fillRect(0.0, 0.0, d2.canvas.width, d2.canvas.height);
}

export function d2_clear_color_vec(v: vec3_t): void {
    d2.fillStyle = d2_rgb_vec_str(v);
    d2.fillRect(0.0, 0.0, d2.canvas.width, d2.canvas.height);
}

export function d2_reset_transform(): void {
    d2.resetTransform();
}

export function d2_center_transform(): void {
    d2.translate(d2.canvas.width / 2.0, d2.canvas.height / 2.0);
    d2.scale(1.0, -1.0);
}

export function d2_point(x: number, y: number): void {
    d2.beginPath();
    d2.rect(x, y, 1.0, 1.0);
    d2.closePath();

    d2_draw();
}

export function d2_point2(p: vec2_t): void {
    d2_point(p[0], p[1]);
}

export function d2_point_radius(x: number, y: number, r: number): void {
    d2.beginPath();
    d2.arc(x, y, r, 0.0, Math.PI * 2.0);
    d2.closePath();

    d2_draw();
}

export function d2_point_radius2(p: vec2_t, r: number): void {
    d2_point_radius(p[0], p[1], r);
}

export function d2_line(x0: number, y0: number, x1: number, y1: number): void {
    d2.beginPath();
    d2.moveTo(x0, y0);
    d2.lineTo(x1, y1);
    d2.closePath();

    d2_draw();
}

export function d2_line2(a: vec2_t, b: vec2_t): void {
    d2_line(a[0], a[1], b[0], b[1]);
}

export function d2_line_radius(x0: number, y0: number, x1: number, y1: number, r: number): void {
    d2.beginPath();
    d2.moveTo(x0, y0);
    d2.lineTo(x1, y1);
    d2.closePath();

    d2.strokeStyle = d2_rgb_vec_str(fill_color);
    d2.lineWidth = r * 2.0;
    d2.lineJoin = "round";
    d2.stroke();
}

export function d2_line_radius2(a: vec2_t, b: vec2_t, r: number): void {
    d2_line_radius(a[0], a[1], b[0], b[1], r);
}

export function d2_line_arrow(x0: number, y0: number, x1: number, y1: number, w: number): void {
    const dx = x1 - x0, dy = y1 - y0;
    const l = Math.hypot(dx, dy);
    const hw = w / 2.0;
    const nx = dx / l * hw, ny = dy / l * hw;
    const px = ny, py = -nx;
    const cap_width = 2.0;
    const cap_length = 4.0;

    d2.beginPath();
    d2.moveTo(x0 - px, y0 - py);
    d2.lineTo(x1 - px - nx * cap_length, y1 - py - ny * cap_length);
    d2.lineTo(x1 - px * cap_width - nx * cap_length, y1 - py * cap_width - ny * cap_length);
    d2.lineTo(x1, y1);
    d2.lineTo(x1 + px * cap_width - nx * cap_length, y1 + py * cap_width - ny * cap_length);
    d2.lineTo(x1 + px - nx * cap_length, y1 + py - ny * cap_length);
    d2.lineTo(x0 + px, y0 + py);
    d2.closePath();

    d2_draw();
}

export function d2_line_arrow2(a: vec2_t, b: vec2_t, w: number): void {
    d2_line_arrow(a[0], a[1], b[0], b[1], w);
}

export function d2_circle(x: number, y: number, r: number): void {
    d2.beginPath();
    d2.arc(x, y, r, 0.0, Math.PI * 2.0);
    d2.closePath();

    d2_draw();
}

export function d2_circle2(p: vec2_t, r: number): void {
    d2_circle(p[0], p[1], r);
}

export function d2_circle_angle(x: number, y: number, r: number, a: number): void {
    d2_line(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r);
}

export function d2_circle_angle2(p: vec2_t, r: number, a: number): void {
    d2_circle_angle(p[0], p[1], r, a);
}

export function d2_aabb(x: number, y: number, w: number, h: number): void {
    d2.beginPath();
    d2.rect(x - w / 2.0, y - h / 2.0, w, h);
    d2.closePath();

    d2_draw();
}

export function d2_aabb2(p: vec2_t, s: vec2_t): void {
    d2_aabb(p[0], p[1], s[0], s[1]);
}


export function d2_obb(x: number, y: number, w: number, h: number, a: number): void {
    const transform = d2.getTransform();

    d2.beginPath();
    d2.translate(x, y);
    d2.rotate(a);
    d2.rect(-w / 2.0, -h / 2.0, w, h);
    d2.closePath();

    d2.setTransform(transform);

    d2_draw();
}

export function d2_obb2(p: vec2_t, s: vec2_t, a: number): void {
    d2_obb(p[0], p[1], s[0], s[1], a);
}

export function d2_obb_angle(x: number, y: number, w: number, h: number, a: number): void {
    d2_line(x, y, x + Math.cos(a) * w / 2.0, y + Math.sin(a) * w / 2.0);
}

export function d2_obb_angle2(p: vec2_t, s: vec2_t, a: number): void {
    d2_obb_angle(p[0], p[1], s[0], s[1], a);
}

export function d2_obb_minmax(minx: number, miny: number, maxx: number, maxy: number, px: number, py: number, angle: number): void {
    const x = (minx + maxx) / 2.0;
    const y = (miny + maxy) / 2.0;
    const sx = Math.abs(maxx - minx);
    const sy = Math.abs(maxy - miny);

    d2_obb(x, y, sx, sy, angle);
}

export function d2_obb_minmax2(min: vec2_t, max: vec2_t, pos: vec2_t, angle: number): void {
    const x = pos[0] + (min[0] + max[0]) / 2.0;
    const y = pos[1] + (min[1] + max[1]) / 2.0;
    const sx = Math.abs(max[0] - min[0]);
    const sy = Math.abs(max[1] - min[1]);

    d2_obb(x, y, sx, sy, angle);
}


export function d2_polygon(points: vec2_t[]): void {
    if (points.length < 3) {
        return;
    }

    const transform = d2.getTransform();

    const point = points[0];

    d2.beginPath();
    d2.moveTo(point[0], point[1]);

    for (let i = 1; i < points.length; i += 1) {
        const point = points[i];

        d2.lineTo(point[0], point[1])
    }

    d2.closePath();

    d2.setTransform(transform);

    d2_draw();
}

export function d2_polygon_cent(points: vec2_t[], x: number, y: number, a: number): void {
    if (points.length < 3) {
        return;
    }

    const transform = d2.getTransform();

    const point = points[0];

    d2.beginPath();
    d2.translate(x, y);
    d2.rotate(a);
    d2.moveTo(point[0], point[1]);

    for (let i = 1; i < points.length; i += 1) {
        const point = points[i];

        d2.lineTo(point[0], point[1])
    }

    d2.closePath();

    d2.setTransform(transform);

    d2_draw();
}

export function d2_polygon_cent2(points: vec2_t[], p: vec2_t, a: number): void {
    d2_polygon_cent(points, p[0], p[1], a);
}

export function d2_polygon_cent_angle(point: vec2_t, x: number, y: number, a: number): void {
    const px = point[0], py = point[1];
    const cos = Math.cos(a), sin = Math.sin(a);
    const x1 = px * cos - py * sin;
    const y1 = px * sin + py * cos;

    d2_line(x, y, x + x1, y + y1);
}

export function d2_polygon_cent_angle2(point: vec2_t, p: vec2_t, a: number): void {
    d2_polygon_cent_angle(point, p[0], p[1], a);
}

export function d2_mouse_pos(x: number, y: number): vec2_t {
    const rect = d2.canvas.getBoundingClientRect()
    const scaled_x = x * d2.canvas.width / rect.width
    const scaled_y = y * d2.canvas.height / rect.height
    const matrix = d2.getTransform().invertSelf()
    const out = vec2();

    out[0] = scaled_x * matrix.a + scaled_y * matrix.c + matrix.e;
    out[1] = scaled_x * matrix.b + scaled_y * matrix.d + matrix.f;

    return out;
}

export function d2_text(x: number, y: number, text: string) {
    const transform = d2.getTransform();

    d2.scale(1.0, -1.0);

    d2.font = `${font_size}px ${font_family}`;
    d2.textAlign = text_align as CanvasTextAlign;
    d2.textBaseline = text_baseline as CanvasTextBaseline;

    if (draw_mode === 0) {
        d2.fillStyle = d2_rgb_vec_str(fill_color);
        d2.fillText(text, x, -y);
    } else {
        d2.strokeStyle = d2_rgb_vec_str(stroke_color);
        d2.lineWidth = line_width;
        d2.strokeText(text, x, -y);
    }

    d2.setTransform(transform);
}
