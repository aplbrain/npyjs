import fs from 'fs'
import path from 'path'
import assert from 'assert'

import npyjs from '../index.js' 


import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));


const records = JSON.parse(fs.readFileSync(__dirname + '/records.json'));

for (let fname in records) {
    let fcontents = fs.readFile(
        path.resolve(__dirname, `${fname}.npy`),
        null,
        function (err, res) {
            assert.equal(err, null);
            let data = npyjs.parse(res.buffer);
            Array.prototype.slice.call(
                data.data.slice(-5)
            ).forEach((i, j) => {
                assert.equal(records[fname][j], i);
            });
        }
    );
}


const {parse, format} = npyjs;

var typedArray = new Int8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
const buf0 = format(typedArray, [5, 2])
console.log(parse(buf0))

const outpath = __dirname + '/data/out.npy'

fs.writeFileSync(outpath, buf0)

var buf1 = fs.readFileSync(outpath)
fs.readFile(outpath, (err, buf2) => {
  console.log(parse(buf1))
  console.log(parse(buf2))
})

