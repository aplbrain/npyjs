## Installation

```shell
yarn add npyjs
```

Import as a module:

```js
import npyjs from 'npyjs' 
```

Or in a script tag:

```html
<script type='module'>
  import npyjs from './npyjs.js' 
  window.npyjs = npyjs
</script>
```

## Parse 

**npyjs.format** takes a npy file and returns an object with the following properties: 
- `data`: a typed array of data
- `shape`: an array with the shape of the data
- `dtype`: a string with type of data

You can load a file with fetch:

```js
const {data, shape, dtype} = npyjs.parse(await(await fetch('ints.npy')).arrayBuffer())
```

Or from disk: 

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

## Format

**npyjs.format** takes a [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) of data and an array with the dimensions of the data. It returns a [npy file](https://numpy.org/devdocs/reference/generated/numpy.lib.format.html).

```js
import fs from 'fs'

const typedArray = new Int8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
const out = npyjs.format(typedArray, [5, 2])

fs.writeFileSync('ints.npy', out)
```