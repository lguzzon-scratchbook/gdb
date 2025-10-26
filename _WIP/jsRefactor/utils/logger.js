/**
 * Structured JSON logger that writes to log file and console
 */

import { appendFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export class Logger {
  constructor(config = {}) {
    this.level = config.level || 'info'
    this.enableFileLogging = config.enableFileLogging !== false
    this.logFile = config.logFile || 'refactor.log'
    this.enableConsole = config.enableConsole !== false
    this.structured = config.structured !== false

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    }

    this.currentLevel = this.levels[this.level] || 2

    // Initialize log file
    if (this.enableFileLogging) {
      this._initLogFile()
    }
  }

  /**
   * Initialize log file with header
   */
  _initLogFile() {
    const logPath = resolve(this.logFile)

    if (!existsSync(logPath)) {
      const header = {
        timestamp: new Date().toISOString(),
        event: 'log_session_start',
        level: this.level,
        version: '1.0.0'
      }

      writeFileSync(logPath, `${JSON.stringify(header)}\n`)
    }
  }

  /**
   * Write log entry
   * @param {string} level - Log level
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Error object if any
   */
  _log(level, event, data = {}, error = null) {
    const levelNum = this.levels[level]

    if (levelNum > this.currentLevel) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      data,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    }

    // Write to file
    if (this.enableFileLogging) {
      const logLine = `${JSON.stringify(logEntry)}\n`
      appendFileSync(resolve(this.logFile), logLine)
    }

    // Write to console
    if (this.enableConsole) {
      if (this.structured) {
        console.log(JSON.stringify(logEntry, null, 2))
      } else {
        const message = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${event}`

        if (data && Object.keys(data).length > 0) {
          console.log(message, data)
        } else {
          console.log(message)
        }

        if (error) {
          console.error(error)
        }
      }
    }
  }

  /**
   * Log error event
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Error object
   */
  error(event, data = {}, error = null) {
    this._log('error', event, data, error)
  }

  /**
   * Log warning event
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Error object
   */
  warn(event, data = {}, error = null) {
    this._log('warn', event, data, error)
  }

  /**
   * Log info event
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Error object
   */
  info(event, data = {}, error = null) {
    this._log('info', event, data, error)
  }

  /**
   * Log debug event
   * @param {string} event - Event name
   * @param {Object} data - Log data
   * @param {Error} error - Error object
   */
  debug(event, data = {}, error = null) {
    this._log('debug', event, data, error)
  }

  /**
   * Log performance metrics
   * @param {string} event - Event name
   * @param {Object} metrics - Performance metrics
   */
  metrics(event, metrics = {}) {
    this._log('info', event, { type: 'metrics', ...metrics })
  }

  /**
   * Log API call
   * @param {string} event - Event name
   * @param {Object} apiData - API call data
   */
  api(event, apiData = {}) {
    this._log('info', event, { type: 'api', ...apiData })
  }

  /**
   * Log worker activity
   * @param {string} event - Event name
   * @param {Object} workerData - Worker data
   */
  worker(event, workerData = {}) {
    this._log('debug', event, { type: 'worker', ...workerData })
  }

  /**
   * Close logger and write session end
   */
  close() {
    if (this.enableFileLogging) {
      const footer = {
        timestamp: new Date().toISOString(),
        event: 'log_session_end',
        level: this.level
      }

      appendFileSync(resolve(this.logFile), `${JSON.stringify(footer)}\n`)
    }
  }
}

// Singleton logger instance
let loggerInstance = null

/**
 * Get or create logger instance
 * @param {Object} config - Logger configuration
 * @returns {Logger} Logger instance
 */
export function getLogger(config = {}) {
  if (!loggerInstance) {
    loggerInstance = new Logger(config)
  }
  return loggerInstance
}

/**
 * Close logger instance
 */
export function closeLogger() {
  if (loggerInstance) {
    loggerInstance.close()
    loggerInstance = null
  }
}
