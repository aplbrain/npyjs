<h1 align="center">npyjs</h1>
<h6 align="center">Read NumPy <code>.npy</code> files in JavaScript (Node, Browser, Deno)</h6>

<p align="center">
  <a href="https://www.npmjs.com/package/npyjs"><img src="https://img.shields.io/npm/v/npyjs.svg?style=for-the-badge" /></a>
  <a href="https://github.com/aplbrain/npyjs/issues"><img src="https://img.shields.io/github/issues/aplbrain/npyjs.svg?style=for-the-badge" /></a>
  <a href="https://github.com/aplbrain/npyjs/blob/main/LICENSE"><img src="https://img.shields.io/github/license/aplbrain/npyjs.svg?style=for-the-badge" /></a>
  <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/aplbrain/npyjs/ci.yml?label=Tests&style=for-the-badge">
</p>

Read `.npy` arrays saved with [NumPy](https://numpy.org/doc/stable/reference/generated/numpy.save.html) directly in modern JavaScript runtimes.

---

## Installation

```bash
npm install npyjs
# or
yarn add npyjs
```

Supports **Node ≥18**, modern browsers, and Deno/Bun.

---

## Import

```ts
// Modern named export (recommended)
import { load } from "npyjs";

// Back-compatibility class (matches legacy docs/tests)
import npyjs from "npyjs";
```

---

## Usage

### 1. Functional API (preferred)

```ts
import { load } from "npyjs";

const arr = await load("my-array.npy");
// arr has { data, shape, dtype, fortranOrder }
console.log(arr.shape); // e.g., [100, 784]
```

### 2. Legacy Class API (still supported)

```ts
import npyjs from "npyjs";

// Default options
const n = new npyjs();

// Disable float16→float32 conversion
const n2 = new npyjs({ convertFloat16: false });

const arr = await n.load("my-array.npy");
```

---

## Accessing multidimensional elements

`npyjs` returns flat typed arrays with a `shape`. `npyjs` also ships a small helper to turn the flat `data` + `shape` into nested JS arrays.

```ts
import { load } from "npyjs";
import { reshape } from "npyjs/reshape";

const { data, shape, fortranOrder } = await load("my-array.npy");
const nested = reshape(data, shape, fortranOrder); // -> arrays nested by dims
```

For C-order arrays (the NumPy default), pass fortranOrder = false (default).

For Fortran-order arrays, pass true and the helper will return the natural row-major nested structure.

Or pair it with [ndarray](https://github.com/scijs/ndarray) or TensorFlow\.js:

```ts
import ndarray from "ndarray";
import { load } from "npyjs";

const { data, shape } = await load("my-array.npy");
const tensor = ndarray(data, shape);

console.log(tensor.get(10, 15));
```

---

## Supported Data Types

-   `int8`, `uint8`
-   `int16`, `uint16`
-   `int32`, `uint32`
-   `int64`, `uint64` (as `BigInt`)
-   `float32`
-   `float64`
-   `float16` (converted to float32 by default)
-   `complex64` (as `Float32Array` with interleaved real/imag)
-   `complex128` (as `Float64Array` with interleaved real/imag)

### Float16 Control

```ts
// Default: converts float16 → float32
const n1 = new npyjs();

// Keep raw Uint16Array
const n2 = new npyjs({ convertFloat16: false });
```

### Complex Numbers

Complex arrays are returned as typed arrays with interleaved real and imaginary parts: `[real0, imag0, real1, imag1, ...]`

```ts
import { load } from "npyjs";

const { data, shape } = await load("complex-array.npy");
// For a shape of [3], data will have 6 elements: [re0, im0, re1, im1, re2, im2]

// Access the first complex number
const real0 = data[0];
const imag0 = data[1];
```

---

## Writing .npy Files

Use the `dump` function to create `.npy` files:

```ts
import { dump } from "npyjs";
import { writeFileSync } from "fs";

// Dump a typed array
const arr = new Float32Array([1.0, 2.0, 3.0, 4.0]);
const bytes = dump(arr, [2, 2]); // 2x2 shape
writeFileSync("output.npy", Buffer.from(bytes));

// Dump a plain array (dtype is inferred)
const plain = [1, 2, 3, 4];
const bytes2 = dump(plain, [4]);
```

### Dumping Complex Arrays

Since complex types cannot be inferred from plain number arrays, use the `dtype` option:

```ts
import { dump } from "npyjs";

// Complex array: 1+2j, 3-4j as interleaved [real, imag, ...]
const complexData = [1, 2, 3, -4];
const bytes = dump(complexData, [2], { dtype: "c8" });  // complex64

// Or use c16 for complex128
const bytes128 = dump(complexData, [2], { dtype: "c16" });
```

---

## Development

-   Built with [tsup](https://github.com/egoist/tsup) (dual ESM + CJS + d.ts)
-   Tested with [Vitest](https://vitest.dev)
-   CI on GitHub Actions (Node 18/20/22)

### Commands

```bash
npm run build       # Build to dist/
npm test            # Run Vitest
npm run typecheck   # TypeScript type checking
```

---

## License

Apache-2.0 © [JHU APL](http://www.jhuapl.edu/)

---

<p align="center"><small>Made with ♥ at <a href="http://www.jhuapl.edu/"><img alt="JHU APL" align="center" src="./docs/apl-logo.png" height="23px"></a></small></p>
````
