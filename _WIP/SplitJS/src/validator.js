import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export class Validator {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  async validateGenerated(filePath) {
    this.errors = []
    this.warnings = []

    try {
      await this._biomeBiomeCheck(filePath)
    } catch (error) {
      this.errors.push(`Biome check failed: ${error.message}`)
    }

    try {
      await this._bunCompile(filePath)
    } catch (error) {
      this.errors.push(`Bun compile failed: ${error.message}`)
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  validateModule(code, filename) {
    const issues = {
      errors: [],
      warnings: []
    }

    if (typeof code !== 'string') {
      issues.errors.push(`Invalid code type in ${filename}`)
      return issues
    }

    if (this._hasInvalidImports(code)) {
      issues.errors.push(`Invalid imports detected in ${filename}`)
    }

    if (this._hasMissingExports(code)) {
      issues.warnings.push(`No default export in ${filename}`)
    }

    if (this._hasSyntaxErrors(code)) {
      issues.errors.push(`Syntax errors detected in ${filename}`)
    }

    return issues
  }

  async _biomeBiomeCheck(filePath) {
    try {
      execSync(`bunx @biomejs/biome check --write "${filePath}"`, {
        stdio: 'pipe'
      })
    } catch (error) {
      throw new Error(
        `Biome validation failed: ${error.stderr || error.message}`
      )
    }
  }

  async _bunCompile(filePath) {
    try {
      execSync(`bun build "${filePath}"`, { stdio: 'pipe' })
    } catch (error) {
      throw new Error(
        `Bun compilation failed: ${error.stderr || error.message}`
      )
    }
  }

  _hasInvalidImports(code) {
    if (typeof code !== 'string') return false
    const importRegex =
      /import\s+{?\s*[\w,\s*]+\s*}?\s+from\s+['"`][^'"`]+['"`]/g
    const imports = code.match(importRegex) || []

    return imports.some((imp) => {
      return imp.includes('undefined') || imp.includes('null')
    })
  }

  _hasMissingExports(code) {
    if (typeof code !== 'string') return false
    const hasNamedExport = /export\s+(function|const|let|var|class|default)/
    const hasDefaultExport = /export\s+default/

    return !hasNamedExport.test(code) && !hasDefaultExport.test(code)
  }

  _hasSyntaxErrors(code) {
    if (typeof code !== 'string') return false
    try {
      new Function(code)
      return false
    } catch {
      return true
    }
  }

  validateDependencyGraph(graph) {
    const issues = []

    graph.forEach((deps, funcName) => {
      const missing = []

      deps.internal?.forEach((dep) => {
        if (!graph.has(dep)) {
          missing.push(dep)
        }
      })

      if (missing.length > 0) {
        issues.push({
          function: funcName,
          missingDependencies: missing
        })
      }
    })

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

export default Validator
