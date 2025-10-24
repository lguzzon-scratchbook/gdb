/**
 * Data channel management and message handling
 */

import {
  ACTION_TYPE_BYTES,
  MAX_CHUNK_SIZE,
  MAX_CHUNKS,
  MAX_SEND_RETRIES,
  MESSAGE_PREFIX,
  RETRY_DELAY
} from '../utils/constants.js'
import {
  createError,
  decodeText,
  encodeText,
  parseJson,
  stringifyJson,
  withTimeout
} from '../utils/helpers.js'
import { validateBoolean } from '../utils/validation.js'

/**
 * Creates a data channel manager for handling message chunking and routing
 * @param {Function} onPeerJoin - Callback for when a peer joins
 * @param {Function} onPeerLeave - Callback for when a peer leaves
 * @param {Function} onDestroy - Callback for cleanup
 * @returns {Object} Data channel manager API
 */
export function createDataChannelManager(_onPeerJoin, onPeerLeave, onDestroy) {
  const peers = new Map()
  const peerData = {}
  const peerStreams = {}
  const peerTracks = {}
  const _handlers = {}

  // Event listener management
  function addEventListener(event, handler) {
    if (!peers.has(event)) {
      peers.set(event, new Set())
    }
    peers.get(event).add(handler)
  }

  function removeEventListener(event, handler) {
    peers.get(event)?.delete(handler)
  }

  function emitEvent(event, ...args) {
    peers.get(event)?.forEach((handler) => handler(...args))
  }

  // Peer management
  function _addPeer(peerId, connection) {
    if (peers.has(peerId)) return

    peers.set(peerId, connection)
    connection.setHandlers({
      data: (data) => handleDataChannelMessage(peerId, data),
      stream: (stream) => {
        emitEvent('stream:add', stream, peerId, peerStreams[peerId])
        delete peerStreams[peerId]
      },
      track: (track, stream) => {
        emitEvent('track:add', track, stream, peerId, peerTracks[peerId])
        delete peerTracks[peerId]
      },
      signal: (signal) => emitEvent('signal', signal, peerId),
      close: () => removePeer(peerId),
      error: (error) => {
        console.error(`${APP_NAME}: peer error for ${peerId}`, error)
        removePeer(peerId)
      }
    })

    emitEvent('peer:join', peerId)
  }

  function removePeer(peerId) {
    if (!peers.has(peerId)) return

    peers.delete(peerId)
    delete peerData[peerId]
    delete peerStreams[peerId]
    delete peerTracks[peerId]

    emitEvent('peer:leave', peerId)
    onPeerLeave(peerId)
  }

  // Message type registration
  const messageTypes = new Map()

  function createMessageType(typeName) {
    if (messageTypes.has(typeName)) {
      return messageTypes.get(typeName)
    }

    if (!typeName) {
      throw createError('action type is required')
    }

    const nameBytes = encodeText(typeName)

    if (nameBytes.byteLength > ACTION_TYPE_BYTES) {
      throw createError(
        `\u274C "${typeName}" exceeds ${ACTION_TYPE_BYTES} bytes. Use a shorter name.`
      )
    }

    const typePrefix = new Uint8Array(ACTION_TYPE_BYTES).map(
      (_, i) => nameBytes[i] || 0
    )

    let messageId = 0
    const listeners = new Map([
      ['message', new Set()],
      ['progress', new Set()]
    ])

    const send = async (data, targetPeerId, meta, onProgress) => {
      validateBoolean(meta, 'meta must be object')

      if (data === undefined) {
        throw createError('data cannot be undefined')
      }

      const isBlob = data instanceof Blob
      const isBinary =
        isBlob || data instanceof ArrayBuffer || data instanceof Uint8Array
      const isString = typeof data !== 'string'

      if (meta && !isBinary) {
        throw createError('meta only allowed with binary')
      }

      const dataBytes = isBinary
        ? new Uint8Array(isBlob ? await data.arrayBuffer() : data)
        : encodeText(isString ? stringifyJson(data) : data)

      const metaBytes = meta ? encodeText(stringifyJson(meta)) : null
      const totalChunks =
        Math.ceil(dataBytes.byteLength / MAX_CHUNK_SIZE) + (meta ? 1 : 0) || 1

      if (totalChunks > MAX_CHUNKS) {
        throw createError(`Message too large, exceeds max chunks ${MAX_CHUNKS}`)
      }

      const chunks = createMessageChunks(
        typePrefix,
        messageId,
        dataBytes,
        metaBytes,
        totalChunks
      )

      messageId = (messageId + 1) & 255

      return sendChunksToPeer(chunks, targetPeerId, onProgress, meta)
    }

    const messageType = {
      send,
      on: listeners.get.bind(listeners),
      off: (event, handler) => listeners.get(event)?.delete(handler)
    }

    messageTypes.set(typeName, messageType)
    return messageType
  }

  // Message chunk creation
  function createMessageChunks(
    typePrefix,
    messageId,
    dataBytes,
    metaBytes,
    totalChunks
  ) {
    const chunks = []

    for (let i = 0; i < totalChunks; i++) {
      const isLast = i === totalChunks - 1
      const isMeta = metaBytes && i === 0

      let chunkData
      if (isMeta) {
        chunkData = metaBytes
      } else {
        const start = meta ? (i - 1) * MAX_CHUNK_SIZE : i * MAX_CHUNK_SIZE
        const end = meta ? i * MAX_CHUNK_SIZE : (i + 1) * MAX_CHUNK_SIZE
        chunkData = dataBytes.subarray(start, end)
      }

      const chunk = createMessageChunk(
        typePrefix,
        messageId,
        isLast,
        isMeta,
        isBinary,
        isString,
        i,
        totalChunks,
        chunkData
      )

      chunks.push(chunk)
    }

    return chunks
  }

  function createMessageChunk(
    typePrefix,
    messageId,
    isLast,
    isMeta,
    isBinary,
    isString,
    chunkIndex,
    totalChunks,
    chunkData
  ) {
    const headerSize = 33 // 12 + 1 + 1 + 1 + 1 + 1 + 16
    const chunk = new Uint8Array(headerSize + chunkData.byteLength)

    let offset = 0

    // Type prefix (12 bytes)
    chunk.set(typePrefix, offset)
    offset += ACTION_TYPE_BYTES

    // Message ID (1 byte)
    chunk.set([messageId], offset)
    offset += 1

    // Flags (1 byte)
    const flags =
      (isLast ? 1 : 0) |
      (isMeta ? 2 : 0) |
      (isBinary ? 4 : 0) |
      (isString ? 8 : 0)
    chunk.set([flags], offset)
    offset += 1

    // Progress (1 byte)
    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 255)
    chunk.set([progress], offset)
    offset += 1

    // Reserved (16 bytes)
    offset += 16

    // Chunk data
    chunk.set(chunkData, offset)

    return chunk
  }

  // Send chunks to peer with retry logic
  async function sendChunksToPeer(chunks, peerId, onProgress, meta) {
    const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

    return Promise.all(
      targetPeers.map((targetPeerId) =>
        sendChunksToSinglePeer(chunks, targetPeerId, onProgress, meta)
      )
    )
  }

  async function sendChunksToSinglePeer(chunks, peerId, onProgress, meta) {
    const connection = peers.get(peerId)
    if (!connection) return

    const { channel } = connection

    for (let i = 0; i < chunks.length; i++) {
      let retryCount = 0

      while (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
        if (retryCount++ > MAX_SEND_RETRIES) {
          throw createError(
            `${APP_NAME}: send buffer full, max retries reached for peer ${peerId}`
          )
        }

        try {
          await waitForBufferLow(channel)
        } catch (error) {
          console.warn(error.message)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        }
      }

      if (!peers.has(peerId)) break

      connection.sendData(chunks[i])
      onProgress?.(chunks[i][34] / 255, peerId, meta) // Progress byte at offset 34
    }
  }

  // Handle incoming data channel messages
  function handleDataChannelMessage(peerId, data) {
    try {
      const bytes = new Uint8Array(data)
      const typeName = decodeText(bytes.subarray(0, ACTION_TYPE_BYTES)).replace(
        /\0/g,
        ''
      )

      if (!messageTypes.has(typeName)) {
        console.warn(`${APP_NAME}: unregistered type (${typeName})`)
        return
      }

      const [messageId] = bytes.subarray(
        ACTION_TYPE_BYTES,
        ACTION_TYPE_BYTES + 1
      )
      const [flags] = bytes.subarray(
        ACTION_TYPE_BYTES + 1,
        ACTION_TYPE_BYTES + 2
      )
      const [progress] = bytes.subarray(
        ACTION_TYPE_BYTES + 2,
        ACTION_TYPE_BYTES + 3
      )
      const chunkData = bytes.subarray(33) // Skip header

      const isLast = Boolean(flags & 1)
      const isMeta = Boolean(flags & 2)
      const isBinary = Boolean(flags & 4)
      const isString = Boolean(flags & 8)

      const messageType = messageTypes.get(typeName)
      const peerMessageData = ((peerData[peerId] ||= {})[typeName] ||= {})

      if (peerMessageData[messageId]?.chunks?.length > MAX_CHUNKS) {
        console.warn(
          `${APP_NAME}: peer ${peerId} sent too many chunks for messageId ${messageId}, ignoring.`
        )
        return
      }

      const messageState = (peerMessageData[messageId] ||= { chunks: [] })

      if (isMeta) {
        try {
          messageState.meta = parseJson(decodeText(chunkData))
        } catch {
          console.warn(
            `${APP_NAME}: failed to parse meta from peer ${peerId} for type ${typeName}`
          )
          return
        }
      } else {
        messageState.chunks.push(chunkData)
      }

      // Emit progress event
      messageType.listeners.get('progress').forEach((handler) => {
        try {
          handler(progress / 255, peerId, messageState.meta)
        } catch (error) {
          console.error(error)
        }
      })

      if (!isLast) return

      // Reassemble complete message
      const totalLength = messageState.chunks.reduce(
        (sum, chunk) => sum + chunk.byteLength,
        0
      )

      const assembledData = new Uint8Array(totalLength)
      let offset = 0

      messageState.chunks.forEach((chunk) => {
        assembledData.set(chunk, offset)
        offset += chunk.byteLength
      })

      delete peerMessageData[messageId]

      let finalData

      if (isBinary) {
        finalData = assembledData
      } else if (isString) {
        try {
          finalData = parseJson(decodeText(assembledData))
        } catch {
          console.warn(
            `${APP_NAME}: failed to parse JSON message data from peer ${peerId} for type ${typeName}`
          )
          return
        }
      } else {
        finalData = decodeText(assembledData)
      }

      // Emit message event
      messageType.listeners.get('message').forEach((handler) => {
        try {
          handler(finalData, peerId, messageState.meta)
        } catch (error) {
          console.error(error)
        }
      })
    } catch (error) {
      console.error(
        `${APP_NAME}: error handling data from peer ${peerId}:`,
        error
      )
    }
  }

  // Utility functions
  function waitForBufferLow(channel) {
    return withTimeout(
      new Promise((resolve) => {
        const handler = () => {
          channel.removeEventListener('bufferedamountlow', handler)
          resolve()
        }
        channel.addEventListener('bufferedamountlow', handler)
      }),
      5000,
      'bufferLow timeout'
    )
  }

  // Built-in message types
  const { send: sendPing, on: onPing } = createMessageType(
    `${MESSAGE_PREFIX}ping`
  )
  const { send: sendPong, on: onPong } = createMessageType(
    `${MESSAGE_PREFIX}pong`
  )
  const { send: sendSignal, on: onSignal } = createMessageType(
    `${MESSAGE_PREFIX}signal`
  )
  const { send: sendStream, on: onStream } = createMessageType(
    `${MESSAGE_PREFIX}stream`
  )
  const { send: sendTrack, on: onTrack } = createMessageType(
    `${MESSAGE_PREFIX}track`
  )
  const { send: sendLeave, on: onLeave } = createMessageType(
    `${MESSAGE_PREFIX}leave`
  )

  // Set up built-in message handlers
  onPing('message', (_data, peerId) => sendPong('', peerId))
  onPong('message', (_data, peerId) => {
    peerData[peerId]?.()
    delete peerData[peerId]
  })
  onSignal('message', (signal, peerId) => {
    peers.get(peerId)?.signal(signal)
  })
  onStream('message', (stream, peerId) => {
    peerStreams[peerId] = stream
  })
  onTrack('message', (track, _stream, peerId) => {
    peerTracks[peerId] = track
  })
  onLeave('message', (_data, peerId) => {
    removePeer(peerId)
  })

  // Public API
  return {
    on: addEventListener,
    off: removeEventListener,
    channel: createMessageType,
    leave: async () => {
      try {
        await sendLeave('')
        await new Promise((resolve) => setTimeout(resolve, 99))
      } catch (error) {
        console.warn(`${APP_NAME}: error sending leave`, error)
      }

      // Clean up all peers
      for (const [peerId, connection] of peers) {
        try {
          connection.destroy()
        } catch {
          // Ignore cleanup errors
        }
        peers.delete(peerId)
      }

      onDestroy()
    },

    ping: async (peerId) => {
      if (!peerId) {
        throw createError('ping() requires target peer ID')
      }

      const startTime = Date.now()
      sendPing('', peerId)

      return new Promise((resolve) => {
        peerData[peerId] = resolve
      }).then(() => Date.now() - startTime)
    },

    getPeers: () =>
      objectFromEntries(
        Array.from(peers, ([peerId, connection]) => [
          peerId,
          connection.connection
        ])
      ),

    addStream: (stream, peerId, meta) => {
      const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

      return Promise.all(
        targetPeers.map(
          (targetPeerId) =>
            new Promise((resolve) => {
              if (meta) {
                sendStream(meta, targetPeerId).then(resolve)
              }

              peers.get(targetPeerId)?.addStream(stream)
              resolve()
            })
        )
      )
    },

    removeStream: (stream, peerId) => {
      const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

      return Promise.all(
        targetPeers.map((targetPeerId) => {
          peers.get(targetPeerId)?.removeStream(stream)
          return Promise.resolve()
        })
      )
    },

    addTrack: (track, stream, peerId, meta) => {
      const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

      return Promise.all(
        targetPeers.map(
          (targetPeerId) =>
            new Promise((resolve) => {
              if (meta) {
                sendTrack(meta, targetPeerId).then(resolve)
              }

              peers.get(targetPeerId)?.addTrack(track, stream)
              resolve()
            })
        )
      )
    },

    removeTrack: (track, peerId) => {
      const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

      return Promise.all(
        targetPeers.map((targetPeerId) => {
          peers.get(targetPeerId)?.removeTrack(track)
          return Promise.resolve()
        })
      )
    },

    replaceTrack: (oldTrack, newTrack, _stream, peerId, meta) => {
      const targetPeers = peerId ? [peerId] : Array.from(peers.keys())

      return Promise.all(
        targetPeers.map(
          (targetPeerId) =>
            new Promise((resolve) => {
              if (meta) {
                sendTrack(meta, targetPeerId).then(resolve)
              }

              peers.get(targetPeerId)?.replaceTrack(oldTrack, newTrack)
              resolve()
            })
        )
      )
    }
  }
}

// Helper functions
function objectFromEntries(entries) {
  return Object.fromEntries(entries)
}

const APP_NAME = 'GenosRTC'
