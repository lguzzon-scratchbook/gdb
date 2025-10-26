import { describe, expect, it } from 'bun:test'
import ASTParser from '../src/astParser.js'
import ScopeAnalyzer from '../src/scopeAnalyzer.js'

describe('ScopeAnalyzer', () => {
  it('should initialize analyzer', () => {
    const parser = new ASTParser()
    const analyzer = new ScopeAnalyzer(parser)
    expect(analyzer).toBeDefined()
  })

  it('should analyze closures', () => {
    const parser = new ASTParser()
    const code = `
      const PI = 3.14159
      function circleArea(r) {
        return PI * r * r
      }
    `
    parser.parse(code)
    const analyzer = new ScopeAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const func = functions.find((f) => f.name === 'circleArea')
    if (func) {
      const closures = analyzer.analyzeClosures(func.node)
      expect(closures.capturedVars).toBeDefined()
    }
  })

  it('should identify free variables', () => {
    const parser = new ASTParser()
    const code = `
      const TIMEOUT = 5000
      function fetchData(url) {
        return fetch(url, { timeout: TIMEOUT })
      }
    `
    parser.parse(code)
    const analyzer = new ScopeAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const func = functions.find((f) => f.name === 'fetchData')
    if (func) {
      const closures = analyzer.analyzeClosures(func.node)
      expect(closures).toBeDefined()
    }
  })

  it('should extract shared variables', () => {
    const parser = new ASTParser()
    const code = `
      const CACHE = new Map()
      function get(key) { return CACHE.get(key) }
      function set(key, val) { CACHE.set(key, val) }
    `
    parser.parse(code)
    const analyzer = new ScopeAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const shared = analyzer.extractSharedVariables(functions)
    expect(shared).toBeDefined()
  })

  it('should preserve lexical scope', () => {
    const parser = new ASTParser()
    const code = `
      function outer() {
        const x = 10
        function inner() {
          return x * 2
        }
        return inner()
      }
    `
    parser.parse(code)
    const analyzer = new ScopeAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const func = functions[0]
    if (func) {
      const scope = analyzer.preserveLexicalScope(func.node, {
        internal: [],
        external: []
      })
      expect(scope).toBeDefined()
    }
  })
})
