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

    it("should load a 1D array", function () {
        // const records = JSON.parse(fs.readFileSync("test/records.json"));
        let n = new N();

        let fcontents = fs.readFileSync(
            path.resolve(__dirname, "data/10-int8.npy")
        );

        n.parse(fcontents.buffer);
    });
});
