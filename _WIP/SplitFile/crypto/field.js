/**
 * Finite field operations and modular arithmetic
 */

import {
  validateOptions,
  validatePositiveInteger
} from '../utils/validation.js'
import { bigIntToBytes, bytesToBigInt } from './utils.js'

// BigInt constants
export const BIGINT_ZERO = BigInt(0)
export const BIGINT_ONE = BigInt(1)
export const BIGINT_TWO = BigInt(2)
export const BIGINT_THREE = BigInt(3)
export const BIGINT_FOUR = BigInt(4)
export const BIGINT_FIVE = BigInt(5)
export const BIGINT_SEVEN = BigInt(7)
export const BIGINT_EIGHT = BigInt(8)
export const BIGINT_NINE = BigInt(9)
export const BIGINT_SIXTEEN = BigInt(16)

// Validation functions
export function isBigInt(value) {
  return typeof value === 'bigint' && BIGINT_ZERO <= value
}

export function createBitMask(bitLength) {
  return (BIGINT_ONE << BigInt(bitLength)) - BIGINT_ONE
}

// Modular arithmetic
export function mod(value, modulus) {
  const result = value % modulus
  return result >= BIGINT_ZERO ? result : modulus + result
}

export function pow(base, exponent, modulus) {
  let result = base
  while (exponent-- > BIGINT_ZERO) {
    result *= result
    result %= modulus
  }
  return result
}

export function invert(value, modulus) {
  if (value === BIGINT_ZERO) {
    throw new Error('invert: expected non-zero number')
  }

  if (modulus <= BIGINT_ZERO) {
    throw new Error(`invert: expected positive modulus, got ${modulus}`)
  }

  let a = mod(value, modulus)
  let b = modulus
  let x0 = BIGINT_ZERO
  let x1 = BIGINT_ONE
  let y0 = BIGINT_ONE
  let y1 = BIGINT_ZERO
  let q = BIGINT_ZERO

  while (a !== BIGINT_ZERO) {
    q = b / a
    const r = b % a
    const x2 = x0 - x1 * q
    const y2 = y0 - y1 * q

    b = a
    a = r
    x0 = x1
    y0 = y1
    x1 = x2
    y1 = y2
  }

  if (b !== BIGINT_ONE) {
    throw new Error('invert: does not exist')
  }

  return mod(x0, modulus)
}

// Square root algorithms
export function validateSquareRoot(field, value, expected) {
  if (!field.eql(field.sqr(value), expected)) {
    throw new Error('Cannot find square root')
  }
}

// Tonelli-Shanks for p ≡ 3 (mod 4)
export function sqrtTonelliShanks(field, value) {
  const exponent = (field.ORDER + BIGINT_ONE) / BIGINT_FOUR
  const result = field.pow(value, exponent)
  validateSquareRoot(field, result, value)
  return result
}

// Square root for p ≡ 5 (mod 8)
export function sqrtFiveModEight(field, value) {
  const exponent = (field.ORDER - BIGINT_THREE) / BIGINT_EIGHT
  const temp = field.mul(value, BIGINT_TWO)
  const result = field.pow(temp, exponent)
  const final = field.mul(value, result)
  const check = field.mul(field.mul(final, BIGINT_TWO), result)
  const sqrt = field.mul(final, field.sub(check, field.ONE))
  validateSquareRoot(field, sqrt, value)
  return sqrt
}

// Complex square root for p ≡ 9 (mod 16)
export function sqrtNineModSixteen(fieldOrder) {
  const field = createField(fieldOrder)
  const sqrtFunc = createSquareRoot(fieldOrder)
  const q = sqrtFunc(field, field.ONE)
  const negQ = sqrtFunc(field, field.neg(field.ONE))
  const sqrtQ = sqrtFunc(field, q)
  const sqrtNegQ = sqrtFunc(field, negQ)
  const exponent = (fieldOrder + BIGINT_SEVEN) / BIGINT_SIXTEEN

  return (field, value) => {
    let v = field.pow(value, exponent)
    let n = field.mul(v, q)
    const l = field.mul(v, sqrtQ)
    const m = field.mul(v, sqrtNegQ)
    const k = field.eql(field.sqr(n), value)
    const h = field.eql(field.sqr(l), value)

    v = field.cmov(v, n, k)
    n = field.cmov(m, l, h)

    const a = field.eql(field.sqr(n), value)
    const e = field.cmov(v, n, a)
    validateSquareRoot(field, e, value)
    return e
  }
}

// General square root finder
export function createSquareRoot(fieldOrder) {
  if (fieldOrder < BIGINT_THREE) {
    throw new Error('sqrt is not defined for small field')
  }

  let s = fieldOrder - BIGINT_ONE
  let e = 0

  // Factor out powers of 2
  while (s % BIGINT_TWO === BIGINT_ZERO) {
    s /= BIGINT_TWO
    e++
  }

  let q = BIGINT_TWO
  const field = createField(fieldOrder)

  // Find a quadratic non-residue
  while (legendreSymbol(field, q) === 1) {
    if (q++ > 1000) {
      throw new Error('Cannot find square root: probably non-prime P')
    }
  }

  // Special case for p ≡ 3 (mod 4)
  if (e === 1) {
    return sqrtTonelliShanks
  }

  const z = field.pow(q, s)
  const c = (s + BIGINT_ONE) / BIGINT_TWO

  return function sqrt(field, value) {
    if (field.is0(value)) {
      return value
    }

    if (legendreSymbol(field, value) !== 1) {
      throw new Error('Cannot find square root')
    }

    let num = e
    let t = field.mul(field.ONE, z)
    let r = field.pow(value, s)
    let x = field.pow(value, c)

    while (!field.eql(r, field.ONE)) {
      if (field.is0(r)) {
        return field.ZERO
      }

      let i = 1
      let t2 = field.sqr(r)

      while (!field.eql(t2, field.ONE)) {
        i++
        t2 = field.sqr(t2)

        if (i === num) {
          throw new Error('Cannot find square root')
        }
      }

      const b = BIGINT_ONE << BigInt(num - i - 1)
      const t2b = field.pow(t, b)

      num = i
      t = field.sqr(t2b)
      r = field.mul(r, t2b)
      x = field.mul(x, t2b)
    }

    return x
  }
}

// Square root algorithm selector
export function selectSquareRootAlgorithm(fieldOrder) {
  if (fieldOrder % BIGINT_FOUR === BIGINT_THREE) {
    return sqrtTonelliShanks
  }

  if (fieldOrder % BIGINT_EIGHT === BIGINT_FIVE) {
    return sqrtFiveModEight
  }

  if (fieldOrder % BIGINT_SIXTEEN === BIGINT_NINE) {
    return sqrtNineModSixteen(fieldOrder)
  }

  return createSquareRoot(fieldOrder)
}

// Field validation
export function validateField(field) {
  const required = {
    ORDER: 'bigint',
    MASK: 'bigint',
    BYTES: 'number',
    BITS: 'number'
  }

  const optional = FIELD_METHODS.reduce((methods, method) => {
    methods[method] = 'function'
    return methods
  }, required)

  validateOptions(field, required, optional)
  return field
}

// Exponentiation
export function fastPow(field, base, exponent) {
  if (exponent < BIGINT_ZERO) {
    throw new Error('invalid exponent, negatives unsupported')
  }

  if (exponent === BIGINT_ZERO) {
    return field.ONE
  }

  if (exponent === BIGINT_ONE) {
    return base
  }

  let result = field.ONE
  let current = base

  while (exponent > BIGINT_ZERO) {
    if (exponent & BIGINT_ONE) {
      result = field.mul(result, current)
    }

    current = field.sqr(current)
    exponent >>= BIGINT_ONE
  }

  return result
}

// Batch inversion
export function batchInvert(field, values, useZero = false) {
  const result = new Array(values.length).fill(useZero ? field.ZERO : undefined)

  const accumulator = values.reduce((acc, value, index) => {
    if (field.is0(value)) {
      return acc
    }
    result[index] = acc
    return field.mul(acc, value)
  }, field.ONE)

  const invAccumulator = field.inv(accumulator)

  values.reduceRight((acc, value, index) => {
    if (field.is0(value)) {
      return acc
    }
    result[index] = field.mul(acc, result[index])
    return field.mul(acc, value)
  }, invAccumulator)

  return result
}

// Legendre symbol
export function legendreSymbol(field, value) {
  const exponent = (field.ORDER - BIGINT_ONE) / BIGINT_TWO
  const result = field.pow(value, exponent)
  const isOne = field.eql(result, field.ONE)
  const isZero = field.eql(result, field.ZERO)
  const isNegOne = field.eql(result, field.neg(field.ONE))

  if (!isOne && !isZero && !isNegOne) {
    throw new Error('invalid Legendre symbol result')
  }

  return isOne ? 1 : isZero ? 0 : -1
}

// Bit and byte length calculation
export function calculateLengths(order, bitLength) {
  if (bitLength !== undefined) {
    validatePositiveInteger(bitLength)
  }

  const nBitLength =
    bitLength !== undefined ? bitLength : order.toString(2).length
  const nByteLength = Math.ceil(nBitLength / 8)

  return { nBitLength, nByteLength }
}

// Field creator
export function createField(order, options = {}, extraOptions = {}) {
  if (order <= BIGINT_ZERO) {
    throw new Error(`invalid field: expected ORDER > 0, got ${order}`)
  }

  let bits
  let sqrt
  let isLE = false
  let modFromBytes = false
  let allowedLengths

  // Handle different argument formats
  if (typeof options === 'object' && options != null) {
    if (extraOptions.sqrt || options.sqrt) {
      throw new Error('cannot specify opts in two arguments')
    }

    const opts = options
    if (opts.BITS) bits = opts.BITS
    if (opts.sqrt) sqrt = opts.sqrt
    if (typeof opts.isLE === 'boolean') isLE = opts.isLE
    if (typeof opts.modFromBytes === 'boolean') modFromBytes = opts.modFromBytes
    allowedLengths = opts.allowedLengths
  } else {
    if (typeof options === 'number') bits = options
    if (extraOptions.sqrt) sqrt = extraOptions.sqrt
  }

  const { nBitLength, nByteLength } = calculateLengths(order, bits)

  if (nByteLength > 2048) {
    throw new Error('invalid field: expected ORDER of <= 2048 bytes')
  }

  let sqrtFunc

  const field = Object.freeze({
    ORDER: order,
    isLE,
    BITS: nBitLength,
    BYTES: nByteLength,
    MASK: createBitMask(nBitLength),
    ZERO: BIGINT_ZERO,
    ONE: BIGINT_ONE,
    allowedLengths,

    create: (value) => mod(value, order),

    isValid: (value) => {
      if (typeof value !== 'bigint') {
        throw new Error(
          `invalid field element: expected bigint, got ${typeof value}`
        )
      }
      return BIGINT_ZERO <= value && value < order
    },

    is0: (value) => value === BIGINT_ZERO,
    isValidNot0: (value) => !field.is0(value) && field.isValid(value),
    isOdd: (value) => (value & BIGINT_ONE) === BIGINT_ONE,

    neg: (value) => mod(-value, order),
    eql: (a, b) => a === b,
    sqr: (value) => mod(value * value, order),
    add: (a, b) => mod(a + b, order),
    sub: (a, b) => mod(a - b, order),
    mul: (a, b) => mod(a * b, order),
    pow: (base, exponent) => fastPow(field, base, exponent),
    div: (a, b) => mod(a * invert(b, order), order),

    sqrN: (a, b) => a * b,
    addN: (a, b) => a + b,
    subN: (a, b) => a - b,
    mulN: (a, b) => a * b,

    inv: (value) => invert(value, order),

    sqrt:
      sqrt ||
      ((value) => {
        if (!sqrtFunc) sqrtFunc = selectSquareRootAlgorithm(order)
        return sqrtFunc(field, value)
      }),

    toBytes: (value) =>
      isLE
        ? bigIntToBytesLE(value, nByteLength)
        : bigIntToBytes(value, nByteLength),

    fromBytes: (bytes, validate = true) => {
      if (allowedLengths) {
        if (
          !allowedLengths.includes(bytes.length) ||
          bytes.length > nByteLength
        ) {
          throw new Error(
            `Field.fromBytes: expected ${allowedLengths} bytes, got ${bytes.length}`
          )
        }

        const padded = new Uint8Array(nByteLength)
        padded.set(bytes, isLE ? 0 : padded.length - bytes.length)
        bytes = padded
      }

      if (bytes.length !== nByteLength) {
        throw new Error(
          `Field.fromBytes: expected ${nByteLength} bytes, got ${bytes.length}`
        )
      }

      let result = isLE ? bytesToBigIntLE(bytes) : bytesToBigInt(bytes)

      if (modFromBytes) {
        result = mod(result, order)
      }

      if (validate) {
        if (!field.isValid(result)) {
          throw new Error('invalid field element: outside of range 0..ORDER')
        }
      }

      return result
    },

    invertBatch: (values) => batchInvert(field, values),
    cmov: (a, b, condition) => (condition ? b : a)
  })

  return Object.freeze(field)
}

// Field utilities
export function getFieldByteLength(order) {
  if (typeof order !== 'bigint') {
    throw new Error('field order must be bigint')
  }

  const bitLength = order.toString(2).length
  return Math.ceil(bitLength / 8)
}

export function getSeedByteLength(order) {
  const byteLength = getFieldByteLength(order)
  return byteLength + Math.ceil(byteLength / 2)
}

export function modScalar(bytes, order, isLE = false) {
  const bytesLength = bytes.length
  const orderByteLength = getFieldByteLength(order)
  const seedByteLength = getSeedByteLength(order)

  if (bytesLength < 16 || bytesLength < seedByteLength || bytesLength > 1024) {
    throw new Error(
      `expected ${seedByteLength}-1024 bytes of input, got ${bytesLength}`
    )
  }

  const value = isLE ? bytesToBigIntLE(bytes) : bytesToBigInt(bytes)
  const reduced = mod(value, order - BIGINT_ONE) + BIGINT_ONE

  return isLE
    ? bigIntToBytesLE(reduced, orderByteLength)
    : bigIntToBytes(reduced, orderByteLength)
}

// Field method names for validation
export const FIELD_METHODS = [
  'create',
  'isValid',
  'is0',
  'neg',
  'inv',
  'sqrt',
  'sqr',
  'eql',
  'add',
  'sub',
  'mul',
  'pow',
  'div',
  'addN',
  'subN',
  'mulN',
  'sqrN'
]
