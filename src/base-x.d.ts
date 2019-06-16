declare module 'base-x' {
  export type BaseXCodec = {
    encode: (buffer: ArrayLike<number>) => string
    decode: (encoded: string) => Buffer
    decodeUnsafe: (encoded: string) => Buffer
  }

  function base(alphabet: string): BaseXCodec

  export default base
}
