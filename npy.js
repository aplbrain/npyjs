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
                "<u8": {
                    name: "uint8",
                    size: 8,
                    arrayConstructor: Uint8Array,
                },
                "<i8": {
                    name: "int8",
                    size: 8,
                    arrayConstructor: Int8Array,
                },
            };
        }

        _parseBytes(a) {
            /*
            Parses an array of bytes, assuming that the n-1th byte is 2^0s, the
            n-2th is 2^8, etc.

            Arguments:
                a (array): An array of integers, in faux-base-256. For instance,
                    [100] => 100; [1, 0] => 256. [256] is an invalid input.

            Returns:
                Integer
            */
            let result = 0;
            for (var i = 0; i < a.length; i++) {
                result += a[i] * Math.pow(256, i);
            }
            return result;
        }

        parse(res) {
            let self = this;
            var headerLength = res.indexOf("}") + 1;
            var header = JSON.parse(
                res.slice(10, headerLength)
                    .replace(/'/g, '"')
                    .replace("False", "false")
                    .replace("(", "[")
                    .replace(/,*\),*/g, "]")
            );
            var shape = header.shape;

            let dtype = this.dtypes[header.descr];

            var array = (
                (res.slice(headerLength))
                    .split("")
            ).map(i => i.charCodeAt(0));

            while (array[0] === 32) {
                array = array.slice(1);
            }
            array = array.slice(1);

            var nums = [];
            for (var i = dtype.size; i < array.length + dtype.size; i += dtype.size) {
                nums.push(self._parseBytes(array.slice(i - dtype.size, i)));
            }

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

                            // Perform reshape.
                            callback(res.nums, res.shape);
                        });
                        reader.readAsBinaryString(content);
                    });
                }
            });
        }
    }

    G.npyjs = npyjs;

    return npyjs;
})(this);
