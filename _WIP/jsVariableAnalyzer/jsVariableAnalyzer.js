#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import jscodeshift from 'jscodeshift'

/**
 * Progress tracker for monitoring execution steps
 */
class ProgressTracker {
  constructor(totalSteps, enableProgress = true) {
    this.totalSteps = totalSteps
    this.currentStep = 0
    this.enableProgress = enableProgress
    this.startTime = Date.now()
    this.stepDetails = []
  }

  nextStep(stepName, substepsTotal = 0) {
    this.currentStep++
    if (this.enableProgress) {
      const percentage = Math.round((this.currentStep / this.totalSteps) * 100)
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)
      console.log(
        `\n[PROGRESS ${percentage}%] Step ${this.currentStep}/${this.totalSteps}: ${stepName} (${elapsed}s elapsed)`
      )
      if (substepsTotal > 0) {
        console.log(`  ├─ Subtasks: 0/${substepsTotal}`)
      }
    }
    this.stepDetails.push({ name: stepName, substepsTotal, substepsCurrent: 0 })
  }

  updateSubstep(stepIndex, substepName, current, total) {
    if (this.enableProgress && stepIndex < this.stepDetails.length) {
      const step = this.stepDetails[stepIndex]
      step.substepsCurrent = current
      const barLength = 20
      const filled = Math.round((current / total) * barLength)
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
      console.log(`  ├─ [${bar}] ${current}/${total}: ${substepName}`)
    }
  }

  complete() {
    if (this.enableProgress) {
      const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1)
      console.log(`\n[✓ COMPLETE] All steps finished in ${totalTime}s\n`)
    }
  }
}

/**
 * @typedef {Object} VariableReference
 * @property {string} name - The variable name
 * @property {number} line - Line number (1-based)
 * @property {number} column - Column number (0-based)
 * @property {string} context - Code context around the reference
 * @property {string} type - Type of reference ('declaration' or 'usage')
 * @property {string} usagePattern - Pattern of usage (e.g., 'function_call', 'property_access', 'assignment')
 */

/**
 * @typedef {Object} VariableInfo
 * @property {string} name - The variable name
 * @property {string} declarationType - Type of declaration (var, let, const, function, class)
 * @property {number} declarationLine - Line where variable is declared
 * @property {number} declarationColumn - Column where variable is declared
 * @property {string} declarationContext - Code context around the declaration
 * @property {VariableReference[]} references - All references to this variable
 * @property {string} inferredType - Inferred type from usage patterns
 * @property {string} scope - Scope level (global, function, block, class)
 * @property {string} scopePath - Full scope hierarchy path (e.g., "global > functionName > blockN")
 * @property {number} scopeDepth - Nesting depth of scope (0 = global)
 * @property {boolean} isExported - Whether this variable is exported
 * @property {string} uniqueId - Unique identifier combining name:line:column
 * @property {Object} scopeRange - Scope boundaries {start: number, end: number}
 */

/**
 * @typedef {Object} ExportInfo
 * @property {Set<string>} exportedNames - All exported names (public API)
 * @property {Map<string, string>} aliasedExports - Maps local name -> export name (internal identifiers)
 * @property {Set<string>} directExports - Direct exports matching local names (public API)
 * @property {Map<string, Object>} exportPatterns - Detailed export pattern information
 */

/**
 * Extracts detailed export information including aliasing patterns
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @returns {ExportInfo} Detailed export information with aliasing details
 */
function extractDetailedExportInfo(sourceCode) {
  const exportedNames = new Set()
  const aliasedExports = new Map()
  const directExports = new Set()
  const exportPatterns = new Map()

  try {
    const ast = jscodeshift(sourceCode)

    // Find all named exports (export { name1, name2, ... })
    ast.find(jscodeshift.ExportNamedDeclaration).forEach((path) => {
      const { node } = path

      // Handle export { name1, name2 }
      if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ExportSpecifier' && spec.local) {
            const localName = spec.local.name
            const exportedName = spec.exported ? spec.exported.name : localName

            exportedNames.add(exportedName)
            exportPatterns.set(exportedName, {
              type: 'named_export',
              localName,
              exportedName,
              isAliased: localName !== exportedName
            })

            if (localName !== exportedName) {
              // Aliased export: local name is an internal implementation detail
              aliasedExports.set(localName, exportedName)
            } else {
              // Direct export: local name matches export name
              directExports.add(localName)
            }
          }
        })
      }

      // Handle export const/let/var name = ...
      if (node.declaration) {
        const decl = node.declaration
        if (decl.type === 'VariableDeclaration' && decl.declarations) {
          decl.declarations.forEach((declarator) => {
            if (declarator.id?.name) {
              const name = declarator.id.name
              exportedNames.add(name)
              directExports.add(name)
              exportPatterns.set(name, {
                type: 'variable_declaration',
                name,
                isAliased: false
              })
            }
          })
        }
        // Handle export function name()
        if (
          (decl.type === 'FunctionDeclaration' ||
            decl.type === 'ClassDeclaration') &&
          decl.id
        ) {
          const name = decl.id.name
          exportedNames.add(name)
          directExports.add(name)
          exportPatterns.set(name, {
            type:
              decl.type === 'FunctionDeclaration'
                ? 'function_declaration'
                : 'class_declaration',
            name,
            isAliased: false
          })
        }
      }
    })

    // Find default exports (function/class declarations are named)
    ast.find(jscodeshift.ExportDefaultDeclaration).forEach((path) => {
      const { node } = path
      if (
        node.declaration &&
        (node.declaration.type === 'FunctionDeclaration' ||
          node.declaration.type === 'ClassDeclaration')
      ) {
        if (node.declaration.id) {
          const name = node.declaration.id.name
          exportedNames.add(name)
          directExports.add(name)
          exportPatterns.set(name, {
            type: 'default_export',
            name,
            isAliased: false
          })
        }
      }
    })
  } catch (error) {
    console.warn('Could not extract export information:', error.message)
  }

  return {
    exportedNames,
    aliasedExports,
    directExports,
    exportPatterns
  }
}

/**
 * Extracts exported names from JavaScript source code (legacy wrapper)
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @returns {Set<string>} Set of exported variable/function names
 */
function extractExportedNames(sourceCode) {
  const exportInfo = extractDetailedExportInfo(sourceCode)
  return exportInfo.exportedNames
}

/**
 * Extracts context lines around a specific line number
 * @param {string[]} sourceLines - Array of source code lines
 * @param {number} targetLine - Target line number (1-based)
 * @param {number} contextSize - Number of lines before and after to include
 * @returns {string} Formatted code block with context
 */
function extractContext(
  sourceLines,
  targetLine,
  contextSize = process.env.CONTEXT_SIZE || 7
) {
  const startLine = Math.max(0, targetLine - contextSize - 1)
  const endLine = Math.min(sourceLines.length, targetLine + contextSize)

  const contextLines = []
  for (let i = startLine; i < endLine; i++) {
    const lineNumber = i + 1
    const isTargetLine = lineNumber === targetLine
    const prefix = isTargetLine ? '>>> ' : '    '
    contextLines.push(
      `${prefix}${lineNumber.toString().padStart(3)}: ${sourceLines[i] || ''}`
    )
  }

  return contextLines.join('\n')
}

/**
 * Gets the line and column position of an AST node
 * @param {Object} node - AST node
 * @returns {{line: number, column: number}} Position information
 */
function getNodePosition(node) {
  return {
    line: node.loc?.start?.line || 1,
    column: node.loc?.start?.column || 0
  }
}

/**
 * Determines if a node is within the scope of a variable declaration
 * @param {Object} declarationNode - The variable declaration node
 * @param {Object} referenceNode - The reference node to check
 * @returns {boolean} True if reference is within scope
 */
function isWithinScope(declarationNode, referenceNode) {
  const declPos = getNodePosition(declarationNode)
  const refPos = getNodePosition(referenceNode)

  return (
    refPos.line > declPos.line ||
    (refPos.line === declPos.line && refPos.column >= declPos.column)
  )
}

/**
 * Analyzes usage patterns for a variable reference
 * @param {Object} path - AST path
 * @param {Object} node - AST node
 * @returns {string} Usage pattern description
 */
function analyzeUsagePattern(path, node) {
  const parent = path.parent
  if (!parent) return 'unknown'

  const parentNode = parent.node

  switch (parentNode.type) {
    case 'CallExpression':
      return parentNode.callee === node ? 'function_call' : 'call_argument'
    case 'MemberExpression':
      return parentNode.property === node ? 'property_access' : 'member_object'
    case 'AssignmentExpression':
      return parentNode.left === node
        ? 'assignment_target'
        : 'assignment_source'
    case 'BinaryExpression':
      return 'binary_operand'
    case 'UnaryExpression':
      return 'unary_operand'
    case 'ReturnStatement':
      return 'return_value'
    case 'ThrowStatement':
      return 'thrown_value'
    case 'NewExpression':
      return 'constructor_call'
    case 'VariableDeclarator':
      return parentNode.init === node ? 'initializer' : 'declaration'
    case 'Property':
      return parentNode.value === node ? 'property_value' : 'property_key'
    case 'ArrayExpression':
      return 'array_element'
    case 'ObjectExpression':
      return 'object_property'
    case 'ConditionalExpression':
    case 'IfStatement':
      return 'condition'
    case 'ForStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
      return 'loop_condition'
    default:
      return 'unknown'
  }
}

/**
 * Infers variable type from usage patterns
 * @param {VariableInfo} variableInfo - Variable information
 * @returns {string} Inferred type
 */
function inferVariableType(variableInfo) {
  const patterns = variableInfo.references.map((ref) => ref.usagePattern)
  const declarationContext = variableInfo.declarationContext.toLowerCase()

  // Check for explicit type hints in declaration context
  if (
    declarationContext.includes('function') ||
    declarationContext.includes('=>')
  ) {
    return 'function'
  }
  if (declarationContext.includes('class')) {
    return 'class'
  }
  if (declarationContext.includes('new ')) {
    return 'object'
  }

  // Analyze usage patterns
  const functionCallPatterns = patterns.filter(
    (p) => p === 'function_call'
  ).length
  const propertyAccessPatterns = patterns.filter(
    (p) => p === 'property_access'
  ).length
  const methodCallPatterns = patterns.filter((p) => p === 'method_call').length

  if (functionCallPatterns > 0) {
    return 'function'
  }
  if (propertyAccessPatterns > 0 || methodCallPatterns > 0) {
    return 'object'
  }

  // Check for common patterns
  const hasArrayOperations = patterns.some(
    (p) =>
      p.includes('array') ||
      declarationContext.includes('[') ||
      declarationContext.includes('push')
  )
  if (hasArrayOperations) {
    return 'array'
  }

  const hasStringOperations = patterns.some(
    (_p) =>
      declarationContext.includes('"') ||
      declarationContext.includes("'") ||
      declarationContext.includes('replace') ||
      declarationContext.includes('split')
  )
  if (hasStringOperations) {
    return 'string'
  }

  const hasNumberOperations = patterns.some(
    (_p) =>
      declarationContext.includes('+') ||
      declarationContext.includes('-') ||
      declarationContext.includes('*') ||
      declarationContext.includes('/')
  )
  if (hasNumberOperations) {
    return 'number'
  }

  return 'unknown'
}



/**
 * Builds a scope hierarchy from AST
 * @param {Object} ast - jscodeshift AST
 * @returns {Object} Root scope node with full hierarchy
 */
function buildScopeHierarchy(ast) {
  const rootScope = {
    type: 'Program',
    name: 'global',
    line: 1,
    parent: null,
    children: [],
    nodeMap: new Map()
  }

  const scopeStack = [rootScope]

  const traverseNode = (node, parent) => {
    if (!node) return

    const currentScope = scopeStack[scopeStack.length - 1]

    // Track ALL nodes by position for proper scope lookup
    if (node.loc) {
      const key = `${node.loc.start.line}:${node.loc.start.column}`
      if (!currentScope.nodeMap.has(key)) {
        currentScope.nodeMap.set(key, node)
      }
    }

    // Handle scope-creating nodes
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      const funcName = node.id?.name || '<anonymous>'
      const funcScope = {
        type: node.type,
        name: funcName,
        line: node.loc?.start?.line || 1,
        endLine: node.loc?.end?.line || Number.POSITIVE_INFINITY,
        parent: currentScope,
        children: [],
        nodeMap: new Map()
      }
      currentScope.children.push(funcScope)
      scopeStack.push(funcScope)

      // Traverse function body
      if (node.body) {
        if (node.body.type === 'BlockStatement') {
          node.body.body?.forEach((child) => traverseNode(child, node))
        } else {
          traverseNode(node.body, node)
        }
      }

      scopeStack.pop()
    } else if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
      const className = node.id?.name || '<anonymous>'
      const classScope = {
        type: node.type,
        name: className,
        line: node.loc?.start?.line || 1,
        endLine: node.loc?.end?.line || Number.POSITIVE_INFINITY,
        parent: currentScope,
        children: [],
        nodeMap: new Map()
      }
      currentScope.children.push(classScope)
      scopeStack.push(classScope)

      // Traverse class body
      node.body?.body?.forEach((child) => traverseNode(child, node))

      scopeStack.pop()
    } else if (node.type === 'BlockStatement' && parent && (parent.type === 'IfStatement' || parent.type === 'ForStatement' || parent.type === 'WhileStatement' || parent.type === 'DoWhileStatement' || parent.type === 'TryStatement')) {
      // Block creates a new scope for let/const in control structures
      const blockScope = {
        type: 'BlockStatement',
        name: '<block>',
        line: node.loc?.start?.line || 1,
        endLine: node.loc?.end?.line || Number.POSITIVE_INFINITY,
        parent: currentScope,
        children: [],
        nodeMap: new Map()
      }
      currentScope.children.push(blockScope)
      scopeStack.push(blockScope)

      node.body?.forEach((child) => traverseNode(child, node))

      scopeStack.pop()
    } else if (node.type === 'Program') {
      node.body?.forEach((child) => traverseNode(child, node))
    } else {
      // Traverse other node types
      if (node.body) {
        if (Array.isArray(node.body)) {
          node.body.forEach((child) => traverseNode(child, node))
        } else {
          traverseNode(node.body, node)
        }
      }
      if (node.consequent) traverseNode(node.consequent, node)
      if (node.alternate) traverseNode(node.alternate, node)
      if (node.test) traverseNode(node.test, node)
    }
  }

  traverseNode(ast.find(jscodeshift.Program).at(0).get().value, null)

  return rootScope
}

/**
 * Finds the scope containing a declaration node
 * @param {Object} declarationNode - The declaration AST node
 * @param {Object} scopeHierarchy - Root scope from buildScopeHierarchy
 * @returns {Object} Scope object containing the declaration
 */
function findScopeForNode(declarationNode, scopeHierarchy) {
  const declPos = getNodePosition(declarationNode)

  // Find the deepest scope that contains this position
  const findDeepestScope = (scope) => {
    // Check if any child scope contains this node
    for (const childScope of scope.children) {
      const declLine = declPos.line
      const scopeStart = childScope.line
      const scopeEnd = childScope.endLine

      // Check if declaration is within this scope's line range
      if (declLine >= scopeStart && declLine <= scopeEnd) {
        const deeperScope = findDeepestScope(childScope)
        if (deeperScope !== scope) {
          return deeperScope
        }
      }
    }
    return scope
  }

  return findDeepestScope(scopeHierarchy)
}

/**
 * Builds a scope path string from a scope node
 * @param {Object} scope - Scope node
 * @returns {string} Formatted scope path (e.g., "global > functionName > blockN")
 */
function getScopePath(scope) {
  const path = []
  let current = scope

  while (current) {
    if (current.type === 'Program') {
      path.unshift('global')
    } else if (current.type === 'FunctionDeclaration' || current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
      path.unshift(`fn:${current.name}`)
    } else if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
      path.unshift(`cls:${current.name}`)
    } else if (current.type === 'BlockStatement') {
      path.unshift(`block:${current.line}`)
    }
    current = current.parent
  }

  return path.join(' > ')
}

/**
 * Determines scope level and depth of a variable
 * @param {Object} declarationNode - The declaration AST node
 * @param {Object} scopeHierarchy - Root scope from buildScopeHierarchy
 * @returns {{level: string, path: string, depth: number}} Scope information
 */
function determineScopeLevel(declarationNode, scopeHierarchy) {
  const scope = findScopeForNode(declarationNode, scopeHierarchy)
  const path = getScopePath(scope)

  // Calculate depth
  let depth = 0
  let current = scope
  while (current?.parent) {
    depth++
    current = current.parent
  }

  // Determine level
  let level = 'global'
  if (scope.type === 'FunctionDeclaration' || scope.type === 'FunctionExpression' || scope.type === 'ArrowFunctionExpression') {
    level = 'function'
  } else if (scope.type === 'BlockStatement') {
    level = 'block'
  } else if (scope.type === 'ClassDeclaration' || scope.type === 'ClassExpression') {
    level = 'class'
  }

  return { level, path, depth }
}

/**
 * Calculates the scope range for a variable declaration
 * @param {Object} declarationNode - AST node of the declaration
 * @param {Object} ast - Full AST or source code
 * @param {number} totalLines - Total number of lines in source (optional)
 * @returns {Object} Scope range {start: line, end: line}
 */
function calculateScopeRange(declarationNode, ast, totalLines = 99999) {
  const startLine = getNodePosition(declarationNode).line
  let endLine = totalLines

  // Walk up the AST to find the containing scope
  const j = typeof ast === 'string' ? jscodeshift(ast) : ast

  // Try to find the end of the containing scope
  // For function declarations, use the function's end
  if (
    declarationNode.type === 'FunctionDeclaration' ||
    declarationNode.type === 'ClassDeclaration'
  ) {
    if (declarationNode.loc?.end?.line) {
      endLine = declarationNode.loc.end.line
    }
  }

  // For variable declarations, find the containing function/program
  let scope = null
  j.find(jscodeshift.Program).forEach((path) => {
    const walker = (node, parent) => {
      // Check if declarationNode is a child of this node
      if (node === declarationNode) {
        scope = parent
      } else if (node.body) {
        const nextParent = node
        if (Array.isArray(node.body)) {
          node.body.forEach((child) => {
            walker(child, nextParent)
          })
        } else if (node.body && typeof node.body === 'object') {
          walker(node.body, nextParent)
        }
      }
    }
    walker(path.node, null)
  })

  // If we found a containing scope, use its end line
  if (scope?.loc?.end?.line) {
    endLine = scope.loc.end.line
  } else if (
    scope === null &&
    declarationNode.type !== 'FunctionDeclaration' &&
    declarationNode.type !== 'ClassDeclaration'
  ) {
    // Top-level declaration - spans to end of file
    endLine = totalLines
  }

  return { start: startLine, end: endLine }
}

/**
 * Creates a unique identifier for a variable declaration (position-based, not name-dependent)
 * @param {string} _name - Variable name (not included in ID to survive renames)
 * @param {number} line - Declaration line
 * @param {number} column - Declaration column
 * @returns {string} Unique identifier
 */
function createUniqueVariableId(_name, line, column) {
  return `${line}:${column}`
}

/**
 * Analyzes a JavaScript source file for variable declarations and references
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @param {string} filename - Name of the file being analyzed
 * @param {Set<string>} exportedNames - Set of exported names to exclude from analysis
 * @returns {VariableInfo[]} Array of variable information objects
 */
function analyzeVariableReferences(sourceCode, filename, exportedNames = null) {
  const sourceLines = sourceCode.split('\n')

  // Extract exported names if not provided
  let names = exportedNames
  if (!names) {
    names = extractExportedNames(sourceCode)
  }

  try {
    const ast = jscodeshift(sourceCode)

    // Find all variable declarations
    // Use an array to handle multiple variables with the same name (shadowing)
    const declarationsList = []

    // Handle var, let, const declarations
    ast.find(jscodeshift.VariableDeclarator).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === 'Identifier') {
        const varName = node.id.name
        const position = getNodePosition(node)
        const parentType = path.parent.value.kind // var, let, const

        // Create unique ID for this declaration
        const uniqueId = createUniqueVariableId(
          varName,
          position.line,
          position.column
        )

        declarationsList.push({
          name: varName,
          declarationType: parentType,
          declarationLine: position.line,
          declarationColumn: position.column,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
          uniqueId,
          scopeRange: { start: position.line, end: sourceLines.length }
        })
      }
    })

    // Handle function declarations
    ast.find(jscodeshift.FunctionDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === 'Identifier') {
        const funcName = node.id.name
        const position = getNodePosition(node)

        const uniqueId = createUniqueVariableId(
          funcName,
          position.line,
          position.column
        )
        const scopeRange = calculateScopeRange(node, ast, sourceLines.length)

        declarationsList.push({
          name: funcName,
          declarationType: 'function',
          declarationLine: position.line,
          declarationColumn: position.column,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
          uniqueId,
          scopeRange
        })
      }
    })

    // Handle class declarations
    ast.find(jscodeshift.ClassDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === 'Identifier') {
        const className = node.id.name
        const position = getNodePosition(node)

        const uniqueId = createUniqueVariableId(
          className,
          position.line,
          position.column
        )
        const scopeRange = calculateScopeRange(node, ast, sourceLines.length)

        declarationsList.push({
          name: className,
          declarationType: 'class',
          declarationLine: position.line,
          declarationColumn: position.column,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
          uniqueId,
          scopeRange
        })
      }
    })

    // Handle function parameters (FunctionDeclaration, FunctionExpression, ArrowFunctionExpression)
    const processFunctionParams = (functionNode, functionPath) => {
      if (!functionNode.params || functionNode.params.length === 0) {
        return
      }

      const funcStartLine = getNodePosition(functionNode).line
      const funcEndLine = functionNode.loc?.end?.line || sourceLines.length

      functionNode.params.forEach((param) => {
        let paramName = null
        let paramNode = param

        // Handle different parameter types: Identifier, RestElement, Pattern, etc.
        if (param.type === 'Identifier') {
          paramName = param.name
          paramNode = param
        } else if (param.type === 'RestElement' && param.argument?.type === 'Identifier') {
          paramName = param.argument.name
          paramNode = param.argument
        } else if (param.type === 'AssignmentPattern' && param.left?.type === 'Identifier') {
          paramName = param.left.name
          paramNode = param.left
        } else if (param.type === 'ArrayPattern') {
          // For array destructured params, extract individual identifiers
          // Object patterns are skipped (semantic binding to single param)
          const identifiers = []
          if (param.elements) {
            param.elements.forEach((elem) => {
              if (elem?.type === 'Identifier') {
                identifiers.push(elem)
              } else if (elem?.type === 'RestElement' && elem.argument?.type === 'Identifier') {
                identifiers.push(elem.argument)
              } else if (elem?.type === 'AssignmentPattern' && elem.left?.type === 'Identifier') {
                identifiers.push(elem.left)
              }
            })
          }

          identifiers.forEach((idNode) => {
            const uniqueId = createUniqueVariableId(
              idNode.name,
              funcStartLine,
              funcStartLine
            )

            declarationsList.push({
              name: idNode.name,
              declarationType: 'parameter',
              declarationLine: funcStartLine,
              declarationColumn: 0,
              declarationContext: extractContext(sourceLines, funcStartLine),
              declarationNode: idNode,
              references: [],
              uniqueId,
              scopeRange: { start: funcStartLine, end: funcEndLine }
            })
          })
          return
        } else if (param.type === 'ObjectPattern') {
          // Skip object destructuring parameters - they represent a single parameter binding
          // The object itself is not tracked as a named symbol in the traditional sense
          return
        }

        if (paramName) {
          const uniqueId = createUniqueVariableId(
            paramName,
            funcStartLine,
            funcStartLine
          )

          declarationsList.push({
            name: paramName,
            declarationType: 'parameter',
            declarationLine: funcStartLine,
            declarationColumn: 0,
            declarationContext: extractContext(sourceLines, funcStartLine),
            declarationNode: paramNode,
            references: [],
            uniqueId,
            scopeRange: { start: funcStartLine, end: funcEndLine }
          })
        }
      })
    }

    // Extract parameters from all function types
    ast.find(jscodeshift.FunctionDeclaration).forEach((path) => {
      processFunctionParams(path.node, path)
    })

    ast.find(jscodeshift.FunctionExpression).forEach((path) => {
      processFunctionParams(path.node, path)
    })

    ast.find(jscodeshift.ArrowFunctionExpression).forEach((path) => {
      processFunctionParams(path.node, path)
    })

    // Find all identifier references
    const processedReferences = new Set()

    ast.find(jscodeshift.Identifier).forEach((path) => {
      const { node } = path
      const varName = node.name

      // Find all declarations with this name
      const matchingDeclarations = declarationsList.filter(
        (d) => d.name === varName
      )
      if (matchingDeclarations.length === 0) {
        return
      }

      const position = getNodePosition(node)
      const referenceKey = `${varName}:${position.line}:${position.column}`

      if (processedReferences.has(referenceKey)) {
        return
      }

      processedReferences.add(referenceKey)

      // Find the correct declaration for this reference
      // Choose the one that is in scope and closest to the reference (most recent declaration)
      // Filter to declarations that are declared before the reference
      const validDeclarations = matchingDeclarations.filter(
        (d) => d.declarationLine < position.line
      )

      if (validDeclarations.length > 0) {
        // Pick the most recent (closest) declaration
        const varInfo = validDeclarations.reduce((closest, current) => {
          return current.declarationLine > closest.declarationLine
            ? current
            : closest
        })

        // Skip if this is the declaration itself
        if (
          position.line === varInfo.declarationLine &&
          node === varInfo.declarationNode.id
        ) {
          return
        }

        // Skip property names and other contexts where renaming would be incorrect
        if (path.parent) {
          const parentNode = path.parent.node
          if (
            (parentNode.type === 'Property' && parentNode.key === node) ||
            (parentNode.type === 'MemberExpression' &&
              parentNode.property === node &&
              !parentNode.computed) ||
            (parentNode.type === 'MethodDefinition' &&
              parentNode.key === node) ||
            (parentNode.type === 'ImportSpecifier' &&
              parentNode.local === node) ||
            (parentNode.type === 'ImportDefaultSpecifier' &&
              parentNode.local === node) ||
            (parentNode.type === 'VariableDeclarator' && parentNode.id === node)
          ) {
            return
          }

          // Skip parameter declaration positions (when identifier is directly in params array)
          // but allow them to be tracked as references inside function bodies
          if (
            (parentNode.type === 'FunctionDeclaration' ||
              parentNode.type === 'FunctionExpression' ||
              parentNode.type === 'ArrowFunctionExpression') &&
            parentNode.params.includes(node)
          ) {
            return
          }
        }

        // Add reference to this specific declaration
        if (isWithinScope(varInfo.declarationNode, node)) {
          const context = extractContext(sourceLines, position.line)
          const usagePattern = analyzeUsagePattern(path, node)

          varInfo.references.push({
            name: varName,
            line: position.line,
            column: position.column,
            context: context,
            type: 'usage',
            usagePattern: usagePattern
          })
        }
      }

      return
    })

    // Build scope hierarchy for accurate scope detection
    const scopeHierarchy = buildScopeHierarchy(ast)

    // Enhance variable information with additional analysis
    for (const varInfo of declarationsList) {
      varInfo.inferredType = inferVariableType(varInfo)
      const scopeInfo = determineScopeLevel(varInfo.declarationNode, scopeHierarchy)
      varInfo.scope = scopeInfo.level
      varInfo.scopePath = scopeInfo.path
      varInfo.scopeDepth = scopeInfo.depth
      varInfo.isExported = names.has(varInfo.name)
    }

    return declarationsList.sort(
      (a, b) => a.declarationLine - b.declarationLine
    )
  } catch (error) {
    console.error(`Error parsing JavaScript in ${filename}:`, error.message)
    return []
  }
}

/**
 * Generates a Markdown report from variable analysis results
 * @param {VariableInfo[]} variables - Array of variable information
 * @param {string} filename - Name of the analyzed file
 * @param {ExportInfo} exportInfo - Export information with aliasing details (optional)
 * @returns {string} Formatted Markdown report
 */
function generateMarkdownReport(variables, filename, exportInfo = null) {
  let report = `# Variable Reference Analysis: ${filename}\n\n`

  if (variables.length === 0) {
    report += 'No variables found or file could not be parsed.\n'
    return report
  }

  // Generate export classification summary if exportInfo is provided
  if (exportInfo) {
    report += '## Export Classification Summary\n\n'
    report += `**Direct Exports (Public API - Protected from renaming):** ${exportInfo.directExports.size}\n`
    report += `**Aliased Exports (Internal identifiers - Eligible for renaming):** ${exportInfo.aliasedExports.size}\n\n`

    if (exportInfo.aliasedExports.size > 0) {
      report += '### Aliased Export Details\n\n'
      for (const [localName, exportedName] of exportInfo.aliasedExports) {
        report += `- \`${localName}\` → \`${exportedName}\` (internal implementation detail, safe for minification)\n`
      }
      report += '\n'
    }
  }

  for (const variable of variables) {
    let exportedLabel = ''
    if (exportInfo) {
      if (exportInfo.directExports.has(variable.name)) {
        exportedLabel = ' [DIRECT EXPORT - Public API - Protected]'
      } else if (exportInfo.aliasedExports.has(variable.name)) {
        exportedLabel = ' [ALIASED EXPORT - Internal ID - Renamable]'
      }
    } else if (variable.isExported) {
      exportedLabel = ' [EXPORTED - Protected from renaming]'
    }

    report += `## Variable: \`${variable.name}\`${exportedLabel}\n\n`
    report += `**Declaration Type:** \`${variable.declarationType}\`  \n`
    report += `**Declared on line:** ${variable.declarationLine}  \n`
    report += `**Inferred Type:** \`${variable.inferredType}\`  \n`
    report += `**Scope Level:** \`${variable.scope}\`  \n`
    report += `**Scope Path:** \`${variable.scopePath}\` (depth: ${variable.scopeDepth})  \n`
    report += `**Exported:** ${variable.isExported ? 'Yes' : 'No'}  \n`
    report += `**Usage Frequency:** ${variable.references.length}\n\n`

    report += `### Declaration Context: \`${variable.name}\`\n\n`
    report += '```javascript\n'
    report += variable.declarationContext
    report += '\n```\n\n'

    report += `**Total references:** ${variable.references.length}\n\n`

    if (variable.references.length === 0) {
      report += '*No references found.*\n\n'
      continue
    }

    for (const reference of variable.references) {
      report += `### Reference at Line ${reference.line}, Column ${reference.column}\n\n`
      report += `**Usage Pattern:** \`${reference.usagePattern}\`\n\n`
      report += '```javascript\n'
      report += reference.context
      report += '\n```\n\n'
    }
  }

  return report
}

/**
 * Main function to analyze JavaScript files for variable references
 * @param {string[]} filePaths - Array of file paths to analyze
 * @param {Object} _options - Options for processing (currently unused)
 */
async function main(filePaths, _options = {}) {
  if (!filePaths || filePaths.length === 0) {
    console.error('Usage: bun jsVariableAnalyzer.js <file1.js> [file2.js] ...')
    process.exit(1)
  }

  // Calculate total steps for progress tracking
  // Analysis steps: 1) Read file, 2) Analyze variables, 3) Generate report
  const stepsPerFile = 3
  const totalSteps = filePaths.length * stepsPerFile
  const progress = new ProgressTracker(totalSteps, true)

  for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
    const filePath = filePaths[fileIndex]
    try {
      progress.nextStep(`Reading file: ${basename(filePath)}`)
      const sourceCode = readFileSync(filePath, 'utf-8')
      const filename = basename(filePath)

      progress.nextStep(`Analyzing variables in: ${filename}`)
      // Extract detailed export information with aliasing analysis
      const exportInfo = extractDetailedExportInfo(sourceCode)
      const variables = analyzeVariableReferences(
        sourceCode,
        filename,
        exportInfo.exportedNames
      )
      console.log(
        `  └─ Found ${variables.length} variables with ${variables.reduce((sum, v) => sum + v.references.length, 0)} total references`
      )

      progress.nextStep(`Generating analysis report for: ${filename}`)
      const analysisReport = generateMarkdownReport(
        variables,
        filename,
        exportInfo
      )
      const analysisOutputPath = `${filePath}-analysis.md`
      writeFileSync(analysisOutputPath, analysisReport)
      console.log(`  └─ Report saved: ${analysisOutputPath}`)
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message)
    }
  }

  progress.complete()
}

// Parse command line arguments
const args = process.argv.slice(2)
const filePaths = args.filter((arg) => !arg.startsWith('--'))
const options = {}

// Run the script with command line arguments
if (import.meta.main) {
  await main(filePaths, options)
}

export {
  ProgressTracker,
  analyzeVariableReferences,
  generateMarkdownReport,
  extractContext,
  extractDetailedExportInfo,
  extractExportedNames,
  calculateScopeRange,
  createUniqueVariableId,
  buildScopeHierarchy,
  findScopeForNode,
  getScopePath,
  determineScopeLevel
}
