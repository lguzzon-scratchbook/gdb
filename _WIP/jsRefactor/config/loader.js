/**
 * Configuration loader for .refactorrc.jsonc
 * Merges user configuration with defaults
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_CONFIG = {
  // Discovery settings
  discovery: {
    targetPath: '.',
    includePatterns: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    excludePatterns: ['node_modules', 'dist', '.git', 'coverage', 'build'],
    useGitignore: true
  },

  // Analysis settings
  analysis: {
    maxWorkers: 4,
    workerTimeout: 30000,
    enableCKG: true,
    extractNodes: true,
    extractEdges: true
  },

  // Suggestion settings
  suggestions: {
    enableHeuristics: true,
    enableLLM: true,
    llmModel: 'z-ai/glm-4.6:exacto',
    confidenceThreshold: 0.7,
    maxBatchSize: 10,
    enableCache: true
  },

  // Transformation settings
  transformation: {
    enableCrossModule: true,
    enableConflictResolution: true,
    backupFiles: true,
    validateRenames: true
  },

  // VCS settings
  vcs: {
    enabled: true,
    autoBranch: true,
    branchPrefix: 'refactor/',
    requireClean: true
  },

  // Logging settings
  logging: {
    level: 'info',
    enableFileLogging: true,
    logFile: 'refactor.log',
    enableConsole: true,
    structured: true
  },

  // Performance settings
  performance: {
    enableMetrics: true,
    enableProfiling: false,
    memoryLimit: '1GB'
  }
}

/**
 * Load configuration from .refactorrc.jsonc
 * @param {string} configPath - Path to config file
 * @returns {Object} Merged configuration object
 */
export function loadConfig(configPath = null) {
  const config = { ...DEFAULT_CONFIG }

  if (configPath) {
    try {
      const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
      return mergeConfig(config, userConfig)
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}: ${error.message}`)
    }
  }

  // Try to load from default locations
  const defaultPaths = [
    '.refactorrc.jsonc',
    '.refactorrc.json',
    'refactor.config.jsonc',
    'refactor.config.json'
  ]

  for (const path of defaultPaths) {
    try {
      const userConfig = JSON.parse(readFileSync(resolve(path), 'utf-8'))
      return mergeConfig(config, userConfig)
    } catch (_error) {
      // Continue to next path
    }
  }

  return config
}

/**
 * Deep merge configuration objects
 * @param {Object} target - Target configuration
 * @param {Object} source - Source configuration
 * @returns {Object} Merged configuration
 */
function mergeConfig(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = mergeConfig(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result
 */
export function validateConfig(config) {
  const errors = []
  const warnings = []

  // Validate required fields
  if (!config.discovery) {
    errors.push('Missing discovery configuration')
  }

  if (!config.analysis) {
    errors.push('Missing analysis configuration')
  }

  // Validate values
  if (config.analysis.maxWorkers < 1 || config.analysis.maxWorkers > 16) {
    warnings.push('maxWorkers should be between 1 and 16')
  }

  if (
    config.suggestions.confidenceThreshold < 0 ||
    config.suggestions.confidenceThreshold > 1
  ) {
    errors.push('confidenceThreshold must be between 0 and 1')
  }

  if (
    config.logging.level &&
    !['error', 'warn', 'info', 'debug'].includes(config.logging.level)
  ) {
    errors.push('Invalid log level')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
