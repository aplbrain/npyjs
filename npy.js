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




tests = [
    [],
    [91,48,83,47,36],
    [1,71,70,59,77,32,63,67,40,75],
    [74,51,26,66,73,96,21,26,35,88,52,49,28,63,11]
];

function arraysAreEqual(a, b) {
    return a === b || (
        !!a && !!b &&
        a.length === b.length &&
        a.map((val, idx) => val === b[idx])
            .reduce((prev, cur) => (prev && cur), true)
    );
}

n = new npyjs();

/*
// Sanity tests:
n.load('1d-0.npy', (a, n) => { console.log(arraysAreEqual(a, tests[0])) })
n.load('1d-5.npy', (a, n) => { console.log(arraysAreEqual(a, tests[1])) })
n.load('1d-10.npy', (a, n) => { console.log(arraysAreEqual(a, tests[2])) })
n.load('1d-15.npy', (a, n) => { console.log(arraysAreEqual(a, tests[3])) })

// Throughput tests:
// n.load('2d-100x100.npy', (a, n) => { console.log(arraysAreEqual(a.slice(0, 3), [105, 169, 119])) })
// n.load('2d-1000x1000.npy', (a, n) => { console.log(arraysAreEqual(a.slice(0, 3), [175, 118, 110])) })

// Dimensionality tests:
n.load('3d-2x2x2.npy', (a, n) => { console.log(arraysAreEqual(a, [14, 231, 252, 169, 44, 140, 109, 42])) })
*/
