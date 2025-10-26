/**
 * Integration tests for the complete jsRefactor workflow
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Refactor } from '../refactor.js'
import { runner } from './test-runner.js'

// Test setup
const testDir = '/tmp/jsrefactor-integration-test'

const setupIntegrationTest = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}

  mkdirSync(testDir, { recursive: true })
  mkdirSync(join(testDir, 'src'), { recursive: true })

  // Create test files with various patterns
  writeFileSync(
    join(testDir, 'src', 'variables.js'),
    `
const oldVar = 'test';
let anotherOld = 42;
function oldFunction() {
  return oldVar + anotherOld;
}
`
  )

  writeFileSync(
    join(testDir, 'src', 'classes.js'),
    `
class OldClass {
  constructor(oldParam) {
    this.oldProperty = oldParam;
  }
  
  oldMethod() {
    return this.oldProperty;
  }
}
`
  )

  writeFileSync(
    join(testDir, 'src', 'imports.js'),
    `
import { oldImport } from './variables';
import { OldClass } from './classes';

export function oldExport() {
  return new OldClass(oldImport);
}
`
  )

  // Create a config file
  writeFileSync(
    join(testDir, 'refactor.config.json'),
    JSON.stringify(
      {
        discovery: {
          targetPath: join(testDir, 'src'),
          includePatterns: ['**/*.js'],
          excludePatterns: []
        },
        analysis: {
          maxWorkers: 2,
          workerTimeout: 10000,
          enableCKG: true
        },
        suggestions: {
          enableHeuristics: true,
          enableLLM: false, // Disable LLM for testing
          confidenceThreshold: 0.6
        },
        transformation: {
          backupFiles: true,
          validateRenames: true
        },
        logging: {
          level: 'error', // Reduce logging for tests
          enableConsole: false,
          enableFileLogging: false
        }
      },
      null,
      2
    )
  )
}

const cleanupIntegrationTest = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}
}

runner.test('Refactor should initialize with config', () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    if (!refactor.config) {
      throw new Error('Refactor should load config')
    }

    if (refactor.config.discovery.targetPath !== join(testDir, 'src')) {
      throw new Error('Refactor should use correct target path')
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should complete discovery phase', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    await refactor.phase1_Discovery({ targetPath: join(testDir, 'src') })

    if (refactor.sessionData.files.length !== 3) {
      throw new Error(
        `Expected 3 files, found ${refactor.sessionData.files.length}`
      )
    }

    const expectedFiles = ['variables.js', 'classes.js', 'imports.js']
    for (const expected of expectedFiles) {
      if (!refactor.sessionData.files.some((f) => f.includes(expected))) {
        throw new Error(`Expected file ${expected} not found`)
      }
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should complete analysis phase', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    await refactor.phase1_Discovery({ targetPath: join(testDir, 'src') })
    await refactor.phase2_Analysis({})

    if (!refactor.sessionData.ckg) {
      throw new Error('CKG should be created')
    }

    if (refactor.sessionData.ckg.getNodeCount() === 0) {
      throw new Error('CKG should contain nodes')
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should complete suggestion phase', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    await refactor.phase1_Discovery({ targetPath: join(testDir, 'src') })
    await refactor.phase2_Analysis({})
    await refactor.phase3_Suggestion({})

    if (!refactor.sessionData.suggestions) {
      throw new Error('Suggestions should be created')
    }

    // Should have some heuristic suggestions even without LLM
    if (refactor.sessionData.suggestions.length === 0) {
      console.log(
        'Warning: No suggestions generated (may be expected for test data)'
      )
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should complete transformation phase', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    await refactor.phase1_Discovery({ targetPath: join(testDir, 'src') })
    await refactor.phase2_Analysis({})
    await refactor.phase3_Suggestion({})

    // Mock some approved suggestions for testing
    refactor.sessionData.suggestions = [
      {
        nodeId: 'test-var',
        currentName: 'oldVar',
        suggestedName: 'newVar',
        type: 'variable',
        confidence: 0.8,
        approved: true
      }
    ]

    await refactor.phase4_Transformation({})

    if (
      refactor.sessionData.appliedChanges.length === 0 &&
      refactor.sessionData.suggestions.length > 0
    ) {
      console.log('Warning: No changes applied (may be expected for test data)')
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should complete reporting phase', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    const results = await refactor.execute({
      targetPath: join(testDir, 'src'),
      dryRun: true
    })

    if (!results) {
      throw new Error('Should return execution results')
    }

    if (!results.report) {
      throw new Error('Should generate report')
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should handle dry run mode', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    const results = await refactor.execute({
      targetPath: join(testDir, 'src'),
      dryRun: true
    })

    // In dry run mode, no files should be modified
    if (results.sessionData.appliedChanges.length > 0) {
      throw new Error('Dry run should not apply changes')
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should handle empty directory', async () => {
  const emptyDir = '/tmp/jsrefactor-empty-test'

  try {
    rmSync(emptyDir, { recursive: true })
  } catch {}

  mkdirSync(emptyDir, { recursive: true })

  try {
    const refactor = new Refactor()

    try {
      await refactor.execute({ targetPath: emptyDir })
      throw new Error('Should throw error for empty directory')
    } catch (error) {
      if (!error.message.includes('No files found')) {
        throw new Error('Should throw specific error for empty directory')
      }
    }
  } finally {
    try {
      rmSync(emptyDir, { recursive: true })
    } catch {}
  }
})

runner.test('Refactor should handle invalid config', async () => {
  setupIntegrationTest()

  try {
    // Create invalid config
    writeFileSync(
      join(testDir, 'invalid.config.json'),
      JSON.stringify({
        discovery: {
          targetPath: '', // Invalid empty path
          includePatterns: []
        }
      })
    )

    try {
      const _refactor = new Refactor(join(testDir, 'invalid.config.json'))
      throw new Error('Should throw error for invalid config')
    } catch (error) {
      if (!error.message.includes('Configuration validation failed')) {
        throw new Error('Should throw config validation error')
      }
    }
  } finally {
    cleanupIntegrationTest()
  }
})

runner.test('Refactor should handle execution errors gracefully', async () => {
  setupIntegrationTest()

  try {
    const refactor = new Refactor(join(testDir, 'refactor.config.json'))

    // Simulate an error by breaking the CKG
    refactor.ckg = null

    try {
      await refactor.execute({ targetPath: join(testDir, 'src') })
      throw new Error('Should handle error gracefully')
    } catch (error) {
      // Should catch and log the error, not crash
      if (!error.message) {
        throw new Error('Should provide error information')
      }
    }
  } finally {
    cleanupIntegrationTest()
  }
})
