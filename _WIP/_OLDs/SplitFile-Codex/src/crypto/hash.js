import {
  assertDigestBuffer,
  assertHashInstance,
  assertUint8Array,
  createView,
  ensureBytes,
  ensureHashConstructor,
  ensureHashInterface,
  setBigUint64,
  zeroize
} from './bytes.js'

export class Hash {
  clone() {
    return this._cloneInto()
  }
}

class SHA2 extends Hash {
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
    this.view = createView(this.buffer)
  }

  update(data) {
    assertHashInstance(this)
    const message = ensureBytes(data)
    assertUint8Array(message)
    const { view, buffer, blockLen } = this
    const length = message.length
    let offset = 0
    while (offset < length) {
      const remaining = Math.min(blockLen - this.pos, length - offset)
      if (remaining === blockLen && this.pos === 0) {
        const messageView = createView(message)
        for (; blockLen <= length - offset; offset += blockLen) {
          this.process(messageView, offset)
        }
        continue
      }
      buffer.set(message.subarray(offset, offset + remaining), this.pos)
      this.pos += remaining
      offset += remaining
      if (this.pos === blockLen) {
        this.process(view, 0)
        this.pos = 0
      }
    }
    this.length += message.length
    this.roundClean()
    return this
  }

  digestInto(buffer) {
    assertHashInstance(this)
    assertDigestBuffer(buffer, this)
    this.finished = true
    const { buffer: internal, view, blockLen, isLE } = this
    let { pos } = this
    internal[pos++] = 0x80
    if (pos > blockLen - this.padOffset) {
      zeroize(internal.subarray(pos))
      this.process(view, 0)
      pos = 0
    }
    for (let index = pos; index < blockLen - 8; index += 1) {
      internal[index] = 0
    }
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE)
    this.process(view, 0)
    const outView = createView(buffer)
    const outputLenWords = this.outputLen / 4
    const state = this.get()
    if (outputLenWords > state.length) {
      throw new Error('_sha2: outputLen bigger than state')
    }
    for (let index = 0; index < outputLenWords; index += 1) {
      outView.setUint32(4 * index, state[index], isLE)
    }
  }

  digest() {
    const buffer = new Uint8Array(this.outputLen)
    this.digestInto(buffer)
    this.destroy()
    return buffer
  }

  destroy() {
    this.destroyed = true
    zeroize(this.buffer)
  }

  roundClean() {}
}

const rotr = (value, shift) =>
  ((value >>> shift) | (value << (32 - shift))) >>> 0

const iv = Uint32Array.from([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19
])

const K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
])

const W = new Uint32Array(64)

const Ch = (x, y, z) => (x & y) ^ (~x & z)
const Maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z)

class SHA256 extends SHA2 {
  constructor() {
    super(64, 32, 8, false)
    this.set(...iv)
  }

  get() {
    const { a, b, c, d, e, f, g, h } = this
    return [a, b, c, d, e, f, g, h]
  }

  set(a, b, c, d, e, f, g, h) {
    this.a = a | 0
    this.b = b | 0
    this.c = c | 0
    this.d = d | 0
    this.e = e | 0
    this.f = f | 0
    this.g = g | 0
    this.h = h | 0
  }

  process(view, offset) {
    for (let i = 0; i < 16; i += 1, offset += 4) {
      W[i] = view.getUint32(offset, false)
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3)
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10)
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
    }
    let { a, b, c, d, e, f, g, h } = this
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const temp1 = (h + S1 + Ch(e, f, g) + K[i] + W[i]) | 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const temp2 = (S0 + Maj(a, b, c)) | 0
      h = g
      g = f
      f = e
      e = (d + temp1) | 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) | 0
    }
    this.set(
      (this.a + a) | 0,
      (this.b + b) | 0,
      (this.c + c) | 0,
      (this.d + d) | 0,
      (this.e + e) | 0,
      (this.f + f) | 0,
      (this.g + g) | 0,
      (this.h + h) | 0
    )
  }

  roundClean() {
    zeroize(W)
  }

  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0)
    super.destroy()
  }
}

export const sha256 = ensureHashInterface(() => new SHA256())
sha256.blockLen = 64
sha256.outputLen = 32
sha256.create = () => new SHA256()

ensureHashConstructor(sha256)

export { SHA256 }
