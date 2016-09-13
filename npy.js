PREFIX = "data:application/octet-stream;base64,";

(function(G) {


    class npyjs {
        constructor(opts) {
            // Do nothing.
        }

        load(filename) {
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
                            var array = (
                                (res.slice(res.indexOf('}') + 1))
                                // .slice(21 - 9)
                                .split('')
                            ).map(i => i.charCodeAt(0));
                            console.log(res);

                            G.array = array;
                            var nums = [];
                            // for (var i = 0; i < array.length; i += 8) {
                            //     nums.push(array[i]);
                            // }
                            G.nums = nums;
                        });
                        reader.readAsBinaryString(content);
                    });
                }
            });
        }
    }

    G.npyjs = npyjs;
})(this);

n = new npyjs();
n.load('blah.npy')
