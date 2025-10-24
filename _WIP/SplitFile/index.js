/**
 * GenosRTC - Main entry point
 *
 * A WebRTC library with Nostr signaling support
 * Provides peer-to-peer communication capabilities
 */

// Export communication components
export { createDataChannelManager } from './communication/datachannel.js'
export {
  createWeierstrassCurve,
  normalizePoints,
  PointMultiplier
} from './crypto/curve.js'
export {
  batchInvert,
  createField,
  fastPow,
  invert,
  mod,
  validateField
} from './crypto/field.js'
export {
  Hash,
  HMAC,
  SHA2,
  SHA256
} from './crypto/hashing.js'
// Export cryptographic utilities
export {
  bytesToHex,
  concatArrays,
  createHashWrapper,
  getRandomBytes,
  hexToBytes,
  hmac,
  normalizeInput,
  sha256,
  stringToBytes
} from './crypto/utils.js'
export {
  getPublicKey,
  keygen,
  randomPrivateKey,
  schnorrSign,
  schnorrVerify
} from './keys/keygen.js'
// Export key management
export {
  createECDH,
  createECDSA,
  createWeierstrassCurve as createSecp256k1,
  DER
} from './keys/secp256k1.js'
// Legacy exports for backward compatibility
export {
  createNostrEvent,
  createNostrSubscription,
  getNostrRelay,
  getRelaySockets,
  getRelaySockets,
  getRelaySockets as DJ,
  NOSTR_EVENT,
  NOSTR_KINDS,
  nostrSignaling,
  nostrSignaling as join,
  nostrSignaling as MJ,
  parseNostrMessage,
  selfId as N0
} from './network/nostr.js'
// Export network components
export { createWebSocketManager } from './network/websocket.js'
// Export core constants and utilities
export {
  AES_GCM,
  APP_NAME,
  DEFAULT_NOSTR_RELAYS,
  DEFAULT_STUN_SERVERS,
  SELF_ID
} from './utils/constants.js'
// Main API exports
export {
  bytesToHex,
  createError,
  decodeText,
  encodeText,
  isBrowser,
  parseJson,
  promiseAll,
  randomString,
  selfId,
  selfId as SELF_ID,
  stringifyJson
} from './utils/helpers.js'
export {
  validateBoolean,
  validateMessage,
  validatePositiveInteger,
  validatePrivateKey,
  validatePublicKey,
  validateUint8Array
} from './utils/validation.js'
// Export WebRTC components
export {
  createConnectionFactory,
  createRTCPeerConnection,
  createSafeRTCConfiguration,
  validateRTCConfiguration
} from './webrtc/connection.js'
