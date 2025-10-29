const fs = require('fs')
const path = require('path')

/**
 * JSCodeshift transformer that extracts functions from JavaScript files into separate modules
 * @param {Object} fileInfo - File information object containing source and path
 * @param {string} fileInfo.source - The source code content
 * @param {string} fileInfo.path - The file path
 * @param {Object} api - JSCodeshift API object
 * @param {Function} api.jscodeshift - The jscodeshift function for AST manipulation
 * @returns {string} The transformed source code
 */
module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Get the base filename without extension for directory name
  const baseName = path.basename(fileInfo.path, path.extname(fileInfo.path))
  const outputDir = path.join(path.dirname(fileInfo.path), baseName)

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  /** @type {Array<{name: string, type: string, path: string}>} */
  const extractedFunctions = []
  let functionCounter = 0

  /**
   * Extracts a function node into a separate module file
   * @param {Object} functionNode - The AST node representing the function
   * @param {string} functionName - The name to use for the extracted function
   * @param {'FunctionDeclaration'|'FunctionExpression'|'ArrowFunctionExpression'|'MethodDefinition'} nodeType - The type of function node
   */
  function extractFunction(functionNode, functionName, nodeType) {
    let moduleContent

    try {
      if (nodeType === 'ArrowFunctionExpression') {
        // For arrow functions, create a default export directly
        moduleContent = j.program([
          j.exportDefaultDeclaration(functionNode)
        ])
      } else if (nodeType === 'MethodDefinition') {
        // Convert method to regular function declaration
        const regularFunction = j.functionDeclaration(
          j.identifier(functionName),
          functionNode.params || [],
          functionNode.body || j.blockStatement([])
        )
        regularFunction.async = functionNode.async || false
        regularFunction.generator = functionNode.generator || false

        moduleContent = j.program([
          regularFunction,
          j.exportDefaultDeclaration(j.identifier(functionName))
        ])
      } else if (nodeType === 'FunctionExpression') {
        // Convert function expression to function declaration first
        const functionDeclaration = j.functionDeclaration(
          j.identifier(functionName),
          functionNode.params || [],
          functionNode.body || j.blockStatement([])
        )
        functionDeclaration.async = functionNode.async || false
        functionDeclaration.generator = functionNode.generator || false

        moduleContent = j.program([
          functionDeclaration,
          j.exportDefaultDeclaration(j.identifier(functionName))
        ])
      } else {
        // For function declarations, keep as-is and add export
        moduleContent = j.program([
          functionNode,
          j.exportDefaultDeclaration(j.identifier(functionName))
        ])
      }

      // Generate the code
      const code = j(moduleContent).toSource({
        quote: 'single',
        reuseParsers: true
      })

      // Write to file
      const outputPath = path.join(outputDir, `${functionName}.js`)
      fs.writeFileSync(outputPath, code)

      extractedFunctions.push({
        name: functionName,
        type: nodeType,
        path: outputPath
      })
    } catch (error) {
      console.warn(`Failed to extract function ${functionName}:`, error.message)
    }
  }

  // Function to safely add import statement
  function addImportStatement(importStatement) {
    const program = root.find(j.Program)
    if (program.length > 0) {
      const programPath = program.get()
      if (programPath && programPath.value && programPath.value.body) {
        programPath.get('body', 0).insertBefore(importStatement)
      }
    }
  }

  // Store paths to remove to avoid concurrent modification
  const pathsToRemove = []

  /**
   * Find and extract FunctionDeclarations from the AST
   */
  root.find(j.FunctionDeclaration).forEach((path) => {
    if (!path.value || !path.value.id) return

    const func = path.value
    const funcName = func.id ? func.id.name : `anonymousFunction${++functionCounter}`

    extractFunction(func, funcName, 'FunctionDeclaration')

    // Add import statement
    const importStatement = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier(funcName))],
      j.literal(`./${funcName}`)
    )
    addImportStatement(importStatement)

    // Store path for later removal
    pathsToRemove.push(path)
  })

  /**
   * Find and extract FunctionExpressions from the AST
   */
  const functionExpressions = []
  root.find(j.FunctionExpression).forEach((path) => {
    if (!path.value) return

    const func = path.value
    let funcName

    // Try to get name from variable assignment or property
    const parent = path.parent
    if (parent && parent.value && parent.value.type === 'VariableDeclarator' && parent.value.id) {
      funcName = parent.value.id.name
    } else if (parent && parent.value && parent.value.type === 'Property' && parent.value.key) {
      funcName = parent.value.key.name || parent.value.key.value
    } else {
      funcName = `anonymousFunction${++functionCounter}`
    }

    extractFunction(func, funcName, 'FunctionExpression')
    functionExpressions.push({ path, funcName, parent })
  })

  // Process function expressions
  functionExpressions.forEach(({ path, funcName, parent }) => {
    const importStatement = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier(funcName))],
      j.literal(`./${funcName}`)
    )

    if (parent && parent.value && parent.value.type === 'VariableDeclarator') {
      // Insert import and store parent for removal
      addImportStatement(importStatement)
      if (parent.parent) {
        pathsToRemove.push(parent.parent)
      }
    } else {
      path.replace(j.identifier(funcName))
      addImportStatement(importStatement)
    }
  })

  /**
   * Find and extract ArrowFunctionExpressions from the AST
   */
  const arrowFunctions = []
  root.find(j.ArrowFunctionExpression).forEach((path) => {
    if (!path.value) return

    const func = path.value
    let funcName

    const parent = path.parent
    if (parent && parent.value && parent.value.type === 'VariableDeclarator' && parent.value.id) {
      funcName = parent.value.id.name
    } else {
      funcName = `arrowFunction${++functionCounter}`
    }

    extractFunction(func, funcName, 'ArrowFunctionExpression')
    arrowFunctions.push({ path, funcName, parent })
  })

  // Process arrow functions
  arrowFunctions.forEach(({ path, funcName, parent }) => {
    const importStatement = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier(funcName))],
      j.literal(`./${funcName}`)
    )

    if (parent && parent.value && parent.value.type === 'VariableDeclarator') {
      // Insert import and store parent for removal
      addImportStatement(importStatement)
      if (parent.parent) {
        pathsToRemove.push(parent.parent)
      }
    } else {
      path.replace(j.identifier(funcName))
      addImportStatement(importStatement)
    }
  })

  /**
   * Find and extract MethodDefinitions from class bodies
   */
  root.find(j.MethodDefinition).forEach((path) => {
    if (!path.value || !path.value.key || path.value.key.type !== 'Identifier') return

    const method = path.value
    if (method.kind === 'method' && method.key.type === 'Identifier') {
      const methodName = method.key.name

      extractFunction(method.value, methodName, 'MethodDefinition')

      // Add import statement
      const importStatement = j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier(methodName))],
        j.literal(`./${methodName}`)
      )
      addImportStatement(importStatement)

      // Replace method with a call to the imported function
      if (method.value && method.value.params) {
        method.value = j.functionExpression(
          null,
          method.value.params,
          j.blockStatement([
            j.returnStatement(
              j.callExpression(j.identifier(methodName), method.value.params.map(param =>
                param && param.type === 'Identifier' ? j.identifier(param.name) : param
              ).filter(Boolean))
            )
          ])
        )
      }
    }
  })

  // Remove all stored paths safely
  pathsToRemove.forEach((pathToRemove) => {
    try {
      if (pathToRemove && pathToRemove.value) {
        j(pathToRemove).remove()
      }
    } catch (error) {
      console.warn('Failed to remove path:', error.message)
    }
  })

  // Log extraction summary
  console.log(`Extracted ${extractedFunctions.length} functions to ${outputDir}/`)
  extractedFunctions.forEach(func => {
    console.log(`  - ${func.name} (${func.type})`)
  })

  return root.toSource({
    quote: 'single',
    reuseParsers: true
  })
}
