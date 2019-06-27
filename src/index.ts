'use strict'

import {
  AddressCodec,
  DecodeOptions,
  EncodeOptions,
  Sha256Function,
  VersionArgument
} from './address-codec'
import { IndexedBytes } from './utils'

const ALPHABETS: Record<string, string> = {
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
  tipple: 'RPShNAF39wBUDnEGHJKLM4pQrsT7VWXYZ2bcdeCg65jkm8ofqi1tuvaxyz',
  stellar: 'gsphnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz'
}

function addMethods (codecMethods: Record<string, CodecMethodOptions>, api: any) {
  function addVersion (name: string, opts: CodecMethodOptions) {
    function add (operation: 'encode' | 'decode') {
      const encode = operation === 'encode'
      return (api[operation + name] = function (arg: any, arg2?: any) {
        let params = opts
        if (arg2 && encode) {
          params = {
            expectedLength: opts.expectedLength,
            version: opts.versions![opts.versionTypes!.indexOf(arg2)]
          }
        }
        return api[operation](arg, params)
      })
    }
    const decode = add('decode')
    add('encode')
    api['isValid' + name] = function (arg: any) {
      try {
        decode(arg)
      } catch (e) {
        return false
      }
      return true
    }
  }
  for (const k of Object.keys(codecMethods)) {
    addVersion(k, codecMethods[k])
  }
  return api
}

function buildCodecsMap (alphabets: Record<string, string>, sha256: Sha256Function): Record<string, AddressCodec> {
  const codecs: Record<string, AddressCodec> = {}
  for (const name of Object.keys(ALPHABETS)) {
    codecs[name] = new AddressCodec(ALPHABETS[name], sha256)
  }

  if (alphabets !== ALPHABETS) {
    for (const name of Object.keys(alphabets)) {
      codecs[name] = new AddressCodec(alphabets[name], sha256)
    }
  }
  return codecs
}

export type CodecMethodOptions = {
  versionTypes?: string[],
  expectedLength?: number
  version?: VersionArgument,
  versions?: VersionArgument[]
}

export default function apiFactory (options: {
  alphabets?: Record<string, string>,
  sha256: Sha256Function,
  defaultAlphabet: string,
  codecMethods: Record<string, CodecMethodOptions>
}) {
  const {
    alphabets = ALPHABETS,
    codecMethods = {},
    defaultAlphabet = Object.keys(alphabets)[0]
  } = options

  const codecs = buildCodecsMap(alphabets, options.sha256)

  return addMethods(codecMethods, {
    Codec: AddressCodec,
    codecs,
    decode: function (string: string, opts: DecodeOptions & {alphabet? : string} = {}) {
      const { alphabet = defaultAlphabet } = opts
      return codecs[alphabet].decode(string, opts)
    },
    encode: function (bytes: IndexedBytes, opts: EncodeOptions & {alphabet? : string} = {}) {
      const { alphabet = defaultAlphabet } = opts
      return codecs[alphabet].encode(bytes, opts)
    }
  })
}


