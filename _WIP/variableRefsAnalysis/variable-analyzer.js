#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs"
import { basename } from "node:path"
import jscodeshift from "jscodeshift";

/**
 * @typedef {Object} VariableReference
 * @property {string} name - The variable name
 * @property {number} line - Line number (1-based)
 * @property {number} column - Column number (0-based)
 * @property {string} context - Code context around the reference
 * @property {string} type - Type of reference ('declaration' or 'usage')
 */

/**
 * @typedef {Object} VariableInfo
 * @property {string} name - The variable name
 * @property {string} declarationType - Type of declaration (var, let, const, function, class)
 * @property {number} declarationLine - Line where variable is declared
 * @property {string} declarationContext - Code context around the declaration
 * @property {VariableReference[]} references - All references to this variable
 */

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
  // Simple scope checking - in a real implementation, you'd want more sophisticated scope analysis
  // For now, we'll assume all references in the same file are potentially in scope
  const declPos = getNodePosition(declarationNode)
  const refPos = getNodePosition(referenceNode);

  // Reference must come after declaration (simplified scope rule)
  return (
    refPos.line > declPos.line ||
    (refPos.line === declPos.line && refPos.column >= declPos.column)
  )
}

/**
 * Analyzes a JavaScript source file for variable declarations and references
 * @param {string} sourceCode - The JavaScript source code to analyze
 * @param {string} filename - Name of the file being analyzed
 * @returns {VariableInfo[]} Array of variable information objects
 */
function analyzeVariableReferences(sourceCode, filename) {
  const sourceLines = sourceCode.split("\n")
  const variableMap = new Map();

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
          declarationContext: extractContext(sourceLines, position.line), // Added declaration context
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
          declarationContext: extractContext(sourceLines, position.line), // Added declaration context
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
          declarationContext: extractContext(sourceLines, position.line), // Added declaration context
          declarationNode: node,
          references: [],
        })
      }
    });

    // Find all identifier references
    ast.find(jscodeshift.Identifier).forEach((path) => {
      const { node } = path
      const varName = node.name;

      // Skip if this identifier is not a variable we're tracking
      if (!declarations.has(varName)) {
        return
      }

      const varInfo = declarations.get(varName)
      const position = getNodePosition(node);

      // Skip the declaration itself
      if (
        position.line === varInfo.declarationLine &&
        node === varInfo.declarationNode.id
      ) {
        return
      }

      // Check if reference is within scope (simplified)
      if (isWithinScope(varInfo.declarationNode, node)) {
        const context = extractContext(sourceLines, position.line);

        varInfo.references.push({
          name: varName,
          line: position.line,
          column: position.column,
          context: context,
          type: "usage",
        })
      }
    });

    // Convert map to array and sort by declaration line
    return Array.from(declarations.values()).sort(
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
    report += `## Variable: \`${variable.name}\`\n\n`
    report += `**Declaration Type:** \`${variable.declarationType}\`  \n`
    report += `**Declared on line:** ${variable.declarationLine}\n\n`

    // Added declaration context section
    report += "### Declaration Context\n\n"
    report += "```javascript\n"
    report += variable.declarationContext
    report += "\n```\n\n"

    report += `**Total references:** ${variable.references.length}\n\n`;

    if (variable.references.length === 0) {
      report += "*No references found.*\n\n"
      continue
    }

    for (const reference of variable.references) {
      report += `### Reference at Line ${reference.line}, Column ${reference.column}\n\n`
      report += "```javascript\n"
      report += reference.context
      report += "\n```\n\n"
    }
  }

  return report
}

/**
 * Main function to analyze JavaScript files and generate reports
 * @param {string[]} filePaths - Array of file paths to analyze
 */
async function main(filePaths) {
  if (!filePaths || filePaths.length === 0) {
    console.error("Usage: bun variable-analyzer.js <file1.js> [file2.js] ...")
    process.exit(1)
  }

  for (const filePath of filePaths) {
    try {
      console.log(`Analyzing: ${filePath}`);

      const sourceCode = readFileSync(filePath, "utf-8")
      const filename = basename(filePath);

      const variables = analyzeVariableReferences(sourceCode, filename)
      const report = generateMarkdownReport(variables, filename);

      const outputPath = `${filePath}-analysis.md`
      writeFileSync(outputPath, report);

      console.log(`Report generated: ${outputPath}`)
      console.log(
        `Found ${variables.length} variables with ${variables.reduce((sum, v) => sum + v.references.length, 0)} total references\n`,
      );
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message)
    }
  }
}

// Run the script with command line arguments
if (import.meta.main) {
  const filePaths = process.argv.slice(2)
  await main(filePaths)
}

export { analyzeVariableReferences, generateMarkdownReport, extractContext }
