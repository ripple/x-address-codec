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
  AccountID: {
    version: 0,
    expectedLength: 20,
  },
  Test: {
    versionTypes: ['one', 'two'],
    versions: [1, 2],
    expectedLength: 4
  }
};
const options = {sha256, defaultAlphabet: 'ripple', codecMethods};
const {
  decodeTest,
  decodeAccountID,
  encodeTest,
  isValidTest,
  encode,
  decode,
  codecs: {ripple}
} = apiFactory(options);


type PairsType = Record<string, string>

function encodeLength(val: string) {
  if (val.length > 57) {
    throw new Error('Max length is 57 chars')
  }
  return ripple.alphabet[val.length]
}


function encodePairs(pairs: PairsType, join='') {
  return join + Object.keys(pairs).map(
    key => {
      const val = pairs[key]
      return encodeLength(key) + encodeLength(val) + key + val
    }
  ).join(join) + join
}

function decodePairs(encoded: string, join='') {
  let ix = 0
  const decoded: PairsType = {}
  while (ix < encoded.length) {
    ix += join.length
    if (ix === encoded.length) {
      break
    }

    const keyLen = ripple.alphabet.indexOf(encoded[ix])
    const valLen = ripple.alphabet.indexOf(encoded[ix + 1])
    const  keyStarts = ix + 2

    const keyEnds = keyStarts + keyLen
    const valEnds = keyEnds + valLen

    const key = encoded.slice(keyStarts, keyEnds)
    const val = encoded.slice(keyEnds, valEnds)

    ix = valEnds
    decoded[key] = val
  }
  return decoded
}

describe('TaggedAddresses', () => {
  const BITSTAMP_ADDY =  'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'

  const join = ''
  // pairs of arbitrary strings composed of ripple alphabet chars
  const pairs = {
    destinationTag: '13371337o',
    subLimator: 'isCrazy'
  }

  const testHumanPrefix = 'XP' // Extended Production Address
  const testHumanSuffix = encodePairs(pairs, join)
  const expiresBuffer = Buffer.alloc(4)
  // You could use
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
    'X' + // XTended
    'P' + // Production address
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    // pairs of arbitrary strings composed of ripple alphabet chars
    'Ew' + // Key + Value length bytes
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    // Whatever the damn hell 'invisible' data you want, DER, BER-TLV
    'TvuPBxoVDCu4aXZYLdJbV9ftn6yg3PST',

    'XP' +
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    'Ew' +
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    '98a3NArhtHdwuk2NG2',


    'XP' +
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    'Ew' +
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    '7d2sdJ9kbf7MGtw4',


    'XP' +
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    'Ew' +
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    'QT3EV8VodFo8jwhEUN9BXGqMrJhKauXgByboEN1XX8ZsRua5Pboo3rd5nRCjCBaazucDRrQaWVkF72HtRGkMfT8MEPjHoRSirQ376fDJFZHMgBiFfvd517VqK73JJB4fa5ccYfBKv141poifsHPpZoM6ryew3ZQmYbytL4xrBYikaCyqyNNBSL2fzoFV6eo2ynDLHu1V7pd57yn1c4nRizqrfHdNAudAHEmzyoBopnUqmwntabKHho8G5qnx2XFskxP4g6xeQLfBv75g9NhesJ7ZzEABwjoMRNengNvzSi1ZepWKybxkgmhHcMQbVaKSvyKd7ijaZ4Tyew2tzsGAPfvywKR3bgT5TDvNP5dFickgPp1gDk1g2uDkPfRBYAJnjNF7aruED3UrdTxtauzTEbqnaWtVTmgnQGYKM2K1GkBCMBnaiJXu3E5NPSAuEm1HyK9VEkT2JyDDcjYsFibJbwGhXbZaMDN2YE2gpSCPPvwmjJ7LQ9KGx7c',


    'XP' +
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    'Ew' +
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    '7BTKpm7f8mUB9Vjnia9Xw3HRR5yKLDmKvaPZEcYztqr5V6eKpXcgGx3VKbHK9ksBmJNcBHWh1Nch7oeQDvx6Bb1c7HZu83tiksui3M8byzuM2gGoew4U2SNaaCVfFzW4H2GfqA6u6umAmN4Htrzi1mM6bHN9tqr2iEZ7dcTcU33jzCDk3KPrGu4Pk91qhjwW7JadKXPoEaZQVtAvHGSb321zQnHESx7RDgE7FEnSvEhaQdWQVaTJJDDfVvLBighf3HmHki6KXGovN7nK83ezk7vEvZKM8nb6RUHHALvxYXzkS1xA5G7qJQk38J1oNbW2J23GV9byTWYxCKJvVwvW7AyrWhx49jLq1ZABTrBYmeKTWGJNNw51UaXgNqu8nvMrzXyot6pityjvBSHuiBTQbK4p1nF5U5EtyFvyMQqkXaYSaAAzFaxUfj7wFmiQeyGZR4s7YMbXNQ7QsEffimvHCMDzt1bfrimHTZVpW9CjifUUWfL4JbNmg84',

    'XP' +
    'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B' +
    'Ew' +
    'destinationTag' +
    '13371337o' +
    'B3' +
    'subLimator' +
    'isCrazy' +
    'WU2UHCTkynRSryXnp',
  ]

  tests.forEach(([encoding, invisibleInEncoding], index) => {
    it(`should sanity cycle \`${invisibleInEncoding.toString(encoding)}\``, function () {
      const tagged = ripple.encodeTagged({
        address: BITSTAMP_ADDY,
        humanPrefix: testHumanPrefix,
        data: invisibleInEncoding,
        humanSuffix: testHumanSuffix})
      const expected = expectedResults[index]
      if (expected) {
        assert.strictEqual(tagged, expected)
      }
      assert(tagged.startsWith(testHumanPrefix + BITSTAMP_ADDY + testHumanSuffix))
      const {address, data, rawBytes, humanSuffix, humanPrefix} = ripple.decodeTagged(tagged)

      assert.strictEqual(humanPrefix, testHumanPrefix)
      assert.strictEqual(address, BITSTAMP_ADDY)
      assert.strictEqual(humanSuffix, testHumanSuffix)
      assert(data.equals(invisibleInEncoding))
      const decodedPairs = decodePairs(humanSuffix, join)
      assert.deepStrictEqual(decodedPairs, pairs)
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
