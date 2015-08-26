'use strict';

const codecFactory = require('./address-codec');

const ALPHABETS = {
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  stellar: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz'
};

function addMethods(codecMethods, api) {
  function addVersion(name, opts) {
    function add(operation) {
      const encode = operation === 'encode';
      const func = api[operation + name] = function(arg, arg2) {
        let params = opts;
        if (arg2 && encode) {
          params = {
            expectedLength: opts.expectedLength,
            version: opts.versions[opts.versionTypes.indexOf(arg2)]
          };
        }
        return api[operation](arg, params);
      };
      return func;
    }
    const decode = add('decode');
    add('encode');
    api['isValid' + name] = function(arg) {
      try {
        decode(arg);
      } catch (e) {
        return false;
      }
      return true;
    };
  }
  for (const k in codecMethods) {
    addVersion(k, codecMethods[k]);
  }
  return api;
}

function buildCodecsMap(alphabets, Codec) {
  const codecs = {};
  for (const name in ALPHABETS)
    codecs[name] = new Codec(ALPHABETS[name]);
  if (alphabets !== ALPHABETS) {
    for (const name in alphabets)
      codecs[name] = new Codec(alphabets[name]);
  }
  return codecs;
}

function apiFactory(options) {
  const {
    alphabets = ALPHABETS,
    codecMethods = {},
    defaultAlphabet = Object.keys(alphabets)[0]
  } = options;

  const Codec = codecFactory(options);
  const codecs = buildCodecsMap(alphabets, Codec);

  return addMethods(codecMethods, {
    Codec,
    codecs,
    decode: function(string, opts = {}) {
      const {alphabet = defaultAlphabet} = opts;
      return codecs[alphabet].decode(string, opts);
    },
    encode: function(bytes, opts = {}) {
      const {alphabet = defaultAlphabet} = opts;
      return codecs[alphabet].encode(bytes, opts);
    }
  });
}

module.exports = apiFactory;
