/**
 * Nostr protocol implementation for signaling
 */

import { getPublicKey, randomPrivateKey, schnorrSign } from '../keys/keygen.js'
import { createRTCPeerConnection } from '../webrtc/connection.js'
import {
  DEFAULT_NOSTR_RELAYS,
  NOSTR_CLOSE,
  NOSTR_EVENT,
  NOSTR_NOTICE,
  NOSTR_OK,
  NOSTR_POW_REGEX,
  NOSTR_REQ
} from '../utils/constants.js'
import {
  bytesToHex,
  encodeText,
  joinStrings,
  objectEntries,
  objectFromEntries,
  parseJson,
  promiseAll,
  randomString,
  selfId,
  simpleHash,
  stringifyJson
} from '../utils/helpers.js'

import { createWebSocketManager } from './websocket.js'

// Nostr event kinds
export const NOSTR_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  REACTION: 7,
  CHANNEL_MESSAGE: 42,
  CHANNEL_METADATA: 40,
  EPHEMERAL: 20000
}

// Nostr state management
const nostrState = {
  subscriptions: new Map(),
  eventHandlers: new Map(),
  powChallenges: new Set(),
  lastSeen: new Map(),
  relayConnections: new Map()
}

// Time utilities
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000)
}

export function getEventTimeout(roomId) {
  const baseTimeout = simpleHash(roomId, 10000)
  return baseTimeout + 20000
}

// URL normalization
export function normalizeRelayUrl(url) {
  return url.replace(/\/$/, '')
}

// Nostr message validation and parsing
export function parseNostrMessage(url, message) {
  try {
    const [type, subscriptionId, event] = parseJson(message)

    if (type === NOSTR_EVENT) {
      const handler = nostrState.eventHandlers.get(subscriptionId)
      if (handler) {
        handler(nostrState.subscriptions.get(subscriptionId), event.content)
      }
    }

    if (type === NOSTR_NOTICE || (type === NOSTR_OK && !event)) {
      const content = type === NOSTR_NOTICE ? subscriptionId : event
      const powRequired = +(content.match(NOSTR_POW_REGEX)?.[1] ?? 0)

      if (powRequired > 0) {
        const timeout = getEventTimeout(url)
        nostrState.powChallenges.add(timeout)
        nostrState.relayConnections.get(timeout)?.close?.()
        delete nostrState.relayConnections[timeout]
      }
    }
  } catch (error) {
    console.error('Nostr: error parsing message:', error)
  }
}

// Relay connection management
export function getNostrRelay(url) {
  const timeout = getEventTimeout(url)

  if (nostrState.relayConnections[timeout]) {
    return nostrState.relayConnections[timeout]
  }

  const connection = createWebSocketManager(url, (message) =>
    parseNostrMessage(url, message)
  )

  nostrState.relayConnections[timeout] = connection
  return connection
}

// Event creation and signing
export async function createNostrEvent(roomId, content) {
  const event = {
    kind: getEventTimeout(roomId),
    content: stringifyJson(content),
    pubkey: bytesToHex(getPublicKey(NOSTR_PRIVATE_KEY)),
    created_at: getCurrentTimestamp(),
    tags: [['x', roomId]]
  }

  // Create event ID
  const eventIdData = encodeText(
    stringifyJson([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ])
  )

  const eventIdHash = await crypto.subtle.digest('SHA-256', eventIdData)
  const eventId = bytesToHex(new Uint8Array(eventIdHash))

  // Sign event
  const signature = schnorrSign(new Uint8Array(eventIdHash), NOSTR_PRIVATE_KEY)

  return stringifyJson([
    NOSTR_EVENT,
    { ...event, id: eventId, sig: bytesToHex(signature) }
  ])
}

// Subscription management
export function createNostrSubscription(roomId, handler) {
  const subscriptionId = randomString(64)
  const replySubscriptionId = randomString(64)

  // Store subscription and handler
  nostrState.subscriptions.set(roomId, handler)
  nostrState.eventHandlers[subscriptionId] = nostrState.eventHandlers[
    replySubscriptionId
  ] = async (subscription, content) => {
    if (nostrState.powChallenges.has(getEventTimeout(subscription.url))) {
      return
    }

    const eventMessage = await createNostrEvent(roomId, content)
    subscription.send(eventMessage)
  }

  // Create subscription messages
  const _subscribeMessage = stringifyJson([
    NOSTR_REQ,
    subscriptionId,
    {
      kinds: [getEventTimeout(roomId)],
      since: getCurrentTimestamp(),
      '#x': [roomId]
    }
  ])

  const _replySubscribeMessage = stringifyJson([
    NOSTR_REQ,
    replySubscriptionId,
    {
      kinds: [getEventTimeout(NOSTR_SELF_ID)],
      since: getCurrentTimestamp(),
      '#x': [NOSTR_SELF_ID]
    }
  ])

  // Return cleanup function
  return () => {
    const unsubscribeMessage = stringifyJson([NOSTR_CLOSE, subscriptionId])
    subscription.send(unsubscribeMessage)

    delete nostrState.subscriptions[roomId]
    delete nostrState.eventHandlers[subscriptionId]
    delete nostrState.eventHandlers[replySubscriptionId]
  }
}

// Nostr signaling implementation
export const nostrSignaling = {
  init: (config) => {
    const relayUrls = config.relayUrls?.length
      ? config.relayUrls
      : DEFAULT_NOSTR_RELAYS

    return selectRelayUrls(config, relayUrls, 5, true)
      .map(getNostrRelay)
      .map((relay) => relay.ready.then(() => relay).catch(() => null))
  },

  subscribe: async (relay, appId, roomId, callback) => {
    const subscriptionId = randomString(64)
    const replySubscriptionId = randomString(64)

    // Store handlers
    nostrState.eventHandlers[subscriptionId] = nostrState.eventHandlers[
      replySubscriptionId
    ] = async (_subscription, content) => {
      if (nostrState.powChallenges.has(getEventTimeout(relay.url))) {
        return
      }

      const [appIdHash, selfIdHash] = await promiseAll([
        getEventHash(appId),
        getEventHash(roomId)
      ])

      if (roomId !== appIdHash && roomId !== selfIdHash) {
        return
      }

      const { peerId, offer, answer } =
        typeof content === 'string' ? parseJson(content) : content

      if (peerId === NOSTR_SELF_ID || nostrState.subscriptions[peerId]) {
        return
      }

      // Handle different message types
      if (offer) {
        await handleOffer(relay, config, appId, roomId, peerId, offer, callback)
      } else if (answer) {
        await handleAnswer(relay, config, appId, roomId, peerId, answer)
      } else {
        await initiateConnection(relay, config, appId, roomId, peerId, callback)
      }
    }

    // Send subscription messages
    const subscribeMessage = stringifyJson([
      NOSTR_REQ,
      subscriptionId,
      {
        kinds: [getEventTimeout(roomId)],
        since: getCurrentTimestamp(),
        '#x': [roomId]
      }
    ])

    const replySubscribeMessage = stringifyJson([
      NOSTR_REQ,
      replySubscriptionId,
      {
        kinds: [getEventTimeout(NOSTR_SELF_ID)],
        since: getCurrentTimestamp(),
        '#x': [NOSTR_SELF_ID]
      }
    ])

    relay.send(subscribeMessage)
    relay.send(replySubscribeMessage)

    // Return cleanup function
    return () => {
      const unsubscribeMessage = stringifyJson([NOSTR_CLOSE, subscriptionId])
      relay.send(unsubscribeMessage)
      relay.send(stringifyJson([NOSTR_CLOSE, replySubscriptionId]))
      delete nostrState.eventHandlers[subscriptionId]
      delete nostrState.eventHandlers[replySubscriptionId]
    }
  },

  announce: async (relay, content) => {
    if (nostrState.powChallenges.has(getEventTimeout(relay.url))) {
      return
    }

    const eventMessage = await createNostrEvent(
      content,
      stringifyJson({ peerId: NOSTR_SELF_ID })
    )
    relay.send(eventMessage)
  }
}

// Helper functions for different message types
async function handleOffer(
  _relay,
  config,
  appId,
  roomId,
  peerId,
  offer,
  callback
) {
  // Implementation for handling incoming offers
  const peerConnection = createRTCPeerConnection(false, config)
  peerConnection.setHandlers({
    connect: () => handleConnection(peerConnection, peerId),
    close: () => removeConnection(peerConnection, peerId)
  })

  try {
    const decryptedAnswer = await decryptMessage(appId, offer)
    if (peerConnection.isDead) return

    const [peerIdHash, answerHash] = await promiseAll([
      getEventHash(joinStrings(APP_NAME, appId, peerId)),
      peerConnection.signal(decryptedAnswer).then(encryptMessage)
    ])

    callback(
      peerIdHash,
      stringifyJson({
        peerId: NOSTR_SELF_ID,
        answer: answerHash
      })
    )
  } catch {
    config.onError?.({
      error: 'decryption failed (offer)',
      appId,
      peerId,
      roomId
    })
  }
}

async function handleAnswer(_relay, config, appId, roomId, peerId, answer) {
  // Implementation for handling incoming answers
  const pendingOffer = nostrState.pendingOffers?.[peerId]
  if (!pendingOffer || pendingOffer.isDead) return

  pendingOffer.setHandlers({
    connect: () => handleConnection(pendingOffer, peerId),
    close: () => removeConnection(pendingOffer, peerId)
  })

  try {
    await pendingOffer.signal(await decryptMessage(appId, answer))
  } catch {
    config.onError?.({
      error: 'decryption failed (answer)',
      appId,
      peerId,
      roomId
    })
  }
}

async function initiateConnection(
  _relay,
  config,
  appId,
  _roomId,
  peerId,
  callback
) {
  // Implementation for initiating connections
  const peerConnection =
    nostrState.connectionPool.pop() || createRTCPeerConnection(true, config)

  const [peerIdHash, offerData] = await promiseAll([
    getEventHash(joinStrings(APP_NAME, appId, peerId)),
    peerConnection.offerPromise.then(encryptMessage)
  ])

  // Initialize pending offers array if needed
  if (!nostrState.pendingOffers[peerId]) {
    nostrState.pendingOffers[peerId] = []
  }

  nostrState.pendingOffers[peerId].push(peerConnection)
  peerConnection.setHandlers({
    connect: () => handleConnection(peerConnection, peerId),
    close: () => removeConnection(peerConnection, peerId)
  })

  callback(
    peerIdHash,
    stringifyJson({
      peerId: NOSTR_SELF_ID,
      offer: offerData,
      peer: peerConnection
    })
  )
}

// Relay URL selection
export function selectRelayUrls(config, urls, redundancy, useHash) {
  return (
    config.relayUrls ?? (useHash ? joinStrings(APP_NAME, config.appId) : urls)
  ).slice(0, config.relayUrls?.length ?? config.relayRedundancy ?? redundancy)
}

// Relay socket getter
export function getRelaySockets(relayMap) {
  return () =>
    objectFromEntries(
      objectEntries(relayMap).map(([url, connection]) => [
        url,
        connection.socket
      ])
    )
}

// Connection management
function handleConnection(connection, peerId) {
  // Store active connection
  nostrState.activeConnections[peerId] = connection

  // Clean up any pending offers
  if (nostrState.pendingOffers?.[peerId]) {
    nostrState.pendingOffers[peerId].forEach((offer) => {
      if (offer !== connection) {
        offer.destroy()
      }
    })
    delete nostrState.pendingOffers[peerId]
  }
}

function removeConnection(_connection, peerId) {
  delete nostrState.activeConnections[peerId]
}

// Cleanup utilities
export function cleanupNostrState() {
  // Clear subscriptions
  nostrState.subscriptions.clear()
  nostrState.eventHandlers.clear()

  // Close connections
  Object.values(nostrState.relayConnections).forEach((connection) => {
    try {
      connection.destroy()
    } catch {
      // Ignore cleanup errors
    }
  })

  nostrState.relayConnections.clear()
  nostrState.powChallenges.clear()
  nostrState.lastSeen.clear()

  // Clear connection pools
  if (nostrState.connectionPool) {
    nostrState.connectionPool.forEach((connection) => {
      try {
        connection.destroy()
      } catch {
        // Ignore cleanup errors
      }
    })
    nostrState.connectionPool = []
  }
}

// Constants
export const NOSTR_SELF_ID = selfId
export const NOSTR_PRIVATE_KEY = randomPrivateKey()
export const NOSTR_PUBLIC_KEY = bytesToHex(getPublicKey(NOSTR_PRIVATE_KEY))
export const AES_GCM = 'AES-GCM'

// Helper functions
async function getEventHash(data) {
  const hash = await crypto.subtle.digest('SHA-1', encodeText(data))
  const hashArray = new Uint8Array(hash)
  let hashString = ''

  for (const byte of hashArray) {
    hashString += byte.toString(36)
  }

  return hashString
}

function _encodeBase64(data) {
  const uint8Array = new Uint8Array(data)
  let binaryString = ''

  for (let i = 0; i < uint8Array.length; i += 32768) {
    binaryString += String.fromCharCode(...uint8Array.subarray(i, i + 32768))
  }

  return btoa(binaryString)
}

function _decodeBase64(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer
}

// Initialize connection pool
nostrState.connectionPool = []
nostrState.activeConnections = {}
nostrState.pendingOffers = {}

// Placeholder functions - these would need proper implementations
function createRTCPeerConnection(_isInitiator, _config) {
  // This would import from webrtc/connection.js
  throw new Error('createRTCPeerConnection not implemented')
}

async function encryptMessage(data) {
  // Placeholder for encryption
  return data
}

// Encryption/decryption utilities
async function createEncryptionKey(appId, roomId, nonce) {
  const keyData = encodeText(`${appId}:${roomId}:${nonce}`);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey('raw', keyHash, { name: AES_GCM }, false, ['encrypt', 'decrypt']);
}

export async function encryptMessage(key, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: AES_GCM, iv }, 
    key, 
    encodeText(message)
  );
  
  return `${iv.join(',')}$${_encodeBase64(encryptedData)}`;
}

export async function decryptMessage(key, encryptedMessage) {
  const [ivString, base64Data] = encryptedMessage.split('$');
  
  if (!ivString || !base64Data) {
    throw new Error('Invalid encrypted payload format');
  }
  
  const iv = Uint8Array.from(ivString.split(','), Number);
  const encryptedData = _decodeBase64(base64Data);
  const decryptedData = await crypto.subtle.decrypt(
    { name: AES_GCM, iv }, 
    key, 
    encryptedData
  );
  
  return decodeText(decryptedData);
}
