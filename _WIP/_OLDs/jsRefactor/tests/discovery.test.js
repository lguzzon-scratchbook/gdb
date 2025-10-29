/**
 * Tests for the file discovery module
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FileDiscovery } from '../discovery/findFiles.js'
import { runner } from './test-runner.js'

// Test setup
const testDir = '/tmp/jsrefactor-test'
const setupTestFiles = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}

  mkdirSync(testDir, { recursive: true })
  mkdirSync(join(testDir, 'subdir'), { recursive: true })
  mkdirSync(join(testDir, 'node_modules'), { recursive: true })

  // Create test files
  writeFileSync(join(testDir, 'test1.js'), 'console.log("test1");')
  writeFileSync(join(testDir, 'test2.jsx'), 'export default function() {}')
  writeFileSync(
    join(testDir, 'test3.mjs'),
    'import { something } from "./test"'
  )
  writeFileSync(join(testDir, 'subdir', 'test4.js'), 'const x = 42;')
  writeFileSync(
    join(testDir, 'node_modules', 'package.js'),
    'module.exports = {}'
  )
  writeFileSync(join(testDir, 'README.md'), '# Test')
}

const cleanupTestFiles = () => {
  try {
    rmSync(testDir, { recursive: true })
  } catch {}
}

runner.test('FileDiscovery should find JavaScript files', async () => {
  setupTestFiles()

  try {
    const discovery = new FileDiscovery({
      targetPath: testDir,
      includePatterns: ['**/*.js'],
      excludePatterns: ['node_modules']
    })

    const results = await discovery.findFiles()

    if (results.files.length !== 2) {
      throw new Error(`Expected 2 JS files, found ${results.files.length}`)
    }

    const expectedFiles = ['test1.js', join('subdir', 'test4.js')]
    for (const expected of expectedFiles) {
      if (!results.files.some((f) => f.includes(expected))) {
        throw new Error(`Expected file ${expected} not found`)
      }
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('FileDiscovery should respect exclude patterns', async () => {
  setupTestFiles()

  try {
    const discovery = new FileDiscovery({
      targetPath: testDir,
      includePatterns: ['**/*.js'],
      excludePatterns: ['node_modules', 'subdir']
    })

    const results = await discovery.findFiles()

    if (results.files.length !== 1) {
      throw new Error(`Expected 1 JS file, found ${results.files.length}`)
    }

    if (!results.files[0].includes('test1.js')) {
      throw new Error('Expected test1.js not found')
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('FileDiscovery should find multiple file types', async () => {
  setupTestFiles()

  try {
    const discovery = new FileDiscovery({
      targetPath: testDir,
      includePatterns: ['**/*.js', '**/*.jsx', '**/*.mjs'],
      excludePatterns: ['node_modules']
    })

    const results = await discovery.findFiles()

    if (results.files.length !== 4) {
      throw new Error(`Expected 4 files, found ${results.files.length}`)
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('FileDiscovery should handle non-existent directory', async () => {
  const discovery = new FileDiscovery({
    targetPath: '/non/existent/path',
    includePatterns: ['**/*.js']
  })

  try {
    await discovery.findFiles()
    throw new Error('Should have thrown error for non-existent path')
  } catch (error) {
    if (!error.message.includes('No files found')) {
      throw new Error('Unexpected error message')
    }
  }
})

runner.test('FileDiscovery should return correct statistics', async () => {
  setupTestFiles()

  try {
    const discovery = new FileDiscovery({
      targetPath: testDir,
      includePatterns: ['**/*.js', '**/*.jsx'],
      excludePatterns: ['node_modules']
    })

    const results = await discovery.findFiles()

    if (results.stats.included !== 3) {
      throw new Error(
        `Expected 3 included files, got ${results.stats.included}`
      )
    }

    if (results.stats.excluded !== 1) {
      throw new Error(`Expected 1 excluded file, got ${results.stats.excluded}`)
    }
  } finally {
    cleanupTestFiles()
  }
})

runner.test('FileDiscovery should validate results', async () => {
  setupTestFiles()

  try {
    const discovery = new FileDiscovery({
      targetPath: testDir,
      includePatterns: ['**/*.js']
    })

    const results = await discovery.findFiles()
    const validation = discovery.validateResults(results)

    if (!validation.isValid) {
      throw new Error('Results should be valid')
    }
  } finally {
    cleanupTestFiles()
  }
})
