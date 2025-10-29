/**
 * Elliptic curve operations and point arithmetic
 */

import { validateArray, validateWindowSize } from '../utils/validation.js'
import {
  BIGINT_EIGHT,
  BIGINT_FIVE,
  BIGINT_FOUR,
  BIGINT_NINE,
  BIGINT_ONE,
  BIGINT_SEVEN,
  BIGINT_SIXTEEN,
  BIGINT_THREE,
  BIGINT_TWO,
  BIGINT_ZERO,
  batchInvert,
  createBitMask,
  createField,
  mod,
  validateField
} from './field.js'
import { memoize } from './utils.js'

// BigInt constants for curve operations
export const CURVE_BIGINT_ZERO = BIGINT_ZERO
export const CURVE_BIGINT_ONE = BIGINT_ONE
export const CURVE_BIGINT_TWO = BIGINT_TWO
export const CURVE_BIGINT_THREE = BIGINT_THREE
export const CURVE_BIGINT_FOUR = BIGINT_FOUR
export const CURVE_BIGINT_FIVE = BIGINT_FIVE
export const CURVE_BIGINT_SEVEN = BIGINT_SEVEN
export const CURVE_BIGINT_EIGHT = BIGINT_EIGHT
export const CURVE_BIGINT_NINE = BIGINT_NINE
export const CURVE_BIGINT_SIXTEEN = BIGINT_SIXTEEN

// Field method names
export const CURVE_FIELD_METHODS = [
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

// Point utilities
export function conditionalSelect(condition, _ifFalse, ifTrue) {
  const negated = ifTrue.negate()
  return condition ? negated : ifTrue
}

export function normalizePoints(PointClass, points) {
  const zInverses = batchInvert(
    PointClass.Fp,
    points.map((point) => point.Z)
  )

  return points.map((point, index) =>
    PointClass.fromAffine(point.toAffine(zInverses[index]))
  )
}

// Windowed NAF utilities
export function validateWindowParameters(windowSize, maxBits) {
  validateWindowSize(windowSize, maxBits)
}

export function calculateWindowParameters(windowSize, bitLength) {
  validateWindowParameters(windowSize, bitLength)

  const windows = Math.ceil(bitLength / windowSize) + 1
  const windowSizeHalf = 2 ** (windowSize - 1)
  const windowSizeFull = 2 ** windowSize
  const mask = createBitMask(windowSize)
  const shiftBy = BigInt(windowSize)

  return {
    windows,
    windowSize: windowSizeHalf,
    mask,
    maxNumber: windowSizeFull,
    shiftBy
  }
}

export function getWindowValue(scalar, windowIndex, windowParams) {
  const { windowSize, mask, maxNumber, shiftBy } = windowParams

  let value = Number(scalar & mask)
  let nextScalar = scalar >> shiftBy

  if (value > windowSize) {
    value -= maxNumber
    nextScalar += CURVE_BIGINT_ONE
  }

  const offset = windowIndex * windowSize
  const nextOffset = offset + Math.abs(value) - 1
  const isZero = value === 0
  const isNegative = value < 0
  const isNegativeOdd = windowIndex % 2 !== 0
  const offsetFull = offset

  return {
    nextN: nextScalar,
    offset: nextOffset,
    isZero,
    isNeg: isNegative,
    isNegF: isNegativeOdd,
    offsetF: offsetFull
  }
}

// Validation utilities
export function validatePointArray(array, PointClass) {
  validateArray(array, PointClass, 'points')
}

export function validateScalarArray(array, field, itemName = 'scalars') {
  validateScalarArray(array, field, itemName)
}

// Point multiplication algorithms
export function doubleBaseMultiply(PointClass, basePoint, scalar1, scalar2) {
  let point = basePoint
  let result1 = PointClass.ZERO
  let result2 = PointClass.ZERO

  while (scalar1 > CURVE_BIGINT_ZERO || scalar2 > CURVE_BIGINT_ZERO) {
    if (scalar1 & CURVE_BIGINT_ONE) {
      result1 = result1.add(point)
    }

    if (scalar2 & CURVE_BIGINT_ONE) {
      result2 = result2.add(point)
    }

    point = point.double()
    scalar1 >>= CURVE_BIGINT_ONE
    scalar2 >>= CURVE_BIGINT_ONE
  }

  return { p1: result1, p2: result2 }
}

export function multiScalarMultiply(PointClass, scalarField, points, scalars) {
  validatePointArray(points, PointClass)
  validateScalarArray(scalars, scalarField)

  if (points.length !== scalars.length) {
    throw new Error('arrays of points and scalars must have equal length')
  }

  const zero = PointClass.ZERO
  const pointCount = BigInt(points.length)
  const windowBits = getBitLength(pointCount)

  let windowSize = 1
  if (windowBits > 12) windowSize = windowBits - 3n
  else if (windowBits > 4) windowSize = windowBits - 2n
  else if (windowBits > 0) windowSize = 2n

  windowSize = Number(windowSize)
  const windowMask = createBitMask(windowSize)
  const maxWindow = Math.floor((scalarField.BITS - 1) / windowSize) * windowSize

  let result = zero

  for (let bit = maxWindow; bit >= 0; bit -= windowSize) {
    const windowBuckets = new Array(Number(windowMask) + 1).fill(zero)

    for (let i = 0; i < scalars.length; i++) {
      const scalar = scalars[i]
      const bucketIndex = Number((scalar >> BigInt(bit)) & windowMask)
      windowBuckets[bucketIndex] = windowBuckets[bucketIndex].add(points[i])
    }

    let accumulated = zero
    for (let i = windowBuckets.length - 1, sum = zero; i > 0; i--) {
      sum = sum.add(windowBuckets[i])
      accumulated = accumulated.add(sum)
    }

    result = result.add(accumulated)

    if (bit !== 0) {
      for (let i = 0; i < windowSize; i++) {
        result = result.double()
      }
    }
  }

  return result
}

// Field creation for curves
export function createCurveField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order) {
      throw new Error('Field.ORDER must match order: Fp == p, Fn == n')
    }
    return validateField(field)
  }

  return createField(order, { isLE })
}

// Curve validation
export function validateCurveParams(curve, curveType, fieldOptions, isLE) {
  if (isLE === undefined) {
    isLE = curveType === 'edwards'
  }

  if (!curve || typeof curve !== 'object') {
    throw new Error(`expected valid ${curveType} CURVE object`)
  }

  // Check required parameters
  for (const param of ['p', 'n', 'h']) {
    const value = curve[param]
    if (!(typeof value === 'bigint' && value > CURVE_BIGINT_ZERO)) {
      throw new Error(`CURVE.${param} must be positive bigint`)
    }
  }

  const primeField = createCurveField(curve.p, fieldOptions.Fp, isLE)
  const scalarField = createCurveField(curve.n, fieldOptions.Fn, isLE)

  // Check curve-specific parameters
  const curveParams = ['Gx', 'Gy', 'a', curveType === 'weierstrass' ? 'b' : 'd']

  for (const param of curveParams) {
    if (!primeField.isValid(curve[param])) {
      throw new Error(`CURVE.${param} must be valid field element of CURVE.Fp`)
    }
  }

  return {
    CURVE: Object.freeze(Object.assign({}, curve)),
    Fp: primeField,
    Fn: scalarField
  }
}

// Point multiplication class
export class PointMultiplier {
  constructor(PointClass, bitLength) {
    this.BASE = PointClass.BASE
    this.ZERO = PointClass.ZERO
    this.Fn = PointClass.Fn
    this.bits = bitLength
  }

  _unsafeLadder(point, scalar, accumulator = this.ZERO) {
    let p = point

    while (scalar > CURVE_BIGINT_ZERO) {
      if (scalar & CURVE_BIGINT_ONE) {
        accumulator = accumulator.add(p)
      }

      p = p.double()
      scalar >>= CURVE_BIGINT_ONE
    }

    return accumulator
  }

  precomputeWindow(point, windowSize) {
    const { windows, windowSize: halfSize } = calculateWindowParameters(
      windowSize,
      this.bits
    )
    const precomputed = []

    let current = point
    let accumulator = current

    for (let i = 0; i < windows; i++) {
      accumulator = current
      precomputed.push(accumulator)

      for (let j = 1; j < halfSize; j++) {
        accumulator = accumulator.add(current)
        precomputed.push(accumulator)
      }

      current = accumulator.double()
    }

    return precomputed
  }

  wNAF(windowSize, precomputed, scalar) {
    if (!this.Fn.isValid(scalar)) {
      throw new Error('invalid scalar')
    }

    let result = this.ZERO
    let f = this.BASE

    const windowParams = calculateWindowParameters(windowSize, this.bits)

    for (let i = 0; i < windowParams.windows; i++) {
      const {
        nextN: nextScalar,
        offset,
        isZero,
        isNeg,
        isNegF,
        offsetF
      } = getWindowValue(scalar, i, windowParams)

      scalar = nextScalar

      if (isZero) {
        f = f.add(conditionalSelect(isNegF, precomputed[offsetF]))
      } else {
        result = result.add(conditionalSelect(isNeg, precomputed[offset]))
      }
    }

    this.validateScalar(scalar)
    return { p: result, f }
  }

  wNAFUnsafe(windowSize, precomputed, scalar, accumulator = this.ZERO) {
    const windowParams = calculateWindowParameters(windowSize, this.bits)

    for (let i = 0; i < windowParams.windows; i++) {
      if (scalar === CURVE_BIGINT_ZERO) {
        break
      }

      const {
        nextN: nextScalar,
        offset,
        isZero,
        isNeg
      } = getWindowValue(scalar, i, windowParams)

      scalar = nextScalar

      if (!isZero) {
        const point = precomputed[offset]
        accumulator = accumulator.add(isNeg ? point.negate() : point)
      }
    }

    this.validateScalar(scalar)
    return accumulator
  }

  getPrecomputes(windowSize, point, _processor) {
    // Implementation would use WeakMap for caching
    return this.precomputeWindow(point, windowSize)
  }

  cached(windowSize, scalar, processor) {
    const cacheSize = this.getCacheSize(windowSize)
    return this.wNAF(
      cacheSize,
      this.getPrecomputes(cacheSize, windowSize, processor),
      scalar
    )
  }

  unsafe(windowSize, scalar, processor, accumulator) {
    const cacheSize = this.getCacheSize(windowSize)

    if (cacheSize === 1) {
      return this._unsafeLadder(scalar, accumulator)
    }

    return this.wNAFUnsafe(
      cacheSize,
      this.getPrecomputes(cacheSize, windowSize, processor),
      scalar,
      accumulator
    )
  }

  createCache(_point, windowSize) {
    validateWindowSize(windowSize, this.bits)
    // Implementation would set cache size
  }

  hasCache(windowSize) {
    return this.getCacheSize(windowSize) !== 1
  }

  getCacheSize(windowSize) {
    // Implementation would get from WeakMap
    return windowSize || 1
  }

  validateScalar(scalar) {
    if (scalar !== CURVE_BIGINT_ZERO) {
      throw new Error('invalid wNAF')
    }
  }
}

// Endomorphism utilities
export function splitScalarEndomorphism(scalar, basises, fieldOrder) {
  const [[b1, b2], [a1, a2]] = basises

  const lambda = mod(scalar * a2, fieldOrder)
  const beta = mod(-scalar * b2, fieldOrder)

  let d1 = scalar - lambda * b1 - beta * a1
  let d2 = -lambda * b2 - beta * a2

  const d1Neg = d1 < CURVE_BIGINT_ZERO
  const d2Neg = d2 < CURVE_BIGINT_ZERO

  if (d1Neg) d1 = -d1
  if (d2Neg) d2 = -d2

  const maxScalar =
    createBitMask(Math.ceil(getBitLength(fieldOrder) / 2)) + CURVE_BIGINT_ONE

  if (
    d1 < CURVE_BIGINT_ZERO ||
    d1 >= maxScalar ||
    d2 < CURVE_BIGINT_ZERO ||
    d2 >= maxScalar
  ) {
    throw new Error(`splitScalar (endomorphism): failed, k=${scalar}`)
  }

  return {
    k1neg: d1Neg,
    k1: d1,
    k2neg: d2Neg,
    k2: d2
  }
}

// Memoized affine conversion
export const memoizeToAffine = memoize((point, invZ) => {
  const { X, Y, Z } = point

  if (point.Fp.eql(Z, point.Fp.ONE)) {
    return { x: X, y: Y }
  }

  const isZero = point.is0()
  if (invZ == null) {
    invZ = isZero ? point.Fp.ONE : point.Fp.inv(Z)
  }

  const x = point.Fp.mul(X, invZ)
  const y = point.Fp.mul(Y, invZ)
  const zCheck = point.Fp.mul(Z, invZ)

  if (isZero) {
    return { x: point.Fp.ZERO, y: point.Fp.ZERO }
  }

  if (!point.Fp.eql(zCheck, point.Fp.ONE)) {
    throw new Error('invZ was invalid')
  }

  return { x, y }
})

// Bit length calculation
export function getBitLength(bigint) {
  let length = 0
  for (; bigint > CURVE_BIGINT_ZERO; bigint >>= CURVE_BIGINT_ONE, length += 1);
  return length
}

// Point constants
export const POINT_ZERO = CURVE_BIGINT_ZERO
export const POINT_ONE = CURVE_BIGINT_ONE

// WeakMaps for caching (would be initialized in actual implementation)
export const pointCache = new WeakMap()
export const windowSizeCache = new WeakMap()
