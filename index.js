import fetch from 'cross-fetch';

class npyjs {

    constructor(opts) {
        if (opts) {
            console.error([
                "No arguments accepted to npyjs constructor.",
                "For usage, go to https://github.com/jhuapl-boss/npyjs."
            ].join(" "));
        }

        this.dtypes = {
            "<u1": {
                name: "uint8",
                size: 8,
                arrayConstructor: Uint8Array,
            },
            "|u1": {
                name: "uint8",
                size: 8,
                arrayConstructor: Uint8Array,
            },
            "<u2": {
                name: "uint16",
                size: 16,
                arrayConstructor: Uint16Array,
            },
            "|i1": {
                name: "int8",
                size: 8,
                arrayConstructor: Int8Array,
            },
            "<i2": {
                name: "int16",
                size: 16,
                arrayConstructor: Int16Array,
            },
            "<u4": {
                name: "uint32",
                size: 32,
                arrayConstructor: Int32Array,
            },
            "<i4": {
                name: "int32",
                size: 32,
                arrayConstructor: Int32Array,
            },
            "<u8": {
                name: "uint64",
                size: 64,
                arrayConstructor: BigUint64Array,
            },
            "<i8": {
                name: "int64",
                size: 64,
                arrayConstructor: BigInt64Array,
            },
            "<f4": {
                name: "float32",
                size: 32,
                arrayConstructor: Float32Array
            },
            "<f8": {
                name: "float64",
                size: 64,
                arrayConstructor: Float64Array
            },
        };
    }

    parse(arrayBufferContents) {
        // const version = arrayBufferContents.slice(6, 8); // Uint8-encoded
        const headerLength = new DataView(arrayBufferContents.slice(8, 10)).getUint8(0);
        const offsetBytes = 10 + headerLength;

        const hcontents = new TextDecoder("utf-8").decode(
            new Uint8Array(arrayBufferContents.slice(10, 10 + headerLength))
        );
        const header = JSON.parse(
            hcontents
                .toLowerCase() // True -> true
                .replace(/'/g, '"')
                .replace("(", "[")
                .replace(/,*\),*/g, "]")
        );
        const shape = header.shape;
        const dtype = this.dtypes[header.descr];
        const nums = new dtype["arrayConstructor"](
            arrayBufferContents,
            offsetBytes
        );
        return {
            dtype: dtype.name,
            data: nums,
            shape,
            fortranOrder: header.fortran_order
        };
    }

    async load(filename, callback, fetchArgs) {
        /*
        Loads an array from a stream of bytes.
        */
        fetchArgs = fetchArgs || {};
        let arrayBuf;
        // If filename is ArrayBuffer
        if (filename instanceof ArrayBuffer) {
            arrayBuf = filename;
        }
        // If filename is a file path
        else {
            const resp = await fetch(filename, { ...fetchArgs });
            arrayBuf = await resp.arrayBuffer();
        }
        const result = this.parse(arrayBuf);
        if (callback) {
            return callback(result);
        }
        return result;
    }
}

export default npyjs;
