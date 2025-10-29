/**
 * Key generation and Schnorr signature utilities - Complete Implementation
 */

import { createField } from '../crypto/field.js';
import { sha256 } from '../crypto/hashing.js';
import {
  concatArrays,
  getRandomBytes,
  normalizeInput,
  bigIntToBytes,
  bytesToBigInt
} from '../crypto/utils.js';
import { createWeierstrassCurve, SECP256K1_CURVE } from './secp256k1.js';

// Create secp256k1 curve instance
const secp256k1Curve = createWeierstrassCurve(SECP256K1_CURVE);

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

export function schnorrVerify(signature, messageHash, publicKey) {
  // Schnorr verification implementation
  if (signature.length !== 64) {
    return false;
  }
  
  const nonceBytes = signature.subarray(0, 32);
  const signatureBytes = signature.subarray(32, 64);
  
  // Recreate nonce point
  let noncePoint;
  try {
    noncePoint = secp256k1Curve.fromBytes(nonceBytes);
  } catch {
    return false;
  }
  
  // Compute challenge
  const challenge = taggedHash('BIP0340/challenge', 
    nonceBytes, 
    pointToBytes(secp256k1Curve.BASE.multiply(publicKey)), 
    messageHash
  );
  
  // Verify signature
  const challengeScalar = bytesToBigInt(challenge);
  const signatureScalar = bytesToBigInt(signatureBytes);
  
  // Compute expected nonce
  const expectedNonce = modScalar(
    challengeScalar - bytesToBigInt(signatureBytes),
    secp256k1Curve.Fn.ORDER
  );
  
  // Verify nonce point matches expected
  const expectedNoncePoint = secp256k1Curve.BASE.multiply(expectedNonce);
  
  return secp256k1Curve.equals(noncePoint, expectedNoncePoint);
}

export function liftX(x) {
  // Point lifting from x-coordinate for secp256k1
  // y² = x³ + 7 (mod p)
  const xSquared = secp256k1Curve.Fp.sqr(x);
  const xCubed = secp256k1Curve.Fp.mul(xSquared, x);
  const ySquared = secp256k1Curve.Fp.add(
    secp256k1Curve.Fp.add(xCubed, secp256k1Curve.Fp.mul(x, secp256k1Curve.CURVE.a)), 
    secp256k1Curve.CURVE.b
  );
  
  const y = secp256k1Curve.Fp.sqrt(ySquared);
  if (!secp256k1Curve.Fp.isValid(y)) {
    throw new Error('Cannot find square root');
  }
  
  return secp256k1Curve.fromAffine({ x, y });
}

export function pointToBytes(point) {
  // Convert point to bytes (compressed format)
  const { x, y } = point.toAffine();
  const xBytes = secp256k1Curve.Fp.toBytes(x);
  const prefix = secp256k1Curve.Fp.isOdd(y) ? 2 : 3;
  return concatArrays(Uint8Array.of(prefix), xBytes);
}

// Keep the rest of the file unchanged
export { randomPrivateKey, getPublicKey, keygen } from './keygen.js';
