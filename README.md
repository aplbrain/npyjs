# npy.js

## Installation
Include npy.js in your project.

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

Unless otherwise specified, all code inside of this repository is covered under the license in [LICENSE](LICENSE).

## Known Issues
- **<kbd>PRIORITY</kbd>** Currently only supports uint.

Please report bugs or contribute pull-requests on [GitHub](https://github.com/jhuapl-boss/npyjs).
