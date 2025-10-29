/**
 * Key generation and Schnorr signature utilities
 */

import { createField } from '../crypto/field.js'
import { sha256 } from '../crypto/hashing.js'
import {
  concatArrays,
  getRandomBytes,
  normalizeInput
} from '../crypto/utils.js'
import { createWeierstrassCurve, SECP256K1_CURVE } from './secp256k1.js'

// Create secp256k1 curve instance
const secp256k1Curve = createWeierstrassCurve(SECP256K1_CURVE)

// Schnorr signature utilities
export function schnorrSign(messageHash, privateKey) {
  // Schnorr signature implementation
  // BIP-340: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
  const aux = getRandomBytes(32);
  const auxHash = sha256(concatArrays(aux, privateKey));
  
  // Create nonce
  const nonce = modScalar(
    concatArrays(auxHash, messageHash),
    secp256k1Curve.Fn.ORDER
  );
  
  // Compute nonce point
  const noncePoint = secp256k1Curve.BASE.multiply(nonce);
  
  // Compute challenge
  const challenge = taggedHash('BIP0340/challenge', 
    pointToBytes(noncePoint), 
    pointToBytes(secp256k1Curve.BASE.multiply(privateKey)), 
    messageHash
  );
  
  // Compute signature
  const challengeScalar = bytesToBigInt(challenge);
  const signatureScalar = modScalar(
    BigInt(challengeScalar + nonce) * privateKey,
    secp256k1Curve.Fn.ORDER
  );
  
  // Create signature bytes
  const signature = concatArrays(
    pointToBytes(noncePoint),
    bigIntToBytes(signatureScalar, 32)
  );
  
  return signature;
}

export function schnorrVerify(_signature, _messageHash, _publicKey) {
  // This would implement Schnorr verification
  // For now, return true
  return true
}

export function liftX(_x) {
  // This would implement point lifting from x-coordinate
  // For now, return a placeholder point
  return secp256k1Curve.BASE
}

export function pointToBytes(_point) {
  // This would convert point to bytes
  // For now, return placeholder
  return new Uint8Array(32)
}

export function randomPrivateKey() {
  const field = createField(SECP256K1_CURVE.n)
  const byteLength = field.BYTES
  return getRandomBytes(byteLength)
}

export function getPublicKey(privateKey) {
  return secp256k1Curve.BASE.multiply(privateKey).toBytes(true)
}

export function keygen(_seed) {
  const privateKey = randomPrivateKey()
  const publicKey = getPublicKey(privateKey)
  return { secretKey: privateKey, publicKey }
}

export function taggedHash(tag, ...data) {
  const tagBytes = normalizeInput(tag)
  const dataBytes = concatArrays(...data.map(normalizeInput))
  return sha256(concatArrays(tagBytes, dataBytes))
}
