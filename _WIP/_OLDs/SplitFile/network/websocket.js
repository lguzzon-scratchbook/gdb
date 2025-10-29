/**
 * WebSocket connection management
 */

import { RECONNECT_DELAY } from '../utils/constants.js'

// WebSocket connection state
const connectionState = {
  sockets: {},
  reconnectDelays: {}
}

export function createWebSocketManager(url, messageHandler) {
  const socketInfo = {}

  const connect = () => {
    const socket = new WebSocket(url)

    socket.onclose = () => {
      // Increase reconnect delay exponentially
      connectionState.reconnectDelays[url] =
        (connectionState.reconnectDelays[url] || RECONNECT_DELAY) * 2

      // Schedule reconnection
      const timeout = setTimeout(connect, connectionState.reconnectDelays[url])
      socketInfo.reconnectTimeout = timeout
    }

    socket.onmessage = (event) => {
      messageHandler(event.data)
    }

    socketInfo.socket = socket
    socketInfo.url = socket.url
    socketInfo.ready = new Promise((resolve) => {
      socket.onopen = () => {
        // Reset reconnect delay on successful connection
        connectionState.reconnectDelays[url] = RECONNECT_DELAY
        resolve(socketInfo)
      }
    })

    socketInfo.send = (data) => {
      if (socket.readyState === 1) {
        socket.send(data)
      }
    }

    connectionState.sockets[url] = socketInfo
    return socketInfo
  }

  socketInfo.forceReconnect = connect
  connect()

  return socketInfo
}
