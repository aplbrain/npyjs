/*
Copyright 2016 The Johns Hopkins University Applied Physics Laboratory

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

(function(G) {

    class npyjs {
        constructor(opts) {
            if (opts) {
                console.error([
                    "No arguments accepted to npyjs constructor.",
                    "For usage, go to https://github.com/jhuapl-boss/npyjs."
                ].join(" "));
            }
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
                        reader.addEventListener("loadend", function() {
                            var res = reader.result;
                            var headerLength = res.indexOf("}") + 1;
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
                                .split("")
                            ).map(i => i.charCodeAt(0));

                            while (array[0] === 32) {
                                array = array.slice(1);
                            }
                            array = array.slice(1);

                            G.array = array;
                            var nums = [];
                            for (var i = 8; i < array.length + 8; i += 8) {
                                nums.push(self._parseBytes(array.slice(i - 8, i)));
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
