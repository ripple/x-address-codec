# Deprecation Notice

As of September 3, 2019, this library's functionality has been incorporated into [ripple-address-codec](https://github.com/ripple/ripple-address-codec).

This library is no longer maintained.

## x-address-codec [![NPM](https://img.shields.io/npm/v/x-address-codec.svg)](https://npmjs.org/package/x-address-codec) [![Build Status](https://img.shields.io/travis/ripple/x-address-codec/master.svg)](https://travis-ci.org/ripple/x-address-codec)

This is a meta-package that exposes an API factory.

- Provide your own hash ([create-hash](https://www.npmjs.com/package/create-hash))
- Provide your own crypto ([crypto](https://nodejs.org/api/crypto.html))

A [base-x](https://github.com/dcousens/base-x) codec is included.

This library is used to encode/decode cryptocurrency address strings to bytes and back.

### Supported alphabets:

* ripple
* tipple
* bitcoin
* stellar

### API

```js
var apiFactory = require('../');
var createHash = require('create-hash');

var api = apiFactory({
  defaultAlphabet: 'stellar',

  // Bring your own hash function:
  sha256: function(bytes) {
    return createHash('sha256').update(new Buffer(bytes)).digest();
  },

  // x-address-codec adds encode* and decode* methods automatically.
  codecMethods : {
    // public keys
    AccountID : {version: 0x00},
    // secrets
    Seed: {version: 0x21}
  },
});

var buf = new Buffer("00000000000000000000000000000000", 'hex');
// It can encode a Buffer
var encoded = api.encodeSeed(buf);
// It returns Array<Number>
var decoded = api.decodeSeed(encoded);
// It can of course encode an Array<Number> too
var reencoded = api.encodeSeed(decoded)

console.log(encoded);
console.log(reencoded);
// ps6JS7f14BuwFY8Mw6bTtLKWauoUp
// ps6JS7f14BuwFY8Mw6bTtLKWauoUp

console.log(decoded);
// [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
```

#### Example: Encode the value as an XRP Ledger seed

```js
console.log(api.encode(decoded, {alphabet: 'ripple', version: 33}));
// sp6JS7f14BuwFY8Mw6bTtLKWauoUs
```

#### Example: Create a codec that uses `spaceMan` as its prefix

```js
var prefix = api.codecs.stellar.findPrefix(16 /* bytes */, 'spaceMan');
var spacey = api.encode(decoded, {version: prefix});
console.log(spacey);
// spaceMan7qBfYEUBHSWDsZjJHctnNQi2pCTn
console.log(api.decode(spacey, {version: prefix}));
// [ 0, 0, 0, 0,   0, 0, 0, 0,   0, 0, 0, 0,   0, 0, 0, 0 ]
```

#### Example: Export and Publish

```js
module.exports = api;
```

```bash
$ npm publish
```

#### Example: Exported functionality

```js
console.log(api)
/*
{ Codec: [Function: AddressCodec],
  codecs:
   { bitcoin:
      { alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
        codec: [Object],
        base: 58 },
     ripple:
      { alphabet: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
        codec: [Object],
        base: 58 },
     tipple:
      { alphabet: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
        codec: [Object],
        base: 58 },
     stellar:
      { alphabet: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz',
        codec: [Object],
        base: 58 } },
  decode: [Function: decode],
  encode: [Function: encode],
  decodeAccountID: [Function],
  encodeAccountID: [Function],
  decodeSeed: [Function],
  encodeSeed: [Function] }
*/
```
