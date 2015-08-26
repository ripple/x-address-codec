'use strict';
/*eslint-disable comma-spacing*/

const hash = require('hash.js');
const BN = require('bn.js');
const _ = require('lodash');
const assert = require('assert');
const fixtures = require('./fixtures/base58.json');
const apiFactory = require('../src');

const VER_ED25519_SEED = [1, 225, 75];
const TWENTY_ZEROES = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

/*eslint-enable comma-spacing*/

function sha256(bytes) {
  return hash.sha256().update(bytes).digest();
}

function digitArray(str) {
  return str.split('').map(function(d) {
    return parseInt(d, 10);
  });
}

function bnFactory(bytes) {
  return new BN(bytes, 'be');
}

function hexToByteArray(hex) {
  return new Buffer(hex, 'hex').toJSON().data;
}

const codecMethods = {
  Test: {
    versionTypes: ['one', 'two'],
    versions: [1, 2],
    expectedLength: 4
  }
};
const options = {sha256, defaultAlphabet: 'ripple', codecMethods};
const {
  decodeTest,
  encodeTest,
  isValidTest,
  encode,
  decode,
  codecs: {ripple}
} = apiFactory(options);

describe('Codec', function() {
  describe('findPrefix', function() {
    it('can find the right version bytes to induce `sEd` for 16 byte payloads',
        function() {
      const version = ripple.findPrefix('sEd', 16);

      // Fill an array of 16 bytes
      const filled = _.fill(Array(16), 0xFF);

      // For all values 0-255, set MSB to value, then encode
      for (let i = 0; i < 0xFF; i++) {
        filled[0] = i;
        const encoded = encode(filled, {version});
        // Check that sEd prefix was induced
        assert.equal('sEd', encoded.slice(0, 3));
      }

      // This should already be filled with 0xFF, but for simple assuredness
      _.fill(filled, 0xFF);
      // For all values 0-255, set LSB to value, then encode
      for (let i = 0; i < 0xFF; i++) {
        filled[filled.length - 1] = i;
        const encoded = encode(filled, {version});
        assert.equal('sEd', encoded.slice(0, 3));
      }

      // The canonical version for sed25519 prefixes
      assert(_.isEqual(version, VER_ED25519_SEED));
    });
  });
});

describe('apiFactory', function() {
  describe('encodeVersioned', function() {
    it('0', function() {
      const encoded = encode(digitArray('00000000000000000000'),
                                   {version: 0});
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
    });
    it('1', function() {
      const encoded = encode(digitArray('00000000000000000001'),
                                   {version: 0});
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });
  describe('decodeVersioned', function() {
    it('rrrrrrrrrrrrrrrrrrrrrhoLvTp', function() {
      const decoded = decode('rrrrrrrrrrrrrrrrrrrrrhoLvTp',
                                   {version: 0});

      assert(bnFactory(decoded).cmpn(0) === 0);
    });
    it('rrrrrrrrrrrrrrrrrrrrBZbvji', function() {
      const decoded = decode('rrrrrrrrrrrrrrrrrrrrBZbvji',
                                   {version: 0});
      assert(bnFactory(decoded).cmpn(1) === 0);
    });
  });
  describe('decode-encode identity', function() {
    it('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function() {
      const decoded = decode('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      const encoded = encode(decoded);
      assert.strictEqual(encoded, 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
  });
  describe('encode', function() {
    fixtures.ripple.forEach(test => {
      it(`encodes "${test.hex}" to "${test.string}"`, function() {
        const encoded = encode(hexToByteArray(test.hex));
        assert.strictEqual(encoded, test.string);
      });
    });
  });
  describe('Buffer encoding', function() {
    it('can encode zero address', function() {
      const buf = new Buffer(TWENTY_ZEROES);
      const encoded = encode(buf, {version: 0});
      assert.equal(encoded, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
    });
  });
  describe('decoding multiple versions', function() {
    it('returns the version passed in by reference', function() {
      const args = {versions: [VER_ED25519_SEED], expectedLength: 16};
      const decoded = decode('sEdTM1uX8pu2do5XvTnutH6HsouMaM2', args);
      assert(decoded.version === VER_ED25519_SEED);
    });
  });
  describe('decode', function() {
    fixtures.ripple.forEach(test => {
      it(`decodes "${test.string}" to "${test.hex}"`, function() {
        const decoded = decode(test.string);
        assert.deepEqual(decoded, hexToByteArray(test.hex));
      });
    });
  });
  describe('codecMethods', function() {
    it('encode allows versions to be specified with a name', function() {
      const encoded = encodeTest([1, 2, 3, 4], 'two');
      const decoded = decodeTest(encoded);
      assert.equal(decoded.version, 2);
    });
    it('validate returns true when valid else false', function() {
      const knownValid = 'p7oFVcrcqMhU';
      assert(isValidTest(knownValid));
      assert(!isValidTest(knownValid + 'p'));
    });
  });
});
