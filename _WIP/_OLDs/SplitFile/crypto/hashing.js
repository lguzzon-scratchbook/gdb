/**
 * Cryptographic hashing implementations
 */

import {
  clearArray,
  createDataView,
  createHashWrapper,
  rotl,
  setBigUint64,
  validateDigestBuffer,
  validateHash,
  validateHashInstance
} from './utils.js'

// Base hash class
export class Hash {
  constructor() {
    if (this.constructor === Hash) {
      throw new Error(
        'Hash is an abstract class and cannot be instantiated directly'
      )
    }
  }

  // Abstract methods to be implemented by subclasses
  update(_data) {
    throw new Error('update() must be implemented by subclass')
  }

  digest() {
    throw new Error('digest() must be implemented by subclass')
  }

  digestInto(_buffer) {
    throw new Error('digestInto() must be implemented by subclass')
  }

  // Common methods
  clone() {
    throw new Error('clone() must be implemented by subclass')
  }

  destroy() {
    throw new Error('destroy() must be implemented by subclass')
  }
}

// SHA-2 base implementation
export class SHA2 extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super()

    this.finished = false
    this.length = 0
    this.pos = 0
    this.destroyed = false
    this.blockLen = blockLen
    this.outputLen = outputLen
    this.padOffset = padOffset
    this.isLE = isLE
    this.buffer = new Uint8Array(blockLen)
    this.view = createDataView(this.buffer)
  }

  update(data) {
    validateHashInstance(this)
    data = normalizeInput(data)
    validateUint8Array(data)

    const { view, buffer, blockLen } = this
    const dataLength = data.length

    for (let offset = 0; offset < dataLength; ) {
      const chunkSize = Math.min(blockLen - this.pos, dataLength - offset)

      if (chunkSize === blockLen) {
        // Process full blocks directly
        const dataView = createDataView(data)
        for (; blockLen <= dataLength - offset; offset += blockLen) {
          this.process(dataView, offset)
        }
        continue
      }

      // Copy partial block
      buffer.set(data.subarray(offset, offset + chunkSize), this.pos)
      this.pos += chunkSize
      offset += chunkSize

      // Process block if full
      if (this.pos === blockLen) {
        this.process(view, 0)
        this.pos = 0
      }
    }

    this.length += data.length
    this.roundClean()
    return this
  }

  digestInto(buffer) {
    validateHashInstance(this, false)
    validateDigestBuffer(buffer, this)
    this.finished = true

    const { buffer: stateBuffer, view, blockLen, isLE } = this
    let { pos } = this

    // Add padding
    stateBuffer[pos++] = 128
    clearArray(stateBuffer.subarray(pos))

    // Process additional block if needed
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0)
      pos = 0
    }

    // Zero remaining bytes
    for (let i = pos; i < blockLen; i++) {
      stateBuffer[i] = 0
    }

    // Add length
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE)
    this.process(view, 0)

    // Copy result
    const resultView = createDataView(buffer)
    const outputLen = this.outputLen

    if (outputLen % 4) {
      throw new Error('_sha2: outputLen should be aligned to 32bit')
    }

    const stateLength = outputLen / 4
    const state = this.get()

    if (stateLength > state.length) {
      throw new Error('_sha2: outputLen bigger than state')
    }

    for (let i = 0; i < stateLength; i++) {
      resultView.setUint32(4 * i, state[i], isLE)
    }
  }

  digest() {
    const { buffer, outputLen } = this
    this.digestInto(buffer)
    const result = buffer.slice(0, outputLen)
    this.destroy()
    return result
  }

  _cloneInto(to) {
    if (!to) {
      to = new this.constructor()
    }
    to.set(...this.get())

    const { blockLen, buffer, length, finished, destroyed, pos } = this

    to.destroyed = destroyed
    to.finished = finished
    to.length = length
    to.pos = pos

    if (length % blockLen) {
      to.buffer.set(buffer)
    }

    return to
  }

  clone() {
    return this._cloneInto()
  }

  // Abstract methods to be implemented by subclasses
  get() {
    throw new Error('get() must be implemented by subclass')
  }

  set(..._state) {
    throw new Error('set() must be implemented by subclass')
  }

  process(_view, _offset) {
    throw new Error('process() must be implemented by subclass')
  }

  roundClean() {
    // Optional cleanup after each round
  }
}

// SHA-256 implementation
export class SHA256 extends SHA2 {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false)

    // Initialize state
    this.A = SHA256_IV[0] | 0
    this.B = SHA256_IV[1] | 0
    this.C = SHA256_IV[2] | 0
    this.D = SHA256_IV[3] | 0
    this.E = SHA256_IV[4] | 0
    this.F = SHA256_IV[5] | 0
    this.G = SHA256_IV[6] | 0
    this.H = SHA256_IV[7] | 0
  }

  get() {
    const { A, B, C, D, E, F, G, H } = this
    return [A, B, C, D, E, F, G, H]
  }

  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0
    this.B = B | 0
    this.C = C | 0
    this.D = D | 0
    this.E = E | 0
    this.F = F | 0
    this.G = G | 0
    this.H = H | 0
  }

  process(view, offset) {
    // Load message schedule
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA256_W[i] = view.getUint32(offset, false)
    }

    // Extend message schedule
    for (let i = 16; i < 64; i++) {
      const sigma0 = SHA256_W[i - 15]
      const sigma1 = SHA256_W[i - 2]
      const gamma0 = rotl(sigma0, 7) ^ rotl(sigma0, 18) ^ (sigma0 >>> 3)
      const gamma1 = rotl(sigma1, 17) ^ rotl(sigma1, 19) ^ (sigma1 >>> 10)
      SHA256_W[i] = (gamma1 + SHA256_W[i - 7] + gamma0 + SHA256_W[i - 16]) | 0
    }

    // Initialize working variables
    let { A: a, B: b, C: c, D: d, E: e, F: f, G: g, H: h } = this

    // Compression function
    for (let i = 0; i < 64; i++) {
      const S1 = rotl(e, 6) ^ rotl(e, 11) ^ rotl(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + SHA256_K[i] + SHA256_W[i]) | 0
      const S0 = rotl(a, 2) ^ rotl(a, 13) ^ rotl(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) | 0

      h = g
      g = f
      f = e
      e = (d + temp1) | 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) | 0
    }

    // Update state
    a = (a + this.A) | 0
    b = (b + this.B) | 0
    c = (c + this.C) | 0
    d = (d + this.D) | 0
    e = (e + this.E) | 0
    f = (f + this.F) | 0
    g = (g + this.G) | 0
    h = (h + this.H) | 0

    this.set(a, b, c, d, e, f, g, h)
  }

  roundClean() {
    clearArray(SHA256_W)
  }

  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0)
    clearArray(this.buffer)
  }
}

// HMAC implementation
export class HMAC extends Hash {
  constructor(hash, key) {
    super()

    validateHash(hash)
    this.finished = false
    this.destroyed = false

    const keyBytes = normalizeInput(key)

    if (typeof hash.create !== 'function') {
      throw new Error('Expected instance of class which extends utils.Hash')
    }

    this.iHash = hash.create()
    this.blockLen = this.iHash.blockLen
    this.outputLen = this.iHash.outputLen

    const blockLen = this.blockLen
    const ipad = new Uint8Array(blockLen)

    // Prepare key
    const keyToUse =
      keyBytes.length > blockLen
        ? hash.create().update(keyBytes).digest()
        : keyBytes

    ipad.set(keyToUse)

    // Create inner and outer hash pads
    for (let i = 0; i < ipad.length; i++) {
      ipad[i] ^= 54
    }

    this.iHash.update(ipad)
    this.oHash = hash.create()

    for (let i = 0; i < ipad.length; i++) {
      ipad[i] ^= 54 ^ 92
    }

    this.oHash.update(ipad)
    clearArray(ipad)
  }

  update(data) {
    validateHashInstance(this)
    return this.iHash.update(data)
  }

  digestInto(buffer) {
    validateHashInstance(this, false)
    validateUint8Array(buffer, this.outputLen)
    this.finished = true

    this.iHash.digestInto(buffer)
    this.oHash.update(buffer)
    this.oHash.digestInto(buffer)
    this.destroy()
  }

  digest() {
    const result = new Uint8Array(this.oHash.outputLen)
    this.digestInto(result)
    return result
  }

  _cloneInto(to) {
    if (!to) {
      to = Object.create(Object.getPrototypeOf(this), {})
    }

    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this

    to.finished = finished
    to.destroyed = destroyed
    to.blockLen = blockLen
    to.outputLen = outputLen
    to.oHash = oHash._cloneInto(to.oHash)
    to.iHash = iHash._cloneInto(to.iHash)

    return to
  }

  clone() {
    return this._cloneInto()
  }

  destroy() {
    this.destroyed = true
    this.oHash.destroy()
    this.iHash.destroy()
  }
}

// SHA-256 constants
export const SHA256_IV = Uint32Array.from([
  1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924,
  528734635, 1541459225
])

export const SHA256_K = Uint32Array.from([
  1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993,
  2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987,
  1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
  264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
  2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711,
  113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
  1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
  3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
  430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063,
  1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474,
  2756734187, 3204031479, 3329325298
])

export const SHA256_W = new Uint32Array(64)

// Helper functions
export const sha256 = createHashWrapper(() => new SHA256())

export function hmac(hash, key, ...data) {
  return new HMAC(hash, key).update(concatArrays(...data)).digest()
}

hmac.create = (hash, key) => new HMAC(hash, key)

// Re-export utilities for convenience
export {
  clearArray,
  concatArrays,
  normalizeInput,
  validateUint8Array
} from './utils.js'
