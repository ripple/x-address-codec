'use strict';

const baseCodec = require('base-x');

const {seqEqual, toArray, isSet} = require('./utils');

/* --------------------------------- ENCODER -------------------------------- */

function codecFactory(injected) {

/*eslint-disable indent*/
const sha256 = injected.sha256;

class AddressCodec {
  /*eslint-enable indent*/

  constructor(alphabet) {
    this.alphabet = alphabet;
    this.codec = baseCodec(alphabet);
    this.base = alphabet.length;
  }

  encodeRaw(bytes) {
    return this.codec.encode(bytes);
  }

  decodeRaw(string) {
    return this.codec.decode(string);
  }

  verifyCheckSum(bytes) {
    const computed = sha256(sha256(bytes.slice(0, -4))).slice(0, 4);
    const checksum = bytes.slice(-4);
    return seqEqual(computed, checksum);
  };

  encodeVersioned(bytes, version) {
    return this.encodeChecked(toArray(version, bytes));
  }

  encodeChecked(buffer) {
    const check = sha256(sha256(buffer)).slice(0, 4);
    return this.encodeRaw(toArray(buffer, check));
  }

  encode(bytes, opts={}) {
    const {version} = opts;
    return isSet(version) ?
              this.encodeVersioned(bytes, version) :
           isSet(opts.checked) ?
              this.encodeChecked(bytes) :
              this.encodeRaw(bytes);
  }

  decode(string, opts={}) {
    const {version, versions} = opts;
    return isSet(versions) ?
              this.decodeMultiVersioned(
                  string, versions, opts.expectedLength, opts.versionTypes) :
           isSet(version) ?
              this.decodeVersioned(string, version) :
           isSet(opts.checked) ?
              this.decodeChecked(string) :
              this.decodeRaw(string);
  }

  decodeChecked(encoded) {
    const buf = this.decodeRaw(encoded);
    if (buf.length < 5) {
      throw new Error('invalid_input_size');
    }
    if (!this.verifyCheckSum(buf)) {
      throw new Error('checksum_invalid');
    }
    return buf.slice(0, -4);
  }

  decodeVersioned(string, version) {
    return this.decodeMultiVersioned(string, [version]).bytes;
  }

  /**
  * @param {Number} payloadLength - number of bytes encoded not incl checksum
  * @param {String} desiredPrefix - desired prefix when base58 encoded with
  *                                 checksum
  * @return {Array} version
  */
  findPrefix(payloadLength, desiredPrefix) {
    if (this.base !== 58) {
      throw new Error('Only works for base58');
    }
    const totalLength = payloadLength + 4; // for checksum
    const chars = (Math.log(Math.pow(256, totalLength)) / Math.log(this.base));
     // (x, x.8] -> x+1, (x.8, x+1) -> x+2
    const requiredChars = Math.ceil(chars + 0.2);
    const padding = this.alphabet[Math.floor((this.alphabet.length) / 2) - 1];
    const template = desiredPrefix + new Array(requiredChars + 1).join(padding);
    const bytes = this.decodeRaw(template);
    const version = bytes.slice(0, -totalLength);
    return version;
  }

  /**
  * @param {String} encoded - base58 checksum encoded data string
  * @param {Array} possibleVersions - array of possible versions.
  *                                   Each element could be a single byte or an
  *                                   array of bytes.
  * @param {Number} expectedLength - of decoded bytes minus checksum
  *
  * @param {Array} [types] - parrallel array of names matching possibleVersions
  *
  * @return {Object} -
  */
  decodeMultiVersioned(encoded, possibleVersions, expectedLength, names) {
    const withoutSum = this.decodeChecked(encoded);
    const ret = {version: null, bytes: null};

    if (possibleVersions.length > 1 && !expectedLength) {
      throw new Error('must pass expectedLengthgth > 1 possibleVersions');
    }

    const versionLenGuess = possibleVersions[0].length || 1; // Number.length
    const payloadLength = expectedLength || withoutSum.length - versionLenGuess;
    const versionBytes = withoutSum.slice(0, -payloadLength);
    const payload = withoutSum.slice(-payloadLength);

    possibleVersions.forEach(function(version, i) {
      const asArray = Array.isArray(version) ? version : [version];
      if (seqEqual(versionBytes, asArray)) {
        ret.version = version;
        ret.bytes = payload;
        ret.versionIx = i;
        if (names) {
          ret.type = names[i];
        }
        return false;
      }
    });

    if (!ret.bytes) {
      throw new Error('version_invalid');
    }
    return ret;
  };

}

/*eslint-disable indent*/
return AddressCodec;
/*eslint-enable indent*/
}
/* ------------------------------- END ENCODER ------------------------------ */

module.exports = codecFactory;
