const dtypes = {
  '<u1': {
    name: 'uint8',
    size: 8,
    arrayConstructor: Uint8Array,
  },
  '|u1': {
    name: 'uint8',
    size: 8,
    arrayConstructor: Uint8Array,
  },
  '<u2': {
    name: 'uint16',
    size: 16,
    arrayConstructor: Uint16Array,
  },
  '|i1': {
    name: 'int8',
    size: 8,
    arrayConstructor: Int8Array,
  },
  '<i2': {
    name: 'int16',
    size: 16,
    arrayConstructor: Int16Array,
  },
  '<u4': {
    name: 'uint32',
    size: 32,
    arrayConstructor: Int32Array,
  },
  '<i4': {
    name: 'int32',
    size: 32,
    arrayConstructor: Int32Array,
  },
  '<u8': {
    name: 'uint64',
    size: 64,
    arrayConstructor: BigUint64Array,
  },
  '<i8': {
    name: 'int64',
    size: 64,
    arrayConstructor: BigInt64Array,
  },
  '<f4': {
    name: 'float32',
    size: 32,
    arrayConstructor: Float32Array
  },
  '<f8': {
    name: 'float64',
    size: 64,
    arrayConstructor: Float64Array
  },
};


function parse(buffer){
  const buf = new Uint8Array(buffer);
  if (buf[6] != 1) throw 'Only npy version 1 is supported';

  const headerLength = buf[8] + buf[9]*256
  const offsetBytes = 10 + headerLength;

  const hcontents = new TextDecoder('utf-8')
    .decode(buf.slice(10, 10 + headerLength));
  const header = JSON.parse(
    hcontents
      .replace(/'/g, '"')
      .replace('False', 'false')
      .replace('(', '[')
      .replace(/,*\),*/g, ']')
  );

  const shape = header.shape;
  if (header.fortan_order) throw 'Fortran-contiguous array data are not supported';

  const dtype = dtypes[header.descr];
  const nums = new dtype['arrayConstructor'](buf.slice(offsetBytes).buffer);

  return {
    dtype: dtype.name,
    data: nums,
    shape,
  };
}

function format(typedArray, shape){
  let dtype = null;
  for (let d in dtypes){
    if (dtypes[d].arrayConstructor == typedArray.constructor) dtype = d;
  }
  if (dtype === null) throw 'Invalid typedArray';

  const header = `{'descr': '${dtype}', 'fortran_order': False, 'shape': (${shape.join(',')},), }\n`;
  const spacepad = Array.from({length: 64 - (8 + header.length) % 64}, d => '\x20').join('');

  const hl = (header + spacepad).length

  return Buffer.concat([
    Buffer.from('\x93NUMPY\x01\x00', 'latin1'),
    // convert to little-endian
    Buffer.from(new Uint8Array([hl % 256, Math.floor(hl/256)])),
    Buffer.from(header + spacepad, 'latin1'),
    Buffer.from(typedArray.buffer)
  ]);
}

export {parse, format}

var typedArray = new Float32Array([1.9, 1, 2, 3, 4, 5, 6, 7, 8, 9])
var typedArray = new Float32Array([1.9, 1, 2, 3, 4, 5, 6, 7, 8, 9])
const buf0 = format(typedArray, [5, 2])
console.log(parse(buf0))

// var u8 = new Uint8Array([
//    51, 51, 243, 63,  0,  0, 128, 63,   0,  0,
//     0, 64,   0,  0, 64, 64,   0,  0, 128, 64,
//     0,  0, 160, 64,  0,  0, 192, 64,   0,  0,
//   224, 64,   0,  0,  0, 65,   0,  0,  16, 65
// ])

// console.log(u8)
// console.log(new Float32Array(u8.buffer))
// console.log(new Float32Array(u8))


// https://github.com/nodejs/node/issues/9336

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const path = __dirname + '/test/data/out.npy'

// const buf1 = new ArrayBuffer(140)
// var buf2 = Buffer.from(buf1)
// var buf2 = Buffer.from(buf1.buffer)

// const buf2 = (new Uint8Array(
//   buf1.buffer,
//   0,
//   buf1.length / Uint8Array.BYTES_PER_ELEMENT))


// typedArray = new Int8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

// var v0 = to_Uint8array(typedArray)
// console.log(v0)
// v0[0] = 100
// console.log({typedArray, v0})



// var v1 = to_Uint8array(typedArray)
// console.log(v1)
// v1[1] = 100
// console.log({typedArray, v0,})





var buf1 = fs.readFileSync(path)
fs.readFile(path, (err, buf2) => {
  // console.log('\nbuffer')
  // console.log(buf1)
  // console.log(buf2)


  // console.log('\ncompare')
  // console.log(Buffer.compare(buf1, buf2))

  // console.log('\nbyteLength')
  // console.log(buf1.byteLength)
  // console.log(buf2.byteLength)

  // console.log('\nlength')
  // console.log(buf1.length)
  // console.log(buf2.length)

  // console.log('\nbyteOffset')
  // console.log(buf1.byteOffset)
  // console.log(buf2.byteOffset)

  // console.log('\nbuffer.buffer')
  // console.log(buf1.buffer)
  // console.log(buf2.buffer)
  // return 0

  // console.log('\nto_Uint8array')
  // console.log(to_Uint8array(buf1))
  // console.log(to_Uint8array(buf2))

  // console.log('\nto_Uint8array .buffer')
  // console.log(to_Uint8array(buf1).buffer)
  // console.log(to_Uint8array(buf2).buffer)

  // console.log('\nto_Uint8array_copy')
  // console.log(to_Uint8array_copy(buf1))
  // console.log(to_Uint8array_copy(buf2))

  // console.log(parse(buf1))
})



