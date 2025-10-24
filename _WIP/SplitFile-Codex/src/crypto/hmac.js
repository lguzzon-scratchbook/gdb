import {
  assertHashInstance,
  assertUint8Array,
  ensureBytes,
  ensureHashConstructor,
  zeroize
} from './bytes.js'
import { Hash } from './hash.js'

export class Hmac extends Hash {
  constructor(hash, key) {
    super()
    ensureHashConstructor(hash)
    const secret = ensureBytes(key)
    this.inner = hash.create()
    if (typeof this.inner.update !== 'function') {
      throw new Error('Expected instance of class which extends utils.Hash')
    }
    this.outer = hash.create()
    this.blockLen = this.inner.blockLen
    this.outputLen = this.inner.outputLen
    this.finished = false
    this.destroyed = false
    const block = new Uint8Array(this.blockLen)
    if (secret.length > this.blockLen) {
      block.set(hash.create().update(secret).digest())
    } else {
      block.set(secret)
    }
    for (let index = 0; index < block.length; index += 1) {
      block[index] ^= 0x36
    }
    this.inner.update(block)
    for (let index = 0; index < block.length; index += 1) {
      block[index] ^= 0x36 ^ 0x5c
    }
    this.outer.update(block)
    zeroize(block)
  }

  update(data) {
    assertHashInstance(this)
    this.inner.update(data)
    return this
  }

  digestInto(buffer) {
    assertHashInstance(this)
    assertUint8Array(buffer, this.outputLen)
    this.finished = true
    this.inner.digestInto(buffer)
    this.outer.update(buffer)
    this.outer.digestInto(buffer)
    this.destroy()
  }

  digest() {
    const out = new Uint8Array(this.outer.outputLen)
    this.digestInto(out)
    return out
  }

  _cloneInto(target) {
    if (!target) {
      target = Object.create(Object.getPrototypeOf(this))
    }
    target.finished = this.finished
    target.destroyed = this.destroyed
    target.blockLen = this.blockLen
    target.outputLen = this.outputLen
    target.outer = this.outer._cloneInto(target.outer)
    target.inner = this.inner._cloneInto(target.inner)
    return target
  }

  destroy() {
    this.destroyed = true
    this.outer.destroy()
    this.inner.destroy()
  }
}

export const hmac = (hash, key, message) =>
  new Hmac(hash, key).update(message).digest()

hmac.create = (hash, key) => new Hmac(hash, key)
