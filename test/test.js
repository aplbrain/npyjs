const assert = require("assert");
const fs = require("fs");
const path = require("path");
const npy = require("../");



const records = JSON.parse(fs.readFileSync(__dirname + '/records.json'));

for (let fname in records) {
    let fcontents = fs.readFile(
        path.resolve(__dirname, `${fname}.npy`),
        null,
        function (err, res) {
            assert.equal(err, null);
            let data = npy.parse(res.buffer);
            Array.prototype.slice.call(
                data.data.slice(-5)
            ).forEach((i, j) => {
                // console.log(i)
                assert.equal(records[fname][j], i);
            });
        }
    );
}
