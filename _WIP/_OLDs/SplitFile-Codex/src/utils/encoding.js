const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const hexAlphabet = Array.from({ length: 256 }, (_, index) =>
  index.toString(16).padStart(2, '0')
)

const zeroCharCodes = {
  zero: '0'.charCodeAt(0),
  nine: '9'.charCodeAt(0),
  A: 'A'.charCodeAt(0),
  F: 'F'.charCodeAt(0),
  a: 'a'.charCodeAt(0),
  f: 'f'.charCodeAt(0)
}

const nibbleFromCode = (code) => {
  if (code >= zeroCharCodes.zero && code <= zeroCharCodes.nine) {
    return code - zeroCharCodes.zero
  }
  if (code >= zeroCharCodes.A && code <= zeroCharCodes.F) {
    return code - (zeroCharCodes.A - 10)
  }
  if (code >= zeroCharCodes.a && code <= zeroCharCodes.f) {
    return code - (zeroCharCodes.a - 10)
  }
  return undefined
}

export const encodeText = (value) => {
  if (typeof value !== 'string') {
    throw new TypeError(`encodeText expected string, received ${typeof value}`)
  }
  return textEncoder.encode(value)
}

export const decodeText = (value) => {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError('decodeText expected Uint8Array')
  }
  return textDecoder.decode(value)
}

export const bytesToHex = (bytes) => {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('bytesToHex expected Uint8Array')
  }
  return Array.from(bytes, (byte) => hexAlphabet[byte]).join('')
}

export const hexToBytes = (hex) => {
  if (typeof hex !== 'string') {
    throw new TypeError(`hexToBytes expected string, received ${typeof hex}`)
  }
  if (hex.length % 2 !== 0) {
    throw new Error(
      `hex string expected, got unpadded hex of length ${hex.length}`
    )
  }
  const length = hex.length / 2
  const bytes = new Uint8Array(length)
  for (let index = 0, offset = 0; index < length; index += 1, offset += 2) {
    const high = nibbleFromCode(hex.charCodeAt(offset))
    const low = nibbleFromCode(hex.charCodeAt(offset + 1))
    if (high === undefined || low === undefined) {
      const pair = `${hex[offset] ?? ''}${hex[offset + 1] ?? ''}`
      throw new Error(
        `hex string expected, got non-hex character "${pair}" at index ${offset}`
      )
    }
    bytes[index] = (high << 4) | low
  }
  return bytes
}

export const jsonStringify = JSON.stringify

export const jsonParse = JSON.parse
