/**
 * WebRTC connection management
 */

import {
  ANSWER_TYPE,
  DEFAULT_STUN_SERVERS,
  ICE_GATHERING_STATE_CHANGE,
  ICE_GATHERING_TIMEOUT,
  OFFER_TYPE
} from '../utils/constants.js'

import { withTimeout } from '../utils/helpers.js'

/**
 * Creates an RTCPeerConnection wrapper with enhanced functionality
 * @param {boolean} isInitiator - Whether this connection initiates the offer
 * @param {Object} options - Configuration options
 * @param {RTCConfiguration} options.rtcConfig - WebRTC configuration
 * @param {RTCPeerConnection} options.rtcPolyfill - Polyfill for RTCPeerConnection
 * @param {Array} options.turnConfig - TURN server configuration
 * @returns {Object} Connection wrapper with enhanced API
 */
export function createRTCPeerConnection(isInitiator, options = {}) {
  const {
    rtcConfig = {},
    rtcPolyfill = RTCPeerConnection,
    turnConfig = []
  } = options

  // Create the peer connection with default STUN servers and optional TURN servers
  const connection = new rtcPolyfill({
    iceServers: [...DEFAULT_STUN_SERVERS, ...turnConfig],
    ...rtcConfig
  })

  // Connection state
  let isNegotiating = false
  let wasRemoteSet = false
  let dataChannel = null
  const handlers = {}

  // Enhanced data channel setup
  const setupDataChannel = (channel) => {
    Object.assign(channel, {
      binaryType: 'arraybuffer',
      bufferedAmountLowThreshold: 65535,
      onmessage: (event) => handlers.data?.(event.data),
      onopen: () => handlers.connect?.(),
      onclose: () => handlers.close?.(),
      onerror: (event) => {
        const errorMessage = event?.error?.message
        if (!errorMessage?.includes('User-Initiated Abort')) {
          handlers.error?.(event)
        }
      }
    })
    return channel
  }

  // Create or wait for data channel
  if (isInitiator) {
    dataChannel = setupDataChannel(connection.createDataChannel('data'))
  } else {
    connection.ondatachannel = ({ channel }) => {
      dataChannel = setupDataChannel(channel)
    }
  }

  // Gather ICE candidates with timeout
  const gatherIceCandidates = async () => {
    return withTimeout(
      new Promise((resolve) => {
        const checkState = () => {
          if (connection.iceGatheringState === 'complete') {
            connection.removeEventListener(
              ICE_GATHERING_STATE_CHANGE,
              checkState
            )
            resolve()
          }
        }

        connection.addEventListener(ICE_GATHERING_STATE_CHANGE, checkState)
        checkState()
      }),
      ICE_GATHERING_TIMEOUT,
      'ICE gathering timeout'
    ).then(() => ({
      type: connection.localDescription.type,
      sdp: connection.localDescription.sdp.replace(
        /a=ice-options:trickle\s\n/g,
        ''
      )
    }))
  }

  // Handle negotiation needed
  connection.onnegotiationneeded = async () => {
    try {
      isNegotiating = true
      await connection.setLocalDescription()
      handlers.signal?.(await gatherIceCandidates())
    } catch (error) {
      handlers.error?.(error)
    } finally {
      isNegotiating = false
    }
  }

  // Handle connection state changes
  connection.onconnectionstatechange = () => {
    if (
      ['disconnected', 'failed', 'closed'].includes(connection.connectionState)
    ) {
      handlers.close?.()
    }
  }

  // Handle incoming tracks
  connection.ontrack = (event) => {
    handlers.track?.(event.track, event.streams[0])
    handlers.stream?.(event.streams[0])
  }

  // Handle removed streams
  connection.onremovestream = (event) => {
    handlers.stream?.(event.stream)
  }

  // Auto-negotiate for initiator if trickle ICE is not supported
  if (isInitiator && !connection.canTrickleIceCandidates) {
    connection.onnegotiationneeded()
  }

  // Get senders utility
  const getSenders = () => connection.getSenders()

  // Return enhanced connection API
  return {
    created: Date.now(),
    connection,
    get channel() {
      return dataChannel
    },
    get isDead() {
      return connection.connectionState === 'closed'
    },

    // Signal handling
    async signal(description) {
      // Skip if data channel is open and this is just a candidate
      if (
        dataChannel?.readyState === 'open' &&
        !description.sdp?.includes('a=rtpmap')
      ) {
        return
      }

      try {
        if (description.type === OFFER_TYPE) {
          // Handle incoming offer
          if (
            isNegotiating ||
            (connection.signalingState !== 'stable' && !wasRemoteSet)
          ) {
            if (isInitiator) return

            // Rollback and set remote description
            await Promise.all([
              connection.setLocalDescription({ type: 'rollback' }),
              connection.setRemoteDescription(description)
            ])
          } else {
            await connection.setRemoteDescription(description)
          }

          // Create and send answer
          await connection.setLocalDescription()
          const answer = await gatherIceCandidates()
          handlers.signal?.(answer)
          return answer
        }

        if (description.type === ANSWER_TYPE) {
          // Handle incoming answer
          wasRemoteSet = true
          try {
            await connection.setRemoteDescription(description)
          } finally {
            wasRemoteSet = false
          }
        }
      } catch (error) {
        handlers.error?.(error)
      }
    },

    // Data transmission
    sendData: (data) => dataChannel.send(data),

    // Cleanup
    destroy: () => {
      dataChannel?.close()
      connection.close()
      isNegotiating = wasRemoteSet = false
    },

    // Event handler management
    setHandlers: (newHandlers) => Object.assign(handlers, newHandlers),

    // Offer promise for initiator
    offerPromise: isInitiator
      ? new Promise((resolve) => {
          handlers.signal = (description) => {
            if (description.type === OFFER_TYPE) {
              resolve(description)
            }
          }
        })
      : Promise.resolve(),

    // Stream management
    addStream: (stream) => {
      stream.getTracks().forEach((track) => {
        connection.addTrack(track, stream)
      })
    },

    removeStream: (stream) => {
      getSenders()
        .filter((sender) => stream.getTracks().includes(sender.track))
        .forEach((sender) => {
          connection.removeTrack(sender)
        })
    },

    // Track management
    addTrack: (track, stream) => connection.addTrack(track, stream),

    removeTrack: (track) => {
      const sender = getSenders().find((s) => s.track === track)
      if (sender) {
        connection.removeTrack(sender)
      }
    },

    replaceTrack: (oldTrack, newTrack, _stream) => {
      const sender = getSenders().find((s) => s.track === oldTrack)
      if (sender) {
        return sender.replaceTrack(newTrack)
      }
    }
  }
}

/**
 * Creates a connection factory with default options
 * @param {Object} defaultOptions - Default configuration options
 * @returns {Function} Connection factory function
 */
export function createConnectionFactory(defaultOptions = {}) {
  return (isInitiator, options = {}) => {
    return createRTCPeerConnection(isInitiator, {
      ...defaultOptions,
      ...options
    })
  }
}

/**
 * Validates WebRTC configuration
 * @param {RTCConfiguration} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
export function validateRTCConfiguration(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('RTCConfiguration must be an object')
  }

  if (config.iceServers && !Array.isArray(config.iceServers)) {
    throw new Error('iceServers must be an array')
  }

  // Validate ice servers if provided
  if (config.iceServers) {
    config.iceServers.forEach((server, index) => {
      if (!server.urls && !server.url) {
        throw new Error(`iceServers[${index}].urls is required`)
      }

      const urls = server.urls || server.url
      const urlArray = Array.isArray(urls) ? urls : [urls]

      urlArray.forEach((url) => {
        if (typeof url !== 'string') {
          throw new Error(`iceServers[${index}].urls must be strings`)
        }

        // Basic URL validation
        try {
          new URL(url)
        } catch {
          throw new Error(
            `iceServers[${index}].urls contains invalid URL: ${url}`
          )
        }
      })
    })
  }
}

/**
 * Creates a safe RTCConfiguration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {RTCConfiguration} Safe configuration
 */
export function createSafeRTCConfiguration(userConfig = {}) {
  const safeConfig = {
    iceServers: [...DEFAULT_STUN_SERVERS]
  }

  // Merge user configuration safely
  if (userConfig.iceServers && Array.isArray(userConfig.iceServers)) {
    safeConfig.iceServers = [
      ...safeConfig.iceServers,
      ...userConfig.iceServers.filter(
        (server) => server && (server.urls || server.url)
      )
    ]
  }

  // Copy other properties
  Object.keys(userConfig).forEach((key) => {
    if (key !== 'iceServers') {
      safeConfig[key] = userConfig[key]
    }
  })

  return safeConfig
}
