/**
 * Cryptographic utilities and helper functions
 */

import {
  validatePositiveInteger,
  validateUint8Array
} from '../utils/validation.js'

// Global crypto detection
export const globalCrypto =
  typeof globalThis === 'object' && 'crypto' in globalThis
    ? globalThis.crypto
    : undefined

// Random bytes generation
export function getRandomBytes(length = 32) {
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    return globalCrypto.getRandomValues(new Uint8Array(length))
  }

  if (globalCrypto && typeof globalCrypto.randomBytes === 'function') {
    return Uint8Array.from(globalCrypto.randomBytes(length))
  }

  throw new Error('crypto.getRandomValues must be defined')
}

// Array clearing (for security)
export function clearArray(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0)
  }
}

// DataView creation
export function createDataView(buffer) {
  return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

// Bit rotation (left)
export function rotl(value, shift) {
  return (value << (32 - shift)) | (value >>> shift)
}

// Bytes to hex string
export function bytesToHex(bytes) {
  validateUint8Array(bytes)

  // Use native method if available
  if (typeof Uint8Array.prototype.toHex === 'function') {
    return bytes.toHex()
  }

  // Fallback implementation
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_LOOKUP_TABLE[bytes[i]]
  }
  return hex
}

// Hex string to bytes
export function hexToBytes(hex) {
  if (typeof hex !== 'string') {
    throw new Error(`hex string expected, got ${typeof hex}`)
  }

  // Use native method if available
  if (typeof Uint8Array.fromHex === 'function') {
    return Uint8Array.fromHex(hex)
  }

  // Fallback implementation
  const length = hex.length
  const byteLength = length / 2

  if (length % 2) {
    throw new Error(`hex string expected, got unpadded hex of length ${length}`)
  }

  const result = new Uint8Array(byteLength)

  for (let i = 0, j = 0; i < byteLength; i++, j += 2) {
    const high = hexCharToInt(hex.charCodeAt(j))
    const low = hexCharToInt(hex.charCodeAt(j + 1))

    if (high === undefined || low === undefined) {
      const char = hex[j] + hex[j + 1]
      throw new Error(
        `hex string expected, got non-hex character "${char}" at index ${j}`
      )
    }

    result[i] = high * 16 + low
  }

  return result
}

// String to bytes
export function stringToBytes(string) {
  if (typeof string !== 'string') {
    throw new Error('string expected')
  }

  return new Uint8Array(new TextEncoder().encode(string))
}

// Input normalization (string -> bytes or bytes -> bytes)
export function normalizeInput(input) {
  if (typeof input === 'string') {
    input = stringToBytes(input)
  }

  validateUint8Array(input)
  return input
}

// Array concatenation
export function concatArrays(...arrays) {
  let totalLength = 0

  // Calculate total length
  for (let i = 0; i < arrays.length; i++) {
    const array = arrays[i]
    validateUint8Array(array)
    totalLength += array.length
  }

  // Create result array
  const result = new Uint8Array(totalLength)
  let offset = 0

  // Copy arrays
  for (let i = 0; i < arrays.length; i++) {
    const array = arrays[i]
    result.set(array, offset)
    offset += array.length
  }

  return result
}

// Hash wrapper creator
export function createHashWrapper(hashFactory) {
  const hash = (data) => hashFactory().update(normalizeInput(data)).digest()
  const instance = hashFactory()

  hash.outputLen = instance.outputLen
  hash.blockLen = instance.blockLen
  hash.create = () => hashFactory()

  return hash
}

// BigUint64 setter with fallback
export function setBigUint64(dataView, byteOffset, value, littleEndian) {
  if (typeof dataView.setBigUint64 === 'function') {
    return dataView.setBigUint64(byteOffset, value, littleEndian)
  }

  // Fallback implementation
  const BI_32 = BigInt(32)
  const BI_32_MASK = BigInt(4294967295)

  const high = Number((value >> BI_32) & BI_32_MASK)
  const low = Number(value & BI_32_MASK)

  const highOffset = littleEndian ? 4 : 0
  const lowOffset = littleEndian ? 0 : 4

  dataView.setUint32(byteOffset + highOffset, high, littleEndian)
  dataView.setUint32(byteOffset + lowOffset, low, littleEndian)
}

// BigInt to hex string
export function bigIntToHex(bigint) {
  if (typeof bigint !== 'string') {
    throw new Error(`hex string expected, got ${typeof bigint}`)
  }

  return bigint === '' ? BIGINT_ZERO : BigInt(`0x${bigint}`)
}

// Bytes to BigInt
export function bytesToBigInt(bytes) {
  return bigIntToHex(bytesToHex(bytes))
}

// Bytes to BigInt (little-endian)
export function bytesToBigIntLE(bytes) {
  validateUint8Array(bytes)
  return bigIntToHex(bytesToHex(Uint8Array.from(bytes).reverse()))
}

// BigInt to bytes
export function bigIntToBytes(bigint, byteLength) {
  return hexToBytes(bigint.toString(16).padStart(byteLength * 2, '0'))
}

// BigInt to bytes (little-endian)
export function bigIntToBytesLE(bigint, byteLength) {
  return bigIntToBytes(bigint, byteLength).reverse()
}

// Modulo operation for BigInt
export function mod(value, modulus) {
  const result = value % modulus
  return result >= BIGINT_ZERO ? result : modulus + result
}

// Check if BigInt is in range
export function isBigIntInRange(value, min, max) {
  return typeof value === 'bigint' && min <= value && value < max
}

// Get bit length of BigInt
export function getBitLength(bigint) {
  let length = 0
  for (; bigint > BIGINT_ZERO; bigint >>= BIGINT_ONE, length += 1);
  return length
}

// Get byte length of BigInt
export function getByteLength(bigint) {
  const bitLength = getBitLength(bigint)
  return Math.ceil(bitLength / 8)
}

// DRBG (Deterministic Random Bit Generator)
export function createDRBG(hashLen, qByteLen, hmacFn) {
  validatePositiveInteger(hashLen)
  validatePositiveInteger(qByteLen)

  if (typeof hmacFn !== 'function') {
    throw new Error('hmacFn must be a function')
  }

  const createBuffer = (length) => new Uint8Array(length)
  const createByte = (value) => Uint8Array.of(value)

  let v = createBuffer(hashLen)
  let k = createBuffer(hashLen)
  let reseedCounter = 0

  const resetState = () => {
    v.fill(1)
    k.fill(0)
    reseedCounter = 0
  }

  const hmac = (...data) => hmacFn(k, v, ...data)

  const updateState = async (seed = createBuffer(0)) => {
    k = await hmac(createByte(0), seed)
    v = await hmac()

    if (seed.length === 0) return

    k = await hmac(createByte(1), seed)
    v = await hmac()
  }

  const generateBlock = async () => {
    if (reseedCounter++ >= 1000) {
      throw new Error('drbg: tried 1000 values')
    }

    let bytesGenerated = 0
    const blocks = []

    while (bytesGenerated < qByteLen) {
      v = await hmac()
      const block = v.slice()
      blocks.push(block)
      bytesGenerated += v.length
    }

    return concatArrays(...blocks)
  }

  return async (entropy, personalization) => {
    resetState()
    await updateState(entropy)

    let result
    // eslint-disable-next-line no-constant-condition
    while (true) {
      result = await personalization(generateBlock())
      if (result) break
      await updateState()
    }

    resetState()
    return result
  }
}

// Memoization utility
export function memoize(fn) {
  const cache = new WeakMap()

  return (key, ...args) => {
    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const result = fn(key, ...args)
    cache.set(key, result)
    return result
  }
}

// Constants
export const HAS_NATIVE_HEX = (() =>
  typeof Uint8Array.from([]).toHex === 'function' &&
  typeof Uint8Array.fromHex === 'function')()

export const HEX_LOOKUP_TABLE = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0')
)

export const HEX_CHAR_CODES = {
  _0: 48,
  _9: 57, // 0-9
  A: 65,
  F: 70, // A-F
  a: 97,
  f: 102 // a-f
}

export const BIGINT_ZERO = BigInt(0)
export const BIGINT_ONE = BigInt(1)

// Helper function to convert hex character to integer
function hexCharToInt(char) {
  if (char >= HEX_CHAR_CODES._0 && char <= HEX_CHAR_CODES._9) {
    return char - HEX_CHAR_CODES._0
  }

  if (char >= HEX_CHAR_CODES.A && char <= HEX_CHAR_CODES.F) {
    return char - (HEX_CHAR_CODES.A - 10)
  }

  if (char >= HEX_CHAR_CODES.a && char <= HEX_CHAR_CODES.f) {
    return char - (HEX_CHAR_CODES.a - 10)
  }

  return undefined
}
