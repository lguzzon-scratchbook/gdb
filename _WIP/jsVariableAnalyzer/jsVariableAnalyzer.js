#!/usr/bin/env bun

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import jscodeshift from 'jscodeshift'

/**
 * Logger class for controlling output verbosity levels
 */
class Logger {
  static levels = {
    SILENT: 0, // No output except critical errors
    ERROR: 1, // Only error messages
    WARN: 2, // Errors + warnings
    INFO: 3, // Errors + warnings + informational (default)
    DEBUG: 4, // All above + detailed debugging information
    TRACE: 5 // Most detailed level
  }

  static currentLevel = Logger.levels.INFO
  static enableProgress = true

  static setLevel(level) {
    Logger.currentLevel = level
    Logger.enableProgress = level >= Logger.levels.INFO
  }

  static shouldLog(level) {
    return Logger.currentLevel >= level
  }

  static formatMessage(level, message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const levelName = Object.keys(Logger.levels).find(
      (key) => Logger.levels[key] === level
    )
    return `[${timestamp}] [${levelName}] ${message}`
  }

  static error(message) {
    if (Logger.shouldLog(Logger.levels.ERROR)) {
      console.error(Logger.formatMessage(Logger.levels.ERROR, message))
    }
  }

  static warn(message) {
    if (Logger.shouldLog(Logger.levels.WARN)) {
      console.warn(Logger.formatMessage(Logger.levels.WARN, message))
    }
  }

  static info(message) {
    if (Logger.shouldLog(Logger.levels.INFO)) {
      console.log(Logger.formatMessage(Logger.levels.INFO, message))
    }
  }

  static debug(message) {
    if (Logger.shouldLog(Logger.levels.DEBUG)) {
      console.log(Logger.formatMessage(Logger.levels.DEBUG, message))
    }
  }

  static trace(message) {
    if (Logger.shouldLog(Logger.levels.TRACE)) {
      console.log(Logger.formatMessage(Logger.levels.TRACE, message))
    }
  }

  static progress(message) {
    if (Logger.enableProgress) {
      console.log(message)
    }
  }

  static traceLLM(traceData) {
    if (Logger.shouldLog(Logger.levels.TRACE)) {
      const trace = {
        timestamp: new Date().toISOString(),
        ...traceData
      }
      console.log(
        Logger.formatMessage(
          Logger.levels.TRACE,
          `LLM TRACE: ${JSON.stringify(trace, null, 2)}`
        )
      )
    }
  }

  static debugLLM(traceData) {
    if (Logger.shouldLog(Logger.levels.DEBUG)) {
      const trace = {
        timestamp: new Date().toISOString(),
        ...traceData
      }
      console.log(
        Logger.formatMessage(
          Logger.levels.DEBUG,
          `LLM DEBUG: ${JSON.stringify(trace, null, 2)}`
        )
      )
    }
  }

  static infoLLM(traceData) {
    if (Logger.shouldLog(Logger.levels.INFO)) {
      const trace = {
        timestamp: new Date().toISOString(),
        ...traceData
      }
      console.log(
        Logger.formatMessage(
          Logger.levels.INFO,
          `LLM: ${JSON.stringify(trace)}`
        )
      )
    }
  }
}

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
      Logger.progress(
        `\n[PROGRESS ${percentage}%] Step ${this.currentStep}/${this.totalSteps}: ${stepName} (${elapsed}s elapsed)`
      )
      if (substepsTotal > 0) {
        Logger.progress(`  ├─ Subtasks: 0/${substepsTotal}`)
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
      Logger.progress(`  ├─ [${bar}] ${current}/${total}: ${substepName}`)
    }
  }

  complete() {
    if (this.enableProgress) {
      const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1)
      Logger.progress(`\n[✓ COMPLETE] All steps finished in ${totalTime}s\n`)
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
    Logger.warn('Could not extract export information:', error.message)
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
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
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
    } else if (
      node.type === 'ClassDeclaration' ||
      node.type === 'ClassExpression'
    ) {
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
    } else if (
      node.type === 'BlockStatement' &&
      parent &&
      (parent.type === 'IfStatement' ||
        parent.type === 'ForStatement' ||
        parent.type === 'WhileStatement' ||
        parent.type === 'DoWhileStatement' ||
        parent.type === 'TryStatement')
    ) {
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
    } else if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      path.unshift(`fn:${current.name}`)
    } else if (
      current.type === 'ClassDeclaration' ||
      current.type === 'ClassExpression'
    ) {
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
  if (
    scope.type === 'FunctionDeclaration' ||
    scope.type === 'FunctionExpression' ||
    scope.type === 'ArrowFunctionExpression'
  ) {
    level = 'function'
  } else if (scope.type === 'BlockStatement') {
    level = 'block'
  } else if (
    scope.type === 'ClassDeclaration' ||
    scope.type === 'ClassExpression'
  ) {
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
        } else if (
          param.type === 'RestElement' &&
          param.argument?.type === 'Identifier'
        ) {
          paramName = param.argument.name
          paramNode = param.argument
        } else if (
          param.type === 'AssignmentPattern' &&
          param.left?.type === 'Identifier'
        ) {
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
              } else if (
                elem?.type === 'RestElement' &&
                elem.argument?.type === 'Identifier'
              ) {
                identifiers.push(elem.argument)
              } else if (
                elem?.type === 'AssignmentPattern' &&
                elem.left?.type === 'Identifier'
              ) {
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
      const scopeInfo = determineScopeLevel(
        varInfo.declarationNode,
        scopeHierarchy
      )
      varInfo.scope = scopeInfo.level
      varInfo.scopePath = scopeInfo.path
      varInfo.scopeDepth = scopeInfo.depth
      varInfo.isExported = names.has(varInfo.name)
    }

    return declarationsList.sort(
      (a, b) => a.declarationLine - b.declarationLine
    )
  } catch (error) {
    Logger.error(`Error parsing JavaScript in ${filename}:`, error.message)
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

    report += `## Variable: \`${variable.scopePath} > ${variable.name}\`${exportedLabel}\n\n`
    report += `**Declaration Type:** \`${variable.declarationType}\`  \n`
    report += `**Declared on line:** ${variable.declarationLine}  \n`
    report += `**Inferred Type:** \`${variable.inferredType}\`  \n`
    report += `**Scope Level:** \`${variable.scope}\`  \n`
    report += `**Scope Path:** \`${variable.scopePath}\` (depth: ${variable.scopeDepth})  \n`
    report += `**Exported:** ${variable.isExported ? 'Yes' : 'No'}  \n`
    report += `**Usage Frequency:** ${variable.references.length}\n\n`

    report += `### Declaration Context: \`${variable.scopePath} > ${variable.name}\`\n\n`
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
 * Generates an enhanced prompt with comprehensive code contexts
 * @param {Object} symbolInfo - Symbol information including context
 * @returns {string} Enhanced prompt for LLM
 */
function generateEnhancedPrompt(symbolInfo) {
  // Group references by usage pattern
  const usageGroups = symbolInfo.references.reduce((groups, ref) => {
    const pattern = ref.usagePattern || 'unknown'
    if (!groups[pattern]) {
      groups[pattern] = []
    }
    groups[pattern].push(ref)
    return groups
  }, {})

  // Build usage patterns section
  const usagePatternsSection = Object.entries(usageGroups)
    .map(([pattern, refs]) => {
      const count = refs.length
      const examples = refs.slice(0, 2).map(r => r.context.trim()).join('\n')
      return `**${pattern}** (${count} occurrences)\n\`\`\`javascript\n${examples}\n\`\`\``
    })
    .join('\n\n')

  // Build code contexts section with representative examples
  const allContexts = symbolInfo.references
    .filter(ref => ref.context && ref.context.trim())
    .map(ref => ({
      context: ref.context.trim(),
      line: ref.line,
      type: ref.type,
      pattern: ref.usagePattern
    }))
    .sort((a, b) => a.line - b.line)

  // Select diverse contexts (limit to prevent token overflow)
  const maxContexts = Math.min(8, allContexts.length)
  const selectedContexts = []
  const usedPatterns = new Set()

  // First, ensure we have examples of each usage pattern
  Object.keys(usageGroups).forEach(pattern => {
    const context = allContexts.find(c => c.pattern === pattern && !usedPatterns.has(pattern))
    if (context && selectedContexts.length < maxContexts) {
      selectedContexts.push(context)
      usedPatterns.add(pattern)
    }
  })

  // Fill remaining slots with other contexts
  allContexts.forEach(context => {
    if (selectedContexts.length >= maxContexts) return
    if (selectedContexts.some(c => c.line === context.line)) return
    selectedContexts.push(context)
  })

  const codeContextsSection = selectedContexts
    .map(ref => `Line ${ref.line} (${ref.type}, ${ref.pattern}):\n\`\`\`javascript\n${ref.context}\n\`\`\``)
    .join('\n\n')

  // Build the enhanced prompt
  return `Generate a meaningful JavaScript identifier name based on comprehensive code analysis.

## VARIABLE TO RENAME
Name: ${symbolInfo.name}
Type: ${symbolInfo.inferredType}
Declaration: ${symbolInfo.declarationType}
Scope: ${symbolInfo.scopePath}
References: ${symbolInfo.references.length} total

## DECLARATION CONTEXT
\`\`\`javascript
${symbolInfo.declarationContext.trim()}
\`\`\`

## USAGE PATTERNS
${usagePatternsSection}

## REPRESENTATIVE CODE CONTEXTS
${codeContextsSection}

## NAMING REQUIREMENTS
- Return ONLY the camelCase identifier name
- Must be valid JavaScript identifier
- Should reflect the variable's purpose and usage patterns
- Consider the semantic domain and code context
- Keep it concise but descriptive
- Follow JavaScript naming conventions

Generated name:`
}

/**
 * Calls OpenRouter API to generate a meaningful symbol name
 * @param {Object} symbolInfo - Symbol information including context
 * @param {string} apiKey - OpenRouter API key
 * @param {string} model - Model name (default: openai/gpt-5-nano)
 * @param {number} temperature - Temperature for LLM (default: 0.01)
 * @returns {Promise<string>} Generated symbol name
 */
async function generateSymbolNameViaLLM(
  symbolInfo,
  apiKey,
  model = 'openai/gpt-4o-mini',
  temperature = 0.01
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  const prompt = generateEnhancedPrompt(symbolInfo)

  // Log LLM request initiation
  Logger.infoLLM({
    requestId,
    symbolName: symbolInfo.name,
    symbolType: symbolInfo.inferredType,
    symbolScope: symbolInfo.scope,
    model,
    temperature,
    maxTokens: 800,
    promptLength: prompt.length,
    phase: 'REQUEST_INITIATED'
  })

  try {
    // Validate API key format before making request
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('INVALID_API_KEY: No OpenRouter API key provided')
    }

    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('Bearer ')) {
      throw new Error(
        'INVALID_API_KEY: API key does not appear to be valid (should start with "sk-")'
      )
    }

    // Log detailed request at DEBUG level
    Logger.debugLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'API_KEY_VALIDATED',
      apiKeyPrefix: `${apiKey.substring(0, 7)}...`
    })

    Logger.traceLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'FULL_PROMPT',
      prompt
    })

    const requestBody = {
      model,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800
    }

    const requestHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }

    // Log request details
    Logger.debugLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'REQUEST_SENT',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': requestHeaders['Content-Type'],
        Authorization: 'Bearer [REDACTED]'
      },
      body: requestBody
    })

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      }
    )

    const responseTime = Date.now() - startTime

    // Log response received
    Logger.debugLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'RESPONSE_RECEIVED',
      status: response.status,
      statusText: response.statusText,
      responseTime,
      headers: {
        'content-type': response.headers.get('content-type'),
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        'x-ratelimit-limit': response.headers.get('x-ratelimit-limit')
      }
    })

    // Comprehensive HTTP status error handling
    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}`

      if (response.status === 401) {
        errorDetails +=
          ' AUTHENTICATION_FAILED: Invalid API key or insufficient permissions'
      } else if (response.status === 403) {
        errorDetails +=
          " FORBIDDEN: API key doesn't have access to this model or endpoint"
      } else if (response.status === 429) {
        errorDetails +=
          ' RATE_LIMIT: Too many requests, API quota exceeded or rate limited'
      } else if (response.status === 500) {
        errorDetails +=
          ' SERVER_ERROR: OpenRouter service is experiencing issues'
      } else if (response.status === 503) {
        errorDetails +=
          ' SERVICE_UNAVAILABLE: OpenRouter is temporarily unavailable'
      } else if (response.status >= 400 && response.status < 500) {
        errorDetails +=
          ' CLIENT_ERROR: Invalid request parameters or model name'
      } else if (response.status >= 500) {
        errorDetails += ' SERVER_ERROR: OpenRouter service error'
      }

      // Log error response
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'API_ERROR',
        status: response.status,
        errorDetails,
        responseTime
      })

      throw new Error(`API_ERROR: ${errorDetails}`)
    }

    // Parse response with detailed error context
    let data
    try {
      data = await response.json()

      // Log successful response parsing
      Logger.debugLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'RESPONSE_PARSED',
        responseSize: JSON.stringify(data).length,
        hasChoices: !!(data.choices && Array.isArray(data.choices)),
        choicesCount: data.choices ? data.choices.length : 0
      })
    } catch (parseError) {
      // Log parsing error
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'PARSE_ERROR',
        error: parseError.message,
        responseTime
      })

      throw new Error(
        `RESPONSE_PARSE_ERROR: Failed to parse JSON response - ${parseError.message}`
      )
    }

    // Check for API error in response body
    if (data.error) {
      const errorMsg = data.error.message || data.error.type || 'Unknown error'

      // Log API error from response body
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'API_BODY_ERROR',
        error: errorMsg,
        responseTime
      })

      throw new Error(`API_RETURNED_ERROR: ${errorMsg}`)
    }

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices)) {
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'INVALID_STRUCTURE',
        error: 'Response missing "choices" array',
        responseTime
      })

      throw new Error(
        'INVALID_RESPONSE_STRUCTURE: Response missing "choices" array'
      )
    }

    if (data.choices.length === 0) {
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'EMPTY_RESPONSE',
        error: 'No choices returned from API',
        responseTime
      })

      throw new Error('EMPTY_RESPONSE: No choices returned from API')
    }

    const firstChoice = data.choices[0]

    // Log choice structure analysis
    Logger.traceLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'CHOICE_ANALYSIS',
      choiceStructure: {
        hasMessage: !!firstChoice.message,
        hasContent: !!firstChoice.message?.content,
        hasReasoning: !!firstChoice.message?.reasoning,
        hasDirectContent: !!firstChoice.content,
        hasText: !!firstChoice.text,
        messageKeys: firstChoice.message ? Object.keys(firstChoice.message) : []
      }
    })

    // Handle both message.content and direct content structures
    let generatedName = null
    let responseStructure = 'unknown'

    if (firstChoice.message?.content?.trim()) {
      generatedName = firstChoice.message.content
      responseStructure = 'message.content'
    } else if (firstChoice.content?.trim()) {
      // Fallback for APIs that return content directly
      generatedName = firstChoice.content
      responseStructure = 'direct.content'
    } else if (firstChoice.text?.trim()) {
      // Fallback for APIs that return text directly
      generatedName = firstChoice.text
      responseStructure = 'direct.text'
    } else if (firstChoice.message?.reasoning) {
      // If content is empty but reasoning exists, try to extract the answer from reasoning
      const reasoning = firstChoice.message.reasoning
      const match = reasoning.match(
        /(?:new\s+)?name[:\s]+[`]?([a-zA-Z_$][a-zA-Z0-9_$]*)[`]?/i
      )
      if (match?.[1]) {
        generatedName = match[1]
        responseStructure = 'reasoning.extracted'
      } else {
        // Try to find any valid identifier in the reasoning
        const idMatch = reasoning.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]{3,})\b/)
        generatedName = idMatch ? idMatch[1] : null
        responseStructure = 'reasoning.fallback'
      }

      Logger.traceLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'REASONING_EXTRACTION',
        reasoning: `${reasoning.substring(0, 200)}...`,
        extractedName: generatedName,
        extractionMethod: responseStructure
      })
    }

    if (!generatedName) {
      // Log actual structure for debugging
      const structureInfo = JSON.stringify(firstChoice, null, 2)

      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'CONTENT_EXTRACTION_FAILED',
        structure: structureInfo.substring(0, 500),
        responseTime
      })

      throw new Error(
        `INVALID_CHOICE_STRUCTURE: Unable to find content in choice. Structure: ${structureInfo.substring(0, 500)}`
      )
    }

    generatedName = generatedName.trim()

    // Log successful extraction
    Logger.debugLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'NAME_EXTRACTED',
      generatedName,
      responseStructure,
      originalLength: firstChoice.message?.content?.length || 0,
      responseTime
    })

    // Validate generated name is not empty
    if (!generatedName) {
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'EMPTY_GENERATION',
        error: 'API returned empty content',
        responseTime
      })

      throw new Error('EMPTY_GENERATION: API returned empty content')
    }

    // Validate generated name format
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(generatedName)) {
      Logger.infoLLM({
        requestId,
        symbolName: symbolInfo.name,
        phase: 'INVALID_IDENTIFIER',
        error: `Generated name "${generatedName}" is not a valid JavaScript identifier`,
        responseTime
      })

      throw new Error(
        `INVALID_IDENTIFIER: Generated name "${generatedName}" is not a valid JavaScript identifier. Expected camelCase starting with letter, $, or _, containing only alphanumeric, $, or _ characters`
      )
    }

    // Log final success
    Logger.infoLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'SUCCESS',
      generatedName,
      responseStructure,
      responseTime
    })

    return generatedName
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Format comprehensive error message with multiple details
    let errorSummary = error.message || 'Unknown error occurred'

    // Add additional context for network errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        errorSummary = `NETWORK_ERROR: Failed to connect to OpenRouter API - ${error.message}`
      } else {
        errorSummary = `INTERNAL_ERROR: ${error.message}`
      }
    }

    // Log comprehensive error trace
    Logger.infoLLM({
      requestId,
      symbolName: symbolInfo.name,
      phase: 'CATCH_ERROR',
      errorType: errorSummary.split(':')[0],
      errorDetails: errorSummary,
      responseTime
    })

    Logger.error(`\n    [LLM ERROR] Symbol: '${symbolInfo.name}'`)
    Logger.error(`    └─ Error Type: ${errorSummary.split(':')[0]}`)
    Logger.error(`    └─ Details: ${errorSummary}`)
    Logger.error(
      '    └─ Troubleshooting: Check API key validity, rate limits, model availability, and network connectivity'
    )

    return null
  }
}

/**
 * Generates a mock name for dry-run mode (deterministic)
 * @param {Object} symbolInfo - Symbol information
 * @returns {string} Generated mock name
 */
function generateMockSymbolName(symbolInfo) {
  const descriptors = {
    function: ['handler', 'processor', 'worker', 'task', 'compute'],
    object: ['config', 'settings', 'context', 'instance', 'entity'],
    array: ['items', 'list', 'collection', 'set', 'batch'],
    string: ['text', 'message', 'label', 'title', 'content'],
    number: ['count', 'total', 'value', 'amount', 'metric'],
    unknown: ['temp', 'cache', 'state', 'buffer', 'store']
  }

  const type = symbolInfo.inferredType || 'unknown'
  const words = descriptors[type] || descriptors.unknown

  const hash = symbolInfo.name
    .split('')
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffffffff, 0)
  const wordIndex = Math.abs(hash) % words.length
  const suffix = Math.abs(hash).toString(16).slice(0, 3)

  return `${words[wordIndex]}${suffix}`
}

/**
 * Performs symbol renaming using jscodeshift
 * @param {string} sourceCode - Source code to transform
 * @param {string} oldName - Symbol to rename from
 * @param {string} newName - Symbol to rename to
 * @returns {string} Transformed source code
 */
function renameSymbolWithJscodeshift(sourceCode, oldName, newName) {
  try {
    const j = jscodeshift
    const ast = j(sourceCode)

    ast.find(j.Identifier).forEach((path) => {
      if (path.node.name === oldName) {
        // Skip property keys in member expressions
        if (
          path.parent?.node?.type === 'MemberExpression' &&
          path.parent.node.property === path.node &&
          !path.parent.node.computed
        ) {
          return
        }
        // Skip object property keys
        if (
          path.parent?.node?.type === 'Property' &&
          path.parent.node.key === path.node
        ) {
          return
        }

        path.node.name = newName
      }
    })

    return ast.toSource()
  } catch (error) {
    Logger.warn(`jscodeshift transformation failed: ${error.message}`)
    return null
  }
}

/**
 * Validates JavaScript syntax using Node.js
 * @param {string} sourceCode - Source code to validate
 * @returns {boolean} True if syntax is valid
 */
function validateSyntax(sourceCode) {
  try {
    const tempFile = `/tmp/syntax_check_${Date.now()}.js`
    writeFileSync(tempFile, sourceCode)
    execSync(`node -c "${tempFile}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Creates the renamed directory and initializes the working file
 * @param {string} filePath - Original file path
 * @param {string} sourceCode - Original source code
 * @returns {Object} Working directory info {renamedDir, workingFile}
 */
function setupRenamedDirectory(filePath, sourceCode) {
  const fileDir = dirname(filePath)
  const fileName = basename(filePath)
  const renamedDir = join(fileDir, `${fileName.split('.')[0]}_renamed`)

  mkdirSync(renamedDir, { recursive: true })

  const workingFile = join(renamedDir, fileName)

  // Only initialize the working file if it doesn't exist (fresh start)
  // If resuming, preserve the existing working file with previous transformations
  if (!existsSync(workingFile)) {
    writeFileSync(workingFile, sourceCode)
  }

  return { renamedDir, workingFile }
}

/**
 * Saves an intermediate version file
 * @param {string} renamedDir - Renamed directory path
 * @param {string} fileName - Original file name
 * @param {string} sourceCode - Source code
 * @param {number} sequenceNumber - Sequence number
 * @param {string} oldSymbol - Old symbol name
 * @param {string} newSymbol - New symbol name
 * @returns {string} Path to saved file
 */
function saveVersionFile(
  renamedDir,
  fileName,
  sourceCode,
  sequenceNumber,
  oldSymbol,
  newSymbol
) {
  const ext = fileName.split('.').pop()
  const baseName = fileName.split('.')[0]
  const versionFileName = `${baseName}_${sequenceNumber}_${oldSymbol}_${newSymbol}.${ext}`
  const versionPath = join(renamedDir, versionFileName)

  writeFileSync(versionPath, sourceCode)
  return versionPath
}

/**
 * Identifies symbols eligible for renaming
 * @param {VariableInfo[]} variables - Variable information
 * @param {number} lengthThreshold - Minimum length threshold (symbols shorter than this are eligible)
 * @returns {VariableInfo[]} Filtered variables eligible for renaming
 */
function getRenameCandidates(variables, lengthThreshold = 4) {
  return variables.filter(
    (v) =>
      v.name.length < lengthThreshold &&
      !v.isExported &&
      v.references.length > 0
  )
}

/**
 * Represents the state of a renaming session
 * @typedef {Object} RenameSessionState
 * @property {Array<{old: string, new: string, line: number}>} renamedSymbols - List of completed renames
 * @property {number} totalRenames - Total renames completed in session
 * @property {string} timestamp - When state was last updated
 * @property {string} sourceFileHash - Hash of original source for conflict detection
 * @property {number} lastSequenceNumber - Last version file sequence number
 */

/**
 * Saves renaming state to a JSON file
 * @param {string} renamedDir - Directory containing rename state
 * @param {Object} state - State object to save
 */
function saveRenameState(renamedDir, state) {
  const stateFile = join(renamedDir, '.rename-state.json')
  writeFileSync(
    stateFile,
    JSON.stringify(
      {
        ...state,
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  )
}

/**
 * Loads renaming state from a JSON file
 * @param {string} renamedDir - Directory containing rename state
 * @returns {RenameSessionState|null} State object or null if not found
 */
function loadRenameState(renamedDir) {
  const stateFile = join(renamedDir, '.rename-state.json')
  if (!existsSync(stateFile)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(stateFile, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Computes a simple hash of source code for conflict detection
 * @param {string} sourceCode - Source code to hash
 * @returns {string} Hash value
 */
function computeSourceHash(sourceCode) {
  let hash = 0
  for (let i = 0; i < sourceCode.length; i += 100) {
    const charCode = sourceCode.charCodeAt(i)
    hash = ((hash << 5) - hash + charCode) | 0
  }
  return hash.toString(16)
}

/**
 * Detects if source code has been modified externally
 * @param {string} sourceCode - Current source code
 * @param {string} expectedHash - Expected hash from previous state
 * @returns {boolean} True if source appears to be modified
 */
function isSourceModified(sourceCode, expectedHash) {
  const currentHash = computeSourceHash(sourceCode)
  return currentHash !== expectedHash
}

/**
 * Executes the full symbol renaming workflow
 * @param {string} filePath - Path to source file
 * @param {Object} options - Renaming options
 * @param {number} options.lengthThreshold - Symbol length threshold (default: 4)
 * @param {boolean} options.dryRun - Enable dry-run mode (default: false)
 * @param {string} options.apiKey - OpenRouter API key
 * @param {number} options.maxRenames - Maximum number of renames per execution (default: 3)
 * @returns {Promise<string>} Path to final renamed file
 */
async function executeRenamingWorkflow(filePath, options = {}) {
  const lengthThreshold = Math.max(4, options.lengthThreshold || 4)
  const dryRun = options.dryRun || false
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY
  const maxRenames = Math.max(1, options.maxRenames || 3)

  if (!dryRun && !apiKey) {
    Logger.warn('No OpenRouter API key provided. Use --dry-run for testing.')
    return null
  }

  try {
    const originalSourceCode = readFileSync(filePath, 'utf-8')
    const fileName = basename(filePath)

    Logger.info(`\n[RENAMING] Initializing symbol renaming for: ${fileName}`)
    const { renamedDir, workingFile } = setupRenamedDirectory(
      filePath,
      originalSourceCode
    )
    Logger.info(`  └─ Working directory: ${renamedDir}`)
    Logger.info(`  └─ Max renames per execution: ${maxRenames}`)

    // Load previous state if it exists
    const previousState = loadRenameState(renamedDir)
    let currentCode = readFileSync(workingFile, 'utf-8')
    let sequenceNumber = 0
    let totalRenamed = 0
    let sessionStartIndex = 0

    if (previousState) {
      Logger.info(
        `\n[RESUMING] Previous session found (${previousState.totalRenames} renames completed)`
      )

      // Check for external modifications
      if (isSourceModified(currentCode, previousState.sourceFileHash)) {
        Logger.warn(
          '  ⚠ External modifications detected in renamed file. Attempting to continue...'
        )
      }

      sessionStartIndex = previousState.totalRenames
      sequenceNumber = previousState.lastSequenceNumber || 0
      totalRenamed = previousState.totalRenames

      if (totalRenamed >= maxRenames) {
        Logger.info(
          `  └─ Session already has ${totalRenamed} renames (limit: ${maxRenames})`
        )
        Logger.info('  └─ Run again with higher --max-renames to continue')
        return workingFile
      }
    } else {
      Logger.info('  └─ Starting new renaming session')
      // Clear state file for fresh start
      const sourceHash = computeSourceHash(originalSourceCode)
      currentCode = originalSourceCode
      saveRenameState(renamedDir, {
        renamedSymbols: [],
        totalRenames: 0,
        sourceFileHash: sourceHash,
        lastSequenceNumber: 0
      })
    }

    let iterationCount = 0
    const maxIterations = 100
    const renamedSymbols = previousState?.renamedSymbols || []

    while (iterationCount < maxIterations) {
      iterationCount++

      // Stop if we've reached the max renames limit
      if (totalRenamed >= maxRenames) {
        Logger.info(
          `\n[BATCH COMPLETE] Renamed ${totalRenamed}/${maxRenames} symbols in this execution`
        )
        Logger.info(
          `  └─ Progress: ${totalRenamed}/${sessionStartIndex + maxRenames} total renames completed`
        )
        Logger.info(
          `  └─ Run again to continue renaming. Command: bun jsVariableAnalyzer.js --rename --max-renames ${maxRenames} ${filePath}`
        )
        break
      }

      // Analyze current code state
      const variables = analyzeVariableReferences(currentCode, fileName)
      const candidates = getRenameCandidates(variables, lengthThreshold)

      if (candidates.length === 0) {
        Logger.info('  └─ Convergence reached: No more candidates for renaming')
        break
      }

      const targetSymbol = candidates[0]
      Logger.info(
        `\n  [Iteration ${iterationCount}] Renaming: '${targetSymbol.name}' (${targetSymbol.references.length} references)`
      )

      // Generate new name
      let newName
      if (dryRun) {
        newName = generateMockSymbolName(targetSymbol)
        Logger.info(`    └─ Generated name (mock): ${newName}`)
      } else {
        newName = await generateSymbolNameViaLLM(targetSymbol, apiKey)
        if (!newName) {
          Logger.error(
            '    └─ Name generation failed. Review errors above for details.'
          )
          Logger.error('    └─ Stopping renaming session due to LLM error')
          break
        }
        Logger.info(`    └─ Generated name (LLM): ${newName}`)
      }

      // Perform renaming
      const transformedCode = renameSymbolWithJscodeshift(
        currentCode,
        targetSymbol.name,
        newName
      )
      if (!transformedCode) {
        Logger.warn('    └─ Transformation failed, skipping')
        break
      }

      // Validate syntax
      if (!validateSyntax(transformedCode)) {
        Logger.warn('    └─ Syntax validation failed, rolling back')
        break
      }

      Logger.info('    └─ Transformation successful')

      // Save version file
      sequenceNumber++
      saveVersionFile(
        renamedDir,
        fileName,
        transformedCode,
        sequenceNumber,
        targetSymbol.name,
        newName
      )

      // Update working file and code
      writeFileSync(workingFile, transformedCode)
      currentCode = transformedCode
      totalRenamed++

      // Record this rename
      renamedSymbols.push({
        old: targetSymbol.name,
        new: newName,
        line: targetSymbol.declarationLine
      })
    }

    // Update state file
    const sourceHash = computeSourceHash(originalSourceCode)
    saveRenameState(renamedDir, {
      renamedSymbols,
      totalRenames: totalRenamed,
      sourceFileHash: sourceHash,
      lastSequenceNumber: sequenceNumber
    })

    if (totalRenamed > 0) {
      Logger.info(
        `\n[RENAMING COMPLETE] Renamed ${totalRenamed} symbols in this execution`
      )
      Logger.info(`  └─ Final file: ${workingFile}`)
    }

    return workingFile
  } catch (error) {
    Logger.error(`Error during renaming workflow: ${error.message}`)
    return null
  }
}

/**
 * Main function to analyze JavaScript files for variable references
 * @param {string[]} filePaths - Array of file paths to analyze
 * @param {Object} _options - Options for processing (currently unused)
 */
async function main(filePaths, options = {}) {
  if (!filePaths || filePaths.length === 0) {
    Logger.error(
      'Usage: bun jsVariableAnalyzer.js [--rename] [--dry-run] [--limit <num>] [--max-renames <num>] [--verbosity <0-5>] [-v] [-vv] [-vvv] [--silent] [--quiet] <file1.js> [file2.js] ...'
    )
    Logger.error('  --rename           Enable symbol renaming workflow')
    Logger.error('  --dry-run          Use mock LLM (no API calls)')
    Logger.error('  --limit <num>      Symbol length threshold (default: 4)')
    Logger.error(
      '  --max-renames <num> Max renames per execution, resumes from previous state (default: 3)'
    )
    Logger.error(
      '  --verbosity <0-5>  Set output verbosity level (0=SILENT, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG, 5=TRACE)'
    )
    Logger.error(
      '  -v, -vv, -vvv      Set verbosity to INFO, DEBUG, or TRACE respectively'
    )
    Logger.error(
      '  --silent, --quiet  Set verbosity to SILENT (no output except errors)'
    )
    process.exit(1)
  }

  if (options.rename) {
    const stepsPerFile = 1
    const totalSteps = filePaths.length * stepsPerFile
    const progress = new ProgressTracker(totalSteps, Logger.enableProgress)

    for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
      const filePath = filePaths[fileIndex]
      try {
        progress.nextStep(`Renaming symbols in: ${basename(filePath)}`)
        await executeRenamingWorkflow(filePath, {
          lengthThreshold: options.limit || 4,
          dryRun: options.dryRun || false,
          apiKey: options.apiKey,
          maxRenames: options.maxRenames || 3
        })
      } catch (error) {
        Logger.error(`Error processing ${filePath}:`, error.message)
      }
    }

    progress.complete()
  } else {
    const stepsPerFile = 3
    const totalSteps = filePaths.length * stepsPerFile
    const progress = new ProgressTracker(totalSteps, Logger.enableProgress)

    for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
      const filePath = filePaths[fileIndex]
      try {
        progress.nextStep(`Reading file: ${basename(filePath)}`)
        const sourceCode = readFileSync(filePath, 'utf-8')
        const filename = basename(filePath)

        progress.nextStep(`Analyzing variables in: ${filename}`)
        const exportInfo = extractDetailedExportInfo(sourceCode)
        const variables = analyzeVariableReferences(
          sourceCode,
          filename,
          exportInfo.exportedNames
        )
        Logger.info(
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
        Logger.info(`  └─ Report saved: ${analysisOutputPath}`)
      } catch (error) {
        Logger.error(`Error processing ${filePath}:`, error.message)
      }
    }

    progress.complete()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const filePaths = []
const options = {}

// Set default verbosity level
Logger.setLevel(Logger.levels.INFO)

for (let i = 0; i < args.length; i++) {
  const arg = args[i]

  if (arg === '--rename') {
    options.rename = true
  } else if (arg === '--dry-run') {
    options.dryRun = true
  } else if (arg === '--limit') {
    options.limit = Math.max(4, Number.parseInt(args[i + 1], 10))
    i++
  } else if (arg === '--max-renames') {
    options.maxRenames = Math.max(1, Number.parseInt(args[i + 1], 10))
    i++
  } else if (arg === '--verbosity') {
    const level = Number.parseInt(args[i + 1], 10)
    if (level >= 0 && level <= 5) {
      Logger.setLevel(level)
    } else {
      Logger.error('Invalid verbosity level. Must be 0-5.')
      process.exit(1)
    }
    i++
  } else if (arg === '--silent' || arg === '--quiet') {
    Logger.setLevel(Logger.levels.SILENT)
  } else if (arg === '-v') {
    Logger.setLevel(Logger.levels.INFO)
  } else if (arg === '-vv') {
    Logger.setLevel(Logger.levels.DEBUG)
  } else if (arg === '-vvv') {
    Logger.setLevel(Logger.levels.TRACE)
  } else if (!arg.startsWith('--')) {
    filePaths.push(arg)
  }
}

// Run the script with command line arguments
if (import.meta.main) {
  await main(filePaths, options)
}

export {
  Logger,
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
  determineScopeLevel,
  generateEnhancedPrompt,
  generateSymbolNameViaLLM,
  generateMockSymbolName,
  renameSymbolWithJscodeshift,
  validateSyntax,
  setupRenamedDirectory,
  saveVersionFile,
  getRenameCandidates,
  executeRenamingWorkflow,
  saveRenameState,
  loadRenameState,
  computeSourceHash,
  isSourceModified
}
