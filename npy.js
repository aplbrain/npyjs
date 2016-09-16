(function(G) {


    class npyjs {
        constructor(opts) {
            // Do nothing.
        }

        load(filename, callback) {
            /*
            Loads an array from a stream of bytes.
            */
            return fetch(filename).then(fh => {
                if (fh.ok) {
                    fh.blob().then(i => {
                        var content = i;
                        var reader = new FileReader();
                        reader.addEventListener("loadend", function() {
                            var res = reader.result;
                            var headerLength = res.indexOf('}') + 1;
                            var header = JSON.parse(
                                res.slice(10, headerLength)
                                .replace(/\'/g, '"')
                                .replace("False", "false")
                                .replace("(", "[")
                                .replace(/,*\),*/g, "]")
                            );
                            var shape = header.shape;
                            G.header = header;

                            var array = (
                                (res.slice(headerLength))
                                .split('')
                            ).map(i => i.charCodeAt(0));

                            while (array[0] === 32) {
                                array = array.slice(1);
                            }
                            array = array.slice(1);

                            G.array = array;
                            var nums = [];
                            for (var i = 0; i < array.length; i += 8) {
                                nums.push(array[i]);
                            }
                            G.nums = nums;

                            // Perform reshape.
                            callback(nums, shape);
                        });
                        reader.readAsBinaryString(content);
                    });
                }
            });
        }
    }

    G.npyjs = npyjs;
})(this);
