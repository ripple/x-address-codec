/// <reference path="./base-x.d.ts" />
import baseCodec, { BaseXCodec } from 'base-x'

import { IndexedBytes, concatArgs, isSet, seqEqual, isSequence } from './utils'
import { Writer as OerWriter, Reader as OerReader } from 'oer-utils'

export type VersionArgument = IndexedBytes|number

export type DecodeOptions = {
  checked?: boolean,
  versions?: any,
  version?: any,
  expectedLength?: number,
  versionTypes?: string[]
}

export type EncodeOptions = { version?: VersionArgument, checked?: boolean, expectedLength?: number }

export type Sha256Function = (byteIndexed: IndexedBytes) => Buffer

export interface IEncodeTaggedParameters {
  address: string;
  data?: IndexedBytes;
  humanSuffix?: string;
  humanPrefix?: string;
}

export class AddressCodec {
  private readonly codec: BaseXCodec
  private readonly base: number
  /* eslint-enable indent */

  constructor (private readonly alphabet: string, private readonly sha256: Sha256Function) {
    this.codec = baseCodec(alphabet)
    this.base = alphabet.length
  }

  encode (bytes: IndexedBytes, opts: EncodeOptions = {}) {
    const { version } = opts
    return isSet(version)
      ? this.encodeVersioned(bytes, version!, opts.expectedLength!)
      : opts.checked
        ? this.encodeChecked(bytes)
        : this.encodeRaw(bytes)
  }

  decode (string: string, opts: DecodeOptions = {}) {

    const { version, versions } = opts

    return isSet(versions)
      ? this.decodeMultiVersioned(
        string,
        versions,
        opts.expectedLength!,
        opts.versionTypes
      )
      : isSet(version)
        ? this.decodeVersioned(string, version, opts.expectedLength!)
        : opts.checked
          ? this.decodeChecked(string)
          : this.decodeRaw(string)
  }

  encodeRaw (bytes: IndexedBytes): string {
    if (!Buffer.isBuffer(bytes)) {
      bytes = Buffer.from(bytes as any)
    }
    return this.codec.encode(bytes)
  }

  decodeRaw (string: string): Buffer {
    return this.codec.decode(string)
  }

  encodeChecked (buffer: IndexedBytes): string {
    const check = this.sha256(this.sha256(buffer)).slice(0, 4)
    return this.encodeRaw(concatArgs(buffer, check))
  }

  decodeChecked (encoded: string) {
    const buf = this.decodeRaw(encoded)
    if (buf.length < 5) {
      throw new Error('invalid_input_size')
    }
    if (!this.verifyCheckSum(buf)) {
      throw new Error('checksum_invalid')
    }
    return buf.slice(0, -4)
  }

  encodeVersioned (bytes: IndexedBytes, version: VersionArgument, expectedLength: number) {
    if (expectedLength && bytes.length !== expectedLength) {
      throw new Error('unexpected_payload_length')
    }
    return this.encodeChecked(concatArgs(version, bytes))
  }

  decodeVersioned (string: string, version: VersionArgument, expectedLength: number) {
    return this.decodeMultiVersioned(string, [version], expectedLength).bytes
  }

  /**
   * @param {String} encoded - base58 checksum encoded data string
   * @param {Array} possibleVersions - array of possible versions.
   *                                   Each element could be a single byte or an
   *                                   array of bytes.
   * @param {Number} [expectedLength] - of decoded bytes minus checksum
   *
   * @param {Array} [types] - parrallel array of names matching possibleVersions
   *
   * @return {Object} -
   */
  decodeMultiVersioned (encoded: string, possibleVersions: Array<VersionArgument>, expectedLength: number, types?: string[]) {
    const withoutSum = this.decodeChecked(encoded)
    const ret: { version: VersionArgument; bytes: Buffer; type?: string } = { version: null!, bytes: null! }

    if (possibleVersions.length > 1 && !expectedLength) {
      throw new Error('must pass expectedLengthgth > 1 possibleVersions')
    }

    const firstVersion = possibleVersions[0]
    const versionLenGuess = isSequence(firstVersion) ? firstVersion.length  : 1
    const payloadLength =
      expectedLength || withoutSum.length - versionLenGuess
    const versionBytes = withoutSum.slice(0, -payloadLength)
    const payload = withoutSum.slice(-payloadLength)

    const foundVersion = possibleVersions.some(function (version, i) {
      const asArray = typeof version === 'number' ? [version] : version
      if (seqEqual(versionBytes, asArray)) {
        ret.version = version
        ret.bytes = payload
        if (types) {
          ret.type = types[i]
        }
        return true
      }
    })

    if (!foundVersion) {
      throw new Error('version_invalid')
    }
    if (expectedLength && ret.bytes.length !== expectedLength) {
      throw new Error('unexpected_payload_length')
    }

    return ret
  }

  encodeTagged({humanPrefix = '', address, humanSuffix = '', data=[]}: IEncodeTaggedParameters) {
    const asBuffer = Buffer.from(data as any)
    // Could create minimal version of this.
    // Just needs to encode var octet strings
    const writer = new OerWriter()

    writer.writeUInt8(humanPrefix.length)
    writer.writeUInt8(address.length)
    writer.writeUInt8(humanSuffix.length)
    writer.writeVarOctetString(asBuffer)

    const reversed = writer.getBuffer().reverse()
    const prefixBytes = this.findPrefix(humanPrefix + address + humanSuffix, reversed.length, reversed)
    return this.encodeVersioned(reversed, prefixBytes, reversed.length)
  }

  decodeTagged(tagged: string) {
    const decoded = this.decodeChecked(tagged).reverse()
    const reader = new OerReader(decoded)

    const prefixLength = reader.readUInt8Number()
    const addressLength = reader.readUInt8Number()
    const suffixLength = reader.readUInt8Number()
    const addressEnd = prefixLength + addressLength

    return {
      address: tagged.slice(prefixLength, addressEnd),
      humanPrefix: tagged.slice(0, prefixLength),
      humanSuffix: tagged.slice(addressEnd, addressEnd + suffixLength),
      data: reader.readVarOctetString()
    }
  }

  verifyCheckSum (bytes: Buffer): boolean {
    const computed = this.sha256(this.sha256(bytes.slice(0, -4))).slice(0, 4)
    const checksum = bytes.slice(-4)
    return computed.equals(checksum)
  }

  /**
   * @param {String} desiredPrefix - desired prefix when base58 encoded with
   *                                 checksum
   * @param {Number} payloadLength - number of bytes encoded not incl checksum
   * @param payload - TODO
   * @return {Array} version
   */
  findPrefix (desiredPrefix: string, payloadLength: number, payload?: Buffer) {
    if (this.base !== 58) {
      throw new Error('Only works for base58')
    }
    const factor = Math.log(256) / Math.log(this.base)

    try {
      const totalLength = payloadLength + 4 // for checksum
      const chars = totalLength * factor
      // (x, x.8] -> x+1, (x.8, x+1) -> x+2
      const requiredChars = Math.ceil(chars + 0.2)
      const padding = this.alphabet[Math.floor(this.alphabet.length / 2) - 1]

      // if (payload) {
      //   let rawLength = this.encodeRaw(payload!).length
      //   console.log('equi', (rawLength + 4) === requiredChars, rawLength, requiredChars)
      // }

      const template =
        desiredPrefix + new Array(requiredChars + 1).join(padding)
      const bytes = this.decodeRaw(template)
      return bytes.slice(0, -totalLength)
    } catch (e) {
      console.log('e', e)
      throw e
    }
  }
}
