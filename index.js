import fetch from 'cross-fetch';

class StringFromCodePoint extends String {
    constructor(...args) {
        const uint32 = new Uint32Array(...args);
        const number_arr = Array.from(uint32);
        const str = String.fromCodePoint(...number_arr);
        console.log("str",str);
        super(str);
    }
}

class npyjs {

    constructor(opts) {
        if (opts && !('convertFloat16' in opts)) {
            console.warn([
                "npyjs constructor now accepts {convertFloat16?: boolean}.",
                "For usage, go to https://github.com/jhuapl-boss/npyjs."
            ].join(" "));
        }

        this.convertFloat16 = opts?.convertFloat16 ?? true;

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
                arrayConstructor: Uint32Array,
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
            "<f2": {
                name: "float16",
                size: 16,
                arrayConstructor: Uint16Array,
                converter: this.convertFloat16 ? this.float16ToFloat32Array : undefined
            },
        };
    }

    float16ToFloat32Array(float16Array) {
        const length = float16Array.length;
        const float32Array = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            float32Array[i] = npyjs.float16ToFloat32(float16Array[i]);
        }
        
        return float32Array;
    }

    static float16ToFloat32(float16) {
        // Extract the parts of the float16
        const sign = (float16 >> 15) & 0x1;
        const exponent = (float16 >> 10) & 0x1f;
        const fraction = float16 & 0x3ff;

        // Handle special cases
        if (exponent === 0) {
            if (fraction === 0) {
                // Zero
                return sign ? -0 : 0;
            }
            // Denormalized number
            return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / 0x400);
        } else if (exponent === 0x1f) {
            if (fraction === 0) {
                // Infinity
                return sign ? -Infinity : Infinity;
            }
            // NaN
            return NaN;
        }

        // Normalized number
        return (sign ? -1 : 1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x400);
    }

    parse(arrayBufferContents) {
        // const version = arrayBufferContents.slice(6, 8); // Uint8-encoded
        const headerLength = new DataView(arrayBufferContents.slice(8, 10)).getUint8(0);
        const offsetBytes = 10 + headerLength;

        const hcontents = new TextDecoder("utf-8").decode(
            new Uint8Array(arrayBufferContents.slice(10, 10 + headerLength))
        );
        console.log("hcontents",hcontents);
        const header = JSON.parse(
            hcontents
                .replace("True","true") // True -> true
                .replace("False","false") // False -> false
                .replace(/'/g, '"')
                .replace("(", "[")
                .replace(/,*\),*/g, "]")
        );
        const shape = header.shape;
        var dtype = this.dtypes[header.descr];
        //parse unicode dtype. The format is a 'U' character followed by a number that is the number of unicode characters in the string
        if (header.descr[1] === "U") {
            dtype = {
                name: "unicode",
                size: parseInt(header.descr.substring(2)),
                arrayConstructor: StringFromCodePoint
            };
        }
        const nums = new dtype.arrayConstructor(
            arrayBufferContents,
            offsetBytes
        );

        //convert to a plain string array the StringFromCodePoint object
        if (dtype.name === "unicode") {
            const nums_ = String(nums);
            nums = new Array();
            //split the string into an array of strings with length dtype.size
            for (let i = 0; i < nums_.length; i += dtype.size) {
                nums.push(nums_.substring(i, i + dtype.size));
            }
        }
        
        // Convert float16 to float32 if converter exists
        const data = dtype.converter ? dtype.converter.call(this, nums) : nums;

        return {
            dtype: dtype.name,
            data: data,
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
