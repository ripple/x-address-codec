'use strict';

const codecFactory = require('./address-codec');

/*eslint-disable no-unused-vars*/
const ALPHABETS = {
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  stellar: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz'
};

function apiFactory(options) {
  const Codec = codecFactory(options);

  const {
      alphabets = ALPHABETS,
      defaultAlphabet = alphabets === ALPHABETS ? 'bitcoin' :
                            Object.keys(alphabets)[0]
  } = options;

  /*eslint-enable no-unused-vars*/
  const codecs = {};
  for (let name in alphabets)
    codecs[name] = new Codec(alphabets[name]);

  return {
    Codec,
    codecs,
    decode: function(string, opts={}) {
      const {alphabet = defaultAlphabet} = opts;
      return codecs[alphabet].decode(string, opts);
    },
    encode: function(bytes, opts={}) {
      const {alphabet = defaultAlphabet} = opts;
      return codecs[alphabet].encode(bytes, opts);
    }
  };
}

module.exports = apiFactory;
