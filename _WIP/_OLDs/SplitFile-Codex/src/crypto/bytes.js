import { encodeText } from '../utils/encoding.js'

export const systemCrypto =
  typeof globalThis === 'object' && 'crypto' in globalThis
    ? globalThis.crypto
    : undefined

export const isUint8Array = (value) =>
  value instanceof Uint8Array ||
  (ArrayBuffer.isView(value) && value.constructor.name === 'Uint8Array')

export const assertUint8Array = (value, ...expectedLengths) => {
  if (!isUint8Array(value)) {
    throw new Error('Uint8Array expected')
  }
  if (expectedLengths.length > 0 && !expectedLengths.includes(value.length)) {
    throw new Error(
      `Uint8Array expected of length ${expectedLengths}, got length=${value.length}`
    )
  }
}

export const assertPositiveInteger = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`positive integer expected, got ${value}`)
  }
}

export const ensureBytes = (data) => {
  if (typeof data === 'string') {
    return encodeText(data)
  }
  assertUint8Array(data)
  return data
}

export const concatBytes = (...items) => {
  let total = 0
  for (const item of items) {
    assertUint8Array(item)
    total += item.length
  }
  const result = new Uint8Array(total)
  for (let offset = 0, index = 0; index < items.length; index += 1) {
    const item = items[index]
    result.set(item, offset)
    offset += item.length
  }
  return result
}

export const zeroize = (...views) => {
  for (const view of views) {
    view.fill(0)
  }
}

export const createView = (bytes) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

export const setBigUint64 = (view, offset, value, isLittleEndian) => {
  if (typeof view.setBigUint64 === 'function') {
    view.setBigUint64(offset, value, isLittleEndian)
    return
  }
  const shift = BigInt(32)
  const mask = BigInt(0xffffffff)
  const high = Number((value >> shift) & mask)
  const low = Number(value & mask)
  const highOffset = isLittleEndian ? 4 : 0
  const lowOffset = isLittleEndian ? 0 : 4
  view.setUint32(offset + highOffset, high, isLittleEndian)
  view.setUint32(offset + lowOffset, low, isLittleEndian)
}

export const randomBytes = (length = 32) => {
  if (systemCrypto && typeof systemCrypto.getRandomValues === 'function') {
    return systemCrypto.getRandomValues(new Uint8Array(length))
  }
  if (systemCrypto && typeof systemCrypto.randomBytes === 'function') {
    return Uint8Array.from(systemCrypto.randomBytes(length))
  }
  throw new Error('crypto.getRandomValues must be defined')
}

export const ensureHashConstructor = (hash) => {
  if (typeof hash !== 'function' || typeof hash.create !== 'function') {
    throw new Error('Hash should be wrapped by utils.createHasher')
  }
  assertPositiveInteger(hash.outputLen)
  assertPositiveInteger(hash.blockLen)
}

export const assertHashInstance = (hashInstance, requireNotFinished = true) => {
  if (hashInstance.destroyed) {
    throw new Error('Hash instance has been destroyed')
  }
  if (requireNotFinished && hashInstance.finished) {
    throw new Error('Hash#digest() has already been called')
  }
}

export const assertDigestBuffer = (buffer, hash) => {
  assertUint8Array(buffer)
  const { outputLen } = hash
  if (buffer.length < outputLen) {
    throw new Error(
      `digestInto() expects output buffer of length at least ${outputLen}`
    )
  }
}

export const ensureHashInterface = (factory) => {
  const hashInstance = factory()
  return Object.assign(
    (...args) => factory().update(ensureBytes(args[0])).digest(),
    {
      outputLen: hashInstance.outputLen,
      blockLen: hashInstance.blockLen,
      create: factory
    }
  )
}
