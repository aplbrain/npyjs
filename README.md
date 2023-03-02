<h1 align=center>npy.js</h1>
<h6 align=center>Read .npy files directly in JS</h6>

<p align=center>
    <a href="https://www.npmjs.com/package/npyjs"><img src="https://img.shields.io/npm/v/npyjs.svg?style=for-the-badge" /></a>
    <a href="https://github.com/aplbrain/npyjs"><img src="https://img.shields.io/github/issues/aplbrain/npyjs.svg?style=for-the-badge" /></a>
    <a href="https://github.com/aplbrain/npyjs"><img src="https://img.shields.io/github/license/aplbrain/npyjs.svg?style=for-the-badge" /></a>
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/aplbrain/npyjs/test-node.yml?label=Tests&style=for-the-badge">
</p>

## Installation

Include npy.js in your project directly, or:

```shell
yarn add npyjs
# npm i npyjs
```

## Import 

```javascript
import npyjs from "npyjs";
```


## Usage

-   Create a new npyjs object.

```javascript
let n = new npyjs();
```

-   This object can now be used load .npy files. Arrays can be returned via a JavaScript callback, so usage looks like this:

```javascript
n.load("my-array.npy", (array, shape) => {
    // `array` is a one-dimensional array of the raw data
    // `shape` is a one-dimensional array that holds a numpy-style shape.
    console.log(
        `You loaded an array with ${array.length} elements and ${shape.length} dimensions.`
    );
});
```

-   You can also use this library promise-style using either .then or async await:

```javascript
n.load("test.npy").then((res) => {
    // res has { data, shape, dtype } members.
});
```

```javascript
const npyArray = await n.load("test.npy");
```

## Accessing multidimensional array elements

-   You can conveniently access multidimensional array elements using the 'ndarray' library:

```javascript
import ndarray from "ndarray";
const npyArray = ndarray(data, shape);
npyArray.get(10, 15)
```

Unless otherwise specified, all code inside of this repository is covered under the license in [LICENSE](LICENSE).

Please report bugs or contribute pull-requests on [GitHub](https://github.com/aplbrain/npyjs).

---

<p align="center"><small>Made with ♥ at <a href="http://www.jhuapl.edu/"><img alt="JHU APL" align="center" src="./docs/apl-logo.png" height="23px"></a></small></p>
