/**
 * Basic file caching utility
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export class FileCache {
  constructor(config = {}) {
    this.enabled = config.enabled !== false
    this.cacheDir = config.cacheDir || '.refactor-cache'
    this.maxAge = config.maxAge || 24 * 60 * 60 * 1000 // 24 hours
    this.maxSize = config.maxSize || 100 * 1024 * 1024 // 100MB
  }

  /**
   * Generate cache key for file
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {string} Cache key
   */
  _generateCacheKey(filePath, content) {
    const hash = createHash('sha256')
    hash.update(filePath)
    hash.update(content)
    hash.update(Date.now().toString())
    return hash.digest('hex')
  }

  /**
   * Get cache file path
   * @param {string} cacheKey - Cache key
   * @returns {string} Cache file path
   */
  _getCachePath(cacheKey) {
    return resolve(this.cacheDir, `${cacheKey}.cache`)
  }

  /**
   * Check if cache entry is valid
   * @param {string} cachePath - Cache file path
   * @returns {boolean} True if valid
   */
  _isCacheValid(cachePath) {
    if (!existsSync(cachePath)) {
      return false
    }

    try {
      const stats = require('node:fs').statSync(cachePath)
      const now = Date.now()
      return now - stats.mtime.getTime() < this.maxAge
    } catch (_error) {
      return false
    }
  }

  /**
   * Get cached data for file
   * @param {string} filePath - File path
   * @param {string} content - Current file content
   * @returns {any} Cached data or null
   */
  get(filePath, content) {
    if (!this.enabled) {
      return null
    }

    const cacheKey = this._generateCacheKey(filePath, content)
    const cachePath = this._getCachePath(cacheKey)

    if (!this._isCacheValid(cachePath)) {
      return null
    }

    try {
      const cachedData = readFileSync(cachePath, 'utf-8')
      return JSON.parse(cachedData)
    } catch (_error) {
      return null
    }
  }

  /**
   * Set cached data for file
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @param {any} data - Data to cache
   * @returns {boolean} True if successful
   */
  set(filePath, content, data) {
    if (!this.enabled) {
      return false
    }

    try {
      const cacheKey = this._generateCacheKey(filePath, content)
      const cachePath = this._getCachePath(cacheKey)

      // Create cache directory if it doesn't exist
      if (!existsSync(this.cacheDir)) {
        require('node:fs').mkdirSync(this.cacheDir, { recursive: true })
      }

      const cacheData = {
        filePath,
        cacheKey,
        timestamp: Date.now(),
        content: content,
        data: data
      }

      writeFileSync(cachePath, JSON.stringify(cacheData, null, 2))
      return true
    } catch (_error) {
      return false
    }
  }

  /**
   * Clear cache for file
   * @param {string} filePath - File path
   * @returns {boolean} True if successful
   */
  clear(filePath) {
    if (!this.enabled) {
      return false
    }

    try {
      const cacheKey = this._generateCacheKey(filePath, '')
      const cachePath = this._getCachePath(cacheKey)

      if (existsSync(cachePath)) {
        require('node:fs').unlinkSync(cachePath)
        return true
      }
      return false
    } catch (_error) {
      return false
    }
  }

  /**
   * Clear all cache
   * @returns {boolean} True if successful
   */
  clearAll() {
    if (!this.enabled) {
      return false
    }

    try {
      if (existsSync(this.cacheDir)) {
        require('node:fs').rmSync(this.cacheDir, { recursive: true })
        return true
      }
      return false
    } catch (_error) {
      return false
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    if (!this.enabled) {
      return { enabled: false }
    }

    try {
      const stats = {
        enabled: true,
        cacheDir: this.cacheDir,
        fileCount: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null
      }

      if (!existsSync(this.cacheDir)) {
        return stats
      }

      const files = require('node:fs').readdirSync(this.cacheDir)
      const now = Date.now()
      let oldestTime = now
      let newestTime = 0

      files.forEach((file) => {
        const filePath = resolve(this.cacheDir, file)
        const fileStats = require('node:fs').statSync(filePath)

        stats.fileCount++
        stats.totalSize += fileStats.size

        if (fileStats.mtime.getTime() < oldestTime) {
          oldestTime = fileStats.mtime.getTime()
          stats.oldestFile = file
        }

        if (fileStats.mtime.getTime() > newestTime) {
          newestTime = fileStats.mtime.getTime()
          stats.newestFile = file
        }
      })

      return stats
    } catch (error) {
      return { enabled: true, error: error.message }
    }
  }
}

// Singleton cache instance
let cacheInstance = null

/**
 * Get or create cache instance
 * @param {Object} config - Cache configuration
 * @returns {FileCache} Cache instance
 */
export function getCache(config = {}) {
  if (!cacheInstance) {
    cacheInstance = new FileCache(config)
  }
  return cacheInstance
}
