export function reshape<T>(flat: ArrayLike<T>, shape: number[], fortranOrder = false): any {
    if (!shape.length) return flat[0];
    const total = shape.reduce((a, b) => a * b, 1);
    if (flat.length !== total) throw new Error("Size mismatch");
    const dims = fortranOrder ? [...shape].reverse() : shape;
    function build(idx: number, dim: number): any {
        if (dim === dims.length - 1) {
            const step = dims[dim];
            const start = idx * step;
            return Array.from({ length: step }, (_, i) => flat[start + i]);
        }
        const step = dims.slice(dim + 1).reduce((a, b) => a * b, 1);
        return Array.from({ length: dims[dim] }, (_, i) => build(idx * dims[dim] + i, dim + 1));
    }
    const out = build(0, 0);
    return fortranOrder ? transposeRecursive(out) : out;
}

function transposeRecursive(arr: any): any {
    if (!Array.isArray(arr) || !Array.isArray(arr[0])) return arr;
    const rows = arr.length, cols = arr[0].length;
    const out = Array.from({ length: cols }, () => Array(rows));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][r] = transposeRecursive(arr[r][c]);
    return out;
}
