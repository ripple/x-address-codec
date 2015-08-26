'use strict';

const assert = require('assert');
const utils = require('../src/utils');

describe('utils', function() {
  it('can concatenate a single element, a list, a Buffer etc', function() {
    const e = 1;
    const array = [2,3];
    // Any seq where seq.length and e=seq[ix] is supported
    const buf = new Buffer([4,5]);
    const typed = new Uint8Array([6, 7]);
    assert.deepEqual(
      [1, 2,3, 4,5, 6,7],
      utils.concatArgs(e, array, buf, typed));
  });
});
