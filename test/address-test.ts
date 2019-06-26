'use strict';
/*eslint-disable comma-spacing*/

import * as crypto from 'crypto'

import apiFactory from '../src'
import fixtures from './fixtures/base58.json'
import assert from 'assert'
import * as _ from 'lodash'
import BN from 'bn.js'
import { IndexedBytes } from '../src/utils'
import { BinaryLike } from 'crypto'

const VER_ED25519_SEED = [1, 225, 75];
const TWENTY_ZEROES = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

/*eslint-enable comma-spacing*/

function sha256(bytes: IndexedBytes) {
  return crypto.createHash('sha256').update(bytes as BinaryLike).digest();
}

function digitArray(str: string) {
  return str.split('').map(function(d) {
    return parseInt(d, 10);
  });
}

function bnFactory(bytes: any) {
  return new BN(bytes, 'be');
}

function hexToByteArray(hex: string) {
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

describe('TaggedAddresses', () => {
  const BITSTAMP_ADDY =  'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'

  const testHumanPrefix = ''
  let join = 'xXx'
  const destTagHumanSuffix = join +
    'desT' +
    '13371337' +
    join +
    'netTest' +
    join
  const expiresBuffer = Buffer.alloc(4)
  expiresBuffer.writeUInt32BE(1561571390, 0)

  const tests: Array<[string, Buffer]> = [
    ['ascii', Buffer.from('have a nice day')],
    ['hex', Buffer.from('0102030405', 'hex')],
    ['ascii', Buffer.from('OK!')],
    ['utf8', Buffer.alloc(358, 0)],
    ['utf8', Buffer.alloc(358, 97)],
    ['hex', expiresBuffer]
  ]

  const expectedResults: string[] = [
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXxXxJj8DSyTcTM4u4emm9W4no1ia4gxoZe',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXxQAvXEg9eBK8KiRSbLn',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXx7YbhSoCipKC1yTTM',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXxMse3nKqmh6CbbxjGiLr7Cmfn7YQkkC5Sb9urkvs74hfhefsfCFYdSgkGihYnBt3e1hQteuSL2JKJ4T6FjZB3kRqiiy4TTjZmGByQsN37Z4TfSuEUPanRquCiyYdCuvkP3r89HUP1VHNr4ZvDCgV2LnV517ijMHvhuJ6aBFARPuLrhMnDS81w15MPHzD1YXHBMdoAEgRUa9unjL7Q1tyX4eaSha4tgDUUJthpNveFkY7dGmSJxPCk46PNYTkKE6aEKHfFTQuKQu3jrARjyzkSJMqAD3JcaPi7ohtXEthRPdNNvvMZjQehDs291tgvAJZi3g5qDtgGbR7BzSdEvgi9xP6JtniXeVmDP8CsHe7mgTUEoD2fPiTU433fRwx8dkbekEQGsTieYvmS9q749LxfE12iVCw3Xh2GTeDE3JoMHqqiaWMWQGZ3w3gKxm6HG5mymje9P5Y12NDoMJFtmgGaZXpDoWZiyNhC4pXFixG6opNn1CHVVzxQ5tS',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXxQmyBcJFnDeszpJQfWUrFJcZ9tyKkyyxaKGgmmH5AjaZj6u25JkMWbdEhaN9egTnjdTsHRBYJAswY46hLYDP7FZA3n1DnSTrmzqkm776m5FnfMPCBuKouY1QfkjzVSjteJ1RebpvTGKdaazSQWRfQesVjS8SjfZWtUxGgVhTpQ7bzxLKfbtrz5H9CsLHUubeaii6NHHAV1DFmkGLTYoLgeN9RLtpuBGpgEJXWn4Y7e5K1vNiqLtomcaFnKYzYXqLJgcVjXZdzXqqTKv8PcuLorYHd9Rg86jeFopXjWzhPVJMRjmFB7nw3F6Grsiw3gokyWHX7NBZ9VZZBrbMHRFVjhDjMDqPmUYeLF3CzLApVb7mpvSzCQGJ4yKSsGuTPwjebrYZbi3zGN8KL6ooPtcRhbbfFGNaMGrwasUbu39KNYUUciHNQ4hyR9cSGQab8CvBED8Y3gKgFVC7ymFPxobbnd6zww8b1d1b4HLSBLCHhEDEWe79XQ7CcpSq',
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxXxdesT13371337xXxnetTestxXx74tuQofhdLD2UWMxb',
  ]

  tests.forEach(([encoding, invisibleInEncoding], index) => {
    it(`should sanity cycle \`${invisibleInEncoding.toString(encoding)}\``, function () {
      const tagged = ripple.encodeTagged({
        address: BITSTAMP_ADDY,
        humanPrefix: testHumanPrefix,
        data: invisibleInEncoding,
        humanSuffix: destTagHumanSuffix})
      const expected = expectedResults[index]
      if (expected) {
        assert.strictEqual(tagged, expected)
      }
      assert(tagged.startsWith(testHumanPrefix + BITSTAMP_ADDY + destTagHumanSuffix))
      const {address, data, humanSuffix, humanPrefix} = ripple.decodeTagged(tagged)
      assert.strictEqual(humanPrefix, testHumanPrefix)
      assert.strictEqual(address, BITSTAMP_ADDY)
      assert.strictEqual(humanSuffix, destTagHumanSuffix)
      assert(data.equals(invisibleInEncoding))
      console.log(`'${tagged}',`)
    })
  })
})

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
        assert.strictEqual('sEd', encoded.slice(0, 3));
      }

      // This should already be filled with 0xFF, but for simple assuredness
      _.fill(filled, 0xFF);
      // For all values 0-255, set LSB to value, then encode
      for (let i = 0; i < 0xFF; i++) {
        filled[filled.length - 1] = i;
        const encoded = encode(filled, {version});
        assert.strictEqual('sEd', encoded.slice(0, 3));
      }

      // The canonical version for sed25519 prefixes
      assert(Buffer.from(VER_ED25519_SEED).equals(version));
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
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
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
      assert.strictEqual(decoded.version, 2);
    });
    it('validate returns true when valid else false', function() {
      const knownValid = 'p7oFVcrcqMhU';
      assert(isValidTest(knownValid));
      assert(!isValidTest(knownValid + 'p'));
    });
  });
});
