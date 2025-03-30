import {gl} from "./gl.ts";

export enum ATTRIB_TYPE {
    S8,
    U8,
    S16,
    U16,
    S32,
    U32,
    F32
};

export const ATTIB_TYPE_SIZE = {
    [ATTRIB_TYPE.S8]: 1,
    [ATTRIB_TYPE.U8]: 1,
    [ATTRIB_TYPE.S16]: 2,
    [ATTRIB_TYPE.U16]: 2,
    [ATTRIB_TYPE.S32]: 4,
    [ATTRIB_TYPE.U32]: 4,
    [ATTRIB_TYPE.F32]: 4
};

function attrib_type_gl(type: ATTRIB_TYPE): number {
    switch (type) {
        case ATTRIB_TYPE.S8:
            return gl.BYTE;
        case ATTRIB_TYPE.U8:
            return gl.UNSIGNED_BYTE;
        case ATTRIB_TYPE.S16:
            return gl.SHORT;
        case ATTRIB_TYPE.U16:
            return gl.UNSIGNED_SHORT;
        case ATTRIB_TYPE.S32:
            return gl.INT;
        case ATTRIB_TYPE.U32:
            return gl.UNSIGNED_INT;
        case ATTRIB_TYPE.F32:
            return gl.FLOAT;
        default:
            return gl.FLOAT;
    }
}

export class attrib_t {
    type: ATTRIB_TYPE;
    size: number;
};

export function attrib_new(type: ATTRIB_TYPE, size: number): attrib_t {
    const attrib = new attrib_t();
    attrib.type = type;
    attrib.size = size;

    return attrib;
}

export class layout_t {
    attribs: attrib_t[];
    stride: number;
};

export function layout_new(): layout_t {
    const layout = new layout_t();
    layout.attribs = [];
    layout.stride = 0;

    return layout;
}

export function layout_attrib(layout: layout_t, type: ATTRIB_TYPE, size: number): attrib_t {
    const attrib = attrib_new(type, size);
    layout.attribs.push(attrib);
    layout.stride += ATTIB_TYPE_SIZE[attrib.type] * attrib.size;

    return attrib;
}

export function layout_build_gl(layout: layout_t, instanced = false) {
    const attribs = layout.attribs;
    let offset = 0;

    for (let i = 0; i < attribs.length; i += 1) {
        const attrib = attribs[i];
        const type = attrib_type_gl(attrib.type);

        gl.enableVertexAttribArray(i);

        if (attrib.type === ATTRIB_TYPE.F32) {
            gl.vertexAttribPointer(i, attrib.size, type, false, layout.stride, offset);
        } else {
            gl.vertexAttribIPointer(i, attrib.size, type, layout.stride, offset);
        }

        if (instanced) {
            gl.vertexAttribDivisor(i, 1);
        }

        offset += ATTIB_TYPE_SIZE[attrib.type] * attrib.size;
    }
}
