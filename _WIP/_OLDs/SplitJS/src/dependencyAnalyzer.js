export class DependencyAnalyzer {
  constructor(astParser) {
    this.astParser = astParser
    this.j = astParser.j
  }

  analyzeFunctionDependencies(
    functionNode,
    functionName,
    globalVars = new Set()
  ) {
    const dependencies = {
      external: new Set(),
      internal: new Set(),
      globals: new Set()
    }

    const scope = {
      parameters: this._extractParameters(functionNode),
      localVars: new Set()
    }

    const ast = this.j(functionNode)

    ast.find(this.j.Identifier).forEach((path) => {
      const name = path.value.name

      if (this._isParameter(name, scope.parameters)) {
        return
      }

      if (this._isLocalVariable(name, path)) {
        scope.localVars.add(name)
        return
      }

      if (globalVars?.has(name)) {
        dependencies.internal.add(name)
        return
      }

      if (!this._isBuiltinGlobal(name)) {
        dependencies.external.add(name)
      }
    })

    ast.find(this.j.CallExpression).forEach((path) => {
      const callee = path.value.callee
      if (callee.type === 'Identifier') {
        const name = callee.name
        if (!this._isBuiltinGlobal(name) && !scope.parameters.has(name)) {
          if (globalVars.has(name)) {
            dependencies.internal.add(name)
          } else if (!this._isLocalVariable(name, path)) {
            dependencies.external.add(name)
          }
        }
      }
    })

    return {
      functionName,
      dependencies: {
        external: Array.from(dependencies.external),
        internal: Array.from(dependencies.internal),
        globals: Array.from(dependencies.globals)
      }
    }
  }

  resolveDependencyGraph(functions) {
    const graph = new Map()
    const allFunctionNames = new Set(functions.map((f) => f.name))
    const globalVars = this.astParser.findGlobalVariables()

    for (const func of functions) {
      const deps = this.analyzeFunctionDependencies(
        func.node,
        func.name,
        globalVars
      )
      const resolved = {
        internal: deps.dependencies.internal.filter((d) =>
          allFunctionNames.has(d)
        ),
        external: deps.dependencies.external.filter(
          (d) => !allFunctionNames.has(d)
        )
      }
      graph.set(func.name, resolved)
    }

    return graph
  }

  detectCircularDependencies(dependencyGraph) {
    const visited = new Set()
    const recursionStack = new Set()
    const cycles = []

    const dfs = (node, path) => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const deps = dependencyGraph.get(node)?.internal || []
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep, [...path])
        } else if (recursionStack.has(dep)) {
          const cycleStart = path.indexOf(dep)
          const cycle = path.slice(cycleStart).concat([dep])
          cycles.push(cycle)
        }
      }

      recursionStack.delete(node)
    }

    for (const [, node] of dependencyGraph) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }

    return cycles
  }

  _extractParameters(functionNode) {
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
        }
      }
    }
    return params
  }

  _isParameter(name, parameters) {
    return parameters.has(name)
  }

  _isLocalVariable(name, path) {
    let current = path
    while (current.parent) {
      current = current.parent
      if (current.value.type === 'VariableDeclarator') {
        if (
          current.value.id.type === 'Identifier' &&
          current.value.id.name === name
        ) {
          return true
        }
      }
    }
    return false
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
      'window',
      'document',
      'Symbol',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Proxy',
      'Reflect',
      'JSON',
      'isNaN',
      'isFinite',
      'parseFloat',
      'parseInt',
      'encodeURI',
      'encodeURIComponent',
      'decodeURI',
      'decodeURIComponent',
      'require',
      'module',
      'exports',
      'process',
      '__dirname',
      '__filename'
    ])
    return builtins.has(name)
  }
}

export default DependencyAnalyzer
