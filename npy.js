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
