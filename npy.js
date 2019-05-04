

npyjs = (function (G) {

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
                "<i1": {
                    name: "int8",
                    size: 8,
                    arrayConstructor: Int8Array,
                },
                "<u8": {
                    name: "uint8",
                    size: 64,
                    arrayConstructor: BigUint64Array,
                },
                "<i8": {
                    name: "int8",
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

        parse(res) {

            // const version = res.slice(6, 8); // Uint8-encoded
            const headerLength = new DataView(res.slice(8, 10)).getUint8(0);
            const offsetBytes = 10 + headerLength;

            var header = JSON.parse(
                String.fromCharCode.apply(null, new Uint8Array(res.slice(10, 10 + headerLength)))
                    .replace(/'/g, '"')
                    .replace("False", "false")
                    .replace("(", "[")
                    .replace(/,*\),*/g, "]")
            );
            var shape = header.shape;

            let dtype = this.dtypes[header.descr];

            let nums = new dtype["arrayConstructor"](
                res,
                offsetBytes
            );

            return {
                dtype: dtype.name,
                nums,
                shape
            };
        }

        load(filename, callback) {
            /*
            Loads an array from a stream of bytes.
            */
            let self = this;
            return fetch(filename).then(fh => {
                if (fh.ok) {
                    fh.blob().then(i => {
                        var content = i;
                        var reader = new FileReader();
                        reader.addEventListener("loadend", function () {
                            var text = reader.result;

                            var res = self.parse(text);

                            callback(res.nums, res.shape);
                        });
                        reader.readAsArrayBuffer(content);
                    });
                }
            });
        }
    }

    G.npyjs = npyjs;

    return npyjs;
})(this);
