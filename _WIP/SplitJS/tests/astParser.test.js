import { describe, expect, it } from 'bun:test'
import fs from 'fs'
import ASTParser from '../src/astParser.js'

describe('ASTParser', () => {
  let parser

  it('should initialize parser', () => {
    parser = new ASTParser()
    expect(parser).toBeDefined()
    expect(parser.j).toBeDefined()
  })

  it('should parse simple JavaScript', () => {
    parser = new ASTParser()
    const code = 'function add(a, b) { return a + b }'
    const ast = parser.parse(code)
    expect(ast).toBeDefined()
    expect(parser.ast).toBeDefined()
  })

  it('should throw on invalid code', () => {
    parser = new ASTParser()
    expect(() => {
      parser.parse('function { invalid syntax }')
    }).toThrow()
  })

  it('should find function declarations', () => {
    parser = new ASTParser()
    const code = `
      function add(a, b) { return a + b }
      function subtract(a, b) { return a - b }
    `
    parser.parse(code)
    const functions = parser.findAllFunctions()
    expect(functions.length).toBe(2)
    expect(functions.some((f) => f.name === 'add')).toBe(true)
    expect(functions.some((f) => f.name === 'subtract')).toBe(true)
  })

  it('should find arrow functions', () => {
    parser = new ASTParser()
    const code = 'const multiply = (a, b) => a * b'
    parser.parse(code)
    const functions = parser.findAllFunctions()
    expect(functions.length).toBeGreaterThan(0)
  })

  it('should find async functions', () => {
    parser = new ASTParser()
    const code = 'async function fetchData() { return await fetch("url") }'
    parser.parse(code)
    const functions = parser.findAllFunctions()
    const asyncFunc = functions.find((f) => f.async === true)
    expect(asyncFunc).toBeDefined()
  })

  it('should find global variables', () => {
    parser = new ASTParser()
    const code = `
      const PI = 3.14159
      const NAME = "test"
      let counter = 0
    `
    parser.parse(code)
    const vars = parser.findGlobalVariables()
    expect(vars.size).toBe(3)
    expect(vars.has('PI')).toBe(true)
    expect(vars.has('NAME')).toBe(true)
    expect(vars.has('counter')).toBe(true)
  })

  it('should find imports', () => {
    parser = new ASTParser()
    const code = `
      import { add } from './math'
      import React from 'react'
    `
    parser.parse(code)
    const imports = parser.findImports()
    expect(imports.length).toBe(2)
  })

  it('should find exports', () => {
    parser = new ASTParser()
    const code = `
      export function add() {}
      export const PI = 3.14
      export default App
    `
    parser.parse(code)
    const exports = parser.findExports()
    expect(exports.length).toBeGreaterThan(0)
  })
})
