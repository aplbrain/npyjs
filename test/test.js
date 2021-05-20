import fs from 'fs'
import path from 'path'
import assert from 'assert'

import * as npyjs from '../index.js' 


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
                // console.log(i)
                assert.equal(records[fname][j], i);
            });
        }
    );
}
