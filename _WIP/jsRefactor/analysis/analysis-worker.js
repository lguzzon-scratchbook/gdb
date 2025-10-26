/**
 * Analysis worker for processing individual files
 * Runs inside a Bun Worker thread to parse files and extract semantic information
 */

import { readFileSync } from 'node:fs'

/**
 * Main worker function for file analysis
 * @param {string} filepath - Path to file to analyze
 * @returns {Object} Analysis results
 */
export async function analyzeFile(filepath) {
  try {
    // Read file content
    const content = readFileSync(filepath, 'utf-8')

    // Parse AST using jscodeshift
    const ast = parseAST(content, filepath)

    // Extract nodes and edges
    const { nodes, edges } = extractSemanticInfo(ast, filepath)

    return {
      success: true,
      filepath,
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        fileSize: content.length,
        parseTime: Date.now()
      }
    }
  } catch (error) {
    return {
      success: false,
      filepath,
      error: error.message,
      nodes: [],
      edges: []
    }
  }
}

/**
 * Parse AST using jscodeshift
 * @param {string} content - File content
 * @param {string} filepath - File path
 * @returns {Object} AST
 */
function parseAST(content, _filepath) {
  // This would use jscodeshift in a real implementation
  // For now, we'll create a mock AST structure

  const ast = {
    type: 'File',
    program: {
      type: 'Program',
      body: [],
      sourceType: 'module',
      loc: {
        start: { line: 1, column: 0 },
        end: {
          line: content.split('\n').length,
          column: content.split('\n').pop().length
        }
      }
    },
    comments: [],
    tokens: []
  }

  // Simple parsing to extract basic structure
  const lines = content.split('\n')
  let inFunction = false
  let inClass = false
  let currentFunction = null
  let currentClass = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect function declarations
    if (line.match(/^(function|const|let|var)\s+\w+\s*=/)) {
      const match = line.match(/(\w+)\s*(?:=|\()/)
      if (match) {
        currentFunction = match[1]
        inFunction = true

        ast.program.body.push({
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: currentFunction },
          params: [],
          body: { type: 'BlockStatement', body: [] },
          loc: {
            start: { line: i + 1, column: 0 },
            end: { line: i + 1, column: line.length }
          }
        })
      }
    }

    // Detect class declarations
    if (line.match(/^class\s+\w+/)) {
      const match = line.match(/class\s+(\w+)/)
      if (match) {
        currentClass = match[1]
        inClass = true

        ast.program.body.push({
          type: 'ClassDeclaration',
          id: { type: 'Identifier', name: currentClass },
          superClass: null,
          body: { type: 'ClassBody', body: [] },
          loc: {
            start: { line: i + 1, column: 0 },
            end: { line: i + 1, column: line.length }
          }
        })
      }
    }

    // Detect variable declarations
    if (line.match(/^(const|let|var)\s+\w+/)) {
      const match = line.match(/(const|let|var)\s+(\w+)/)
      if (match) {
        ast.program.body.push({
          type: 'VariableDeclaration',
          kind: match[1],
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: match[2] },
              init: null,
              loc: {
                start: { line: i + 1, column: 0 },
                end: { line: i + 1, column: line.length }
              }
            }
          ],
          loc: {
            start: { line: i + 1, column: 0 },
            end: { line: i + 1, column: line.length }
          }
        })
      }
    }

    // Detect import statements
    if (line.match(/^import\s+/)) {
      ast.program.body.push({
        type: 'ImportDeclaration',
        specifiers: [],
        source: { type: 'StringLiteral', value: 'mock-module' },
        loc: {
          start: { line: i + 1, column: 0 },
          end: { line: i + 1, column: line.length }
        }
      })
    }

    // Detect export statements
    if (line.match(/^export\s+/)) {
      ast.program.body.push({
        type: 'ExportNamedDeclaration',
        specifiers: [],
        loc: {
          start: { line: i + 1, column: 0 },
          end: { line: i + 1, column: line.length }
        }
      })
    }

    // Simple block detection
    if (line.includes('{')) {
      if (inFunction) {
        inFunction = false
        currentFunction = null
      }
      if (inClass) {
        inClass = false
        currentClass = null
      }
    }
  }

  return ast
}

/**
 * Extract semantic information from AST
 * @param {Object} ast - AST object
 * @param {string} filepath - File path
 * @returns {Object} Extracted nodes and edges
 */
function extractSemanticInfo(ast, filepath) {
  const nodes = []
  const edges = []

  // Extract nodes from AST body
  for (const statement of ast.program.body) {
    const node = extractNodeFromStatement(statement, filepath)
    if (node) {
      nodes.push(node)
    }
  }

  // Extract edges from relationships
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const edge = extractEdgeBetweenNodes(nodes[i], nodes[j], ast)
      if (edge) {
        edges.push(edge)
      }
    }
  }

  return { nodes, edges }
}

/**
 * Extract node from AST statement
 * @param {Object} statement - AST statement
 * @param {string} filepath - File path
 * @returns {Object|null} Node data or null
 */
function extractNodeFromStatement(statement, filepath) {
  switch (statement.type) {
    case 'FunctionDeclaration':
      return {
        id: `function:${statement.id?.name || 'anonymous'}:${filepath}`,
        type: 'function',
        name: statement.id?.name || 'anonymous',
        file: filepath,
        loc: statement.loc,
        kind: 'declaration',
        params: statement.params?.map((p) => p.name) || [],
        body: statement.body
      }

    case 'ClassDeclaration':
      return {
        id: `class:${statement.id?.name || 'anonymous'}:${filepath}`,
        type: 'class',
        name: statement.id?.name || 'anonymous',
        file: filepath,
        loc: statement.loc,
        superClass: statement.superClass?.name,
        body: statement.body
      }

    case 'VariableDeclaration': {
      const declarations = statement.declarations || []
      return declarations.map((decl) => ({
        id: `variable:${decl.id?.name || 'anonymous'}:${filepath}`,
        type: 'variable',
        name: decl.id?.name || 'anonymous',
        file: filepath,
        loc: decl.loc,
        kind: statement.kind,
        init: decl.init
      }))
    }

    case 'ImportDeclaration':
      return {
        id: `import:${statement.source?.value || 'unknown'}:${filepath}`,
        type: 'import',
        name: statement.source?.value || 'unknown',
        file: filepath,
        loc: statement.loc,
        specifiers: statement.specifiers || [],
        source: statement.source?.value
      }

    case 'ExportNamedDeclaration':
      return {
        id: `export:${filepath}`,
        type: 'export',
        name: 'export',
        file: filepath,
        loc: statement.loc,
        specifiers: statement.specifiers || []
      }

    default:
      return null
  }
}

/**
 * Extract edge between two nodes
 * @param {Object} sourceNode - Source node
 * @param {Object} targetNode - Target node
 * @param {Object} ast - AST object
 * @returns {Object|null} Edge data or null
 */
function extractEdgeBetweenNodes(sourceNode, targetNode, _ast) {
  // Simple relationship detection
  if (sourceNode.type === 'variable' && targetNode.type === 'function') {
    return {
      id: `edge:${sourceNode.id}->${targetNode.id}`,
      type: 'references',
      source: sourceNode.id,
      target: targetNode.id,
      relationship: 'variable-references-function',
      weight: 1.0,
      loc: sourceNode.loc
    }
  }

  if (sourceNode.type === 'function' && targetNode.type === 'variable') {
    return {
      id: `edge:${sourceNode.id}->${targetNode.id}`,
      type: 'modifies',
      source: sourceNode.id,
      target: targetNode.id,
      relationship: 'function-modifies-variable',
      weight: 1.0,
      loc: sourceNode.loc
    }
  }

  if (sourceNode.type === 'class' && targetNode.type === 'function') {
    return {
      id: `edge:${sourceNode.id}->${targetNode.id}`,
      type: 'contains',
      source: sourceNode.id,
      target: targetNode.id,
      relationship: 'class-contains-method',
      weight: 2.0,
      loc: sourceNode.loc
    }
  }

  if (sourceNode.type === 'import' && targetNode.type === 'function') {
    return {
      id: `edge:${sourceNode.id}->${targetNode.id}`,
      type: 'imports',
      source: sourceNode.id,
      target: targetNode.id,
      relationship: 'import-uses-function',
      weight: 1.5,
      loc: sourceNode.loc
    }
  }

  return null
}

// Worker message handling
if (typeof globalThis.onmessage !== 'undefined') {
  globalThis.onmessage = async (event) => {
    const { filepath } = event.data

    try {
      const result = await analyzeFile(filepath)
      globalThis.postMessage(result)
    } catch (error) {
      globalThis.postMessage({
        success: false,
        filepath,
        error: error.message,
        nodes: [],
        edges: []
      })
    }
  }
}
