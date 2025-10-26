import { describe, expect, it } from 'bun:test'
import fs from 'fs'
import FunctionExtractor from '../src/extractor.js'

describe('FunctionExtractor', () => {
  it('should initialize extractor', () => {
    const extractor = new FunctionExtractor()
    expect(extractor).toBeDefined()
    expect(extractor.parser).toBeDefined()
  })

  it('should extract basic functions', () => {
    const code = `
      function add(a, b) { return a + b }
      function multiply(a, b) { return a * b }
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)
    expect(result.functions.length).toBe(2)
    expect(result.modules.length).toBe(2)
  })

  it('should throw on empty input', () => {
    const code = 'const x = 5'
    const extractor = new FunctionExtractor()
    expect(() => {
      extractor.extract(code)
    }).toThrow()
  })

  it('should detect dependencies', () => {
    const code = `
      function greet(name) {
        return "Hello " + name
      }
      function welcome(name) {
        return greet(name) + "!"
      }
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)
    expect(result.dependencies).toBeDefined()
  })

  it('should generate orchestrator', () => {
    const code = `
      function a() {}
      function b() {}
    `
    const extractor = new FunctionExtractor({ includeOrchestrator: true })
    const result = extractor.extract(code)
    expect(result.orchestrator).toBeDefined()
    expect(result.orchestrator.code).toContain('import')
  })

  it('should handle async functions', () => {
    const code = `
      async function fetch1() { return 1 }
      async function fetch2() { return 2 }
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)
    expect(result.functions.some((f) => f.async === true)).toBe(true)
  })

  it('should handle arrow functions', () => {
    const code = `
      const fn1 = () => 1
      const fn2 = (x) => x * 2
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)
    expect(result.functions.length).toBeGreaterThan(0)
  })

  it('should generate extraction report', () => {
    const code = `
      function a() {}
      function b() {}
    `
    const extractor = new FunctionExtractor()
    const result = extractor.extract(code)
    expect(result.functions).toBeDefined()
    expect(result.modules).toBeDefined()
    expect(result.errors).toBeDefined()
    expect(result.warnings).toBeDefined()
  })
})
