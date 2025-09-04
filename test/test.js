import assert from "assert";
import {promises as fs} from "fs";
import path from "path";
import http from "http";
import N from "../index.js";

//eslint-disable-next-line no-undef
describe("npyjs parser", function () {
    //eslint-disable-next-line no-undef
    it("should correctly parse npy files", async function () {
        const server = http.createServer(async function (req, res) {
            const fpath = path.resolve(req.url.slice(1));
            const data = await fs.readFile(fpath);
            res.writeHead(200);
            res.end(data);
        });
        server.listen();
        const {port} = server.address();

        const records = JSON.parse(await fs.readFile("test/records.json"));
        const n = new N();

        for (const fname in records) {
            const fpath = path.join("test", `${fname}.npy`);
            const data = await n.load(`http://localhost:${port}/${fpath}`);
            
            // Get the last 5 values for comparison
            const resultValues = Array.prototype.slice.call(
                data.data.slice(-5)
            );
            
            // Compare with expected values
            resultValues.forEach((actual, j) => {
                const expected = records[fname][j];
                // Use approximate equality for floating point comparisons
                if (data.dtype.includes('float')) {
                    assert.ok(
                        Math.abs(actual - expected) < 1e-5,
                        `${fname}: Expected ${expected} but got ${actual} at index ${j}`
                    );
                } else if (data.dtype.includes('int64') || data.dtype.includes('uint64')) {
                    // Convert BigInt to string for comparison
                    assert.strictEqual(
                        actual.toString(),
                        expected.toString(),
                        `${fname}: Expected ${expected} but got ${actual} at index ${j}`
                    );
                } else {
                    assert.strictEqual(
                        actual,
                        expected,
                        `${fname}: Expected ${expected} but got ${actual} at index ${j}`
                    );
                }
            });
        }

        server.close();
    });

    // Add specific test for float16 conversion
    it("should correctly convert float16 to float32", function() {
        const n = new N();
        
        // Test some known float16 to float32 conversions
        const testCases = [
            { input: 0x0000, expected: 0 },                    // Zero
            { input: 0x8000, expected: -0 },                   // Negative zero
            { input: 0x3C00, expected: 1 },                    // One
            { input: 0xBC00, expected: -1 },                   // Negative one
            { input: 0x7C00, expected: Infinity },             // Infinity
            { input: 0xFC00, expected: -Infinity },            // Negative infinity
            { input: 0x7E00, expected: NaN },                  // NaN
            { input: 0x3200, expected: 0.1875 }               // 1.5 * 2^-9
        ];

        testCases.forEach(({input, expected}) => {
            const result = N.float16ToFloat32(input);
            if (Number.isNaN(expected)) {
                assert.ok(Number.isNaN(result), `Expected NaN for input 0x${input.toString(16)}`);
            } else {
                assert.strictEqual(
                    result,
                    expected,
                    `Failed converting 0x${input.toString(16)}: expected ${expected}, got ${result}`
                );
            }
        });
    });

    it("should handle float16 data based on conversion flag", async function() {
        const server = http.createServer(async function (req, res) {
            const fpath = path.resolve(req.url.slice(1));
            const data = await fs.readFile(fpath);
            res.writeHead(200);
            res.end(data);
        });
        server.listen();
        const {port} = server.address();

        // Test with conversion enabled (default)
        const nWithConversion = new N();
        const dataConverted = await nWithConversion.load(
            `http://localhost:${port}/test/data/10-float16.npy`
        );
        assert.ok(dataConverted.data instanceof Float32Array, 
            "With conversion enabled, should return Float32Array");

        // Test with conversion disabled
        const nWithoutConversion = new N({ convertFloat16: false });
        const dataRaw = await nWithoutConversion.load(
            `http://localhost:${port}/test/data/10-float16.npy`
        );
        assert.ok(dataRaw.data instanceof Uint16Array, 
            "With conversion disabled, should return Uint16Array");

        server.close();
    });
});


//eslint-disable-next-line no-undef
describe("npyjs dumper", function () {
    //eslint-disable-next-line no-undef
    it("should correctly dump npy files", async function () {
        const server = http.createServer(async function (req, res) {
            const fpath = path.resolve(req.url.slice(1));
            const data = await fs.readFile(fpath);
            res.writeHead(200);
            res.end(data);
        });
        server.listen();
        const {port} = server.address();
        
        const records = JSON.parse(await fs.readFile("test/records.json"));
        const n = new N();
        
        for (const fname in records) {
            const fpath = path.join("test", `${fname}.npy`);
            const data = await n.load(`http://localhost:${port}/${fpath}`);
            const dumped = n.dump(data.data);
            const reloaded = await n.loadBlob(dumped);
            Array.prototype.slice.call(
                reloaded.data.slice(-5)
            ).forEach((i, j) => {
                assert.equal(records[fname][j], i);
            });
        }
    });
});