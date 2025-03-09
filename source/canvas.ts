export function en_create_canvas(parent_el: HTMLElement): HTMLCanvasElement {
    const canvas_el = document.createElement("canvas");
    parent_el.append(canvas_el);
    canvas_el.width = parent_el.clientWidth;
    canvas_el.height = parent_el.clientHeight;

    addEventListener("resize", function(): void {
        canvas_el.width = parent_el.clientWidth;
        canvas_el.height = parent_el.clientHeight;
    });

    return canvas_el;
}
