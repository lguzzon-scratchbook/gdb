import path from 'node:path'

export class ModuleGenerator {
  constructor(astParser, dependencyAnalyzer, scopeAnalyzer) {
    this.astParser = astParser
    this.dependencyAnalyzer = dependencyAnalyzer
    this.scopeAnalyzer = scopeAnalyzer
    this.j = astParser.j
    this.modules = new Map()
  }

  generateModule(func, dependencyGraph, originalImports) {
    const deps = dependencyGraph.get(func.name) || {
      internal: [],
      external: []
    }
    const closures = this.scopeAnalyzer.analyzeClosures(func.node)

    let moduleCode = ''

    moduleCode += this._generateImports(
      deps,
      closures,
      originalImports,
      func.name
    )
    moduleCode += this._generateFunctionCode(func)
    moduleCode += this._generateExports(func.name)

    this.modules.set(func.name, {
      filename: this._generateFilename(func),
      code: moduleCode,
      dependencies: deps,
      closures: Array.from(closures.capturedVars)
    })

    return {
      filename: this._generateFilename(func),
      code: moduleCode
    }
  }

  generateAllModules(functions, dependencyGraph, originalImports) {
    const generated = []

    for (const func of functions) {
      const module = this.generateModule(func, dependencyGraph, originalImports)
      generated.push(module)
    }

    return generated
  }

  _generateImports(deps, closures, originalImports, funcName) {
    let imports = ''

    const originalImportMap = new Map()
    for (const imp of originalImports) {
      for (const spec of imp.specifiers) {
        originalImportMap.set(spec.local, {
          source: imp.source,
          imported: spec.imported
        })
      }
    }

    const neededExternals = new Set([
      ...deps.external,
      ...closures.capturedVars
    ])

    for (const extDep of neededExternals) {
      if (originalImportMap.has(extDep)) {
        const impInfo = originalImportMap.get(extDep)
        imports += `import { ${impInfo.imported} } from '${impInfo.source}'\n`
      }
    }

    for (const intDep of deps.internal) {
      imports += `import { ${intDep} } from './${this._generateFilename(intDep)}'\n`
    }

    if (imports) imports += '\n'
    return imports
  }

  _generateFunctionCode(func) {
    const functionCode = this.astParser.getSourceForNode(func.node)
    let code = ''

    if (func.node.type === 'ClassMethod' || func.node.type === 'ObjectMethod') {
      code = `export function ${func.name}(${this._extractParamString(func)}) ${functionCode.slice(functionCode.indexOf('{'))}\n`
    } else if (func.node.type === 'FunctionExpression') {
      code = `export function ${func.name}${functionCode.slice(8)}\n`
    } else if (func.node.type === 'ArrowFunctionExpression') {
      code = `export const ${func.name} = ${functionCode}\n`
    } else {
      code = `export ${functionCode}\n`
    }

    return code
  }

  _extractParamString(func) {
    if (func.params && func.params.length > 0) {
      return func.params
        .map((p) => (typeof p === 'string' ? p : p.name || p))
        .join(', ')
    }
    return ''
  }

  _generateExports(funcName) {
    return `\nexport default ${funcName}\n`
  }

  _generateFilename(func) {
    if (typeof func === 'string') {
      return `${this._sanitizeName(func)}.js`
    }
    return `${this._sanitizeName(func.name)}.js`
  }

  _sanitizeName(name) {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
  }

  getGeneratedModules() {
    return Array.from(this.modules.values())
  }
}

export default ModuleGenerator
