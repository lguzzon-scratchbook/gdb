import jscodeshift from 'jscodeshift'

export class ASTParser {
  constructor() {
    this.j = jscodeshift
    this.ast = null
    this.source = null
    this.anonymousCounter = 0
    this.namedFunctionCount = new Map()
  }

  parse(sourceCode) {
    this.source = sourceCode
    try {
      this.ast = this.j(sourceCode)
      return this.ast
    } catch (error) {
      throw new Error(`Failed to parse source code: ${error.message}`)
    }
  }

  _generateUniqueId(baseName) {
    if (!this.namedFunctionCount.has(baseName)) {
      this.namedFunctionCount.set(baseName, 0)
    }
    const count = this.namedFunctionCount.get(baseName)
    this.namedFunctionCount.set(baseName, count + 1)
    return count === 0 ? baseName : `${baseName}_${count}`
  }

  findAllFunctions() {
    if (!this.ast) {
      throw new Error('Must parse source code first')
    }

    const functions = []

    this.ast.find(this.j.FunctionDeclaration).forEach((path) => {
      const name = this._generateUniqueId(path.value.id.name)
      functions.push({
        type: 'FunctionDeclaration',
        name,
        path,
        node: path.value,
        params: path.value.params.map((p) => p.name || p.type),
        async: path.value.async || false,
        generator: path.value.generator || false
      })
    })

    this.ast.find(this.j.FunctionExpression).forEach((path) => {
      const contextName = this._extractNameFromContext(path)
      const baseName = path.value.id?.name || contextName || 'anonymous'
      const name = this._generateUniqueId(baseName)
      functions.push({
        type: 'FunctionExpression',
        name,
        path,
        node: path.value,
        params: path.value.params.map((p) => p.name || p.type),
        async: path.value.async || false,
        generator: path.value.generator || false
      })
    })

    this.ast.find(this.j.ArrowFunctionExpression).forEach((path) => {
      const contextName = this._extractNameFromContext(path)
      const baseName = contextName || 'anonymous'
      const name = this._generateUniqueId(baseName)
      functions.push({
        type: 'ArrowFunctionExpression',
        name,
        path,
        node: path.value,
        params: path.value.params.map((p) => p.name || p.type),
        async: path.value.async || false,
        generator: false
      })
    })

    this.ast.find(this.j.ObjectMethod).forEach((path) => {
      functions.push({
        type: 'ObjectMethod',
        name: path.value.key.name || path.value.key.value,
        path,
        node: path.value,
        params: path.value.params.map((p) => p.name || p.type),
        async: path.value.async || false,
        generator: path.value.generator || false
      })
    })

    this.ast.find(this.j.ClassMethod).forEach((path) => {
      functions.push({
        type: 'ClassMethod',
        name: path.value.key.name || path.value.key.value,
        path,
        node: path.value,
        params: path.value.params.map((p) => p.name || p.type),
        async: path.value.async || false,
        generator: path.value.generator || false
      })
    })

    return functions
  }

  findGlobalVariables() {
    if (!this.ast) {
      throw new Error('Must parse source code first')
    }

    const variables = new Map()

    this.ast
      .find(this.j.VariableDeclaration)
      .filter((path) => path.parent.value.type === 'Program')
      .forEach((path) => {
        for (const decl of path.value.declarations) {
          if (decl.id.type === 'Identifier') {
            variables.set(decl.id.name, {
              name: decl.id.name,
              kind: path.value.kind,
              init: decl.init,
              node: decl
            })
          }
        }
      })

    return variables
  }

  findImports() {
    if (!this.ast) {
      throw new Error('Must parse source code first')
    }

    const imports = []

    this.ast.find(this.j.ImportDeclaration).forEach((path) => {
      const specifiers = path.value.specifiers.map((spec) => ({
        imported: spec.imported?.name || spec.local.name,
        local: spec.local.name,
        type: spec.type
      }))

      imports.push({
        source: path.value.source.value,
        specifiers,
        node: path.value
      })
    })

    return imports
  }

  findExports() {
    if (!this.ast) {
      throw new Error('Must parse source code first')
    }

    const exports = []

    this.ast.find(this.j.ExportNamedDeclaration).forEach((path) => {
      if (path.value.declaration) {
        exports.push({
          type: 'named',
          declaration: path.value.declaration,
          node: path.value
        })
      } else {
        exports.push({
          type: 'specifier',
          specifiers: path.value.specifiers,
          node: path.value
        })
      }
    })

    this.ast.find(this.j.ExportDefaultDeclaration).forEach((path) => {
      exports.push({
        type: 'default',
        declaration: path.value.declaration,
        node: path.value
      })
    })

    return exports
  }

  getSourceForNode(node) {
    return this.j(node).toSource()
  }

  _extractNameFromContext(path) {
    const parent = path.parent
    if (!parent) return null

    if (
      parent.value.type === 'VariableDeclarator' &&
      parent.value.id.type === 'Identifier'
    ) {
      return parent.value.id.name
    }

    if (parent.value.type === 'AssignmentExpression') {
      if (parent.value.left.type === 'Identifier') {
        return parent.value.left.name
      }
    }

    return null
  }
}

export default ASTParser
