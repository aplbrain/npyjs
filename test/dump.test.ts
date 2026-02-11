// tests/dump.test.ts
import { describe, it, expect } from "vitest";
import * as npyjs from "../src";

describe("npyjs dump", () => {

    it("each kind", async () => {
        const arrays = [
            new Uint8Array([1, 2, 254, 255]),
            new Int8Array([1, 2, 254, 255]),
            new Uint8ClampedArray([1, 2, 254, 255]),
            new Uint16Array([1, 2, 254, 255]),
            new Int16Array([1, 2, 999, 1000]),
            new Uint32Array([1, 2, 999, 1000]),
            new Int32Array([1, 2, 999, 1000]),
            new Float32Array([0.1, NaN, 10_000, Infinity]),
            new BigUint64Array([BigInt(1), BigInt(1), BigInt(1), BigInt(1_000_000_000_000_000)]),
            new BigInt64Array([BigInt(1), BigInt(1), BigInt(1), BigInt(1_000_000_000_000_000)]),
            new Float64Array([0.1, NaN, 10_000, Infinity]),
            new Array(true, true, false),
            new Array(1, 2, 3, 4),
            new Array("some", "text", "to", "test here")
        ];
        for (let array of arrays) {
            const bytes = npyjs.dump(array, [2, 2]);
            const expected = array  instanceof Uint8ClampedArray ? new Uint8Array(array.buffer) : array;
            // parse back the bytes to check the result
            const result = await npyjs.load(bytes);
            expect(result.shape).toEqual([2, 2]);
            if (array instanceof Array) {
                expect(Array.from(result.data)).toEqual(expected);
            } else {
                expect(result.data).toEqual(expected);
            }
        }
    });

    it("check 1D shape", async () => {
        const array = new Uint8Array([1, 2, 3, 4, 5, 6]);
        const bytes = npyjs.dump(array);
        const result = await npyjs.load(bytes);
        expect(result.shape).toEqual([6]);
        expect(result.data).toEqual(array);
    });

    it("check width/height", async () => {
        const array = new Uint8Array([1, 2, 3, 4, 5, 6]);
        const shape = [3, 2];
        const bytes = npyjs.dump(array, shape);
        const result = await npyjs.load(bytes);
        expect(result.shape).toEqual(shape);
    });

    it("unsupported array", async () => {
        class MyArray {};
        const array = new MyArray();
        try {
            // @ts-expect-error
            npyjs.dump(array);
        } catch (error) {
            expect(error.toString()).toContain("MyArray")
        }
    });

    it("complex64 (c8) with plain array", async () => {
        const complexData = [1, 2, 3, -4, 5, 6];
        const bytes = npyjs.dump(complexData, [3], { dtype: "c8" });
        const result = await npyjs.load(bytes);

        expect(result.dtype).toBe("c8");
        expect(result.shape).toEqual([3]);
        expect(result.data).toEqual(new Float32Array(complexData));
    });

    it("complex128 (c16) with plain array", async () => {
        const complexData = [1.5, 2.5, -3.5, 4.5];
        const bytes = npyjs.dump(complexData, [2], { dtype: "c16" });
        const result = await npyjs.load(bytes);

        expect(result.dtype).toBe("c16");
        expect(result.shape).toEqual([2]);
        expect(result.data).toEqual(new Float64Array(complexData));
    });

    it("complex64 (c8) with Float32Array", async () => {
        const original = new Float32Array([1, 2, 3, -4, 5.5, 6.5]);
        const bytes = npyjs.dump(original, [3], { dtype: "c8" });
        const result = await npyjs.load(bytes);

        expect(result.dtype).toBe("c8");
        expect(result.shape).toEqual([3]);
        expect(result.data).toEqual(original);
    });

    it("complex128 (c16) with Float64Array", async () => {
        const original = new Float64Array([1.1, 2.2, 3.3, -4.4]);
        const bytes = npyjs.dump(original, [2], { dtype: "c16" });
        const result = await npyjs.load(bytes);

        expect(result.dtype).toBe("c16");
        expect(result.shape).toEqual([2]);
        expect(result.data).toEqual(original);
    });

    it("2D complex array", async () => {
        const complexData = [1, 1, 2, 2, 3, 3, 4, 4];
        const bytes = npyjs.dump(complexData, [2, 2], { dtype: "c8" });
        const result = await npyjs.load(bytes);

        expect(result.dtype).toBe("c8");
        expect(result.shape).toEqual([2, 2]);
        expect(result.data).toEqual(new Float32Array(complexData));
    });
});
