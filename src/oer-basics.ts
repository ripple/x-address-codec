// // How many bytes are safe to decode as a JS number
// // MAX_SAFE_INTEGER = 2^53 - 1
// // 53 div 8 -> 6 bytes
// export const MAX_SAFE_BYTES = 6
//
// export class OerReader {
//   cursor = 0
//
//   constructor(private buffer: Buffer) {
//
//   }
//
//   // Most significant bit in a byte
//   static HIGH_BIT = 0x80
//
//   // Other bits in a byte
//   static LOWER_SEVEN_BITS = 0x7F
//
//   readLengthPrefix (): number {
//     const length = this.readUIntNumber(1)
//
//     if (length & OerReader.HIGH_BIT) {
//       const lengthPrefixLength = length & OerReader.LOWER_SEVEN_BITS
//       const actualLength = lengthPrefixLength && this.readUIntNumber(lengthPrefixLength)
//
//       // Reject lengths that could have been encoded with a shorter prefix
//       const minLength = Math.max(128, 1 << ((lengthPrefixLength - 1) * 8))
//       if (lengthPrefixLength === 0 || actualLength < minLength) {
//         throw new Error('Length prefix encoding is not canonical: ' +
//           actualLength + ' encoded in ' + lengthPrefixLength + ' bytes')
//       }
//
//       return actualLength
//     }
//
//     return length
//   }
//
//   /**
//    * Read a fixed-length unsigned big-endian integer as a JS number.
//    *
//    * @param length Length of the integer in bytes.
//    */
//   readUIntNumber (length: number): number {
//     if (length < 1) {
//       throw new Error('UInt length must be greater than zero')
//     } else if (MAX_SAFE_BYTES < length) {
//       throw new Error('Value does not fit a JS number without sacrificing precision')
//     } else {
//       const value = this.buffer.readUIntBE(this.cursor, length)
//       this.cursor += length
//       return value
//     }
//   }
// }
//
// export class OerWriter {
//   private _writeLengthPrefix (length: number): void {
//     const MSB = 0x80
//     if (length <= 127) {
//       // For buffers shorter than 128 bytes, we simply prefix the length as a
//       // single byte.
//       this.writeUInt8(length)
//     } else {
//       // For buffers longer than 128 bytes, we first write a single byte
      // containing the length of the length in bytes, with the most significant
      // bit set.
//       const lengthOfLength = getUIntBufferSize(length)
//       this.writeUInt8(MSB | lengthOfLength)
//
//       // Then we write the length of the buffer in that many bytes.
//       this.writeUInt(length, lengthOfLength)
//     }
//   }
// }
