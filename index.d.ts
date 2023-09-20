type ValueOf<T> = T[keyof T];

export type Dtypes = {
    "<u1": {
        name: "uint8";
        size: 8;
        arrayConstructor: typeof Uint8Array;
    };
    "|u1": {
        name: "uint8";
        size: 8;
        arrayConstructor: typeof Uint8Array;
    };
    "<u2": {
        name: "uint16";
        size: 16;
        arrayConstructor: typeof Uint16Array;
    };
    "|i1": {
        name: "int8";
        size: 8;
        arrayConstructor: typeof Int8Array;
    };
    "<i2": {
        name: "int16";
        size: 16;
        arrayConstructor: typeof Int16Array;
    };
    "<u4": {
        name: "uint32";
        size: 32;
        arrayConstructor: typeof Int32Array;
    };
    "<i4": {
        name: "int32";
        size: 32;
        arrayConstructor: typeof Int32Array;
    };
    "<u8": {
        name: "uint64";
        size: 64;
        arrayConstructor: typeof BigUint64Array;
    };
    "<i8": {
        name: "int64";
        size: 64;
        arrayConstructor: typeof BigInt64Array;
    };
    "<f4": {
        name: "float32";
        size: 32;
        arrayConstructor: typeof Float32Array;
    };
    "<f8": {
        name: "float64";
        size: 64;
        arrayConstructor: typeof Float64Array;
    };
};

export type Parsed = ValueOf<{
    [K in keyof Dtypes]: {
        dtype: Dtypes[K]["name"];
        data: InstanceType<Dtypes[K]["arrayConstructor"]>;
        shape: number[];
        fortranOrder: boolean;
    };
}>;

declare class npyjs {

    constructor(opts?: never);

    dtypes: Dtypes;

    parse(arrayBufferContents: ArrayBuffer): Parsed;

    load(
        filename: RequestInfo | URL | ArrayBuffer,
        callback?: (result?: Parsed) => any,
        fetchArgs?: RequestInit
    ): Promise<Parsed>;
}

export default npyjs;
