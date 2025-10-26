export class ScopeAnalyzer {
  constructor(astParser) {
    this.astParser = astParser
    this.j = astParser.j
  }

  analyzeClosures(functionNode) {
    const closures = {
      capturedVars: new Set(),
      freeVars: new Set()
    }

    const params = this._extractFunctionParams(functionNode)
    const localVars = new Set()

    const walker = (node) => {
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        localVars.add(node.id.name)
      }

      if (node.type === 'Identifier') {
        const name = node.name
        if (
          !params.has(name) &&
          !localVars.has(name) &&
          !this._isBuiltinGlobal(name)
        ) {
          closures.capturedVars.add(name)
        }
      }
    }

    this._walkAST(functionNode.body || functionNode, walker)

    const globalVars = this.astParser.findGlobalVariables()
    closures.freeVars = new Set(
      Array.from(closures.capturedVars).filter((v) => !globalVars.has(v))
    )

    return closures
  }

  extractSharedVariables(functions) {
    const usageCount = new Map()

    for (const func of functions) {
      const closures = this.analyzeClosures(func.node)
      for (const varName of closures.capturedVars) {
        usageCount.set(varName, (usageCount.get(varName) || 0) + 1)
      }
    }

    const shared = new Map()
    for (const [varName, count] of usageCount) {
      if (count > 1) {
        const globalVars = this.astParser.findGlobalVariables()
        if (globalVars.has(varName)) {
          shared.set(varName, globalVars.get(varName))
        }
      }
    }

    return shared
  }

  preserveLexicalScope(functionNode, dependencies) {
    const scope = {
      imports: new Set(),
      localDeclarations: new Set()
    }

    for (const dep of dependencies.internal) {
      scope.imports.add(dep)
    }

    const walker = (node) => {
      if (node.type === 'VariableDeclaration' && node.declarations.length > 0) {
        for (const decl of node.declarations) {
          if (decl.id.type === 'Identifier') {
            scope.localDeclarations.add(decl.id.name)
          }
        }
      }
    }

    this._walkAST(functionNode.body || functionNode, walker)

    return scope
  }

  _extractFunctionParams(functionNode) {
    const params = new Set()
    if (functionNode.params) {
      for (const param of functionNode.params) {
        if (param.type === 'Identifier') {
          params.add(param.name)
        } else if (
          param.type === 'RestElement' &&
          param.argument.type === 'Identifier'
        ) {
          params.add(param.argument.name)
        } else if (param.type === 'ObjectPattern') {
          this._extractPatternIdentifiers(param, params)
        } else if (param.type === 'ArrayPattern') {
          this._extractPatternIdentifiers(param, params)
        }
      }
    }
    return params
  }

  _extractPatternIdentifiers(pattern, identifiers) {
    if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (
          prop.type === 'RestElement' &&
          prop.argument.type === 'Identifier'
        ) {
          identifiers.add(prop.argument.name)
        } else if (prop.value && prop.value.type === 'Identifier') {
          identifiers.add(prop.value.name)
        }
      }
    } else if (pattern.type === 'ArrayPattern') {
      for (const elem of pattern.elements) {
        if (elem && elem.type === 'Identifier') {
          identifiers.add(elem.name)
        } else if (
          elem &&
          elem.type === 'RestElement' &&
          elem.argument.type === 'Identifier'
        ) {
          identifiers.add(elem.argument.name)
        }
      }
    }
  }

  _walkAST(node, callback) {
    if (!node) return

    callback(node)

    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range') continue
      const child = node[key]

      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && item.type) {
            this._walkAST(item, callback)
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        this._walkAST(child, callback)
      }
    }
  }

  _isBuiltinGlobal(name) {
    const builtins = new Set([
      'console',
      'Math',
      'Object',
      'Array',
      'String',
      'Number',
      'Boolean',
      'Date',
      'RegExp',
      'Error',
      'undefined',
      'null',
      'globalThis',
      'Symbol',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Proxy',
      'Reflect',
      'JSON'
    ])
    return builtins.has(name)
  }
}

export default ScopeAnalyzer
