#!/usr/bin/env bun

/**
 * Test runner for the jsRefactor tool
 * Runs comprehensive tests for all components
 */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Test utilities
class TestRunner {
  constructor() {
    this.tests = []
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    }
  }

  test(name, testFn) {
    this.tests.push({ name, testFn })
  }

  async run() {
    console.log('🧪 Running jsRefactor Test Suite\n')

    for (const { name, testFn } of this.tests) {
      try {
        await testFn()
        console.log(`✅ ${name}`)
        this.results.passed++
      } catch (error) {
        console.log(`❌ ${name}`)
        console.log(`   Error: ${error.message}`)
        this.results.failed++
      }
      this.results.total++
    }

    console.log('\n📊 Test Results:')
    console.log(`   Total: ${this.results.total}`)
    console.log(`   Passed: ${this.results.passed}`)
    console.log(`   Failed: ${this.results.failed}`)
    console.log(
      `   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`
    )

    return this.results.failed === 0
  }
}

// Create test runner instance
const runner = new TestRunner()

// Import test modules
async function runTests() {
  // Colors utility tests
  await import('./colors.test.js')

  // File discovery tests
  await import('./discovery.test.js')

  // Configuration tests
  await import('./config.test.js')

  // Analysis tests
  await import('./analysis.test.js')

  // Suggestions tests
  await import('./suggestions.test.js')

  // Transformation tests
  await import('./transformation.test.js')

  // Integration tests
  await import('./integration.test.js')

  // Run all tests
  const success = await runner.run()
  process.exit(success ? 0 : 1)
}

// Export runner for use in test files
export { runner }

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await runTests()
}
