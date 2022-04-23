import assert from "assert";
import {promises as fs} from "fs";
import path from "path";
import http from "http";
import N from "../index.js";

describe("npyjs parser", function () {
    it("should correctly parse npy files", async function () {
        const server = http.createServer(async function (req, res) {
            const fpath = path.resolve(req.url.slice(1));
            const data = await fs.readFile(fpath);
            res.writeHead(200);
            res.end(data);
        });
        server.listen();
        const {port} = server.address()

        const records = JSON.parse(await fs.readFile("test/records.json"));
        const n = new N();

        for (const fname in records) {
            const fpath = path.join("test", `${fname}.npy`)
            const data = await n.load(`http://localhost:${port}/${fpath}`)
            Array.prototype.slice.call(
                data.data.slice(-5)
            ).forEach((i, j) => {
                assert.equal(records[fname][j], i);
            });
        }

        server.close();
    });
});
