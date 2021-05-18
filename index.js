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
  const version = new DataView(buffer.slice(6, 7)).getUint8(0); 
  if (version != 1) throw 'Only npy version 1 is supported'

  const headerLength = new DataView(buffer.slice(8, 10)).getUint8(0);
  const offsetBytes = 10 + headerLength;

  const hcontents = new TextDecoder('utf-8').decode(
    new Uint8Array(buffer.slice(10, 10 + headerLength))
  );
  const header = JSON.parse(
    hcontents
      .replace(/'/g, '"')
      .replace('False', 'false')
      .replace('(', '[')
      .replace(/,*\),*/g, ']')
  );

  const shape = header.shape;
  if (header.fortan_order) throw 'Fortran-contiguous array data not supported'

  const dtype = dtypes[header.descr];
  const nums = new dtype['arrayConstructor'](buffer, offsetBytes);

  return {
    dtype: dtype.name,
    data: nums,
    shape,
  };
}

function format(typedArray, shape){
  let dtype = null;
  for (d in dtypes){
    if (dtypes[d].arrayConstructor == typedArray.constructor) dtype = d;
  }
  if (dtype === null) throw 'Invalid typedArray';

  const header = `{'descr': '${dtype}', 'fortran_order': False, 'shape': (${shape.join(',')},), }\n`;
  const spacePad = Array.from({length: 64 - (8 + header.length) % 64}, d => '\x20').join('');

  return Buffer.concat([
    Buffer.from('\x93NUMPY\x01\x00', 'ascii'),
    Buffer.from(new Uint8Array([(spacePad + header).length, 0])),
    Buffer.from(header + spacePad, 'ascii'),
    Buffer.from(typedArray)
  ]);
}

module.exports = {parse, format}





// var typedArray = new Int8Array(10)
// typedArray.forEach((d, i) => typedArray[i] = i)

// var path = __dirname + '/test/data/out.npy'
// require('fs').writeFileSync(path, format(typedArray, [5, 2]), 'binary')

// var path = __dirname + '/test/data/out.npy'
// require('fs').readFile(path, null, (err, res) => {
//   var obj = parse(res.buffer)
//   console.log(obj)
// })






