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
import npyjs from 'npyjs' 
```

Or as a script tag:

```html
<script type='module'>
  import npyjs from './npyjs.js' 
  window.npyjs = npyjs
</script>
```

## Format

**npyjs.format** takes a [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) of data and an array with the dimensions of the data and returns a [npy file](https://numpy.org/devdocs/reference/generated/numpy.lib.format.html).

```js
import fs from 'fs'

const typedArray = new Int8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
const out = npyjs.format(typedArray, [5, 2])

fs.writeFileSync('ints.npy', out)
```

## Parse 

**npyjs.format** a npy file and returns an object with the following properties: 
- `data`: a typed array of data
- `shape`: an array with the shape of the data
- `dtype`: a string with type of data

You can load the file from disk:

```js
import fs from 'fs'

fs.readFile('ints.npy', (err, res) => {
  const ints = npyjs.parse(res)
  console.log(ints)
  // {
  //   data: Int8Array(10) [
  //     0, 1, 2, 3, 4,
  //     5, 6, 7, 8, 9
  //   ],
  //   shape: [ 5, 2 ]
  //   dtype: 'int8',
  // }
})
```

or with fetch:

```js
const {data, shape} = npyjs.parse(await(await fetch('ints.npy')).arrayBuffer())
```

## Contribute

Please report bugs or contribute pull-requests on [GitHub](https://github.com/aplbrain/npyjs).

Unless otherwise specified, all code inside of this repository is covered under the license in [LICENSE](LICENSE).

---

<p align="center"><small>Made with ♥ at <a href="http://www.jhuapl.edu/"><img alt="JHU APL" align="center" src="./docs/apl-logo.png" height="23px"></a></small></p>
