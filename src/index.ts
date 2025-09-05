export type DType =
    | "i1" | "u1" | "i2" | "u2" | "i4" | "u4" | "i8" | "u8"
    | "f2" | "f4" | "f8" | "b1" | `U${number}`; // e.g., U10 for strings of length 10
import * as fs from 'fs';
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

class StringFromCodePoint extends String {
    constructor(buf: ArrayBufferLike, byteOffset?: number, length?: number) {
        const uint32 = new Uint32Array(buf, byteOffset, length);
        const number_arr = Array.from(uint32);
        const str = String.fromCodePoint(...number_arr);
        super(str);
    }
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
    //parse unicode dtype. The format is a 'U' character followed by a number that is the number of unicode characters in the string
    if (code[0] === "U") {
        const size = parseInt(code.substring(1))
        const _string = String(new StringFromCodePoint(buf, offset));
        const strings : string[] = [];
        //split the string into an array of strings with length dtype.size
        for (let i = 0; i < _string.length; i += size) {
            strings.push(_string.substring(i, i + size).replace(/\0/g, ''));
        }
        return strings;
    }
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

export async function load(source: string | ArrayBuffer | ArrayBufferView | Blob, opts: Options = {}): Promise<NpyArray> {
    let buf: ArrayBufferLike;
    if (typeof source === "string") {
        const res = await fetch(source);
        buf = await res.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
        buf = source;
    } else if (source instanceof Blob) {
        buf = await source.arrayBuffer();
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

export function arrayToTypedArray(dtype: DType, array: Array): TypedArray { 
    if (!Array.isArray(array)) throw new TypeError("Expected an array");

    if (dtype.startsWith("U")) {
        // Unicode string array
        const size = parseInt(dtype.substring(1));
        const buf = new ArrayBuffer(array.length * size * 4);
        const uint32 = new Uint32Array(buf);
        for (let i = 0; i < array.length; i++) {
            const str = array[i] as string;
            for (let j = 0; j < size; j++) {
                const code = j < str.length ? str.codePointAt(j) ?? 0 : 0;
                uint32[i * size + j] = code!;
            }
        }
        return new Uint8Array(buf);
    }

    switch (dtype) {
        case "b1": return new Uint8Array(array);
        case "i1": return new Int8Array(array);
        case "u1": return new Uint8Array(array);
        case "i2": return new Int16Array(array);
        case "u2": return new Uint16Array(array);
        case "i4": return new Int32Array(array);
        case "u4": return new Uint32Array(array);
        case "i8": return new BigInt64Array(array);
        case "u8": return new BigUint64Array(array);
        case "f4": return new Float32Array(array);
        case "f8": return new Float64Array(array);
        default: throw new Error(`Unsupported dtype: ${dtype}`);
    }
}

function inferUnicodeDtypeFromStringArray(array: string[]): DType {
    let longestStringLength = array[0].length;
    for (let i = 1; i < array.length; i++) {
        const element = array[i];
        if (typeof element === "string" && element.length > longestStringLength) {
            longestStringLength = element.length;
        }
    }
    return `U${Math.max(1, longestStringLength)}` as DType; // e.g., U10 for strings of length 10
}

function inferDtypeFromNumberArray(array: number[]): DType {
    let isInteger = true;
    let isNonNegative = true;
    let maxAbsValue = 0;

    for (const num of array) {
        if (!Number.isInteger(num)) {
            isInteger = false;
        }
        if (num < 0) {
            isNonNegative = false;
        }
        const absNum = Math.abs(num);
        if (absNum > maxAbsValue) {
            maxAbsValue = absNum;
        }
    }

    if (!isInteger) {
        if (maxAbsValue <= 3.40282347e+38) return "f4"; // max representable float32
        return "f8"; // default to float64
    }

    // Integer array, determine smallest fitting dtype
    if (isNonNegative) {
        // Unsigned integers
        if (maxAbsValue <= 0xFF) return "u1";
        if (maxAbsValue <= 0xFFFF) return "u2";
        if (maxAbsValue <= 0xFFFFFFFF) return "u4";
        return "u8";
    } else {
        // Signed integers
        if (maxAbsValue <= 0x7F) return "i1";
        if (maxAbsValue <= 0x7FFF) return "i2";
        if (maxAbsValue <= 0x7FFFFFFF) return "i4";
        return "i8";
    }
}

export function inferDtypeFromArray(array: Array<number | number[] | string | string[]>): DType {
    if (array.length === 0) return "f8"; // default to float64 for empty arrays
    const first = array[0];

    if (typeof first === "number") {
        return inferDtypeFromNumberArray(array as number[]);
    }

    if (typeof first === "string") {
        return inferUnicodeDtypeFromStringArray(array as string[]);
    }

    if (Array.isArray(first)) {
        // Nested array, infer from first sub-array
        return inferDtypeFromArray(first);
    }
}

/**
 * True if the system is little endian.
 */
function isLittleEndian(): boolean {
    // The result could be cached
    return ((new Uint32Array((new Uint8Array([1, 0, 0, 0])).buffer))[0] === 1);
}

function createPyDescription(dtype : DType, shape: number[]) : string {

    const isByte = dtype == 'u1' || dtype == 'i1';
    const endianness = isByte ? '|' : (isLittleEndian() ? '<' : '>');
    const descr = `${endianness}${dtype}`;
    let pyShape = shape.map((v) => { return `${v}`; }).join(",");
    if (shape.length === 1) pyShape += ",";

    return `{'descr':'${descr}','fortran_order':False,'shape':(${pyShape})}`;
}

export function dump(array: TypedArray | Array<number | string>, shape: number[] | undefined) : ArrayBuffer{
    const dtype = array instanceof Array ? inferDtypeFromArray(array) : arrayToDtype(array);
    array = array instanceof Array ? arrayToTypedArray(dtype, array) : array;
    
    let pyDesc = createPyDescription(dtype, shape ?? [array.length]);
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

    dump(array: TypedArray | Array<number | string>, shape: number[]) {
        return dump(array, shape);
    }
}
