import { range } from './array.js'

export const APP_NAME = 'GenosRTC'

export const ICE_GATHERING_TIMEOUT_MS = 5000
export const ICE_GATHERING_EVENT = 'icegatheringstatechange'
export const SDP_TYPE_OFFER = 'offer'
export const SDP_TYPE_ANSWER = 'answer'

export const DEFAULT_STUN_SERVERS = [
  ...range(3, (_value, index) => `stun:stun${index || ''}.l.google.com:19302`),
  'stun:stun.cloudflare.com:3478'
].map((urls) => ({ urls }))

export const BUFFER_LOW_EVENT = 'bufferedamountlow'
export const CHUNK_HEADER_TYPE_LENGTH = 12
export const CHUNK_HEADER_NONCE_OFFSET = CHUNK_HEADER_TYPE_LENGTH
export const CHUNK_HEADER_FLAGS_OFFSET = CHUNK_HEADER_NONCE_OFFSET + 1
export const CHUNK_HEADER_PROGRESS_OFFSET = CHUNK_HEADER_FLAGS_OFFSET + 1
export const CHUNK_HEADER_DATA_OFFSET = CHUNK_HEADER_PROGRESS_OFFSET + 1
export const CHUNK_SIZE = 16384 - CHUNK_HEADER_DATA_OFFSET
export const CHUNK_PROGRESS_MAX = 255

export const MAX_MESSAGE_CHUNKS = 100
export const BUFFER_LOW_RETRIES = 3
export const BUFFER_LOW_RETRY_DELAY_MS = 200

export const DEFAULT_PING_SAMPLE_SIZE = 20
export const SIGNAL_REFRESH_INTERVAL_MS = 5333
export const RTC_RECYCLE_INTERVAL_MS = 57333
export const RELAY_SELECTION_COUNT = 5

export const X_KIND_TAG = 'x'
export const EVENT_TYPE = 'EVENT'

export const RECONNECT_BASE_DELAY_MS = 3333

export const DEFAULT_RELAYS = [
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
