/**
 * Tests for the configuration module
 */

import { rmSync, writeFileSync } from 'node:fs'
import { loadConfig, validateConfig } from '../config/loader.js'
import { runner } from './test-runner.js'

// Test setup
const testConfigPath = '/tmp/jsrefactor-test-config.json'

runner.test(
  'loadConfig should return default config when no file exists',
  () => {
    const config = loadConfig('/non/existent/config.json')

    if (!config.discovery) {
      throw new Error('Default config should have discovery section')
    }

    if (!config.analysis) {
      throw new Error('Default config should have analysis section')
    }

    if (!config.suggestions) {
      throw new Error('Default config should have suggestions section')
    }
  }
)

runner.test('loadConfig should load custom config file', () => {
  const customConfig = {
    discovery: {
      targetPath: './src',
      includePatterns: ['**/*.ts']
    },
    analysis: {
      maxWorkers: 8
    }
  }

  writeFileSync(testConfigPath, JSON.stringify(customConfig, null, 2))

  try {
    const config = loadConfig(testConfigPath)

    if (config.discovery.targetPath !== './src') {
      throw new Error('Custom config not loaded properly')
    }

    if (config.analysis.maxWorkers !== 8) {
      throw new Error('Custom analysis config not loaded properly')
    }
  } finally {
    try {
      rmSync(testConfigPath)
    } catch {}
  }
})

runner.test('loadConfig should handle invalid JSON gracefully', () => {
  writeFileSync(testConfigPath, '{ invalid json }')

  try {
    const config = loadConfig(testConfigPath)

    // Should fall back to default config
    if (!config.discovery) {
      throw new Error('Should fall back to default config on invalid JSON')
    }
  } finally {
    try {
      rmSync(testConfigPath)
    } catch {}
  }
})

runner.test('validateConfig should validate valid config', () => {
  const validConfig = {
    discovery: {
      targetPath: '.',
      includePatterns: ['**/*.js']
    },
    analysis: {
      maxWorkers: 4,
      workerTimeout: 30000
    },
    suggestions: {
      confidenceThreshold: 0.7
    }
  }

  const validation = validateConfig(validConfig)

  if (!validation.isValid) {
    throw new Error('Valid config should pass validation')
  }

  if (validation.errors.length > 0) {
    throw new Error('Valid config should not have errors')
  }
})

runner.test('validateConfig should detect invalid config', () => {
  const invalidConfig = {
    discovery: {
      targetPath: '', // Empty target path should be invalid
      includePatterns: []
    },
    analysis: {
      maxWorkers: -1 // Negative workers should be invalid
    }
  }

  const validation = validateConfig(invalidConfig)

  if (validation.isValid) {
    throw new Error('Invalid config should fail validation')
  }

  if (validation.errors.length === 0) {
    throw new Error('Invalid config should have errors')
  }
})

runner.test(
  'validateConfig should provide warnings for non-critical issues',
  () => {
    const configWithWarnings = {
      discovery: {
        targetPath: '.',
        includePatterns: ['**/*.js']
      },
      analysis: {
        maxWorkers: 100, // Very high number should generate warning
        workerTimeout: 30000
      },
      suggestions: {
        confidenceThreshold: 0.7
      }
    }

    const validation = validateConfig(configWithWarnings)

    if (!validation.isValid) {
      throw new Error('Config should be valid even with warnings')
    }

    // Should have at least one warning about high worker count
    if (validation.warnings.length === 0) {
      throw new Error('Should generate warnings for edge cases')
    }
  }
)

runner.test('validateConfig should handle missing sections', () => {
  const incompleteConfig = {
    discovery: {
      targetPath: '.'
    }
    // Missing analysis and suggestions sections
  }

  const validation = validateConfig(incompleteConfig)

  if (validation.isValid) {
    throw new Error('Incomplete config should fail validation')
  }
})

runner.test('validateConfig should merge with defaults', () => {
  const partialConfig = {
    discovery: {
      targetPath: './custom'
    }
    // Other sections should be filled with defaults
  }

  const validation = validateConfig(partialConfig)

  if (!validation.isValid) {
    throw new Error(
      'Partial config should be valid after merging with defaults'
    )
  }
})
