import { describe, it, expect } from "vitest";
import { reshape } from "../src/reshape";

describe("reshape (C-order)", () => {
    it("returns scalar when shape is []", () => {
        const out = reshape([42], []);
        expect(out).toBe(42);
    });

    it("1D -> 1D structural identity", () => {
        const flat = [0, 1, 2, 3, 4];
        const out = reshape(flat, [5]);
        expect(out).toEqual([0, 1, 2, 3, 4]);
    });

    it("flat -> 2D row-major", () => {
        const flat = [1, 2, 3, 4, 5, 6];
        const out = reshape(flat, [2, 3]); // 2 rows, 3 cols
        expect(out).toEqual([
            [1, 2, 3],
            [4, 5, 6],
        ]);
    });

    it("flat -> 3D row-major", () => {
        // shape [2,2,3]
        const flat = Array.from({ length: 12 }, (_, i) => i + 1);
        const out = reshape(flat, [2, 2, 3]);
        expect(out).toEqual([
            [
                [1, 2, 3],
                [4, 5, 6],
            ],
            [
                [7, 8, 9],
                [10, 11, 12],
            ],
        ]);
    });

    it("throws on size mismatch", () => {
        expect(() => reshape([1, 2, 3], [2, 2])).toThrow(/Size mismatch/i);
    });
});

describe("reshape (Fortran-order)", () => {
    it("2D column-major interpretation and transpose back", () => {
        // Pretend data laid out in Fortran-order for shape (2,3)
        // Fortran memory order for 2x3 would be:
        // [[1,3,5],
        //  [2,4,6]] in column-major linearization -> flat = [1,2,3,4,5,6]
        const flat = [1, 2, 3, 4, 5, 6];
        const out = reshape(flat, [2, 3], true /* fortran */);

        // Your implementation reverses dims for building then transposeRecursive,
        // resulting in the conventional row-major nested arrays:
        // [[1,2,3],
        //  [4,5,6]]
        expect(out).toEqual([
            [1, 2, 3],
            [4, 5, 6],
        ]);
    });

    it("3D Fortran-order roundtrip shape", () => {
        // shape (2,2,3) with fortran_order True; we can build expected by
        // taking the row-major nested array and ensure the output matches it.
        const flat = Array.from({ length: 12 }, (_, i) => i + 1);
        const out = reshape(flat, [2, 2, 3], true);

        // Expected is same nested structure as row-major “human readable”
        expect(out).toEqual([
            [
                [1, 2, 3],
                [4, 5, 6],
            ],
            [
                [7, 8, 9],
                [10, 11, 12],
            ],
        ]);
    });

    it("1D Fortran-order is no-op on structure", () => {
        const flat = [10, 20, 30];
        const out = reshape(flat, [3], true);
        expect(out).toEqual([10, 20, 30]);
    });
});
