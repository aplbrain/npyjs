export type DType =
    | "i1" | "u1" | "i2" | "u2" | "i4" | "u4" | "i8" | "u8"
    | "f2" | "f4" | "f8" | "b1";

export type TypedArray =
    | Int8Array
    | Int16Array
    | Int32Array
    | BigInt64Array
    | Uint8Array
    | Uint8ClampedArray
    | Uint16Array
    | Uint32Array
    | BigUint64Array
    | Float32Array
    | Float64Array;

export interface NpyArray<T extends ArrayBufferView = ArrayBufferView> {
    data: T;
    shape: number[];
    dtype: DType;
    fortranOrder: boolean;
}

export interface Options {
    /** Convert float16 to float32. Default true. */
    convertFloat16?: boolean;
}

const textDecoder = new TextDecoder("latin1");

function readHeader(buf: ArrayBufferLike) {
    const view = new DataView(buf);
    const magic = String.fromCharCode(
        view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3),
        view.getUint8(4), view.getUint8(5)
    );
    if (magic !== "\x93NUMPY") throw new Error("Not an .npy file");

    const major = view.getUint8(6);
    const minor = view.getUint8(7);

    let headerLen: number;
    if (major <= 1) {
        headerLen = view.getUint16(8, true);
        return { headerOffset: 10, headerLen, version: [major, minor] as const };
    } else {
        headerLen = Number(view.getUint32(8, true));
        return { headerOffset: 12, headerLen, version: [major, minor] as const };
    }
}

function parseDict(dictStr: string) {
    // very small parser for the NumPy header dict (single quotes, Python-likes)
    // matches keys: descr, fortran_order, shape
    const dtype = /'descr'\s*:\s*'([^']+)'/.exec(dictStr)?.[1];
    const fortran = /'fortran_order'\s*:\s*(True|False)/.exec(dictStr)?.[1] === "True";
    const shapeMatch = /'shape'\s*:\s*\(([^)]*)\)/.exec(dictStr)?.[1] ?? "";
    const shape = shapeMatch.split(",").map(s => s.trim()).filter(Boolean).map(n => Number(n));
    if (shape.length === 1 && dictStr.includes("(n,)")) {/* ok */ }
    return { dtype, fortranOrder: fortran, shape };
}

function dtypeToArray(dtype: string, buf: ArrayBufferLike, offset: number, opts: Options) {
    const little = dtype.startsWith("<") || dtype.startsWith("|"); // | = not applicable
    const code = dtype.substring(dtype.length -2); // e.g., 'f8', 'i8'
    switch (code) {
        case "b1": return new Uint8Array(buf, offset);
        case "i1": return new Int8Array(buf, offset);
        case "u1": return new Uint8Array(buf, offset);
        case "i2": return new Int16Array(buf, offset);
        case "u2": return new Uint16Array(buf, offset);
        case "i4": return new Int32Array(buf, offset);
        case "u4": return new Uint32Array(buf, offset);
        case "i8": return new BigInt64Array(buf, offset);
        case "u8": return new BigUint64Array(buf, offset);
        case "f4": return new Float32Array(buf, offset);
        case "f8": return new Float64Array(buf, offset);
        case "f2": {
            if (opts.convertFloat16 !== false) {
                const u16 = new Uint16Array(buf, offset);
                const f32 = new Float32Array(u16.length);
                for (let i = 0; i < u16.length; i++) f32[i] = f16toF32(u16[i]);
                return f32;
            }
            return new Uint16Array(buf, offset);
        }
        default: throw new Error(`Unsupported dtype: ${dtype}`);
    }
}

// Kahan-friendly f16→f32 (IEEE 754)
function f16toF32(u16: number): number {
    const s = (u16 & 0x8000) >> 15;
    const e = (u16 & 0x7C00) >> 10;
    const f = u16 & 0x03FF;
    if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
    if (e === 0x1F) return f ? NaN : (s ? -Infinity : Infinity);
    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / Math.pow(2, 10));
}

export async function load(source: string | ArrayBuffer | ArrayBufferView, opts: Options = {}): Promise<NpyArray> {
    let buf: ArrayBufferLike;
    if (typeof source === "string") {
        const res = await fetch(source);
        buf = await res.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
        buf = source;
    } else {
        buf = source.buffer;
    }

    const { headerOffset, headerLen } = readHeader(buf);
    const headerBytes = new Uint8Array(buf, headerOffset, headerLen);
    const header = textDecoder.decode(headerBytes).trim();

    const { dtype, fortranOrder, shape } = parseDict(header);
    if (!dtype || !shape) throw new Error("Malformed .npy header");

    // Data starts at headerOffset + headerLen, already padded to 16-byte boundary by format spec
    const dataOffset = headerOffset + headerLen;
    const data = dtypeToArray(dtype, buf, dataOffset, opts);

    return { data, shape, dtype: dtype.slice(1) as DType, fortranOrder };
}


// Back-compat:

// keep existing named exports above (load, types, etc.)
export function float16ToFloat32(u16: number): number {
    return f16toF32(u16);
}

function arrayToDtype(array: unknown): DType {
    if (array instanceof Uint8Array) {
        return "u1";
    }
    if (array instanceof Uint8ClampedArray) {
        return "u1";
    }
    if (array instanceof Int8Array) {
        return "i1";
    }
    if (array instanceof Uint16Array) {
        return "u2";
    }
    if (array instanceof Int16Array) {
        return "i2";
    }
    if (array instanceof Uint32Array) {
        return "u4";
    }
    if (array instanceof Int32Array) {
        return "i4";
    }
    if (array instanceof Float32Array) {
        return "f4";
    }
    if (array instanceof BigUint64Array) {
        return "u8";
    }
    if (array instanceof BigInt64Array) {
        return "i8";
    }
    if (array instanceof Float64Array) {
        return "f8";
    }
    const kind = typeof array === "object" ? array?.constructor?.name : typeof array;
    throw new TypeError(`Unsupported dtype for ${kind}`);
}

/**
 * True if the system is little endian.
 */
function isLittleEndian(): boolean {
    // The result could be cached
    return ((new Uint32Array((new Uint8Array([1, 0, 0, 0])).buffer))[0] === 1);
}

export function dump(array: TypedArray, shape: number[]) {
    function createPyDescription() {
        const dtype = arrayToDtype(array);
        const isByte = dtype == 'u1' || dtype == 'i1';
        const endianness = isByte ? '|' : (isLittleEndian() ? '<' : '>');
        const descr = `${endianness}${dtype}`;
        const pyShape = shape.map((v) => { return `${v}`; }).join(",");
        return `{'descr':'${descr}','fortran_order':False,'shape':(${pyShape})}`;
    }
    let pyDesc = createPyDescription();
    let headerSize = 10 + pyDesc.length;
    const pad = 8 - ((headerSize + 1) % 8);
    pyDesc = pyDesc + " ".repeat(pad) + "\x0A";
    headerSize += pad + 1;
    const buffer = new ArrayBuffer(headerSize + array.byteLength);
    const view = new DataView(buffer);
    view.setUint32(0, 2471384397, false);
    view.setUint32(4, 1348010240, false);
    view.setUint16(8, pyDesc.length, true);
    const encoder = new TextEncoder();
    const header = new Uint8Array(buffer, 10, pyDesc.length);
    encoder.encodeInto(pyDesc, header);
    const data = new Uint8Array(buffer, 10 + pyDesc.length);
    data.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    return buffer;
}

// Back-compat class API (matches old tests)
export default class N {
    private opts: Options;
    constructor(opts: Options = {}) {
        this.opts = opts;
    }
    async load(source: string | ArrayBuffer | ArrayBufferView) {
        return load(source, this.opts);
    }
    static float16ToFloat32(u16: number) {
        return f16toF32(u16);
    }
}
