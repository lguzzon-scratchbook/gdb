/**
 * Application constants and configuration values
 */

// Cryptographic constants
export const AES_GCM = 'AES-GCM'

// Application identifiers
export const APP_NAME = 'GenosRTC'
export const SELF_ID = 'selfId'

// WebRTC constants
export const ICE_GATHERING_TIMEOUT = 5000
export const ICE_GATHERING_STATE_CHANGE = 'icegatheringstatechange'
export const OFFER_TYPE = 'offer'
export const ANSWER_TYPE = 'answer'

// Default STUN servers
export const DEFAULT_STUN_SERVERS = [
  ...Array.from(
    { length: 3 },
    (_, i) => `stun:stun${i || ''}.l.google.com:19302`
  ),
  'stun:stun.cloudflare.com:3478'
].map((urls) => ({ urls }))

// Data channel constants
export const ACTION_TYPE_BYTES = 12
export const MAX_CHUNK_SIZE = 16384 - 33 // 33 bytes for header
export const MAX_CHUNKS = 100
export const MAX_SEND_RETRIES = 3
export const RETRY_DELAY = 200

// Network constants
export const MAX_CONNECTIONS = 20
export const ANNOUNCE_INTERVAL = 5333
export const CONNECTION_CLEANUP_INTERVAL = 57333
export const RECONNECT_DELAY = 3333
export const RELAY_REDUNDANCY = 5

// Nostr protocol constants
export const NOSTR_EVENT = 'EVENT'
export const NOSTR_NOTICE = 'NOTICE'
export const NOSTR_OK = 'OK'
export const NOSTR_REQ = 'REQ'
export const NOSTR_CLOSE = 'CLOSE'
export const NOSTR_POW_REGEX = /pow:\s*(\d+)\s*bits needed\.?/i

// Nostr default relays
export const DEFAULT_NOSTR_RELAYS = [
  'wss://black.nostrcity.club',
  'wss://eu.purplerelay.com',
  'wss://ftp.halifax.rwth-aachen.de/nostr',
  'wss://nostr.cool110.xyz',
  'wss://nostr.data.haus',
  'wss://nostr.mom',
  'wss://nostr.oxtr.dev',
  'wss://nostr.sathoarder.com',
  'wss://nostr.vulpem.com',
  'wss://relay.agorist.space',
  'wss://relay.binaryrobot.com',
  'wss://relay.fountain.fm',
  'wss://relay.mostro.network',
  'wss://relay.nostraddress.com',
  'wss://relay.nostrdice.com',
  'wss://relay.nostromo.social',
  'wss://relay.oldenburg.cool',
  'wss://relay.snort.social',
  'wss://relay.verified-nostr.com',
  'wss://sendit.nosflare.com',
  'wss://yabu.me/v2',
  'wss://relay.damus.io'
]

// Message protocol constants
export const MESSAGE_PREFIX = '@_'
export const PAYLOAD_SEPARATOR = '$'
export const CHUNK_SEPARATOR = ','

// BigInt constants for cryptographic operations
export const BIGINT_ZERO = BigInt(0)
export const BIGINT_ONE = BigInt(1)
export const BIGINT_TWO = BigInt(2)
export const BIGINT_THREE = BigInt(3)
export const BIGINT_FOUR = BigInt(4)
export const BIGINT_FIVE = BigInt(5)
export const BIGINT_SEVEN = BigInt(7)
export const BIGINT_EIGHT = BigInt(8)
export const BIGINT_NINE = BigInt(9)
export const BIGINT_SIXTEEN = BigInt(16)

// secp256k1 curve parameters
export const SECP256K1_PARAMS = {
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

// Endomorphism parameters for secp256k1
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

// Schnorr signature constants
export const SCHNORR_ZERO = BigInt(0)
export const SCHNORR_ONE = BigInt(1)
export const SCHNORR_TWO = BigInt(2)
