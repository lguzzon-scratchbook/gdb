#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs"
import { basename } from "node:path"
import jscodeshift from "jscodeshift";
import fetch from "node-fetch";

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
      console.log(`\n[PROGRESS ${percentage}%] Step ${this.currentStep}/${this.totalSteps}: ${stepName} (${elapsed}s elapsed)`)
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
 * @property {string} scope - Scope level (global, function, block)
 * @property {Object} behavioralPatterns - Analysis of how the variable is used
 * @property {boolean} isExported - Whether this variable is exported
 * @property {string} uniqueId - Unique identifier combining name:line:column
 * @property {Object} scopeRange - Scope boundaries {start: number, end: number}
 */

/**
 * @typedef {Object} LLMConfig
 * @property {string} apiKey - Openrouter.ai API key
 * @property {string} model - Model to use (e.g., 'openai/gpt-4o-mini')
 * @property {string} namingStrategy - Naming strategy ('descriptive', 'concise', 'domain-specific')
 * @property {number} maxTokens - Maximum tokens for LLM response
 * @property {number} temperature - Temperature for LLM creativity
 * @property {boolean} enableBatchProcessing - Whether to process multiple variables at once
 * @property {number|null} renameLimit - Maximum number of renames to perform (null for unlimited)
 * @property {boolean} dryRun - If true, use mock LLM with random generated names instead of calling API
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
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: process.env.OPENROUTE_MODEL || 'openai/gpt-4o-mini',
  namingStrategy: 'descriptive',
  maxTokens: 4000,
  temperature: 0.1,
  enableBatchProcessing: false,
  renameLimit: null,
  dryRun: false
};

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
  const exportedNames = new Set();
  const aliasedExports = new Map();
  const directExports = new Set();
  const exportPatterns = new Map();

  try {
    const ast = jscodeshift(sourceCode);

    // Find all named exports (export { name1, name2, ... })
    ast.find(jscodeshift.ExportNamedDeclaration).forEach((path) => {
      const { node } = path;

      // Handle export { name1, name2 }
      if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ExportSpecifier' && spec.local) {
            const localName = spec.local.name;
            const exportedName = spec.exported ? spec.exported.name : localName;
            
            exportedNames.add(exportedName);
            exportPatterns.set(exportedName, {
              type: 'named_export',
              localName,
              exportedName,
              isAliased: localName !== exportedName
            });

            if (localName !== exportedName) {
              // Aliased export: local name is an internal implementation detail
              aliasedExports.set(localName, exportedName);
            } else {
              // Direct export: local name matches export name
              directExports.add(localName);
            }
          }
        });
      }

      // Handle export const/let/var name = ...
      if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'VariableDeclaration' && decl.declarations) {
          decl.declarations.forEach((declarator) => {
            if (declarator.id?.name) {
              const name = declarator.id.name;
              exportedNames.add(name);
              directExports.add(name);
              exportPatterns.set(name, {
                type: 'variable_declaration',
                name,
                isAliased: false
              });
            }
          });
        }
        // Handle export function name()
        if ((decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') && decl.id) {
          const name = decl.id.name;
          exportedNames.add(name);
          directExports.add(name);
          exportPatterns.set(name, {
            type: decl.type === 'FunctionDeclaration' ? 'function_declaration' : 'class_declaration',
            name,
            isAliased: false
          });
        }
      }
    });

    // Find default exports (function/class declarations are named)
    ast.find(jscodeshift.ExportDefaultDeclaration).forEach((path) => {
      const { node } = path;
      if (node.declaration && (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration')) {
        if (node.declaration.id) {
          const name = node.declaration.id.name;
          exportedNames.add(name);
          directExports.add(name);
          exportPatterns.set(name, {
            type: 'default_export',
            name,
            isAliased: false
          });
        }
      }
    });
  } catch (error) {
    console.warn('Could not extract export information:', error.message);
  }

  return {
    exportedNames,
    aliasedExports,
    directExports,
    exportPatterns
  };
}

/**
 * Extracts exported names from JavaScript source code (legacy wrapper)
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @returns {Set<string>} Set of exported variable/function names
 */
function extractExportedNames(sourceCode) {
  const exportInfo = extractDetailedExportInfo(sourceCode);
  return exportInfo.exportedNames;
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
 * Generates a random meaningful variable name based on variable analysis (mock LLM)
 * @param {VariableInfo} variableInfo - Variable information
 * @returns {string} Mock-generated variable name
 */
function generateMockLLMName(variableInfo) {
  const patterns = variableInfo.behavioralPatterns
  const inferredType = variableInfo.inferredType
  const declarationType = variableInfo.declarationType
  const originalName = variableInfo.name
  const usageFreq = patterns.usageFrequency

  // Simple noun pairs for concise, realistic names
  const nouns = ['value', 'data', 'result', 'item', 'entry', 'key', 'record', 'element']
  const adjectives = ['current', 'next', 'prev', 'total', 'temp', 'new']
  const verbs = ['get', 'set', 'process', 'handle', 'validate', 'check', 'create', 'find']
  const stateNames = ['state', 'store', 'cache', 'config']
  const loopNames = ['index', 'counter', 'pos', 'idx']

  // Generate name based on variable characteristics
  let name = ''

  // Function declaration: use verb + noun
  if (patterns.isFunction && declarationType === 'function') {
    const verb = verbs[Math.floor(Math.random() * verbs.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    name = verb + noun.charAt(0).toUpperCase() + noun.slice(1)
  }
  // Configuration object: add Config suffix
  else if (patterns.isConfiguration) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    name = adj + 'Config'
  }
  // State object: simple name with State/Data suffix
  else if (patterns.isState) {
    const stateType = stateNames[Math.floor(Math.random() * stateNames.length)]
    name = stateType.charAt(0).toUpperCase() + stateType.slice(1)
  }
  // Read-only constant: simple noun
  else if (declarationType === 'const' && patterns.isReadOnly && usageFreq <= 2) {
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    name = noun.charAt(0).toUpperCase() + noun.slice(1)
  }
  // Array/Collection: collection-aware name
  else if (inferredType === 'array' || patterns.commonOperations.includes('array_modification')) {
    const noun = ['items', 'entries', 'elements', 'collection'][Math.floor(Math.random() * 4)]
    name = noun.charAt(0).toUpperCase() + noun.slice(1)
  }
  // Loop counter: prioritize simple short names
  // Detect by: single char name, used in loop context, low frequency
  else if ((originalName.length === 1 && patterns.isIterator) || 
           (usageFreq <= 3 && patterns.isIterator && !patterns.isModified)) {
    name = loopNames[Math.floor(Math.random() * loopNames.length)]
  }
  // Variable/property that gets modified: adjective + noun
  else if (patterns.isModified) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    name = adj + noun.charAt(0).toUpperCase() + noun.slice(1)
  }
  // Default: simple noun or adjective + noun
  else {
    if (Math.random() > 0.5) {
      name = nouns[Math.floor(Math.random() * nouns.length)]
      name = name.charAt(0).toUpperCase() + name.slice(1)
    } else {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
      const noun = nouns[Math.floor(Math.random() * nouns.length)]
      name = adj + noun.charAt(0).toUpperCase() + noun.slice(1)
    }
  }

  // Ensure camelCase (first letter lowercase) and is not empty
  const finalName = name.charAt(0).toLowerCase() + name.slice(1)
  return finalName || 'value'
}

/**
 * Calls Openrouter.ai API to get variable name suggestions
 * @param {VariableInfo} variableInfo - Variable information
 * @param {LLMConfig} config - LLM configuration
 * @returns {Promise<string>} Suggested variable name
 */
async function getLLMNameSuggestion(variableInfo, config) {
  // Use mock LLM if in dry run mode
  if (config.dryRun) {
    return generateMockLLMName(variableInfo)
  }

  if (!config.apiKey) {
    throw new Error('Openrouter.ai API key is required. Set OPENROUTER_API_KEY environment variable.')
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
    throw new Error(`Openrouter.ai API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const suggestion = data.choices?.[0]?.message?.content?.trim()

  if (!suggestion) {
    throw new Error('No suggestion received from Openrouter.ai API')
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
  // Helper to serialize with cyclic reference handling
  const serializeWithCycleDetection = (obj) => {
    const visited = new WeakSet()
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (visited.has(value)) {
          return '[Circular]'
        }
        visited.add(value)
      }
      return value
    }, 2)
  }

  const originalJSON = serializeWithCycleDetection(originalAST)
  const modifiedJSON = serializeWithCycleDetection(modifiedAST)

  // Simple comparison - in a real implementation, you'd want more sophisticated AST comparison
  const differences = []

  // Remove identifier names from comparison to focus on structure
  const normalizeAST = (ast) => {
    const visited = new WeakSet()
    const astStr = JSON.stringify(ast, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (visited.has(value)) {
          return '[Circular]'
        }
        visited.add(value)
      }
      return value
    })
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
 * Calculates the scope range for a variable declaration
 * @param {Object} declarationNode - AST node of the declaration
 * @param {Object} ast - Full AST or source code
 * @param {number} totalLines - Total number of lines in source (optional)
 * @returns {Object} Scope range {start: line, end: line}
 */
function calculateScopeRange(declarationNode, ast, totalLines = 99999) {
  const startLine = getNodePosition(declarationNode).line;
  let endLine = totalLines;

  // Walk up the AST to find the containing scope
  const j = typeof ast === 'string' ? jscodeshift(ast) : ast;
  
  // Try to find the end of the containing scope
  // For function declarations, use the function's end
  if (declarationNode.type === 'FunctionDeclaration' || 
      declarationNode.type === 'ClassDeclaration') {
    if (declarationNode.loc?.end?.line) {
      endLine = declarationNode.loc.end.line;
    }
  }
  
  // For variable declarations, find the containing function/program
  let scope = null;
  j.find(jscodeshift.Program).forEach((path) => {
    const walker = (node, parent) => {
      // Check if declarationNode is a child of this node
      if (node === declarationNode) {
        scope = parent;
      } else if (node.body) {
        const nextParent = node;
        if (Array.isArray(node.body)) {
          node.body.forEach(child => walker(child, nextParent));
        } else if (node.body && typeof node.body === 'object') {
          walker(node.body, nextParent);
        }
      }
    };
    walker(path.node, null);
  });

  // If we found a containing scope, use its end line
  if (scope && scope.loc?.end?.line) {
    endLine = scope.loc.end.line;
  } else if (scope === null && declarationNode.type !== 'FunctionDeclaration' && 
             declarationNode.type !== 'ClassDeclaration') {
    // Top-level declaration - spans to end of file
    endLine = totalLines;
  }

  return { start: startLine, end: endLine };
}

/**
 * Creates a unique identifier for a variable declaration (position-based, not name-dependent)
 * @param {string} name - Variable name (not included in ID to survive renames)
 * @param {number} line - Declaration line
 * @param {number} column - Declaration column
 * @returns {string} Unique identifier
 */
function createUniqueVariableId(name, line, column) {
  return `${line}:${column}`;
}

/**
 * Validates that new names don't create duplicates
 * @param {Array} renameMappings - Array of {from: string, to: string} mappings
 * @returns {Object} {isValid: boolean, duplicates: Set<string>, conflicts: Array}
 */
function validateRenameMapping(renameMappings) {
  const seenNewNames = new Map();
  const duplicates = new Set();
  const conflicts = [];

  for (const mapping of renameMappings) {
    if (seenNewNames.has(mapping.to)) {
      duplicates.add(mapping.to);
      conflicts.push({
        newName: mapping.to,
        conflictingOriginals: [seenNewNames.get(mapping.to), mapping.from]
      });
    }
    seenNewNames.set(mapping.to, mapping.from);
  }

  return {
    isValid: duplicates.size === 0,
    duplicates,
    conflicts
  };
}

/**
 * Determines if an identifier is renamable based on export patterns
 * @param {string} name - Identifier name to check
 * @param {ExportInfo} exportInfo - Export information with aliasing details
 * @returns {boolean} True if identifier can be safely renamed
 */
function isRenamableIdentifier(name, exportInfo) {
  // If it's a direct export (public API), it's protected from renaming
  if (exportInfo.directExports.has(name)) {
    return false;
  }

  // If it's an internal identifier exported via alias, it's safely renamable
  if (exportInfo.aliasedExports.has(name)) {
    return true;
  }

  // If it's not exported at all, it's renamable
  return true;
}

/**
 * Renames a variable within its scope using a unique identifier
 * @param {Object|string} ast - The AST or source code to modify
 * @param {string} variableId - Unique identifier in format name:line:column
 * @param {string} newName - New variable name
 * @param {Object} variableInfo - Variable information with scope details and references
 * @param {ExportInfo} exportInfo - Detailed export information with aliasing
 * @returns {string} Modified source code
 */
function renameVariableByIdWithExportInfo(ast, variableId, newName, variableInfo, exportInfo) {
  const j = jscodeshift(ast);

  // Skip renaming if the variable is a direct export (public API contract)
  if (!isRenamableIdentifier(variableInfo.name, exportInfo)) {
    return typeof ast === 'string' ? ast : j.toSource();
  }

  // Build set of reference positions to rename
  const referencePosToRename = new Set();
  for (const ref of variableInfo.references) {
    referencePosToRename.add(`${ref.line}:${ref.column}`);
  }

  // Also add the declaration position itself
  const declPos = `${variableInfo.declarationLine}:${variableInfo.declarationColumn}`;
  
  let renamedCount = 0;

  // Find all identifiers with the old name
  j.find(jscodeshift.Identifier, { name: variableInfo.name }).forEach(path => {
    const nodePosition = getNodePosition(path.node);
    const posKey = `${nodePosition.line}:${nodePosition.column}`;

    // Only rename if this identifier is in our references or is the declaration
    if (!referencePosToRename.has(posKey) && posKey !== declPos) {
      return;
    }

    // Skip property names and other contexts where renaming would be incorrect
    const parent = path.parent;
    if (parent) {
      const parentNode = parent.node;

      // Skip property names in object literals
      if (parentNode.type === 'Property' && parentNode.key === path.node) {
        return;
      }

      // Skip property access in non-computed member expressions
      if (parentNode.type === 'MemberExpression' &&
        parentNode.property === path.node &&
        !parentNode.computed) {
        return;
      }

      // Skip import specifiers
      if (parentNode.type === 'ImportSpecifier' && parentNode.local === path.node) {
        return;
      }

      // Skip export specifiers only if they're direct exports (public API)
      // For aliased exports (local !== exported), we should rename the local identifier
      if (parentNode.type === 'ExportSpecifier' && parentNode.local === path.node) {
        const isDirectExport = path.node.name === parentNode.exported.name;
        if (isDirectExport) {
          return; // Skip direct exports - they're part of public API
        }
      }

      // Skip function parameter names in function declarations
      if (parentNode.type === 'FunctionDeclaration' &&
        parentNode.params.includes(path.node)) {
        return;
      }

      // Skip class method parameters
      if (parentNode.type === 'MethodDefinition' && parentNode.key === path.node) {
        return;
      }
    }

    // Rename the identifier
    path.node.name = newName;
    renamedCount++;
  });

  return j.toSource();
}

/**
 * Renames a variable throughout the AST with smart export protection
 * @param {Object|string} ast - The AST or source code to modify
 * @param {string} oldName - Current variable name
 * @param {string} newName - New variable name
 * @param {ExportInfo} exportInfo - Detailed export information with aliasing
 * @returns {string} Modified source code
 */
function renameVariableInASTWithExportInfo(ast, oldName, newName, exportInfo) {
  const j = jscodeshift(ast)

  // Skip renaming if the variable is a direct export (public API contract)
  if (!isRenamableIdentifier(oldName, exportInfo)) {
    return typeof ast === 'string' ? ast : j.toSource()
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

      // Skip export specifiers only if they're direct exports (public API)
      // For aliased exports (local !== exported), we should rename the local identifier
      if (parentNode.type === 'ExportSpecifier' && parentNode.local === path.node) {
        const isDirectExport = path.node.name === parentNode.exported.name;
        if (isDirectExport) {
          return; // Skip direct exports - they're part of public API
        }
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

  return j.toSource()
}

/**
 * Renames a variable throughout the AST (backward compatible wrapper)
 * @param {Object} ast - The AST to modify
 * @param {string} oldName - Current variable name
 * @param {string} newName - New variable name
 * @param {Set<string>} exportedNames - Set of exported names to exclude from renaming
 * @returns {Object} Modified AST
 */
function renameVariableInAST(ast, oldName, newName, exportedNames = new Set()) {
  // Create export info from the exported names set for backward compatibility
  const exportInfo = {
    exportedNames,
    aliasedExports: new Map(),
    directExports: exportedNames,
    exportPatterns: new Map()
  };
  return renameVariableInASTWithExportInfo(ast, oldName, newName, exportInfo);
}

/**
 * Performs an intelligent variable rename with validation
 * @param {string} sourceCode - Original source code
 * @param {VariableInfo} variableInfo - Variable to rename
 * @param {LLMConfig} config - LLM configuration
 * @param {ExportInfo} exportInfo - Export information with aliasing details
 * @returns {Promise<RenameResult>} Rename result
 */
async function performIntelligentRename(sourceCode, variableInfo, config, exportInfo) {
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

    // Create a modified AST by applying the rename
    const modifiedAST = renameVariableInASTWithExportInfo(
      sourceCode,
      variableInfo.name,
      suggestedName,
      exportInfo
    )

    // Generate the modified source code
    const modifiedSource = typeof modifiedAST === 'string' ? modifiedAST : modifiedAST.toSource()

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
 * Processes multiple variables for renaming with batch support and duplicate detection
 * @param {string} sourceCode - Original source code
 * @param {VariableInfo[]} variables - Variables to process
 * @param {LLMConfig} config - LLM configuration
 * @param {ExportInfo} exportInfo - Export information with aliasing details
 * @returns {Promise<RenameResult[]>} Array of rename results
 */
async function processBatchRenames(sourceCode, variables, config, exportInfo) {
  const results = []
  let currentSource = sourceCode
  const usedNewNames = new Set()
  let successfulRenameCount = 0
  const renameLimit = config.renameLimit

  // First pass: collect all suggested names and validate for duplicates
  // Stop collecting if we've reached the rename limit
  const suggestions = []
  let suggestionsCollected = 0
  for (const variableInfo of variables) {
    if (renameLimit !== null && suggestionsCollected >= renameLimit) {
      // Skip remaining variables if limit reached
      results.push({
        success: false,
        originalName: variableInfo.name,
        newName: '',
        reason: `Rename limit (${renameLimit}) reached`,
        warnings: ['Variable processing skipped due to rename limit'],
        astComparison: null
      })
      continue
    }

    try {
      const suggestedName = await getLLMNameSuggestion(variableInfo, config)
      suggestions.push({
        variable: variableInfo,
        suggestedName,
        isValid: isValidIdentifier(suggestedName) && suggestedName !== variableInfo.name
      })
      suggestionsCollected++
    } catch (error) {
      results.push({
        success: false,
        originalName: variableInfo.name,
        newName: '',
        reason: `Failed to get name suggestion: ${error.message}`,
        warnings: [`Error during LLM request: ${error.message}`],
        astComparison: null
      })
    }
  }

  // Validate rename mappings for duplicates
  const renameMappings = suggestions
    .filter(s => s.isValid)
    .map(s => ({ from: s.variable.name, to: s.suggestedName }));

  const validation = validateRenameMapping(renameMappings);
  
  if (!validation.isValid) {
    // Add warnings for duplicate names
    for (const conflict of validation.conflicts) {
      results.push({
        success: false,
        originalName: conflict.conflictingOriginals[0],
        newName: conflict.newName,
        reason: `Duplicate new name "${conflict.newName}" conflicts with rename of "${conflict.conflictingOriginals[1]}"`,
        warnings: [`Cannot use "${conflict.newName}" - collision with another variable's new name`],
        astComparison: null
      })
    }
  }

  // Second pass: apply valid renames that don't create collisions
  for (const suggestion of suggestions) {
    // Check if we've reached the rename limit
    if (renameLimit !== null && successfulRenameCount >= renameLimit) {
      results.push({
        success: false,
        originalName: suggestion.variable.name,
        newName: suggestion.suggestedName,
        reason: `Rename limit (${renameLimit}) reached`,
        warnings: ['Variable processing skipped due to rename limit'],
        astComparison: null
      })
      continue
    }

    if (!suggestion.isValid) {
      results.push({
        success: false,
        originalName: suggestion.variable.name,
        newName: suggestion.suggestedName,
        reason: suggestion.suggestedName === suggestion.variable.name 
          ? 'LLM suggested the same name'
          : `Suggested name "${suggestion.suggestedName}" is not a valid JavaScript identifier`,
        warnings: [suggestion.suggestedName === suggestion.variable.name 
          ? 'LLM suggestion identical to original'
          : `Invalid identifier: ${suggestion.suggestedName}`],
        astComparison: null
      })
      continue
    }

    // Check if this new name conflicts with another suggestion
    if (validation.duplicates.has(suggestion.suggestedName)) {
      results.push({
        success: false,
        originalName: suggestion.variable.name,
        newName: suggestion.suggestedName,
        reason: `Cannot use "${suggestion.suggestedName}" - would create collision with another rename`,
        warnings: [`Duplicate name collision: "${suggestion.suggestedName}"`],
        astComparison: null
      })
      continue
    }

    // Re-analyze the variable in the current source to get updated references
    const updatedVariables = analyzeVariableReferences(currentSource, 'current', exportInfo.exportedNames)
    const currentVariable = updatedVariables.find(v => v.uniqueId === suggestion.variable.uniqueId)

    if (!currentVariable) {
      results.push({
        success: false,
        originalName: suggestion.variable.name,
        newName: '',
        reason: 'Variable no longer exists in current source',
        warnings: ['Variable not found during batch processing'],
        astComparison: null
      })
      continue
    }

    // Apply the rename using scope-aware function
    const modifiedSource = renameVariableByIdWithExportInfo(
      currentSource,
      currentVariable.uniqueId,
      suggestion.suggestedName,
      currentVariable,
      exportInfo
    )

    currentSource = modifiedSource
    usedNewNames.add(suggestion.suggestedName)
    successfulRenameCount++
    
    results.push({
      success: true,
      originalName: suggestion.variable.name,
      newName: suggestion.suggestedName,
      reason: `Successfully renamed "${suggestion.variable.name}" to "${suggestion.suggestedName}" based on ${config.namingStrategy} strategy`,
      warnings: [],
      astComparison: null
    })

    // Add delay between API calls to avoid rate limiting
    if (config.enableBatchProcessing && suggestions.indexOf(suggestion) < suggestions.length - 1) {
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
  let names = exportedNames;
  if (!names) {
    names = extractExportedNames(sourceCode);
  }

  try {
    const ast = jscodeshift(sourceCode);

    // Find all variable declarations
    // Use an array to handle multiple variables with the same name (shadowing)
    const declarationsList = [];

    // Handle var, let, const declarations
    ast.find(jscodeshift.VariableDeclarator).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const varName = node.id.name
        const position = getNodePosition(node)
        const parentType = path.parent.value.kind // var, let, const

        // Create unique ID for this declaration
        const uniqueId = createUniqueVariableId(varName, position.line, position.column);

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
    });

    // Handle function declarations
    ast.find(jscodeshift.FunctionDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const funcName = node.id.name
        const position = getNodePosition(node);

        const uniqueId = createUniqueVariableId(funcName, position.line, position.column);
        const scopeRange = calculateScopeRange(node, ast, sourceLines.length);

        declarationsList.push({
          name: funcName,
          declarationType: "function",
          declarationLine: position.line,
          declarationColumn: position.column,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
          uniqueId,
          scopeRange
        })
      }
    });

    // Handle class declarations
    ast.find(jscodeshift.ClassDeclaration).forEach((path) => {
      const { node } = path
      if (node.id && node.id.type === "Identifier") {
        const className = node.id.name
        const position = getNodePosition(node);

        const uniqueId = createUniqueVariableId(className, position.line, position.column);
        const scopeRange = calculateScopeRange(node, ast, sourceLines.length);

        declarationsList.push({
          name: className,
          declarationType: "class",
          declarationLine: position.line,
          declarationColumn: position.column,
          declarationContext: extractContext(sourceLines, position.line),
          declarationNode: node,
          references: [],
          uniqueId,
          scopeRange
        })
      }
    });

    // Find all identifier references
    const processedReferences = new Set();
    
    ast.find(jscodeshift.Identifier).forEach((path) => {
      const { node } = path
      const varName = node.name;

      // Find all declarations with this name
      const matchingDeclarations = declarationsList.filter(d => d.name === varName);
      if (matchingDeclarations.length === 0) {
        return;
      }

      const position = getNodePosition(node);
      const referenceKey = `${varName}:${position.line}:${position.column}`;

      if (processedReferences.has(referenceKey)) {
        return;
      }

      processedReferences.add(referenceKey);

      // Find the correct declaration for this reference
      // Choose the one that is in scope and closest to the reference (most recent declaration)
      // Filter to declarations that are declared before the reference
      const validDeclarations = matchingDeclarations.filter(d => d.declarationLine < position.line);
      
      if (validDeclarations.length > 0) {
        // Pick the most recent (closest) declaration
        const varInfo = validDeclarations.reduce((closest, current) => {
          return current.declarationLine > closest.declarationLine ? current : closest;
        });
        
        // Skip if this is the declaration itself
        if (position.line === varInfo.declarationLine && node === varInfo.declarationNode.id) {
          return;
        }
        
        // Skip property names and other contexts where renaming would be incorrect
        if (path.parent) {
          const parentNode = path.parent.node;
          if ((parentNode.type === 'Property' && parentNode.key === node) ||
              (parentNode.type === 'MemberExpression' && parentNode.property === node && !parentNode.computed) ||
              (parentNode.type === 'FunctionDeclaration' && parentNode.params.includes(node)) ||
              (parentNode.type === 'FunctionExpression' && parentNode.params.includes(node)) ||
              (parentNode.type === 'ArrowFunctionExpression' && parentNode.params.includes(node)) ||
              (parentNode.type === 'MethodDefinition' && parentNode.key === node) ||
              (parentNode.type === 'ImportSpecifier' && parentNode.local === node) ||
              (parentNode.type === 'ImportDefaultSpecifier' && parentNode.local === node) ||
              (parentNode.type === 'VariableDeclarator' && parentNode.id === node)) {
            return;
          }
        }
        
        // Add reference to this specific declaration
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
      }
      
      return;
    });

    // Enhance variable information with additional analysis
    for (const varInfo of declarationsList) {
      varInfo.inferredType = inferVariableType(varInfo)
      varInfo.scope = determineScopeLevel(varInfo.declarationNode, sourceCode)
      varInfo.behavioralPatterns = analyzeBehavioralPatterns(varInfo)
      varInfo.isExported = names.has(varInfo.name)
    }
    
    return declarationsList.sort(
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
 * @param {ExportInfo} exportInfo - Export information with aliasing details (optional)
 * @returns {string} Formatted Markdown report
 */
function generateMarkdownReport(variables, filename, exportInfo = null) {
  let report = `# Variable Reference Analysis: ${filename}\n\n`;

  if (variables.length === 0) {
    report += "No variables found or file could not be parsed.\n"
    return report
  }

  // Generate export classification summary if exportInfo is provided
  if (exportInfo) {
    report += `## Export Classification Summary\n\n`
    report += `**Direct Exports (Public API - Protected from renaming):** ${exportInfo.directExports.size}\n`
    report += `**Aliased Exports (Internal identifiers - Eligible for renaming):** ${exportInfo.aliasedExports.size}\n\n`
    
    if (exportInfo.aliasedExports.size > 0) {
      report += `### Aliased Export Details\n\n`
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
 * @param {number|null} renameLimit - Rename limit applied (if any)
 * @returns {string} Formatted Markdown report
 */
function generateRenameReport(results, filename, renameLimit = null) {
  let report = `# Intelligent Variable Rename Report: ${filename}\n\n`

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const limitExceeded = failed.filter(r => r.reason.includes('Rename limit') && r.reason.includes('reached'))

  report += '## Summary\n\n'
  report += `- **Total processed:** ${results.length}\n`
  report += `- **Successfully renamed:** ${successful.length}\n`
  report += `- **Failed:** ${failed.length}\n`
  if (renameLimit !== null) {
    report += `- **Rename limit:** ${renameLimit}\n`
    report += `- **Skipped due to limit:** ${limitExceeded.length}\n`
  }
  report += '\n'

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
    console.error("Usage: bun jsVariableAnalyzer.js <file1.js> [file2.js] ... [--rename] [--all] [--strategy=descriptive|concise|domain-specific] [--batch] [--limit=N] [--dry-run]")
    console.error("  --rename    Enable intelligent variable renaming")
    console.error("  --all       Rename all variables (default: only variables with name length < 4 chars)")
    console.error("  --strategy  Naming strategy: descriptive, concise, or domain-specific (default: descriptive)")
    console.error("  --batch     Process multiple variables in batch mode")
    console.error("  --limit     Maximum number of variables to rename in this session (default: unlimited)")
    console.error("  --dry-run   Use mock LLM with randomly generated names (no API calls)")
    process.exit(1)
  }

  const enableRename = options.rename || false
  const namingStrategy = options.strategy || 'descriptive'
  const enableBatch = options.batch || false
  const renameAll = options.all || false
  const renameLimit = options.limit !== undefined ? (options.limit === null ? null : parseInt(options.limit, 10)) : null
  const dryRun = options.dryRun || false

  // Configure LLM
  const llmConfig = {
    ...DEFAULT_LLM_CONFIG,
    namingStrategy,
    enableBatchProcessing: enableBatch,
    renameLimit,
    dryRun
  };

  // Calculate total steps for progress tracking
  // Analysis steps: 1) Read file, 2) Analyze variables, 3) Generate report
  // Rename steps (if enabled): 4) Process renames, 5) Write rename report
  const stepsPerFile = enableRename ? 5 : 3
  const totalSteps = filePaths.length * stepsPerFile
  const progress = new ProgressTracker(totalSteps, true)

  for (let fileIndex = 0; fileIndex < filePaths.length; fileIndex++) {
    const filePath = filePaths[fileIndex]
    try {
      progress.nextStep(`Reading file: ${basename(filePath)}`)
      const sourceCode = readFileSync(filePath, "utf-8")
      const filename = basename(filePath);

      progress.nextStep(`Analyzing variables in: ${filename}`)
      // Extract detailed export information with aliasing analysis
      const exportInfo = extractDetailedExportInfo(sourceCode)
      const variables = analyzeVariableReferences(sourceCode, filename, exportInfo.exportedNames)
      console.log(`  └─ Found ${variables.length} variables with ${variables.reduce((sum, v) => sum + v.references.length, 0)} total references`)

      progress.nextStep(`Generating analysis report for: ${filename}`)
      const analysisReport = generateMarkdownReport(variables, filename, exportInfo);
      const analysisOutputPath = `${filePath}-analysis.md`
      writeFileSync(analysisOutputPath, analysisReport);
      console.log(`  └─ Report saved: ${analysisOutputPath}`)

      if (enableRename) {
        console.log(`\n  → Rename configuration:`)
        console.log(`    • Strategy: ${namingStrategy}`)
        if (!renameAll) {
          console.log('    • Filter: Only variables with name length < 4 chars')
        } else {
          console.log('    • Filter: All variables')
        }
        if (renameLimit !== null) {
          console.log(`    • Limit: Maximum ${renameLimit} renames per session`)
        }
        if (dryRun) {
          console.log(`    • Mode: DRY RUN (mock LLM with randomly generated names)`)
        }

        progress.nextStep(`Processing intelligent renames for: ${filename}`, variables.length)

        // Classify variables based on export patterns
        const protectedExports = variables.filter(v => exportInfo.directExports.has(v.name))
        const aliasedInternalIds = variables.filter(v => exportInfo.aliasedExports.has(v.name))
        const nonExportedVariables = variables.filter(v => !v.isExported)
        const renamableVariables = filterVariablesByLength(
          [...aliasedInternalIds, ...nonExportedVariables],
          renameAll
        )

        console.log(`  ├─ Protected exports (public API): ${protectedExports.length}`)
        console.log(`  ├─ Aliased exports (internal IDs): ${aliasedInternalIds.length}`)
        console.log(`  └─ Non-exported variables: ${nonExportedVariables.length}`)

        let renameResults = []

        // Document protected direct exports (public API contract)
        for (const protectedVar of protectedExports) {
          renameResults.push({
            success: false,
            originalName: protectedVar.name,
            newName: '',
            reason: 'Variable is a direct export representing the module public contract',
            warnings: ['This variable is part of the public API and cannot be renamed'],
            astComparison: null
          })
        }

        const renameStepIndex = fileIndex * stepsPerFile + 3 // Step 4 for each file (0-indexed to 3 for step 4)
        if (enableBatch) {
          const batchResults = await processBatchRenames(sourceCode, renamableVariables, llmConfig, exportInfo)
          renameResults = renameResults.concat(batchResults)
          progress.updateSubstep(renameStepIndex, `Batch processing ${renamableVariables.length} variables`, renamableVariables.length, renamableVariables.length)
        } else {
          for (let i = 0; i < renamableVariables.length; i++) {
            const variable = renamableVariables[i]
            const result = await performIntelligentRename(sourceCode, variable, llmConfig, exportInfo)
            renameResults.push(result)
            progress.updateSubstep(renameStepIndex, `${result.originalName} → ${result.newName || 'FAILED'}`, i + 1, renamableVariables.length)

            if (!enableBatch) {
              // Add delay between API calls
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }

        progress.nextStep(`Writing rename report for: ${filename}`)
        const renameReport = generateRenameReport(renameResults, filename, renameLimit)
        const renameOutputPath = `${filePath}-rename-report.md`
        writeFileSync(renameOutputPath, renameReport)
        console.log(`  ├─ Rename report saved: ${renameOutputPath}`)

        // Apply successful renames to create a new file
        const successfulRenames = renameResults.filter(r => r.success)
        if (successfulRenames.length > 0) {
          let modifiedSource = sourceCode

          // Apply all successful renames using smart export protection
          for (const rename of successfulRenames) {
            modifiedSource = renameVariableInASTWithExportInfo(modifiedSource, rename.originalName, rename.newName, exportInfo)
          }

          const renamedFilePath = `${filePath}-renamed.js`
          writeFileSync(renamedFilePath, modifiedSource)
          console.log(`  ├─ Renamed file saved: ${renamedFilePath}`)
          console.log(`  └─ Successfully renamed ${successfulRenames.length} variables`)
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message)
    }
  }

  progress.complete()
}

// Parse command line arguments
const args = process.argv.slice(2)
const filePaths = args.filter(arg => !arg.startsWith('--'))
const limitArg = args.find(arg => arg.startsWith('--limit='))
const options = {
  rename: args.includes('--rename'),
  batch: args.includes('--batch'),
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  strategy: args.find(arg => arg.startsWith('--strategy='))?.split('=')[1] || 'descriptive',
  limit: limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined
};

// Run the script with command line arguments
if (import.meta.main) {
  await main(filePaths, options)
}

export {
  ProgressTracker,
  analyzeVariableReferences,
  generateMarkdownReport,
  generateRenameReport,
  extractContext,
  performIntelligentRename,
  processBatchRenames,
  getLLMNameSuggestion,
  generateMockLLMName,
  filterVariablesByLength,
  extractDetailedExportInfo,
  extractExportedNames,
  isRenamableIdentifier,
  renameVariableInAST,
  renameVariableInASTWithExportInfo,
  renameVariableByIdWithExportInfo,
  calculateScopeRange,
  createUniqueVariableId,
  validateRenameMapping
}