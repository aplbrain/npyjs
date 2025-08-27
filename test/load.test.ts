// tests/load.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import http from "http";

import N from "../index.js";

// --- small HTTP file server for fetch() based loader ---
function startServer(root = process.cwd()): Promise<{ server: http.Server; baseUrl: string }> {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const rel = (req.url ?? "/").replace(/^\//, "");
                const fpath = path.resolve(root, rel);
                const data = await fs.readFile(fpath);
                res.writeHead(200);
                res.end(data);
            } catch (e) {
                res.writeHead(404);
                res.end("not found");
            }
        });
        server.on("error", reject);
        server.listen(0, () => {
            const addr = server.address();
            if (!addr || typeof addr === "string") return reject(new Error("Failed to bind test server"));
            resolve({ server, baseUrl: `http://localhost:${addr.port}` });
        });
    });
}

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
});

afterAll(async () => {
    if (server) await new Promise<void>((r) => server.close(() => r()));
});

describe("npyjs parser", () => {
    it("parses npy files and matches tail values", async () => {
        // records.json should map filename (no .npy) -> array of the last 5 expected values
        const records = JSON.parse(await fs.readFile("test/records.json", "utf8"));
        const n = new (N as any)();

        for (const fname of Object.keys(records)) {
            const fpath = path.join("test", `${fname}.npy`);
            const data = await n.load(`${baseUrl}/${fpath}`);

            // Tail 5 values from the result for comparison
            const tail = Array.prototype.slice.call(data.data.slice(-5)) as Array<number | bigint>;

            tail.forEach((actual, j) => {
                const expected = records[fname][j];

                // Handle NaN explicitly for float comparisons
                const isActualNaN = typeof actual === "number" && Number.isNaN(actual);
                const isExpectedNaN = typeof expected === "number" && Number.isNaN(expected);

                // Detect dtype class
                const dtype: string = data.dtype || ""; // e.g., "float32", "f4", "i8", "u8"
                const isFloat = /^f\d$/.test(dtype) || /float/i.test(dtype);
                const isI64 = dtype === "i8" || /int64/i.test(dtype);
                const isU64 = dtype === "u8" || /uint64/i.test(dtype);

                if (isFloat) {
                    if (isExpectedNaN) {
                        expect(isActualNaN).toBe(true);
                    } else {
                        expect(typeof actual).toBe("number");
                        expect(actual as number).toBeCloseTo(Number(expected), 5);
                    }
                } else if (isI64 || isU64 || typeof actual === "bigint") {
                    // Compare as strings to avoid bigint/number mismatch
                    expect(actual.toString()).toBe(String(expected));
                } else {
                    expect(actual).toBe(expected);
                }
            });
        }
    });

    it("converts float16 to float32 correctly (spot checks)", () => {
        // Support either legacy static name or a new helper if you renamed it.
        const f16 =
            (N as any).float16ToFloat32 ||
            (N as any).f16toF32 ||
            ((_: number) => {
                throw new Error("No float16->float32 conversion function found on export N");
            });

        const cases = [
            { input: 0x0000, expected: 0 }, // +0
            { input: 0x8000, expected: -0 }, // -0
            { input: 0x3c00, expected: 1 }, // 1
            { input: 0xbc00, expected: -1 }, // -1
            { input: 0x7c00, expected: Infinity }, // +Inf
            { input: 0xfc00, expected: -Infinity }, // -Inf
            { input: 0x7e00, expected: NaN }, // NaN
            { input: 0x3200, expected: 0.1875 } // 1.5 * 2^-9
        ];

        for (const { input, expected } of cases) {
            const got = f16(input);
            if (Number.isNaN(expected)) {
                expect(Number.isNaN(got)).toBe(true);
            } else if (Object.is(expected, -0)) {
                expect(Object.is(got, -0)).toBe(true);
            } else {
                expect(got).toBe(expected);
            }
        }
    });

    it("respects convertFloat16 flag (Float32Array vs Uint16Array)", async () => {
        const url = `${baseUrl}/test/data/10-float16.npy`;

        const nDefault = new (N as any)(); // conversion enabled by default
        const converted = await nDefault.load(url);
        expect(converted.data instanceof Float32Array).toBe(true);

        const nRaw = new (N as any)({ convertFloat16: false });
        const raw = await nRaw.load(url);
        expect(raw.data instanceof Uint16Array).toBe(true);
    });
});
