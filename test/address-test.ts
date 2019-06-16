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
  const BITSTAMP_ADDY = 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
  const prefix = BITSTAMP_ADDY + 'xTag'

  const tests: Array<[string, Buffer, string]> = [
    ['ascii', Buffer.from('have a nice day'), 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxTagPNAPU7ciRU8gdfeERp35pCuNXLnbv'],
    ['hex', Buffer.from('0102030405', 'hex'), 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxTagVD8LksB1Yj5Byv8j'],
    ['ascii', Buffer.from('OK!'), 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxTag7wdtDQHTVCXmY'],
    ['utf8', Buffer.alloc(358, 97),
      'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59BxTagVGZBRZ4SD5vt8aUkZocdcAPBTxevtuCKSVVxHUh4USN' +
      'NWaZPiLmgNR8kfyLTjKbgcCFbQibpmaLXgBSVBh8UiMRhbEJ6145KkK6Q5PpbkMVRyRwqcy68ezdq5DX' +
      'fb1btFmPcDHyT2BxaUc7CZ2rLiFcArM9X7aaxjoPeWHPWoSABqYgLgiiDWGNo1anHtnrzbnAQrektKtq' +
      'BDzaey7iCq7pa6hUDQJa8tRa1ApHHDAAkG4VD3ZBCQRUWeGa6Gf6brorPRDNv1yKUCGmfLJzkVNf8qdU' +
      '8Xi6X3ipVxiPiu3mv6972KYRpaYV7out1ZukRWEzrCsc5QG85Aun8YG9HrvuZdMzM8X9CTeUgFDHzWt7' +
      'PXpg2SX68YNU25pNej1X86HjyD5a2Dmbr8P72p1dosocYyzKs3EQ1WHCV9jQ6XFf5k2TE3R1roHvvXmn' +
      'kbwmdJk9RSyP25c6uYwZkFPCYSnakgLLL2bNHdGLEZww4S6ewMThcbKhpn']
  ]

  // for (let i = 0; i < 2000; i++) {
  //   tests.push(['hex', crypto.randomBytes(_.random(5, 2000, false))])
  // }

  tests.forEach(([encoding, buf, expectedTagged]) => {
    it(`should sanity cycle \`${buf.toString(encoding)}\``, function () {
      const tagged = ripple.encodeTagged(prefix, buf)
      assert.strictEqual(tagged, expectedTagged)
      assert(tagged.startsWith(prefix))
      const {address, tags} = ripple.decodeTagged(tagged)
      assert.strictEqual(address, prefix)
      assert(tags.equals(buf))
      // console.log('tagged=', tagged)
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
