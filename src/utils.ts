'use strict'

export type IndexedBytes = ArrayLike<number>

export function seqEqual (seq1: IndexedBytes, seq2: IndexedBytes) {
  if (seq1.length !== seq2.length) {
    return false
  }

  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      return false
    }
  }
  return true
}

export function isSequence (val: any): val is IndexedBytes {
  return val.length !== undefined
}

/**
 * Concatenates all `arguments` into a single array. Each argument can be either
 * a single element or a sequence, which has a `length` property and supports
 * element retrieval via sequence[ix].
 *
 * > concatArgs(1, [2, 3], new Buffer([4,5]), new Uint8Array([6, 7]));
 *  [1,2,3,4,5,6,7]
 *
 * @return {Array} - concatenated arguments
 */
export function concatArgs (...args: Array<IndexedBytes| number>): Buffer {
  // TODO, inefficient
  const ret: number[] = []

  args.forEach(arg => {
    if (isSequence(arg)) {
      for (let j = 0; j < arg.length; j++) {
        ret.push(arg[j])
      }
    } else {
      ret.push(arg)
    }
  })
  return Buffer.from(ret)
}

export function isSet (o: any): boolean {
  return o !== null && o !== undefined
}
