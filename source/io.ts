export enum KB_STATE {
    DOWN,
    UP
};

export type kb_event_t = {
    code: string;
    alt: boolean;
    ctrl: boolean;
    shift: boolean;
    event: KeyboardEvent;
};

export type m_event_t = {
    x: number;
    y: number;
    xd: number;
    yd: number;
    button: number;
    alt: boolean;
    ctrl: boolean;
    shift: boolean;
    target: EventTarget|null;
    event: MouseEvent;
};

export type m_wheel_event_t = {
    xd: number;
    yd: number;
    event: WheelEvent;
};

// internal
type io_t = {
    keys: {[key: string]: KB_STATE};
    buttons: {[key: number]: KB_STATE};
    kb_key_down: (event: kb_event_t) => void;
    kb_key_up: (event: kb_event_t) => void;
    m_move: (event: m_event_t) => void;
    m_button_down: (event: m_event_t) => void;
    m_button_up: (event: m_event_t) => void;
    m_wheel_scroll: (event: m_wheel_event_t) => void;
};

// internal
const io: io_t = {
    keys: {},
    buttons: {},
    kb_key_down: function() {},
    kb_key_up: function() {},
    m_move: function() {},
    m_button_down: function() {},
    m_button_up: function() {},
    m_wheel_scroll: function() {}
};

export function io_kb_key_down(callback: (event: kb_event_t) => void): void {
    io.kb_key_down = callback;
}

export function io_kb_key_up(callback: (event: kb_event_t) => void): void {
    io.kb_key_up = callback;
}

export function io_m_move(callback: (event: m_event_t) => void): void {
    io.m_move = callback;
}

export function io_m_button_down(callback: (event: m_event_t) => void): void {
    io.m_button_down = callback;
}

export function io_m_button_up(callback: (event: m_event_t) => void): void {
    io.m_button_up = callback;
}

export function io_m_wheel_scroll(callback: (event: m_wheel_event_t) => void): void {
    io.m_wheel_scroll = callback;
}

export function io_init(): void {
    addEventListener("keydown", function(event: KeyboardEvent): void {
        io.keys[event.code] = KB_STATE.DOWN;
        io.kb_key_down({
            code: event.code,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            event
        });
    });

    addEventListener("keyup", function(event: KeyboardEvent): void {
        io.keys[event.code] = KB_STATE.UP;
        io.kb_key_up({
            code: event.code,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            event
        });
    });

    addEventListener("mousemove", function(event: MouseEvent): void {
        io.m_move({
            x: event.offsetX,
            y: event.offsetY,
            xd: event.movementX,
            yd: event.movementY,
            button: event.button,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            target: event.target,
            event
        });
    });

    addEventListener("mousedown", function(event: MouseEvent): void {
        io.buttons[event.button] = KB_STATE.DOWN;
        io.m_button_down({
            x: event.offsetX,
            y: event.offsetY,
            xd: event.movementX,
            yd: event.movementY,
            button: event.button,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            target: event.target,
            event
        });
    });

    addEventListener("mouseup", function(event: MouseEvent): void {
        io.buttons[event.button] = KB_STATE.UP;
        io.m_button_up({
            x: event.offsetX,
            y: event.offsetY,
            xd: event.movementX,
            yd: event.movementY,
            button: event.button,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            target: event.target,
            event
        });
    });

    addEventListener("wheel", function(event: WheelEvent): void {
        io.m_wheel_scroll({
            xd: Math.sign(event.deltaX),
            yd: Math.sign(event.deltaY),
            event
        });
    });
}

export function io_key_down(key: string): boolean {
    return io.keys[key] === KB_STATE.DOWN;
}

export function io_button_down(button: number): boolean {
    return io.buttons[button] === KB_STATE.DOWN;
}
