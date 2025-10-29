import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import FunctionExtractor from '../src/extractor.js'
import FileWriter from '../src/fileWriter.js'

describe('Integration Tests', () => {
  const testOutputDir = '/tmp/splitjs-test-output'

  beforeAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true })
    }
  })

  it('should extract and write modules', () => {
    const code = `
      function add(a, b) { return a + b }
      function subtract(a, b) { return a - b }
    `
    const extractor = new FunctionExtractor({ outputDir: testOutputDir })
    const result = extractor.extract(code)

    const fileWriter = new FileWriter(testOutputDir)
    const modules = Array.from(extractor.moduleGenerator.modules.values())

    for (const mod of modules) {
      const modulesDir = path.join(testOutputDir, 'modules')
      if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir, { recursive: true })
      }
      fs.writeFileSync(path.join(modulesDir, mod.filename), mod.code, 'utf-8')
    }

    expect(fs.existsSync(testOutputDir)).toBe(true)
  })

  it('should handle complex extraction', () => {
    const code = `
      const CACHE = new Map()
      
      function createKey(id, type) {
        return \`\${type}:\${id}\`
      }
      
      function get(id, type) {
        const key = createKey(id, type)
        return CACHE.get(key)
      }
      
      function set(id, type, value) {
        const key = createKey(id, type)
        CACHE.set(key, value)
      }
    `
    const extractor = new FunctionExtractor({ outputDir: testOutputDir })
    const result = extractor.extract(code)

    expect(result.functions.length).toBeGreaterThan(0)
    expect(result.modules.length).toBeGreaterThan(0)
    expect(result.dependencies).toBeDefined()
  })

  it('should generate valid manifest', () => {
    const code = `
      function task1() { return 1 }
      function task2() { return task1() + 1 }
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)

    expect(result.manifest).toBeDefined()
    expect(result.manifest.modules).toBeDefined()
    expect(result.manifest.modules.length).toBeGreaterThan(0)
  })

  it('should report extraction statistics', () => {
    const code = `
      function a() {}
      function b() {}
      function c() {}
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)

    expect(result.functions.length).toBe(3)
    expect(result.modules.length).toBe(3)
  })

  it('should handle mixed function types', () => {
    const code = `
      function regular() {}
      async function asyncFn() {}
      function* generatorFn() {}
      const arrowFn = () => {}
      const asyncArrow = async () => {}
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)

    expect(result.functions.length).toBeGreaterThan(0)
    const hasAsync = result.functions.some((f) => f.async)
    expect(hasAsync).toBe(true)
  })
})
