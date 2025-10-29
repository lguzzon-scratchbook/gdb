/**
 * Tests for the transformation module
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { applyChanges, ChangeApplier } from '../transformation/apply-changes.js'
import { runner } from './test-runner.js'

// Test setup
const testDir = '/tmp/jsrefactor-transformation-test'

const setupTestFiles = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}

  mkdirSync(testDir, { recursive: true })

  // Create test files
  writeFileSync(
    join(testDir, 'test1.js'),
    'const oldName = "test";\nconsole.log(oldName);'
  )
  writeFileSync(
    join(testDir, 'test2.js'),
    'function oldFunction() { return "test"; }\noldFunction();'
  )
}

const cleanupTestFiles = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}
}

runner.test('ChangeApplier should initialize with config', () => {
  const config = {
    backupFiles: true,
    validateRenames: true
  }

  const applier = new ChangeApplier(config)

  if (applier.config.backupFiles !== true) {
    throw new Error('ChangeApplier should use provided config')
  }
})

runner.test('ChangeApplier should create backups when enabled', async () => {
  setupTestFiles()

  try {
    const applier = new ChangeApplier({ backupFiles: true })

    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldName',
        suggestedName: 'newName',
        type: 'variable',
        file: join(testDir, 'test1.js')
      }
    ]

    await applier.applyChanges(suggestions)

    // Check if backup was created
    if (applier.backups.size === 0) {
      throw new Error('Backup should have been created')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('ChangeApplier should apply variable rename', async () => {
  setupTestFiles()

  try {
    const applier = new ChangeApplier({ backupFiles: false })

    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldName',
        suggestedName: 'newName',
        type: 'variable',
        file: join(testDir, 'test1.js')
      }
    ]

    const changes = await applier.applyChanges(suggestions)

    if (changes.length !== 1) {
      throw new Error('Should have applied one change')
    }

    // Verify the change was applied
    const content = readFileSync(join(testDir, 'test1.js'), 'utf-8')
    if (!content.includes('newName') || content.includes('oldName')) {
      throw new Error('Variable rename not applied correctly')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('ChangeApplier should apply function rename', async () => {
  setupTestFiles()

  try {
    const applier = new ChangeApplier({ backupFiles: false })

    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldFunction',
        suggestedName: 'newFunction',
        type: 'function',
        file: join(testDir, 'test2.js')
      }
    ]

    const changes = await applier.applyChanges(suggestions)

    if (changes.length !== 1) {
      throw new Error('Should have applied one change')
    }

    // Verify the change was applied
    const content = readFileSync(join(testDir, 'test2.js'), 'utf-8')
    if (!content.includes('newFunction') || content.includes('oldFunction')) {
      throw new Error('Function rename not applied correctly')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test(
  'ChangeApplier should handle multiple changes in same file',
  async () => {
    setupTestFiles()

    try {
      const applier = new ChangeApplier({ backupFiles: false })

      const suggestions = [
        {
          nodeId: 'test-node-1',
          currentName: 'oldName',
          suggestedName: 'newName',
          type: 'variable',
          file: join(testDir, 'test1.js')
        },
        {
          nodeId: 'test-node-2',
          currentName: 'console',
          suggestedName: 'logger',
          type: 'variable',
          file: join(testDir, 'test1.js')
        }
      ]

      const changes = await applier.applyChanges(suggestions)

      if (changes.length !== 2) {
        throw new Error('Should have applied two changes')
      }

      // Verify both changes were applied
      const content = readFileSync(join(testDir, 'test1.js'), 'utf-8')
      if (!content.includes('newName') || !content.includes('logger')) {
        throw new Error('Multiple changes not applied correctly')
      }
    } finally {
      cleanupTestFiles()
    }
  }
)

runner.test(
  'ChangeApplier should validate changes before applying',
  async () => {
    setupTestFiles()

    try {
      const applier = new ChangeApplier({ validateRenames: true })

      const suggestions = [
        {
          nodeId: 'test-node',
          currentName: 'oldName',
          suggestedName: 'const', // Reserved keyword should be invalid
          type: 'variable',
          file: join(testDir, 'test1.js')
        }
      ]

      try {
        await applier.applyChanges(suggestions)
        throw new Error('Should have thrown error for invalid rename')
      } catch (error) {
        if (!error.message.includes('Invalid')) {
          throw new Error('Should throw validation error')
        }
      }
    } finally {
      cleanupTestFiles()
    }
  }
)

runner.test('ChangeApplier should restore from backup', async () => {
  setupTestFiles()

  try {
    const applier = new ChangeApplier({ backupFiles: true })

    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldName',
        suggestedName: 'newName',
        type: 'variable',
        file: join(testDir, 'test1.js')
      }
    ]

    // Apply changes
    await applier.applyChanges(suggestions)

    // Restore from backup
    const restored = applier.restoreFromBackup(join(testDir, 'test1.js'))

    if (!restored) {
      throw new Error('Should have restored from backup')
    }

    // Verify restoration
    const content = readFileSync(join(testDir, 'test1.js'), 'utf-8')
    if (!content.includes('oldName') || content.includes('newName')) {
      throw new Error('File not restored correctly from backup')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('applyChanges standalone function should work', async () => {
  setupTestFiles()

  try {
    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldName',
        suggestedName: 'newName',
        type: 'variable',
        file: join(testDir, 'test1.js')
      }
    ]

    const changes = await applyChanges(suggestions, { backupFiles: false })

    if (changes.length !== 1) {
      throw new Error('Standalone function should apply changes')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('ChangeApplier should handle empty suggestions', async () => {
  const applier = new ChangeApplier({})

  const changes = await applier.applyChanges([])

  if (changes.length !== 0) {
    throw new Error('Should handle empty suggestions gracefully')
  }
})

runner.test('ChangeApplier should clean up backups', async () => {
  setupTestFiles()

  try {
    const applier = new ChangeApplier({ backupFiles: true })

    const suggestions = [
      {
        nodeId: 'test-node',
        currentName: 'oldName',
        suggestedName: 'newName',
        type: 'variable',
        file: join(testDir, 'test1.js')
      }
    ]

    await applier.applyChanges(suggestions)

    // Should have backups
    if (applier.backups.size === 0) {
      throw new Error('Should have created backups')
    }

    // Clean up
    const cleaned = applier.cleanUpBackups()

    if (!cleaned) {
      throw new Error('Should have cleaned up backups successfully')
    }

    if (applier.backups.size !== 0) {
      throw new Error('Should have removed all backups')
    }
  } finally {
    cleanupTestFiles()
  }
})
