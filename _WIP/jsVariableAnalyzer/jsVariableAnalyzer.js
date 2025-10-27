#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs"
import { basename } from "node:path"
import jscodeshift from "jscodeshift";
import fetch from "node-fetch";

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
 * @property {string} declarationContext - Code context around the declaration
 * @property {VariableReference[]} references - All references to this variable
 * @property {string} inferredType - Inferred type from usage patterns
 * @property {string} scope - Scope level (global, function, block)
 * @property {Object} behavioralPatterns - Analysis of how the variable is used
 * @property {boolean} isExported - Whether this variable is exported
 */

/**
 * @typedef {Object} LLMConfig
 * @property {string} apiKey - OpenRoute.ai API key
 * @property {string} model - Model to use (e.g., 'openai/gpt-4o-mini')
 * @property {string} namingStrategy - Naming strategy ('descriptive', 'concise', 'domain-specific')
 * @property {number} maxTokens - Maximum tokens for LLM response
 * @property {number} temperature - Temperature for LLM creativity
 * @property {boolean} enableBatchProcessing - Whether to process multiple variables at once
 */

/**
 * @typedef {Object} RenameResult
 * @property {boolean} success - Whether the rename was successful
 * @property {string} originalName - Original variable name
 * @property {string} newName - New variable name
 * @property {string} reason - Reason for the rename suggestion
 * @property {string[]} warnings - Any warnings during the process
 * @property {Object} astComparison - AST comparison results
 */

/**
 * Configuration for LLM integration
 */
const DEFAULT_LLM_CONFIG = {
  apiKey: process.env.OPENROUTE_API_KEY || '',
  model: process.env.OPENROUTE_MODEL || 'openai/gpt-4o-mini',
  namingStrategy: 'descriptive',
  maxTokens: 4000,
  temperature: 0.1,
  enableBatchProcessing: false
};

/**
 * Extracts exported names from JavaScript source code
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @returns {Set<string>} Set of exported variable/function names
 */
function extractExportedNames(sourceCode) {
  const exportedNames = new Set();
  try {
    const ast = jscodeshift(sourceCode);

    // Find all named exports (export { name1, name2, ... })
    ast.find(jscodeshift.ExportNamedDeclaration).forEach((path) => {
      const { node } = path;

      // Handle export { name1, name2 }
      if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ExportSpecifier' && spec.local) {
            exportedNames.add(spec.local.name);
          }
        });
      }

      // Handle export const/let/var name = ...
      if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'VariableDeclaration' && decl.declarations) {
          decl.declarations.forEach((declarator) => {
            if (declarator.id && declarator.id.name) {
              exportedNames.add(declarator.id.name);
            }
          });
        }
        // Handle export function name()
        if ((decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') && decl.id) {
          exportedNames.add(decl.id.name);
        }
      }
    });

    // Find default exports (function/class declarations are named)
    ast.find(jscodeshift.ExportDefaultDeclaration).forEach((path) => {
      const { node } = path;
      if (node.declaration && (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration')) {
        if (node.declaration.id) {
          exportedNames.add(node.declaration.id.name);
        }
      }
    });
  } catch (error) {
    console.warn('Could not extract exported names:', error.message);
  }
  return exportedNames;
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
  contextSize = process.env.CONTEXT_SIZE || 7,
) {
  const startLine = Math.max(0, targetLine - contextSize - 1)
  const endLine = Math.min(sourceLines.length, targetLine + contextSize);

  const contextLines = []
  for (let i = startLine; i < endLine; i++) {
    const lineNumber = i + 1
    const isTargetLine = lineNumber === targetLine
    const prefix = isTargetLine ? ">>> " : "    "
    contextLines.push(
      `${prefix}${lineNumber.toString().padStart(3)}: ${sourceLines[i] || ""}`,
    )
  }

  return contextLines.join("\n")
}

/**
 * Gets the line and column position of an AST node
 * @param {Object} node - AST node
 * @returns {{line: number, column: number}} Position information
 */
function getNodePosition(node) {
  return {
    line: node.loc?.start?.line || 1,
    column: node.loc?.start?.column || 0,
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
  const refPos = getNodePosition(referenceNode);

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
      return parentNode.left === node ? 'assignment_target' : 'assignment_source'
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
  const patterns = variableInfo.references.map(ref => ref.usagePattern)
  const declarationContext = variableInfo.declarationContext.toLowerCase()

  // Check for explicit type hints in declaration context
  if (declarationContext.includes('function') || declarationContext.includes('=>')) {
    return 'function'
  }
  if (declarationContext.includes('class')) {
    return 'class'
  }
  if (declarationContext.includes('new ')) {
    return 'object'
  }

  // Analyze usage patterns
  const functionCallPatterns = patterns.filter(p => p === 'function_call').length
  const propertyAccessPatterns = patterns.filter(p => p === 'property_access').length
  const methodCallPatterns = patterns.filter(p => p === 'method_call').length

  if (functionCallPatterns > 0) {
    return 'function'
  }
  if (propertyAccessPatterns > 0 || methodCallPatterns > 0) {
    return 'object'
  }

  // Check for common patterns
  const hasArrayOperations = patterns.some(p =>
    p.includes('array') || declarationContext.includes('[') || declarationContext.includes('push')
  )
  if (hasArrayOperations) {
    return 'array'
  }

  const hasStringOperations = patterns.some(p =>
    declarationContext.includes('"') || declarationContext.includes("'") ||
    declarationContext.includes('replace') || declarationContext.includes('split')
  )
  if (hasStringOperations) {
    return 'string'
  }

  const hasNumberOperations = patterns.some(p =>
    declarationContext.includes('+') || declarationContext.includes('-') ||
    declarationContext.includes('*') || declarationContext.includes('/')
  )
  if (hasNumberOperations) {
    return 'number'
  }

  return 'unknown'
}

/**
 * Analyzes behavioral patterns of a variable
 * @param {VariableInfo} variableInfo - Variable information
 * @returns {Object} Behavioral pattern analysis
 */
function analyzeBehavioralPatterns(variableInfo) {
  const patterns = {
    isModified: false,
    isReadOnly: true,
    isFunction: false,
    isIterator: false,
    isConfiguration: false,
    isState: false,
    isUtility: false,
    usageFrequency: variableInfo.references.length,
    commonOperations: []
  }

  // Analyze each reference for behavioral patterns
  variableInfo.references.forEach(ref => {
    const pattern = ref.usagePattern

    if (pattern === 'assignment_target') {
      patterns.isModified = true
      patterns.isReadOnly = false
    }

    if (pattern === 'function_call') {
      patterns.isFunction = true
    }

    if (ref.context.includes('forEach') || ref.context.includes('map') ||
      ref.context.includes('for') || ref.context.includes('while')) {
      patterns.isIterator = true
    }

    if (ref.context.toLowerCase().includes('config') ||
      ref.context.toLowerCase().includes('settings')) {
      patterns.isConfiguration = true
    }

    if (ref.context.toLowerCase().includes('state') ||
      ref.context.toLowerCase().includes('data')) {
      patterns.isState = true
    }

    // Track common operations
    if (ref.context.includes('push') || ref.context.includes('pop')) {
      patterns.commonOperations.push('array_modification')
    }
    if (ref.context.includes('replace') || ref.context.includes('split')) {
      patterns.commonOperations.push('string_manipulation')
    }
    if (ref.context.includes('filter') || ref.context.includes('reduce')) {
      patterns.commonOperations.push('functional_operations')
    }
  })

  // Remove duplicates from common operations
  patterns.commonOperations = [...new Set(patterns.commonOperations)]

  return patterns
}

/**
 * Determines the scope level of a variable
 * @param {Object} declarationNode - The declaration AST node
 * @param {string} sourceCode - Full source code
 * @returns {string} Scope level
 */
function determineScopeLevel(declarationNode, sourceCode) {
  // Simple scope detection - in a real implementation, you'd want more sophisticated analysis
  const lines = sourceCode.split('\n')
  const declLine = getNodePosition(declarationNode).line - 1

  // Check if we're inside a function
  let functionDepth = 0
  for (let i = 0; i <= declLine; i++) {
    const line = lines[i]
    if (line.includes('function ') || line.includes('=>')) {
      functionDepth++
    }
    if (line.includes('}') && functionDepth > 0) {
      functionDepth--
    }
  }

  if (functionDepth === 0) {
    return 'global'
  }
  if (functionDepth === 1) {
    return 'function'
  }
  return 'block'
}

/**
 * Calls OpenRoute.ai API to get variable name suggestions
 * @param {VariableInfo} variableInfo - Variable information
 * @param {LLMConfig} config - LLM configuration
 * @returns {Promise<string>} Suggested variable name
 */
async function getLLMNameSuggestion(variableInfo, config) {
  if (!config.apiKey) {
    throw new Error('OpenRoute.ai API key is required. Set OPENROUTE_API_KEY environment variable.')
  }

  const prompt = generateNamingPrompt(variableInfo, config)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/js-variable-analyzer',
      'X-Title': 'JS Variable Analyzer'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert JavaScript developer who specializes in creating meaningful, semantic variable names. Respond only with the suggested variable name, no explanation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    })
  })

  if (!response.ok) {
    throw new Error(`OpenRoute.ai API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const suggestion = data.choices?.[0]?.message?.content?.trim()

  if (!suggestion) {
    throw new Error('No suggestion received from OpenRoute.ai API')
  }

  // Clean up the suggestion - remove any extra formatting
  return suggestion.replace(/[^a-zA-Z0-9_$]/g, '')
}

/**
 * Generates a prompt for the LLM based on variable analysis
 * @param {VariableInfo} variableInfo - Variable information
 * @param {LLMConfig} config - LLM configuration
 * @returns {string} Generated prompt
 */
function generateNamingPrompt(variableInfo, config) {
  const { namingStrategy } = config

  let prompt = `Based on the following JavaScript variable analysis, suggest a better name using ${namingStrategy} naming conventions:\n\n`
  prompt += `Current name: ${variableInfo.name}\n`
  prompt += `Declaration type: ${variableInfo.declarationType}\n`
  prompt += `Inferred type: ${variableInfo.inferredType}\n`
  prompt += `Scope: ${variableInfo.scope}\n`
  prompt += `Usage frequency: ${variableInfo.behavioralPatterns.usageFrequency}\n\n`

  prompt += `Declaration context:\n\`\`\`javascript\n${variableInfo.declarationContext}\n\`\`\`\n\n`

  if (variableInfo.references.length > 0) {
    prompt += 'Usage examples:\n'
    variableInfo.references.slice(0, 3).forEach((ref, index) => {
      prompt += `${index + 1}. Pattern: ${ref.usagePattern}\n`
      prompt += `\`\`\`javascript\n${ref.context}\n\`\`\`\n\n`
    })
  }

  prompt += 'Behavioral patterns:\n'
  const patterns = variableInfo.behavioralPatterns
  prompt += `- Modified: ${patterns.isModified}\n`
  prompt += `- Read-only: ${patterns.isReadOnly}\n`
  prompt += `- Function: ${patterns.isFunction}\n`
  prompt += `- Iterator: ${patterns.isIterator}\n`
  prompt += `- Configuration: ${patterns.isConfiguration}\n`
  prompt += `- State: ${patterns.isState}\n`
  prompt += `- Common operations: ${patterns.commonOperations.join(', ')}\n\n`

  // Add strategy-specific instructions
  switch (namingStrategy) {
    case 'descriptive':
      prompt += `Provide a descriptive name that clearly explains the variable's purpose and usage. Use camelCase for variables and functions, PascalCase for classes.`
      break
    case 'concise':
      prompt += 'Provide a concise but meaningful name. Keep it short while maintaining clarity. Use standard abbreviations when appropriate.'
      break
    case 'domain-specific':
      prompt += 'Provide a name that follows domain-specific conventions and terminology. Consider the context and industry standards.'
      break
    default:
      prompt += 'Provide a meaningful, semantic name that follows JavaScript naming conventions.'
  }

  return prompt
}

/**
 * Compares two ASTs for semantic equivalence
 * @param {Object} originalAST - Original AST
 * @param {Object} modifiedAST - Modified AST
 * @returns {Object} Comparison result
 */
function compareASTs(originalAST, modifiedAST) {
  const originalJSON = JSON.stringify(originalAST, null, 2)
  const modifiedJSON = JSON.stringify(modifiedAST, null, 2)

  // Simple comparison - in a real implementation, you'd want more sophisticated AST comparison
  const differences = []

  // Remove identifier names from comparison to focus on structure
  const normalizeAST = (ast) => {
    const astStr = JSON.stringify(ast)
    return astStr.replace(/"name":"[^"]+"/g, '"name":"[IDENTIFIER]"')
  }

  const normalizedOriginal = normalizeAST(originalAST)
  const normalizedModified = normalizeAST(modifiedAST)

  const isStructurallyEquivalent = normalizedOriginal === normalizedModified

  return {
    isStructurallyEquivalent,
    differences,
    normalizedOriginal,
    normalizedModified
  }
}

/**
 * Renames a variable throughout the AST
 * @param {Object} ast - The AST to modify
 * @param {string} oldName - Current variable name
 * @param {string} newName - New variable name
 * @param {Set<string>} exportedNames - Set of exported names to exclude from renaming
 * @returns {Object} Modified AST
 */
function renameVariableInAST(ast, oldName, newName, exportedNames = new Set()) {
  const j = jscodeshift(ast)

  // Skip renaming if the variable is an exported name
  if (exportedNames.has(oldName)) {
    return ast
  }

  // Find all identifiers with the old name
  j.find(jscodeshift.Identifier, { name: oldName }).forEach(path => {
    // Skip property names and other contexts where renaming would be incorrect
    const parent = path.parent
    if (parent) {
      const parentNode = parent.node

      // Skip property names in object literals
      if (parentNode.type === 'Property' && parentNode.key === path.node) {
        return
      }

      // Skip property access in non-computed member expressions
      if (parentNode.type === 'MemberExpression' &&
        parentNode.property === path.node &&
        !parentNode.computed) {
        return
      }

      // Skip import specifiers
      if (parentNode.type === 'ImportSpecifier' && parentNode.local === path.node) {
        return
      }

      // Skip function parameter names in function declarations
      if (parentNode.type === 'FunctionDeclaration' &&
        parentNode.params.includes(path.node)) {
        return
      }
    }

    // Rename the identifier
    path.node.name = newName
  })

  return ast
}

/**
 * Performs an intelligent variable rename with validation
 * @param {string} sourceCode - Original source code
 * @param {VariableInfo} variableInfo - Variable to rename
 * @param {LLMConfig} config - LLM configuration
 * @param {Set<string>} exportedNames - Set of exported names to exclude from renaming
 * @returns {Promise<RenameResult>} Rename result
 */
async function performIntelligentRename(sourceCode, variableInfo, config, exportedNames = new Set()) {
  const result = {
    success: false,
    originalName: variableInfo.name,
    newName: '',
    reason: '',
    warnings: [],
    astComparison: null
  }

  try {
    // Get LLM suggestion
    const suggestedName = await getLLMNameSuggestion(variableInfo, config)
    result.newName = suggestedName

    // Validate the suggested name
    if (!isValidIdentifier(suggestedName)) {
      result.warnings.push(`Suggested name "${suggestedName}" is not a valid JavaScript identifier`)
      return result
    }

    if (suggestedName === variableInfo.name) {
      result.warnings.push('LLM suggested the same name')
      return result
    }

    // Create backup of original AST
    const originalAST = jscodeshift(sourceCode)

    // Apply the rename
    const modifiedAST = renameVariableInAST(
      JSON.parse(JSON.stringify(originalAST)),
      variableInfo.name,
      suggestedName,
      exportedNames
    )

    // Compare ASTs for semantic equivalence
    const astComparison = compareASTs(originalAST, modifiedAST)
    result.astComparison = astComparison

    if (!astComparison.isStructurallyEquivalent) {
      result.warnings.push('AST structure changed during rename - potential semantic issues')
      return result
    }

    // Generate the modified source code
    const modifiedSource = modifiedAST.toSource()

    result.success = true
    result.reason = `Successfully renamed "${variableInfo.name}" to "${suggestedName}" based on ${config.namingStrategy} strategy`

    return result

  } catch (error) {
    result.warnings.push(`Error during rename: ${error.message}`)
    return result
  }
}

/**
 * Validates if a string is a valid JavaScript identifier
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid identifier
 */
function isValidIdentifier(name) {
  if (!name || typeof name !== 'string') return false

  // Check if it's a reserved word
  const reservedWords = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public',
    'static', 'await', 'abstract', 'boolean', 'byte', 'char', 'double', 'final',
    'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized', 'throws',
    'transient', 'volatile'
  ])

  if (reservedWords.has(name)) return false

  // Check JavaScript identifier rules
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
}

/**
 * Processes multiple variables for renaming with batch support
 * @param {string} sourceCode - Original source code
 * @param {VariableInfo[]} variables - Variables to process
 * @param {LLMConfig} config - LLM configuration
 * @param {Set<string>} exportedNames - Set of exported names to exclude from renaming
 * @returns {Promise<RenameResult[]>} Array of rename results
 */
async function processBatchRenames(sourceCode, variables, config, exportedNames = new Set()) {
  const results = []
  let currentSource = sourceCode

  for (const variableInfo of variables) {
    // Re-analyze the variable in the current source to get updated references
    const updatedVariables = analyzeVariableReferences(currentSource, 'current', exportedNames)
    const currentVariable = updatedVariables.find(v => v.name === variableInfo.name)

    if (!currentVariable) {
      results.push({
        success: false,
        originalName: variableInfo.name,
        newName: '',
        reason: 'Variable no longer exists in current source',
        warnings: ['Variable not found during batch processing'],
        astComparison: null
      })
      continue
    }

    const result = await performIntelligentRename(currentSource, currentVariable, config, exportedNames)

    if (result.success) {
      // Apply the rename to the current source
      const ast = jscodeshift(currentSource)
      renameVariableInAST(ast, result.originalName, result.newName, exportedNames)
      currentSource = ast.toSource()
    }

    results.push(result)

    // Add delay between API calls to avoid rate limiting
    if (config.enableBatchProcessing && variables.indexOf(variableInfo) < variables.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * Analyzes a JavaScript source file for variable declarations and references
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @param {string} filename - Name of the file being analyzed
 * @param {Set<string>} exportedNames - Set of exported names to exclude from analysis
 * @returns {VariableInfo[]} Array of variable information objects
 */
function analyzeVariableReferences(sourceCode, filename, exportedNames = null) {
  const sourceLines = sourceCode.split("\n")
  const variableMap = new Map();

  // Extract exported names if not provided
  if (!exportedNames) {
    exportedNames = extractExportedNames(sourceCode);
  }

  try {
    const ast = jscodeshift(sourceCode);

    // Find all variable declarations
    const declarations = new Map();

    // Handle var, let, const declarations
    ast.find(jscodeshift.VariableDeclarator).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const varName = node.id.name
        const position = getNodePosition(node)
        const parentType = path.parent.value.kind // var, let, const

        declarations.set(varName, {
          name: varName,
          declarationType: parentType,
          declarationLine: position.line,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
        })
      }
    });

    // Handle function declarations
    ast.find(jscodeshift.FunctionDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const funcName = node.id.name
        const position = getNodePosition(node);

        declarations.set(funcName, {
          name: funcName,
          declarationType: "function",
          declarationLine: position.line,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
        })
      }
    });

    // Handle class declarations
    ast.find(jscodeshift.ClassDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const className = node.id.name
        const position = getNodePosition(node);

        declarations.set(className, {
          name: className,
          declarationType: "class",
          declarationLine: position.line,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
        })
      }
    });

    // Find all identifier references
    const processedReferences = new Set();
    
    ast.find(jscodeshift.Identifier).forEach((path) => {
      const { node } = path
      const varName = node.name;

      if (!declarations.has(varName)) {
        return
      }

      const varInfo = declarations.get(varName)
      const position = getNodePosition(node);

      const referenceKey = `${varName}:${position.line}:${position.column}`;

      if (processedReferences.has(referenceKey)) {
        return;
      }

      processedReferences.add(referenceKey);

      if (
        (position.line === varInfo.declarationLine &&
          node === varInfo.declarationNode.id) ||
        (path.parent && path.parent.node.type === "Property" && path.parent.node.key === node) ||
        (path.parent && path.parent.node.type === "MemberExpression" && path.parent.node.property === node && !path.parent.node.computed) ||
        (path.parent && path.parent.node.type === "FunctionDeclaration" && path.parent.node.params.includes(node)) ||
        (path.parent && path.parent.node.type === "FunctionExpression" && path.parent.node.params.includes(node)) ||
        (path.parent && path.parent.node.type === "ArrowFunctionExpression" && path.parent.node.params.includes(node)) ||
        (path.parent && path.parent.node.type === "MethodDefinition" && path.parent.node.key === node) ||
        (path.parent && path.parent.node.type === "ImportSpecifier" && path.parent.node.local === node) ||
        (path.parent && path.parent.node.type === "ImportDefaultSpecifier" && path.parent.node.local === node) ||
        (path.parent && path.parent.node.type === "VariableDeclarator" && path.parent.node.id === node)
      ) {
        return
      }

      if (isWithinScope(varInfo.declarationNode, node)) {
        const context = extractContext(sourceLines, position.line);
        const usagePattern = analyzeUsagePattern(path, node);

        varInfo.references.push({
          name: varName,
          line: position.line,
          column: position.column,
          context: context,
          type: "usage",
          usagePattern: usagePattern,
        })
      }
    });

    // Enhance variable information with additional analysis
    for (const [name, varInfo] of declarations) {
      varInfo.inferredType = inferVariableType(varInfo)
      varInfo.scope = determineScopeLevel(varInfo.declarationNode, sourceCode)
      varInfo.behavioralPatterns = analyzeBehavioralPatterns(varInfo)
      varInfo.isExported = exportedNames.has(name)
    }

    const allDeclarations = Array.from(declarations.values())
    
    return allDeclarations.sort(
      (a, b) => a.declarationLine - b.declarationLine,
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
 * @returns {string} Formatted Markdown report
 */
function generateMarkdownReport(variables, filename) {
  let report = `# Variable Reference Analysis: ${filename}\n\n`;

  if (variables.length === 0) {
    report += "No variables found or file could not be parsed.\n"
    return report
  }

  for (const variable of variables) {
    const exportedLabel = variable.isExported ? ' [EXPORTED - Protected from renaming]' : ''
    report += `## Variable: \`${variable.name}\`${exportedLabel}\n\n`
    report += `**Declaration Type:** \`${variable.declarationType}\`  \n`
    report += `**Declared on line:** ${variable.declarationLine}  \n`
    report += `**Inferred Type:** \`${variable.inferredType}\`  \n`
    report += `**Scope:** \`${variable.scope}\`  \n`
    report += `**Exported:** ${variable.isExported ? 'Yes' : 'No'}  \n`
    report += `**Usage Frequency:** ${variable.behavioralPatterns.usageFrequency}\n\n`

    report += `### Declaration Context: \`${variable.name}\`\n\n`
    report += "```javascript\n"
    report += variable.declarationContext
    report += "\n```\n\n"

    report += '### Behavioral Patterns\n\n'
    const patterns = variable.behavioralPatterns
    report += `- **Modified:** ${patterns.isModified}\n`
    report += `- **Read-only:** ${patterns.isReadOnly}\n`
    report += `- **Function:** ${patterns.isFunction}\n`
    report += `- **Iterator:** ${patterns.isIterator}\n`
    report += `- **Configuration:** ${patterns.isConfiguration}\n`
    report += `- **State:** ${patterns.isState}\n`
    if (patterns.commonOperations.length > 0) {
      report += `- **Common Operations:** ${patterns.commonOperations.join(', ')}\n`
    }
    report += "\n"

    report += `**Total references:** ${variable.references.length}\n\n`;

    if (variable.references.length === 0) {
      report += "*No references found.*\n\n"
      continue
    }

    for (const reference of variable.references) {
      report += `### Reference at Line ${reference.line}, Column ${reference.column}\n\n`
      report += `**Usage Pattern:** \`${reference.usagePattern}\`\n\n`
      report += "```javascript\n"
      report += reference.context
      report += "\n```\n\n"
    }
  }

  return report
}

/**
 * Generates a rename report from rename results
 * @param {RenameResult[]} results - Array of rename results
 * @param {string} filename - Name of the processed file
 * @returns {string} Formatted Markdown report
 */
function generateRenameReport(results, filename) {
  let report = `# Intelligent Variable Rename Report: ${filename}\n\n`

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  report += '## Summary\n\n'
  report += `- **Total processed:** ${results.length}\n`
  report += `- **Successfully renamed:** ${successful.length}\n`
  report += `- **Failed:** ${failed.length}\n\n`

  if (successful.length > 0) {
    report += '## Successful Renames\n\n'
    for (const result of successful) {
      report += `### \`${result.originalName}\` → \`${result.newName}\`\n\n`
      report += `**Reason:** ${result.reason}\n\n`
      if (result.warnings.length > 0) {
        report += '**Warnings:**\n'
        result.warnings.forEach(warning => {
          report += `- ${warning}\n`
        })
        report += "\n"
      }
    }
  }

  if (failed.length > 0) {
    report += '## Failed Renames\n\n'
    for (const result of failed) {
      report += `### \`${result.originalName}\`\n\n`
      report += `**Reason:** ${result.reason}\n\n`
      if (result.warnings.length > 0) {
        report += '**Warnings:**\n'
        result.warnings.forEach(warning => {
          report += `- ${warning}\n`
        })
        report += "\n"
      }
    }
  }

  return report
}

/**
 * Filters variables based on name length
 * @param {VariableInfo[]} variables - Array of variables to filter
 * @param {boolean} renameAll - If true, include all variables; if false, only include variables with name < 4 chars
 * @returns {VariableInfo[]} Filtered array of variables
 */
function filterVariablesByLength(variables, renameAll = false) {
  if (renameAll) {
    return variables
  }
  return variables.filter(v => v.name.length < 4)
}

/**
 * Main function to analyze JavaScript files and optionally perform intelligent renaming
 * @param {string[]} filePaths - Array of file paths to analyze
 * @param {Object} options - Options for processing
 */
async function main(filePaths, options = {}) {
  if (!filePaths || filePaths.length === 0) {
    console.error("Usage: bun jsVariableAnalyzer.js <file1.js> [file2.js] ... [--rename] [--all] [--strategy=descriptive|concise|domain-specific] [--batch]")
    console.error("  --rename    Enable intelligent variable renaming")
    console.error("  --all       Rename all variables (default: only variables with name length < 4 chars)")
    console.error("  --strategy  Naming strategy: descriptive, concise, or domain-specific (default: descriptive)")
    console.error("  --batch     Process multiple variables in batch mode")
    process.exit(1)
  }

  const enableRename = options.rename || false
  const namingStrategy = options.strategy || 'descriptive'
  const enableBatch = options.batch || false
  const renameAll = options.all || false

  // Configure LLM
  const llmConfig = {
    ...DEFAULT_LLM_CONFIG,
    namingStrategy,
    enableBatchProcessing: enableBatch
  };

  for (const filePath of filePaths) {
    try {
      console.log(`Analyzing: ${filePath}`);

      const sourceCode = readFileSync(filePath, "utf-8")
      const filename = basename(filePath);

      // Extract exported names to protect them from renaming
      const exportedNames = extractExportedNames(sourceCode)

      const variables = analyzeVariableReferences(sourceCode, filename, exportedNames)
      const analysisReport = generateMarkdownReport(variables, filename);

      const analysisOutputPath = `${filePath}-analysis.md`
      writeFileSync(analysisOutputPath, analysisReport);

      console.log(`Analysis report generated: ${analysisOutputPath}`)
      console.log(
        `Found ${variables.length} variables with ${variables.reduce((sum, v) => sum + v.references.length, 0)} total references\n`,
      );

      if (enableRename) {
        console.log(`Performing intelligent renaming with strategy: ${namingStrategy}`)
        if (!renameAll) {
          console.log(`Filtering: Only renaming variables with name length < 4 characters`)
        }

        const exportedVariables = variables.filter(v => v.isExported)
        const nonExportedVariables = variables.filter(v => !v.isExported)
        const renamableVariables = filterVariablesByLength(nonExportedVariables, renameAll)

        let renameResults = []

        // Skip renaming for exported variables and document them
        for (const expVar of exportedVariables) {
          renameResults.push({
            success: false,
            originalName: expVar.name,
            newName: '',
            reason: 'Variable is exported and protected from renaming',
            warnings: ['This variable is part of the public API and cannot be renamed'],
            astComparison: null
          })
        }

        if (enableBatch) {
          const batchResults = await processBatchRenames(sourceCode, renamableVariables, llmConfig, exportedNames)
          renameResults = renameResults.concat(batchResults)
        } else {
          for (const variable of renamableVariables) {
            const result = await performIntelligentRename(sourceCode, variable, llmConfig, exportedNames)
            renameResults.push(result)

            if (!enableBatch) {
              // Add delay between API calls
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }

        const renameReport = generateRenameReport(renameResults, filename)
        const renameOutputPath = `${filePath}-rename-report.md`
        writeFileSync(renameOutputPath, renameReport)

        console.log(`Rename report generated: ${renameOutputPath}`)

        // Apply successful renames to create a new file
        const successfulRenames = renameResults.filter(r => r.success)
        if (successfulRenames.length > 0) {
          let modifiedSource = sourceCode
          const ast = jscodeshift(modifiedSource)

          // Apply all successful renames
          for (const rename of successfulRenames) {
            renameVariableInAST(ast, rename.originalName, rename.newName, exportedNames)
          }

          modifiedSource = ast.toSource()
          const renamedFilePath = `${filePath}-renamed.js`
          writeFileSync(renamedFilePath, modifiedSource)

          console.log(`Renamed file generated: ${renamedFilePath}`)
          console.log(`Successfully renamed ${successfulRenames.length} variables`)
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message)
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const filePaths = args.filter(arg => !arg.startsWith('--'))
const options = {
  rename: args.includes('--rename'),
  batch: args.includes('--batch'),
  all: args.includes('--all'),
  strategy: args.find(arg => arg.startsWith('--strategy='))?.split('=')[1] || 'descriptive'
};

// Run the script with command line arguments
if (import.meta.main) {
  await main(filePaths, options)
}

export {
  analyzeVariableReferences,
  generateMarkdownReport,
  extractContext,
  performIntelligentRename,
  processBatchRenames,
  getLLMNameSuggestion,
  filterVariablesByLength
}