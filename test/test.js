import assert from "assert";
import fs from "fs";
import path from "path";
import N from "../index.js";


describe("npyjs parser", function () {

    it("should correctly parse npy files", function () {
        const records = JSON.parse(fs.readFileSync("test/records.json"));
        let n = new N();

        for (let fname in records) {
            let fcontents = fs.readFile(
                path.resolve(`test/${fname}.npy`),
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
