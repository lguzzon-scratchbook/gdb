/**
 * secp256k1 elliptic curve implementation
 */

import {
  conditionalSelect,
  doubleBaseMultiply,
  memoizeToAffine,
  multiScalarMultiply,
  normalizePoints,
  POINT_ONE,
  POINT_ZERO,
  PointMultiplier,
  splitScalarEndomorphism,
  validateCurveParams
} from '../crypto/curve.js'

import { bigIntToBytes, bytesToBigInt, concatArrays } from '../crypto/utils.js'
import {
  validateBoolean,
  validateMessage,
  validateOptions,
  validatePrivateKey,
  validateSignatureFormat
} from '../utils/validation.js'

// secp256k1 curve parameters
export const SECP256K1_CURVE = {
  p: BigInt(
    '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'
  ),
  n: BigInt(
    '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'
  ),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt(
    '0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
  ),
  Gy: BigInt(
    '0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'
  )
}

// Endomorphism parameters
export const SECP256K1_ENDO = {
  beta: BigInt(
    '0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'
  ),
  basises: [
    [
      BigInt('0x3086d221a7d46bcde86c90e49284eb15'),
      -BigInt('0xe4437ed6010e88286f547fa90abfe4c3')
    ],
    [
      BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8'),
      BigInt('0x3086d221a7d46bcde86c90e49284eb15')
    ]
  ]
}

// Signature format validation
export function validateSecp256k1SignatureFormat(format) {
  return validateSignatureFormat(format)
}

// Options validation and merging
export function mergeSignatureOptions(options, defaults) {
  const merged = {}

  for (const key of Object.keys(defaults)) {
    merged[key] = options[key] === undefined ? defaults[key] : options[key]
  }

  validateBoolean(merged.lowS, 'lowS')
  validateBoolean(merged.prehash, 'prehash')

  if (merged.format !== undefined) {
    validateSecp256k1SignatureFormat(merged.format)
  }

  return merged
}

// Private key normalization
export function normalizePrivateKey(privateKey, scalarField) {
  return validatePrivateKey(privateKey, scalarField)
}

// Weierstrass curve implementation
export function createWeierstrassCurve(curve, options = {}) {
  const {
    Fp: primeField,
    Fn: scalarField,
    CURVE
  } = validateCurveParams(curve, 'weierstrass', options, false)

  const { h: cofactor, n: order } = CURVE

  // Validate additional options
  validateOptions(
    options,
    {},
    {
      allowInfinityPoint: 'boolean',
      clearCofactor: 'function',
      isTorsionFree: 'function',
      fromBytes: 'function',
      toBytes: 'function',
      endo: 'object',
      wrapPrivateKey: 'boolean'
    }
  )

  const { endo } = options

  // Validate endomorphism if present
  if (endo) {
    if (
      !primeField.is0(CURVE.a) ||
      typeof endo.beta !== 'bigint' ||
      !Array.isArray(endo.basises)
    ) {
      throw new Error(
        'invalid endo: expected "beta": bigint and "basises": array'
      )
    }
  }

  // Length definitions
  const lengths = {
    secretKey: scalarField.BYTES,
    publicKey: 1 + primeField.BYTES,
    publicKeyUncompressed: 1 + 2 * primeField.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * scalarField.BYTES
  }

  // Compression check
  function checkCompressionSupport() {
    if (!primeField.isOdd) {
      throw new Error(
        'compression is not supported: Field does not have .isOdd()'
      )
    }
  }

  // Point encoding (compressed/uncompressed)
  function encodePoint(point, isCompressed) {
    const { x, y } = point.toAffine()
    const xBytes = primeField.toBytes(x)

    validateBoolean(isCompressed, 'isCompressed')

    if (isCompressed) {
      checkCompressionSupport()
      const prefix = getCompressedPrefix(!primeField.isOdd(y))
      return concatArrays(prefix, xBytes)
    } else {
      const prefix = Uint8Array.of(4)
      const yBytes = primeField.toBytes(y)
      return concatArrays(prefix, xBytes, yBytes)
    }
  }

  // Point decoding
  function decodePoint(bytes) {
    validateMessage(bytes, 'Point')

    const { publicKey: compressedLen, publicKeyUncompressed: uncompressedLen } =
      lengths
    const byteLength = bytes.length
    const prefix = bytes[0]
    const data = bytes.subarray(1)

    // Compressed point
    if (byteLength === compressedLen && (prefix === 2 || prefix === 3)) {
      const x = primeField.fromBytes(data)

      if (!primeField.isValid(x)) {
        throw new Error('bad point: is not on curve, wrong x')
      }

      const ySquared = calculateYSquared(x)
      let y

      try {
        y = primeField.sqrt(ySquared)
      } catch (error) {
        const message = error instanceof Error ? `: ${error.message}` : ''
        throw new Error(`bad point: is not on curve, sqrt error${message}`)
      }

      checkCompressionSupport()
      const isOdd = primeField.isOdd(y)

      if (((prefix & 1) === 1) !== isOdd) {
        y = primeField.neg(y)
      }

      return { x, y }
    }
    // Uncompressed point
    else if (byteLength === uncompressedLen && prefix === 4) {
      const fieldBytes = primeField.BYTES
      const x = primeField.fromBytes(data.subarray(0, fieldBytes))
      const y = primeField.fromBytes(data.subarray(fieldBytes, fieldBytes * 2))

      if (!isPointOnCurve(x, y)) {
        throw new Error('bad point: is not on curve')
      }

      return { x, y }
    } else {
      throw new Error(
        `bad point: got length ${byteLength}, expected compressed=${compressedLen} or uncompressed=${uncompressedLen}`
      )
    }
  }

  // Helper functions
  function getCompressedPrefix(isEven) {
    return Uint8Array.of(isEven ? 2 : 3)
  }

  function calculateYSquared(x) {
    const xSquared = primeField.sqr(x)
    const xCubed = primeField.mul(xSquared, x)
    return primeField.add(
      primeField.add(xCubed, primeField.mul(x, CURVE.a)),
      CURVE.b
    )
  }

  function isPointOnCurve(x, y) {
    const ySquared = primeField.sqr(y)
    const xSquared = calculateYSquared(x)
    return primeField.eql(ySquared, xSquared)
  }

  // Validate generator point
  if (!isPointOnCurve(CURVE.Gx, CURVE.Gy)) {
    throw new Error('bad curve params: generator point')
  }

  // Validate curve parameters
  const discriminant = primeField.mul(
    primeField.pow(CURVE.a, POINT_ONE * 3),
    POINT_ONE * 4 * 27
  )
  const bTerm = primeField.mul(primeField.sqr(CURVE.b), BigInt(27))

  if (primeField.is0(primeField.add(discriminant, bTerm))) {
    throw new Error('bad curve params: a or b')
  }

  // Point coordinate validation
  function validateCoordinate(name, value, allowZero = false) {
    if (!primeField.isValid(value) || (allowZero && primeField.is0(value))) {
      throw new Error(`bad point coordinate ${name}`)
    }
    return value
  }

  // Point class validation
  function validateProjectivePoint(point) {
    if (!(point instanceof ProjectivePoint)) {
      throw new Error('ProjectivePoint expected')
    }
  }

  // Endomorphism scalar splitting
  function splitScalar(scalar) {
    if (!endo || !endo.basises) {
      throw new Error('no endo')
    }
    return splitScalarEndomorphism(scalar, endo.basises, scalarField.ORDER)
  }

  // Memoized functions
  const toAffineMemo = memoizeToAffine

  const validatePointMemo = memoize((point) => {
    if (point.is0()) {
      if (options.allowInfinityPoint && !primeField.is0(point.Y)) {
        return
      }
      throw new Error('bad point: ZERO')
    }

    const { x, y } = point.toAffine()

    if (!primeField.isValid(x) || !primeField.isValid(y)) {
      throw new Error('bad point: x or y not field elements')
    }

    if (!isPointOnCurve(x, y)) {
      throw new Error('bad point: equation left != right')
    }

    if (!point.isTorsionFree()) {
      throw new Error('bad point: not in prime-order subgroup')
    }

    return true
  })

  // Endomorphism point combination
  function combineEndomorphismPoints(beta, p1, p2, k1neg, k2neg) {
    const scaledP1 = new ProjectivePoint(primeField.mul(p1.X, beta), p1.Y, p1.Z)

    const scaledP2 = conditionalSelect(k2neg, p2)
    const scaledP1Negated = conditionalSelect(k1neg, scaledP1)

    return scaledP2.add(scaledP1Negated)
  }

  // ProjectivePoint class
  class ProjectivePoint {
    constructor(x, y, z) {
      this.X = validateCoordinate('x', x)
      this.Y = validateCoordinate('y', y, true)
      this.Z = validateCoordinate('z', z)
      Object.freeze(this)
    }

    static CURVE() {
      return CURVE
    }

    static fromAffine(point) {
      const { x, y } = point || {}

      if (!point || !primeField.isValid(x) || !primeField.isValid(y)) {
        throw new Error('invalid affine point')
      }

      if (point instanceof ProjectivePoint) {
        throw new Error('projective point not allowed')
      }

      if (primeField.is0(x) && primeField.is0(y)) {
        return ProjectivePoint.ZERO
      }

      return new ProjectivePoint(x, y, primeField.ONE)
    }

    static fromBytes(bytes) {
      const point = ProjectivePoint.fromAffine(
        decodePoint(validateMessage(bytes, 'point'))
      )
      point.assertValidity()
      return point
    }

    static fromHex(hex) {
      return ProjectivePoint.fromBytes(validateMessage(hex, 'pointHex'))
    }

    get x() {
      return this.toAffine().x
    }

    get y() {
      return this.toAffine().y
    }

    precompute(windowSize = 8, multiply = true) {
      multiplier.createCache(this, windowSize)
      if (multiply) {
        this.multiply(POINT_ONE * 3)
      }
      return this
    }

    assertValidity() {
      validatePointMemo(this)
    }

    hasEvenY() {
      const { y } = this.toAffine()

      if (!primeField.isOdd) {
        throw new Error("Field doesn't support isOdd")
      }

      return !primeField.isOdd(y)
    }

    equals(other) {
      validateProjectivePoint(other)

      const { X: x1, Y: y1, Z: z1 } = this
      const { X: x2, Y: y2, Z: z2 } = other

      const x1z2 = primeField.mul(x1, z2)
      const x2z1 = primeField.mul(x2, z1)
      const y1z2 = primeField.mul(y1, z2)
      const y2z1 = primeField.mul(y2, z1)

      return primeField.eql(x1z2, x2z1) && primeField.eql(y1z2, y2z1)
    }

    negate() {
      return new ProjectivePoint(this.X, primeField.neg(this.Y), this.Z)
    }

    double() {
      const { a, b } = CURVE
      const threeB = primeField.mul(b, POINT_ONE * 3)
      const { X, Y, Z } = this

      const XX = primeField.mul(X, X)
      const YY = primeField.mul(Y, Y)
      const ZZ = primeField.mul(Z, Z)
      const XY = primeField.mul(X, Y)
      const XZ = primeField.mul(X, Z)

      // Calculate intermediate values
      let T = primeField.mul(a, XZ)
      let U = primeField.mul(threeB, ZZ)
      let V = T
      let W = primeField.add(V, U)
      const VV = primeField.sub(YY, W)
      const WW = primeField.add(YY, W)
      const WWW = primeField.mul(VV, WW)
      V = primeField.mul(XY, VV)
      W = primeField.mul(threeB, XZ)
      T = primeField.mul(a, ZZ)
      U = primeField.sub(XX, T)
      T = primeField.mul(a, U)
      U = primeField.add(T, W)
      W = primeField.sub(XX, U)
      T = primeField.mul(a, W)
      W = primeField.add(T, U)
      U = primeField.add(XX, XX)
      U = primeField.add(U, XX)
      T = primeField.add(U, T)
      U = primeField.add(T, U)
      T = primeField.mul(U, W)
      W = primeField.mul(XY, W)
      U = primeField.add(WWW, T)
      T = primeField.mul(Y, Z)
      T = primeField.add(T, T)
      W = primeField.mul(T, W)
      V = primeField.sub(V, W)
      T = primeField.mul(T, YY)
      T = primeField.add(T, T)
      T = primeField.add(T, T)

      return new ProjectivePoint(V, U, T)
    }

    add(other) {
      validateProjectivePoint(other)

      const { X: x1, Y: y1, Z: z1 } = this
      const { X: x2, Y: y2, Z: z2 } = other

      const a = CURVE.a
      const threeB = primeField.mul(CURVE.b, POINT_ONE * 3)

      const X1Y2 = primeField.mul(x1, y2)
      const Y1X2 = primeField.mul(y1, x2)
      const Z1Z2 = primeField.mul(z1, z2)
      const X1X2 = primeField.mul(x1, x2)
      const Y1Y2 = primeField.mul(y1, y2)

      const X1plusY1 = primeField.add(x1, y1)
      const X2plusY2 = primeField.add(x2, y2)
      const X1plusZ1 = primeField.add(x1, z1)
      const X2plusZ2 = primeField.add(x2, z2)
      const Y1plusZ1 = primeField.add(y1, z1)
      const Y2plusZ2 = primeField.add(y2, z2)

      const A = primeField.mul(X1plusY1, X2plusY2)
      const B = primeField.add(X1Y2, Y1X2)
      const C = primeField.sub(A, B)
      const D = primeField.mul(X1plusZ1, X2plusZ2)
      const E = primeField.add(X1X2, Z1Z2)
      const F = primeField.sub(D, E)
      const G = primeField.mul(Y1plusZ1, Y2plusZ2)
      const H = primeField.add(Y1Y2, Z1Z2)
      const I = primeField.sub(G, H)
      const J = primeField.mul(a, F)
      const K = primeField.mul(threeB, I)
      const L = primeField.add(J, K)
      const M = primeField.sub(Y1Y2, L)
      const N = primeField.add(Y1Y2, L)
      const O = primeField.mul(M, N)
      const P = primeField.mul(X1Y2, C)
      const Q = primeField.mul(threeB, F)
      const R = primeField.add(P, Q)
      const S = primeField.sub(X1X2, R)
      const T = primeField.add(X1X2, R)
      const U = primeField.mul(S, T)
      const V = primeField.add(O, U)
      const W = primeField.mul(C, R)
      const X = primeField.mul(F, I)
      const Y = primeField.add(W, X)
      const _Z = primeField.mul(C, N)
      const AA = primeField.mul(F, L)
      const BB = primeField.sub(X1X2, AA)
      const CC = primeField.mul(a, BB)
      const DD = primeField.mul(threeB, I)
      const EE = primeField.add(CC, DD)
      const FF = primeField.sub(Y1Y2, EE)
      const GG = primeField.add(Y1Y2, EE)
      const HH = primeField.mul(FF, GG)
      const II = primeField.mul(C, EE)
      const JJ = primeField.add(HH, II)
      const KK = primeField.mul(Y1Z1, W)
      const LL = primeField.add(KK, KK)
      const MM = primeField.add(LL, LL)
      const NN = primeField.add(MM, LL)
      const _OO = primeField.mul(NN, W)
      const PP = primeField.mul(KK, Y1Y2)
      const QQ = primeField.add(PP, PP)
      const RR = primeField.add(QQ, QQ)
      const SS = primeField.add(RR, RR)
      const TT = primeField.mul(SS, W)
      const UU = primeField.add(JJ, TT)

      return new ProjectivePoint(UU, V, Y)
    }

    subtract(other) {
      return this.add(other.negate())
    }

    is0() {
      return this.equals(ProjectivePoint.ZERO)
    }

    multiply(scalar) {
      if (!scalarField.isValidNot0(scalar)) {
        throw new Error('invalid scalar: out of range')
      }

      let result, final

      const cachedMultiply = (scalar) => {
        return multiplier.cached(this, scalar, (points) =>
          normalizePoints(ProjectivePoint, points)
        )
      }

      if (endo) {
        const { k1neg, k1, k2neg, k2 } = splitScalar(scalar)
        const { p, f } = cachedMultiply(k1)
        const { p: p2, f: f2 } = cachedMultiply(k2)

        final = f.add(f2)
        result = combineEndomorphismPoints(endo.beta, p, p2, k1neg, k2neg)
      } else {
        const { p, f } = cachedMultiply(scalar)
        result = p
        final = f
      }

      return normalizePoints(ProjectivePoint, [result, final])[0]
    }

    multiplyUnsafe(scalar) {
      if (!scalarField.isValid(scalar)) {
        throw new Error('invalid scalar: out of range')
      }

      if (scalar === POINT_ZERO || this.is0()) {
        return ProjectivePoint.ZERO
      }

      if (scalar === POINT_ONE) {
        return this
      }

      if (multiplier.hasCache(this)) {
        return this.multiply(scalar)
      }

      if (endo) {
        const { k1neg, k1, k2neg, k2 } = splitScalar(scalar)
        const { p1, p2 } = doubleBaseMultiply(ProjectivePoint, this, k1, k2)
        return combineEndomorphismPoints(endo.beta, p1, p2, k1neg, k2neg)
      } else {
        return multiplier.unsafe(this, scalar)
      }
    }

    multiplyAndAddUnsafe(basePoint, baseScalar, scalar) {
      const result = this.multiplyUnsafe(baseScalar).add(
        basePoint.multiplyUnsafe(scalar)
      )
      return result.is0() ? undefined : result
    }

    toAffine(invZ) {
      return toAffineMemo(this, invZ)
    }

    isTorsionFree() {
      if (cofactor === POINT_ONE) {
        return true
      }

      const { isTorsionFree } = options
      if (isTorsionFree) {
        return isTorsionFree(ProjectivePoint, this)
      }

      return multiplier.unsafe(this, order).is0()
    }

    clearCofactor() {
      const { clearCofactor } = options

      if (cofactor === POINT_ONE) {
        return this
      }

      if (clearCofactor) {
        return clearCofactor(ProjectivePoint, this)
      }

      return this.multiplyUnsafe(cofactor)
    }

    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0()
    }

    toBytes(isCompressed = true) {
      validateBoolean(isCompressed, 'isCompressed')
      this.assertValidity()
      return (options.toBytes || encodePoint)(this, isCompressed)
    }

    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed))
    }

    toString() {
      return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`
    }

    // Legacy getters
    get px() {
      return this.X
    }

    get py() {
      return this.Y
    }

    get pz() {
      return this.Z
    }

    toRawBytes(isCompressed = true) {
      return this.toBytes(isCompressed)
    }

    _setWindowSize(windowSize) {
      this.precompute(windowSize)
    }

    static normalizeZ(points) {
      return normalizePoints(ProjectivePoint, points)
    }

    static msm(points, scalars) {
      return multiScalarMultiply(ProjectivePoint, scalarField, points, scalars)
    }

    static fromPrivateKey(privateKey) {
      return ProjectivePoint.BASE.multiply(
        normalizePrivateKey(privateKey, scalarField)
      )
    }
  }

  // Static properties
  ProjectivePoint.BASE = new ProjectivePoint(CURVE.Gx, CURVE.Gy, primeField.ONE)
  ProjectivePoint.ZERO = new ProjectivePoint(
    primeField.ZERO,
    primeField.ONE,
    primeField.ZERO
  )
  ProjectivePoint.Fp = primeField
  ProjectivePoint.Fn = scalarField

  // Create multiplier
  const bitLength = scalarField.BITS
  const multiplier = new PointMultiplier(
    ProjectivePoint,
    options.endo ? Math.ceil(bitLength / 2) : bitLength
  )

  // Precompute generator
  ProjectivePoint.BASE.precompute(8)

  return ProjectivePoint
}

// ECDH key agreement
export function createECDH(curve, options = {}) {
  const { Fn: scalarField } = curve
  const { randomBytes = getRandomBytes } = options

  const lengths = {
    secretKey: scalarField.BYTES,
    publicKey: 1 + curve.Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * curve.Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * scalarField.BYTES
  }

  // Key validation
  function isValidSecretKey(privateKey) {
    try {
      return !!normalizePrivateKey(privateKey, scalarField)
    } catch {
      return false
    }
  }

  // Public key validation
  function isValidPublicKey(publicKey, allowCompressed = true) {
    const { publicKey: compressedLen, publicKeyUncompressed: uncompressedLen } =
      lengths

    try {
      const length = publicKey.length

      if (allowCompressed && length !== compressedLen) {
        return false
      }

      if (!allowCompressed && length !== uncompressedLen) {
        return false
      }

      return !!curve.fromBytes(publicKey)
    } catch {
      return false
    }
  }

  // Random private key generation
  function randomPrivateKey() {
    const seedLength = getSeedByteLength(scalarField.ORDER)
    return modScalar(randomBytes(seedLength), scalarField.ORDER)
  }

  // Get public key from private key
  function getPublicKey(privateKey, isCompressed = true) {
    return curve.BASE.multiply(
      normalizePrivateKey(privateKey, scalarField)
    ).toBytes(isCompressed)
  }

  // Key pair generation
  function keygen(seed) {
    const privateKey = randomPrivateKey(seed)
    const publicKey = getPublicKey(privateKey)
    return { secretKey: privateKey, publicKey }
  }

  // Shared secret computation
  function computeSharedSecret(privateKey, publicKey, isCompressed = true) {
    if (isPrivateKeyLike(privateKey)) {
      throw new Error('first arg must be private key')
    }

    if (!isPublicKeyLike(publicKey)) {
      throw new Error('second arg must be public key')
    }

    const scalar = normalizePrivateKey(privateKey, scalarField)
    return curve.fromHex(publicKey).multiply(scalar).toBytes(isCompressed)
  }

  // Helper functions
  function isPrivateKeyLike(obj) {
    if (typeof obj === 'bigint') {
      return false
    }

    if (obj instanceof curve) {
      return true
    }

    const { secretKey, publicKey, publicKeyUncompressed } = lengths

    if (scalarField.allowedLengths || secretKey === publicKey) {
      return
    }

    const length = validateMessage(obj, 'key').length
    return (
      length === secretKey ||
      length === publicKey ||
      length === publicKeyUncompressed
    )
  }

  function isPublicKeyLike(obj) {
    return !isPrivateKeyLike(obj)
  }

  function getSeedByteLength(order) {
    const byteLength = getByteLength(order)
    return byteLength + Math.ceil(byteLength / 2)
  }

  function getByteLength(bigint) {
    const bitLength = bigint.toString(2).length
    return Math.ceil(bitLength / 8)
  }

  function modScalar(bytes, order) {
    const bytesLength = bytes.length
    const orderByteLength = getByteLength(order)
    const seedByteLength = getSeedByteLength(order)

    if (
      bytesLength < 16 ||
      bytesLength < seedByteLength ||
      bytesLength > 1024
    ) {
      throw new Error(
        `expected ${seedByteLength}-1024 bytes of input, got ${bytesLength}`
      )
    }

    const value = bytesToBigInt(bytes)
    const reduced = (value % (order - POINT_ONE)) + POINT_ONE
    return bigIntToBytes(reduced, orderByteLength)
  }

  function getRandomBytes(length) {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      return globalThis.crypto.getRandomValues(new Uint8Array(length))
    }

    throw new Error('crypto.getRandomValues must be defined')
  }

  return Object.freeze({
    getPublicKey,
    getSharedSecret: computeSharedSecret,
    keygen,
    Point: curve,
    utils: {
      isValidSecretKey,
      isValidPublicKey,
      randomSecretKey: randomPrivateKey,
      randomPrivateKey: randomPrivateKey,
      normPrivateKeyToScalar: (privateKey) =>
        normalizePrivateKey(privateKey, scalarField),
      precompute: (windowSize = 8, point = curve.BASE) => {
        return point.precompute(windowSize, false)
      }
    },
    lengths
  })
}

// ECDSA implementation
export function createECDSA(curve, hash, options = {}) {
  validateHash(hash)

  validateOptions(
    options,
    {},
    {
      hmac: 'function',
      lowS: 'boolean',
      randomBytes: 'function',
      bits2int: 'function',
      bits2int_modN: 'function'
    }
  )

  const { randomBytes = getRandomBytes } = options
  const hmac =
    options.hmac ||
    ((key, ...data) => createHMAC(hash, key, concatArrays(...data)))

  const { Fp: primeField, Fn: scalarField } = curve
  const { ORDER: order, BITS: bitLength } = scalarField

  // Get ECDH utilities
  const ecdh = createECDH(curve, options)
  const {
    keygen,
    getPublicKey,
    getSharedSecret,
    utils: ecdhUtils,
    lengths
  } = ecdh

  // Default options
  const defaultOptions = {
    prehash: false,
    lowS: typeof options.lowS === 'boolean' ? options.lowS : false,
    format: undefined,
    extraEntropy: false
  }

  const defaultFormat = 'compact'

  // Helper functions
  function hasHighS(scalar) {
    const halfOrder = order >> POINT_ONE
    return scalar > halfOrder
  }

  function validateSignatureScalar(scalarName, scalar) {
    if (!scalarField.isValidNot0(scalar)) {
      throw new Error(
        `invalid signature ${scalarName}: out of range 1..Point.Fn.ORDER`
      )
    }
    return scalar
  }

  function validateSignatureBytes(bytes, format) {
    validateSecp256k1SignatureFormat(format)

    const expectedLength =
      format === 'compact'
        ? lengths.signature
        : format === 'recovered'
          ? lengths.signature + 1
          : undefined

    return validateMessage(bytes, expectedLength, `${format} signature`)
  }

  // Signature class
  class Signature {
    constructor(r, s, recovery) {
      this.r = validateSignatureScalar('r', r)
      this.s = validateSignatureScalar('s', s)

      if (recovery != null) {
        this.recovery = recovery
      }

      Object.freeze(this)
    }

    static fromBytes(bytes, format = defaultFormat) {
      validateSignatureBytes(bytes, format)

      let recovery

      if (format === 'der') {
        const { r, s } = DER.toSig(validateMessage(bytes))
        return new Signature(r, s)
      }

      if (format === 'recovered') {
        recovery = bytes[0]
        format = 'compact'
        bytes = bytes.subarray(1)
      }

      const fieldBytes = scalarField.BYTES
      const rBytes = bytes.subarray(0, fieldBytes)
      const sBytes = bytes.subarray(fieldBytes, fieldBytes * 2)

      return new Signature(
        scalarField.fromBytes(rBytes),
        scalarField.fromBytes(sBytes),
        recovery
      )
    }

    static fromHex(hex, format) {
      return Signature.fromBytes(hexToBytes(hex), format)
    }

    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery)
    }

    recoverPublicKey(messageHash) {
      const { r, s, recovery } = this

      if (recovery == null || ![0, 1, 2, 3].includes(recovery)) {
        throw new Error('recovery id invalid')
      }

      if (order * POINT_ONE * 2 < primeField.ORDER && recovery > 1) {
        throw new Error('recovery id is ambiguous for h>1 curve')
      }

      const x = recovery === 2 || recovery === 3 ? r + order : r

      if (!primeField.isValid(x)) {
        throw new Error('recovery id 2 or 3 invalid')
      }

      const xBytes = primeField.toBytes(x)
      const prefix = getCompressedPrefix((recovery & 1) === 0)
      const point = curve.fromBytes(concatArrays(prefix, xBytes))
      const rInv = scalarField.inv(r)
      const e = scalarField.create(-bytesToBigInt(messageHash) * rInv)
      const sInv = scalarField.create(s * rInv)

      const rG = curve.BASE.multiplyUnsafe(e)
      const sP = point.multiplyUnsafe(sInv)
      const result = rG.add(sP)

      if (result.is0()) {
        throw new Error('point at infinity')
      }

      result.assertValidity()
      return result
    }

    hasHighS() {
      return hasHighS(this.s)
    }

    toBytes(format = defaultFormat) {
      validateSecp256k1SignatureFormat(format)

      if (format === 'der') {
        return hexToBytes(DER.hexFromSig(this))
      }

      const rBytes = scalarField.toBytes(this.r)
      const sBytes = scalarField.toBytes(this.s)

      if (format === 'recovered') {
        if (this.recovery == null) {
          throw new Error('recovery bit must be present')
        }

        return concatArrays(Uint8Array.of(this.recovery), rBytes, sBytes)
      }

      return concatArrays(rBytes, sBytes)
    }

    toHex(format) {
      return bytesToHex(this.toBytes(format))
    }

    assertValidity() {
      // No validation needed for now
    }

    // Static convenience methods
    static fromCompact(bytes) {
      return Signature.fromBytes(validateMessage(bytes, 'sig'), 'compact')
    }

    static fromDER(bytes) {
      return Signature.fromBytes(validateMessage(bytes, 'sig'), 'der')
    }

    normalizeS() {
      return this.hasHighS()
        ? new Signature(this.r, scalarField.neg(this.s), this.recovery)
        : this
    }

    // Legacy methods
    toDERRawBytes() {
      return this.toBytes('der')
    }

    toDERHex() {
      return bytesToHex(this.toBytes('der'))
    }

    toCompactRawBytes() {
      return this.toBytes('compact')
    }

    toCompactHex() {
      return bytesToHex(this.toBytes('compact'))
    }
  }

  // Bits to int conversion
  const bits2int =
    options.bits2int ||
    ((bytes) => {
      if (bytes.length > 8192) {
        throw new Error('input is too large')
      }

      const value = bytesToBigInt(bytes)
      const shift = bytes.length * 8 - bitLength

      return shift > 0 ? value >> BigInt(shift) : value
    })

  // Bits to int modulo n
  const bits2intModN =
    options.bits2int_modN || ((bytes) => scalarField.create(bits2int(bytes)))

  // Number to bytes
  function numToBytes(num) {
    validateRange('num', num, POINT_ZERO, createBitMask(bitLength))
    return scalarField.toBytes(num)
  }

  // Message preprocessing
  function preprocessMessage(message, prehash) {
    validateMessage(message, 'message')
    return prehash
      ? validateMessage(hash(message), 'prehashed message')
      : message
  }

  // Sign message
  function signMessage(message, privateKey, options = {}) {
    if (['recovered', 'canonical'].some((key) => key in options)) {
      throw new Error('sign() legacy options not supported')
    }

    const { lowS, prehash, extraEntropy } = mergeSignatureOptions(
      options,
      defaultOptions
    )

    message = preprocessMessage(message, prehash)
    const msgHash = bits2intModN(message)
    const privKey = normalizePrivateKey(privateKey, scalarField)

    const seedData = [numToBytes(privKey), numToBytes(msgHash)]

    if (extraEntropy != null && extraEntropy !== false) {
      const entropy =
        extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy
      seedData.push(validateMessage(entropy, 'extraEntropy'))
    }

    const seed = concatArrays(...seedData)
    const drbg = createDRBG(hash.outputLen, scalarField.BYTES, hmac)

    return drbg(seed, (nonce) => {
      const nonceInt = bits2int(nonce)

      if (!scalarField.isValidNot0(nonceInt)) {
        return
      }

      const nonceInv = scalarField.inv(nonceInt)
      const point = curve.BASE.multiply(nonceInt).toAffine()
      const rx = scalarField.create(point.x)

      if (rx === POINT_ZERO) {
        return
      }

      const sValue = scalarField.create(
        nonceInv * scalarField.create(msgHash + rx * privKey)
      )

      if (sValue === POINT_ZERO) {
        return
      }

      let recovery = (point.x === rx ? 0 : 2) | Number(point.y & POINT_ONE)
      let r = rx

      if (lowS && hasHighS(sValue)) {
        r = scalarField.neg(r)
        recovery ^= 1
      }

      return new Signature(rx, sValue, recovery)
    })
  }

  // Verify signature
  function verifySignature(signature, message, publicKey, options = {}) {
    const { lowS, prehash, format } = mergeSignatureOptions(
      options,
      defaultOptions
    )

    publicKey = validateMessage(publicKey, 'publicKey')
    message = preprocessMessage(validateMessage(message, 'message'), prehash)

    if ('strict' in options) {
      throw new Error('options.strict was renamed to lowS')
    }

    const sig =
      format === undefined
        ? parseSignature(signature)
        : Signature.fromBytes(validateMessage(signature, 'sig'), format)

    if (sig === false) {
      return false
    }

    try {
      const point = curve.fromBytes(publicKey)

      if (lowS && sig.hasHighS()) {
        return false
      }

      const { r, s } = sig
      const msgHash = bits2intModN(message)
      const sInv = scalarField.inv(s)
      const u1 = scalarField.create(msgHash * sInv)
      const u2 = scalarField.create(r * sInv)

      const u1G = curve.BASE.multiplyUnsafe(u1)
      const u2P = point.multiplyUnsafe(u2)
      const result = u1G.add(u2P)

      if (result.is0()) {
        return false
      }

      return scalarField.create(result.x) === r
    } catch {
      return false
    }
  }

  // Recover public key
  function recoverPublicKey(signature, message, options = {}) {
    const { prehash } = mergeSignatureOptions(options, defaultOptions)
    message = preprocessMessage(message, prehash)

    return Signature.fromBytes(signature, 'recovered')
      .recoverPublicKey(message)
      .toBytes()
  }

  // Parse signature from various formats
  function parseSignature(signature) {
    let sig

    const isString = typeof signature === 'string'
    const isBytes = isUint8Array(signature)
    const isObject =
      !isString &&
      !isBytes &&
      signature !== null &&
      typeof signature === 'object' &&
      typeof signature.r === 'bigint' &&
      typeof signature.s === 'bigint'

    if (!isString && !isBytes && !isObject) {
      throw new Error(
        'invalid signature, expected Uint8Array, hex string or Signature instance'
      )
    }

    if (isObject) {
      sig = new Signature(signature.r, signature.s)
    } else if (isString || isBytes) {
      try {
        sig = Signature.fromBytes(validateMessage(signature, 'sig'), 'der')
      } catch (error) {
        if (!(error instanceof DER.Error)) {
          throw error
        }
      }

      if (!sig) {
        try {
          sig = Signature.fromBytes(
            validateMessage(signature, 'sig'),
            'compact'
          )
        } catch {
          return false
        }
      }
    }

    return sig || false
  }

  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils: ecdhUtils,
    lengths,
    Point: curve,
    sign: signMessage,
    verify: verifySignature,
    recoverPublicKey,
    Signature,
    hash
  })
}

// DER encoding/decoding utilities
export const DER = {
  Error: class DERError extends Error {
    constructor(message = '') {
      super(message)
    }
  },

  _tlv: {
    encode(tag, data) {
      const { Error: DERError } = DER

      if (tag < 0 || tag > 256) {
        throw new DERError('tlv.encode: wrong tag')
      }

      if (data.length & 1) {
        throw new DERError('tlv.encode: unpadded data')
      }

      const dataLength = data.length / 2
      const lengthHex = intToHex(dataLength)

      if ((lengthHex.length / 2) & 128) {
        throw new DERError('tlv.encode: long form length too big')
      }

      const lengthPrefix =
        dataLength > 127 ? intToHex((lengthHex.length / 2) | 128) : ''

      return intToHex(tag) + lengthPrefix + lengthHex + data
    },

    decode(tag, data) {
      const { Error: DERError } = DER
      let offset = 0

      if (tag < 0 || tag > 256) {
        throw new DERError('tlv.encode: wrong tag')
      }

      if (data.length < 2 || data[offset++] !== tag) {
        throw new DERError('tlv.decode: wrong tlv')
      }

      const lengthByte = data[offset++]
      const isLongForm = !!(lengthByte & 128)
      let length = 0

      if (!isLongForm) {
        length = lengthByte
      } else {
        const lengthBytes = lengthByte & 127

        if (!lengthBytes) {
          throw new DERError(
            'tlv.decode(long): indefinite length not supported'
          )
        }

        if (lengthBytes > 4) {
          throw new DERError('tlv.decode(long): byte length is too big')
        }

        const lengthData = data.subarray(offset, offset + lengthBytes)

        if (lengthData.length !== lengthBytes) {
          throw new DERError('tlv.decode(long): length bytes not complete')
        }

        if (lengthData[0] === 0) {
          throw new DERError('tlv.decode(long): zero leftmost byte')
        }

        for (const byte of lengthData) {
          length = (length << 8) | byte
        }

        offset += lengthBytes

        if (length < 128) {
          throw new DERError('tlv.decode(long): not minimal encoding')
        }
      }

      const value = data.subarray(offset, offset + length)

      if (value.length !== length) {
        throw new DERError('tlv.decode: wrong value length')
      }

      return { v: value, l: data.subarray(offset + length) }
    }
  },

  _int: {
    encode(num) {
      const { Error: DERError } = DER

      if (num < POINT_ZERO) {
        throw new DERError('integer: negative integers are not allowed')
      }

      let hex = intToHex(num)

      if (Number.parseInt(hex[0], 16) & 8) {
        hex = `00${hex}`
      }

      if (hex.length & 1) {
        throw new DERError('unexpected DER parsing assertion: unpadded hex')
      }

      return hex
    },

    decode(bytes) {
      const { Error: DERError } = DER

      if (bytes[0] & 128) {
        throw new DERError('invalid signature integer: negative')
      }

      if (bytes[0] === 0 && !(bytes[1] & 128)) {
        throw new DERError(
          'invalid signature integer: unnecessary leading zero'
        )
      }

      return bytesToBigInt(bytes)
    }
  },

  toSig(bytes) {
    const { Error: DERError, _int, _tlv } = DER
    const data = validateMessage(bytes, 'signature')

    const { v: inner, l: remaining } = _tlv.decode(48, data)

    if (remaining.length) {
      throw new DERError('invalid signature: left bytes after parsing')
    }

    const { v: rBytes, l: rRemaining } = _tlv.decode(2, inner)
    const { v: sBytes, l: sRemaining } = _tlv.decode(2, rRemaining)

    if (sRemaining.length) {
      throw new DERError('invalid signature: left bytes after parsing')
    }

    return {
      r: _int.decode(rBytes),
      s: _int.decode(sBytes)
    }
  },

  hexFromSig(signature) {
    const { _tlv, _int } = DER
    const rHex = _tlv.encode(2, _int.encode(signature.r))
    const sHex = _tlv.encode(2, _int.encode(signature.s))
    const inner = rHex + sHex
    return _tlv.encode(48, inner)
  }
}

// Helper functions
function intToHex(num) {
  const hex = num.toString(16)
  return hex.length & 1 ? `0${hex}` : hex
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}

function hexToBytes(hex) {
  if (typeof hex !== 'string') {
    throw new Error(`hex string expected, got ${typeof hex}`)
  }

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

function hexCharToInt(char) {
  if (char >= 48 && char <= 57) return char - 48 // 0-9
  if (char >= 65 && char <= 70) return char - (65 - 10) // A-F
  if (char >= 97 && char <= 102) return char - (97 - 10) // a-f
  return undefined
}

function validateRange(name, value, min, max) {
  if (!isBigIntInRange(value, min, max)) {
    throw new Error(
      `expected valid ${name}: ${min} <= n < ${max}, got ${value}`
    )
  }
}

function isBigIntInRange(value, min, max) {
  return typeof value === 'bigint' && min <= value && value < max
}

function createBitMask(bitLength) {
  return (POINT_ONE << BigInt(bitLength)) - POINT_ONE
}

function isUint8Array(data) {
  return (
    data instanceof Uint8Array ||
    (ArrayBuffer.isView(data) && data.constructor.name === 'Uint8Array')
  )
}

function getRandomBytes(length) {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    return globalThis.crypto.getRandomValues(new Uint8Array(length))
  }

  throw new Error('crypto.getRandomValues must be defined')
}

function createHMAC(hash, key, ...data) {
  const hmac = new HMAC(hash, key)
  return hmac.update(concatArrays(...data)).digest()
}

function createDRBG(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== 'number' || hashLen < 2) {
    throw new Error('hashLen must be a number')
  }

  if (typeof qByteLen !== 'number' || qByteLen < 2) {
    throw new Error('qByteLen must be a number')
  }

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

function _concatArrays(...arrays) {
  let totalLength = 0

  for (const array of arrays) {
    if (!isUint8Array(array)) {
      throw new Error('Uint8Array expected')
    }
    totalLength += array.length
  }

  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const array of arrays) {
    result.set(array, offset)
    offset += array.length
  }

  return result
}

function getCompressedPrefix(isEven) {
  return Uint8Array.of(isEven ? 2 : 3)
}

function _bytesToBigInt(bytes) {
  return BigInt(`0x${bytesToHex(bytes)}`)
}

function _bigIntToBytes(bigint, byteLength) {
  return hexToBytes(bigint.toString(16).padStart(byteLength * 2, '0'))
}

function getByteLength(bigint) {
  const bitLength = bigint.toString(2).length
  return Math.ceil(bitLength / 8)
}

function _getSeedByteLength(order) {
  const byteLength = getByteLength(order)
  return byteLength + Math.ceil(byteLength / 2)
}

// HMAC class (simplified version)
class HMAC {
  constructor(hash, key) {
    this.hash = hash
    this.key = key
    this.inner = null
    this.outer = null
    // Initialize HMAC...
  }

  update(_data) {
    // Update HMAC...
    return this
  }

  digest() {
    // Return digest...
    return new Uint8Array()
  }
}
