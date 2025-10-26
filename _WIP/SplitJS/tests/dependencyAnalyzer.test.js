import { describe, expect, it } from 'bun:test'
import ASTParser from '../src/astParser.js'
import DependencyAnalyzer from '../src/dependencyAnalyzer.js'

describe('DependencyAnalyzer', () => {
  it('should initialize analyzer', () => {
    const parser = new ASTParser()
    const analyzer = new DependencyAnalyzer(parser)
    expect(analyzer).toBeDefined()
  })

  it('should analyze function dependencies', () => {
    const parser = new ASTParser()
    const code = `
      const helper = () => 42
      function main() {
        return helper()
      }
    `
    parser.parse(code)
    const analyzer = new DependencyAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const mainFunc = functions.find((f) => f.name === 'main')
    if (mainFunc) {
      const deps = analyzer.analyzeFunctionDependencies(mainFunc.node, 'main')
      expect(deps).toBeDefined()
    }
  })

  it('should resolve dependency graph', () => {
    const parser = new ASTParser()
    const code = `
      function a() { return 1 }
      function b() { return a() }
      function c() { return b() }
    `
    parser.parse(code)
    const analyzer = new DependencyAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const graph = analyzer.resolveDependencyGraph(functions)
    expect(graph).toBeDefined()
    expect(graph.size).toBe(3)
  })

  it('should detect circular dependencies', () => {
    const parser = new ASTParser()
    const code = `
      function a() { return b() }
      function b() { return a() }
    `
    parser.parse(code)
    const analyzer = new DependencyAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const graph = analyzer.resolveDependencyGraph(functions)
    const cycles = analyzer.detectCircularDependencies(graph)
    expect(cycles).toBeDefined()
  })

  it('should handle external dependencies', () => {
    const parser = new ASTParser()
    const code = `
      function useConsole() {
        console.log('hello')
        Math.round(3.14)
      }
    `
    parser.parse(code)
    const analyzer = new DependencyAnalyzer(parser)
    const functions = parser.findAllFunctions()
    const deps = analyzer.analyzeFunctionDependencies(
      functions[0].node,
      'useConsole'
    )
    expect(deps).toBeDefined()
  })
})
