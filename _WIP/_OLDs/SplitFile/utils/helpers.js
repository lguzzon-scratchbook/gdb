/**
 * General helper functions and utilities
 */

import { APP_NAME } from './constants.js'

// Array creation utility
export function createArray(length, mapFn) {
  return Array.from({ length }, mapFn)
}

// Random string generator
export function randomString(length) {
  return createArray(
    crypto.getRandomValues(new Uint8Array(length)),
    (byte) =>
      '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'[
        byte %
          '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'
            .length
      ]
  ).join('')
}

// Random ID generator
export const selfId = randomString(20)

// Promise.all bound to Promise
export const promiseAll = Promise.all.bind(Promise)

// Object utilities
export const objectEntries = Object.entries
export const objectFromEntries = Object.fromEntries
export const objectKeys = Object.keys

// Empty function
export const emptyFunction = () => {}

// Error factory
export function createError(message) {
  return new Error(`${APP_NAME}: ${message}`)
}

// String joiner
export function joinStrings(...parts) {
  return parts.join('@')
}

// Array shuffler (Fisher-Yates)
export function shuffleArray(array) {
  const result = [...array]
  let length = result.length
  let randomIndex = 0

  // Seeded random function
  const random = () => {
    let seed = randomIndex++
    return Math.sin(seed++) * 10000 - Math.floor(Math.sin(seed++) * 10000)
  }

  while (length) {
    const randomPosition = Math.floor(random() * length--)
    ;[result[length], result[randomPosition]] = [
      result[randomPosition],
      result[length]
    ]
  }

  return result
}

// Text encoding utilities
export const textEncoder = new TextEncoder()
export const textDecoder = new TextDecoder()

export function encodeText(string) {
  return textEncoder.encode(string)
}

export function decodeText(bytes) {
  return textDecoder.decode(bytes)
}

// JSON utilities
export function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}

export function stringifyJson(data) {
  return JSON.stringify(data)
}

export function parseJson(text) {
  return JSON.parse(text)
}

// Simple hash utility
export function simpleHash(string, max = Number.MAX_SAFE_INTEGER) {
  return (
    string.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0) % max
  )
}

// Environment detection
export const isBrowser = typeof window !== 'undefined'

// Base64 encoding/decoding utilities
export function encodeBase64(bytes) {
  const uint8Array = new Uint8Array(bytes)
  let binaryString = ''

  for (let i = 0; i < uint8Array.length; i += 32768) {
    binaryString += String.fromCharCode(...uint8Array.subarray(i, i + 32768))
  }

  return btoa(binaryString)
}

export function decodeBase64(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer
}

// Async cache utility
export function createAsyncCache() {
  const cache = new Map()

  return async (key, factory) => {
    if (cache.has(key)) {
      return cache.get(key)
    }

    const value = await factory()
    cache.set(key, value)
    return value
  }
}

// Debounce utility
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle utility
export function throttle(func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Retry utility
export async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    condition = () => true
  } = options

  let lastError

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (i === retries || !condition(error)) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, delay * backoff ** i))
    }
  }

  throw lastError
}

// Timeout utility
export function withTimeout(
  promise,
  timeoutMs,
  errorMessage = 'Operation timed out'
) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

// Safe JSON parse with fallback
export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

// Generate unique ID
export function generateId(prefix = '', length = 8) {
  const id = randomString(length)
  return prefix ? `${prefix}_${id}` : id
}

// Check if value is a promise
export function isPromise(value) {
  return value && typeof value.then === 'function'
}

// Deep clone utility
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item))
  }

  if (typeof obj === 'object') {
    const cloned = {}
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}
