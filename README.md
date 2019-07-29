<h1 align=center>npy.js</h1>
<h6 align=center>Read .npy files directly in JS</h6>

<p align=center>
    <img src="https://img.shields.io/npm/v/npyjs.svg?style=for-the-badge" />
    <img src="https://img.shields.io/github/issues/aplbrain/npyjs.svg?style=for-the-badge" />
    <img src="https://img.shields.io/github/license/aplbrain/npyjs.svg?style=for-the-badge" />
</p>

## Installation
Include npy.js in your project directly, or:

```shell
yarn add npyjs
# npm i npyjs
```

## Usage

- Create a new npyjs object.
```javascript
let n = new npyjs();
```
- This object can now be used load .npy files. Arrays are returned via a JavaScript callback, so usage looks like this:
```javascript
n.load('my-array.npy', (array, shape) => {
    // `array` is a one-dimensional array of the raw data
    // `shape` is a one-dimensional array that holds a numpy-style shape.
    console.log(`You loaded an array with ${array.length} elements and ${shape.length} dimensions.`);
});
```

You can also use this library promise-style:

```javascript
n.load("test.npy").then(res => {
    // res has { data, shape, dtype } members.
});
```

Unless otherwise specified, all code inside of this repository is covered under the license in [LICENSE](LICENSE).


Please report bugs or contribute pull-requests on [GitHub](https://github.com/aplbrain/npyjs).


----

<p align="center"><small>Made with ♥ at <a href="http://www.jhuapl.edu/"><img alt="JHU APL" align="center" src="./docs/apl-logo.png" height="23px"></a></small></p>
