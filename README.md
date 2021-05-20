<h1 align=center>npy.js</h1>
<h6 align=center>Read .npy files directly in JS</h6>

<p align=center>
    <img src="https://img.shields.io/npm/v/npyjs.svg?style=for-the-badge" />
    <img src="https://img.shields.io/github/issues/aplbrain/npyjs.svg?style=for-the-badge" />
    <img src="https://img.shields.io/github/license/aplbrain/npyjs.svg?style=for-the-badge" />
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/aplbrain/npyjs/Node.js CI?label=Tests&style=for-the-badge">
</p>

## Installation

```shell
yarn add npyjs
```

Import as a module:

```js
import * as npyjs from 'npyjs' 
```

Or as a script tag:

```html
<script type='module'>
  import * as npyjs from './npyjs.js' 
  window.npyjs = npyjs
</script>
```

## Format

```js
import fs from 'fs'

const typedArray = new Int8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
const buffer = format(typedArray, [5, 2])

console.log(parse(buffer))
fs.writeFileSync('data.npy', buffer, 'binary')
```

## Parse 

```js
import fs from 'fs'

fs.readFile('data.npy', null, (err, res) => {
  const obj = parse(res.buffer)
  console.log(obj)
  / *



   // {data, shape, dtype}
})
```

-   This object can now be used load .npy files. Arrays are returned via a JavaScript callback, so usage looks like this:

```javascript
n.load("my-array.npy", (array, shape) => {
    // `array` is a one-dimensional array of the raw data
    // `shape` is a one-dimensional array that holds a numpy-style shape.
    console.log(
        `You loaded an array with ${array.length} elements and ${shape.length} dimensions.`
    );
});
```

You can also use this library promise-style:

```javascript
n.load("test.npy").then((res) => {
    // res has { data, shape, dtype } members.
});
```

Unless otherwise specified, all code inside of this repository is covered under the license in [LICENSE](LICENSE).

Please report bugs or contribute pull-requests on [GitHub](https://github.com/aplbrain/npyjs).

---

<p align="center"><small>Made with ♥ at <a href="http://www.jhuapl.edu/"><img alt="JHU APL" align="center" src="./docs/apl-logo.png" height="23px"></a></small></p>
