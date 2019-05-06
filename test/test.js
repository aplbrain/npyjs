let assert = require("assert");
let fs = require("fs");
const path = require("path");
let N = require("..");


describe("npyjs parser", function () {
    // it("should be able to add 1+1", function () {
    //     assert.equal(1 + 1, 2);
    // });


    // it("should be able to be created", function () {
    //     assert.doesNotThrow(() => {
    //         new npyjs();
    //     });
    // });

    // it("should access a json manifest file", function () {
    // JSON.parse(fs.readFileSync("test/records.json"));
    // });

    it("should correctly parse npy files", function () {
        const records = JSON.parse(fs.readFileSync("test/records.json"));
        let n = new N();

        for (let fname in records) {
            let fcontents = fs.readFile(
                path.resolve(__dirname, `${fname}.npy`),
                null,
                function (err, res) {
                    assert.equal(err, null);
                    let data = n.parse(res.buffer);
                    Array.prototype.slice.call(
                        data.data.slice(-5)
                    ).forEach((i, j) => {
                        assert.equal(records[fname][j], i);
                    });
                }
            );
        }
    });
});
