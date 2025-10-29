/**
 * Input validation and error handling utilities
 */

// Uint8Array validation
export function isUint8Array(data) {
  return (
    data instanceof Uint8Array ||
    (ArrayBuffer.isView(data) && data.constructor.name === 'Uint8Array')
  )
}

// Positive integer validation
export function validatePositiveInteger(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`positive integer expected, got ${value}`)
  }
}

// Uint8Array validation with optional length check
export function validateUint8Array(data, ...expectedLengths) {
  if (!isUint8Array(data)) {
    throw new Error('Uint8Array expected')
  }

  if (expectedLengths.length > 0 && !expectedLengths.includes(data.length)) {
    throw new Error(
      `Uint8Array expected of length ${expectedLengths}, got length=${data.length}`
    )
  }
}

// Boolean validation with optional field name
export function validateBoolean(value, fieldName = '') {
  if (typeof value !== 'boolean') {
    const field = fieldName && `"${fieldName}"`
    throw new Error(`${field}expected boolean, got type=${typeof value}`)
  }

  return value
}

// Uint8Array validation with length and field name
export function validateUint8ArrayWithLength(
  data,
  expectedLength,
  fieldName = ''
) {
  const isUint8 = isUint8Array(data)
  const actualLength = data?.length
  const hasLength = expectedLength !== undefined

  if (!isUint8 || (hasLength && actualLength !== expectedLength)) {
    const field = fieldName && `"${fieldName}" `
    const lengthStr = hasLength ? ` of length ${expectedLength}` : ''
    const typeStr = isUint8 ? `length=${actualLength}` : `type=${typeof data}`

    throw new Error(`${field}expected Uint8Array${lengthStr}, got ${typeStr}`)
  }

  return data
}

// Hex string or Uint8Array validation with optional length
export function validateHexOrBytes(fieldName, input, expectedLength) {
  let result

  if (typeof input === 'string') {
    try {
      result = hexToBytes(input)
    } catch (error) {
      throw new Error(
        `${fieldName} must be hex string or Uint8Array, cause: ${error}`
      )
    }
  } else if (isUint8Array(input)) {
    result = Uint8Array.from(input)
  } else {
    throw new Error(`${fieldName} must be hex string or Uint8Array`)
  }

  const actualLength = result.length
  if (typeof expectedLength === 'number' && actualLength !== expectedLength) {
    throw new Error(
      `${fieldName} of length ${expectedLength} expected, got ${actualLength}`
    )
  }

  return result
}

// Range validation
export function isInRange(value, min, max) {
  return typeof value === 'bigint' && min <= value && value < max
}

// Range validation with error message
export function validateRange(fieldName, value, min, max) {
  if (!isInRange(value, min, max)) {
    throw new Error(
      `expected valid ${fieldName}: ${min} <= n < ${max}, got ${value}`
    )
  }
}

// Hash function validation
export function validateHash(hash) {
  if (typeof hash !== 'function' || typeof hash.create !== 'function') {
    throw new Error('Hash should be wrapped by utils.createHasher')
  }

  validatePositiveInteger(hash.outputLen)
  validatePositiveInteger(hash.blockLen)
}

// Hash instance validation
export function validateHashInstance(hash, checkFinished = true) {
  if (hash.destroyed) {
    throw new Error('Hash instance has been destroyed')
  }

  if (checkFinished && hash.finished) {
    throw new Error('Hash#digest() has already been called')
  }
}

// Digest buffer validation
export function validateDigestBuffer(buffer, hash) {
  validateUint8Array(buffer)
  const expectedLength = hash.outputLen

  if (buffer.length < expectedLength) {
    throw new Error(
      `digestInto() expects output buffer of length at least ${expectedLength}`
    )
  }
}

// Field element validation
export function validateFieldElement(value, field) {
  if (typeof value !== 'bigint') {
    throw new Error(
      `invalid field element: expected bigint, got ${typeof value}`
    )
  }

  return field.isValid(value)
}

// Point validation
export function validatePoint(point, PointClass) {
  if (!(point instanceof PointClass)) {
    throw new Error('ProjectivePoint expected')
  }
}

// Array validation
export function validateArray(array, expectedType, itemName = 'array') {
  if (!Array.isArray(array)) {
    throw new Error(`${itemName} expected`)
  }

  array.forEach((item, index) => {
    if (!(item instanceof expectedType)) {
      throw new Error(`invalid ${itemName.slice(0, -1)} at index ${index}`)
    }
  })
}

// Scalar array validation
export function validateScalarArray(array, field, itemName = 'scalars') {
  if (!Array.isArray(array)) {
    throw new Error(`array of ${itemName} expected`)
  }

  array.forEach((scalar, index) => {
    if (!field.isValid(scalar)) {
      throw new Error(`invalid scalar at index ${index}`)
    }
  })
}

// Options object validation
export function validateOptions(options, required, optional = {}) {
  if (!options || typeof options !== 'object') {
    throw new Error('expected valid options object')
  }

  function validateField(fieldName, expectedType, isOptional) {
    const value = options[fieldName]

    if (isOptional && value === undefined) {
      return
    }

    const actualType = typeof value

    if (actualType !== expectedType || value === null) {
      throw new Error(
        `param "${fieldName}" is invalid: expected ${expectedType}, got ${actualType}`
      )
    }
  }

  // Validate required fields
  Object.entries(required).forEach(([fieldName, expectedType]) => {
    validateField(fieldName, expectedType, false)
  })

  // Validate optional fields
  Object.entries(optional).forEach(([fieldName, expectedType]) => {
    validateField(fieldName, expectedType, true)
  })
}

// Curve parameters validation
export function validateCurveParams(curve, curveType) {
  if (!curve || typeof curve !== 'object') {
    throw new Error(`expected valid ${curveType} CURVE object`)
  }

  // Check required parameters
  for (const param of ['p', 'n', 'h']) {
    const value = curve[param]
    if (!(typeof value === 'bigint' && value > 0)) {
      throw new Error(`CURVE.${param} must be positive bigint`)
    }
  }

  return curve
}

// Window size validation
export function validateWindowSize(windowSize, maxBits) {
  if (
    !Number.isSafeInteger(windowSize) ||
    windowSize <= 0 ||
    windowSize > maxBits
  ) {
    throw new Error(
      `invalid window size, expected [1..${maxBits}], got W=${windowSize}`
    )
  }
}

// Signature format validation
export function validateSignatureFormat(format) {
  if (!['compact', 'recovered', 'der'].includes(format)) {
    throw new Error('Signature format must be "compact", "recovered", or "der"')
  }

  return format
}

// Message validation
export function validateMessage(message, fieldName = 'message') {
  return validateHexOrBytes(fieldName, message)
}

// Private key validation
export function validatePrivateKey(privateKey, field) {
  const { BYTES } = field
  let scalar

  if (typeof privateKey === 'bigint') {
    scalar = privateKey
  } else {
    const bytes = validateHexOrBytes('private key', privateKey)
    try {
      scalar = field.fromBytes(bytes)
    } catch (_error) {
      throw new Error(
        `invalid private key: expected ui8a of size ${BYTES}, got ${typeof privateKey}`
      )
    }
  }

  if (!field.isValidNot0(scalar)) {
    throw new Error('invalid private key: out of range [1..N-1]')
  }

  return scalar
}

// Public key validation
export function validatePublicKey(
  publicKey,
  pointClass,
  _allowCompressed = true
) {
  const bytes = validateMessage(publicKey, 'publicKey')
  return pointClass.fromBytes(bytes)
}

// Nonce validation
export function validateNonce(nonce) {
  if (typeof nonce !== 'string' || nonce.length === 0) {
    throw new Error('nonce must be non-empty string')
  }

  return nonce
}

// URL validation
export function validateUrl(url, schemes = ['http:', 'https:']) {
  try {
    const parsed = new URL(url)
    if (!schemes.includes(parsed.protocol)) {
      throw new Error(
        `URL must use one of these schemes: ${schemes.join(', ')}`
      )
    }
    return parsed
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`)
  }
}

// Room ID validation
export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    throw new Error('roomId must be non-empty string')
  }

  return roomId
}

// App ID validation
export function validateAppId(config) {
  if (!config || !config.appId) {
    throw new Error('appId missing')
  }

  return config.appId
}

// Configuration validation
export function validateConfig(config, requiredFields = []) {
  if (!config || typeof config !== 'object') {
    throw new Error('config required')
  }

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`${field} required`)
    }
  }

  return config
}

// Hex string validation (helper function)
export function hexToBytes(hex) {
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

// Helper function to convert hex character to integer
function hexCharToInt(char) {
  if (char >= 48 && char <= 57) return char - 48 // 0-9
  if (char >= 65 && char <= 70) return char - (65 - 10) // A-F
  if (char >= 97 && char <= 102) return char - (97 - 10) // a-f
  return undefined
}
