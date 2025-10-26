/**
 * Suggestion generation module
 * Implements heuristic and LLM-based rename suggestions using the CKG
 */

import { HeuristicAnalyzer } from './heuristic-analyzer.js'
import { LLMAnalyzer } from './llm-analyzer.js'

export class SuggestionGenerator {
  constructor(config = {}) {
    this.enableHeuristics = config.enableHeuristics !== false
    this.enableLLM = config.enableLLM !== false
    this.llmModel = config.llmModel || 'z-ai/glm-4.6:exacto'
    this.confidenceThreshold = config.confidenceThreshold || 0.7
    this.maxBatchSize = config.maxBatchSize || 10
    this.enableCache = config.enableCache !== false

    // Initialize analyzers
    this.heuristicAnalyzer = new HeuristicAnalyzer(config.heuristics || {})
    this.llmAnalyzer = new LLMAnalyzer({
      model: this.llmModel,
      confidenceThreshold: this.confidenceThreshold,
      ...config.llm
    })

    // Cache for suggestions
    this.suggestionCache = new Map()
  }

  /**
   * Generate suggestions using CKG
   * @param {CodeKnowledgeGraph} ckg - Code Knowledge Graph
   * @param {Object} options - Generation options
   * @returns {Array<Object>} Array of suggestions
   */
  async generateSuggestions(ckg, options = {}) {
    const suggestions = []

    // Phase 1: Heuristic analysis
    if (this.enableHeuristics) {
      const heuristicSuggestions = await this.heuristicAnalyzer.analyze(ckg)
      suggestions.push(...heuristicSuggestions)
    }

    // Phase 2: LLM analysis
    if (this.enableLLM) {
      const llmSuggestions = await this.llmAnalyzer.analyze(ckg, {
        batchSize: options.batchSize || this.maxBatchSize,
        ...options.llm
      })
      suggestions.push(...llmSuggestions)
    }

    // Phase 3: Consolidate and filter suggestions
    const consolidatedSuggestions = this.consolidateSuggestions(suggestions)

    // Phase 4: Filter by confidence threshold
    const filteredSuggestions = consolidatedSuggestions.filter(
      (suggestion) => suggestion.confidence >= this.confidenceThreshold
    )

    return filteredSuggestions
  }

  /**
   * Consolidate suggestions from multiple analyzers
   * @param {Array<Object>} suggestions - Array of suggestions
   * @returns {Array<Object>} Consolidated suggestions
   */
  consolidateSuggestions(suggestions) {
    const consolidated = new Map()

    for (const suggestion of suggestions) {
      const key = this._generateSuggestionKey(suggestion)

      if (consolidated.has(key)) {
        // Merge with existing suggestion
        const existing = consolidated.get(key)
        const merged = this._mergeSuggestions(existing, suggestion)
        consolidated.set(key, merged)
      } else {
        // Add new suggestion
        consolidated.set(key, suggestion)
      }
    }

    return Array.from(consolidated.values())
  }

  /**
   * Generate unique key for suggestion
   * @param {Object} suggestion - Suggestion object
   * @returns {string} Unique key
   */
  _generateSuggestionKey(suggestion) {
    return `${suggestion.type}:${suggestion.nodeId}:${suggestion.currentName}`
  }

  /**
   * Merge two suggestions for the same target
   * @param {Object} suggestion1 - First suggestion
   * @param {Object} suggestion2 - Second suggestion
   * @returns {Object} Merged suggestion
   */
  _mergeSuggestions(suggestion1, suggestion2) {
    // Choose the suggestion with higher confidence
    const primary =
      suggestion1.confidence >= suggestion2.confidence
        ? suggestion1
        : suggestion2
    const secondary =
      suggestion1.confidence >= suggestion2.confidence
        ? suggestion2
        : suggestion1

    return {
      ...primary,
      sources: [
        ...(primary.sources || [primary.source]),
        ...(secondary.sources || [secondary.source])
      ],
      merged: true,
      originalConfidence: primary.confidence,
      secondaryConfidence: secondary.confidence
    }
  }

  /**
   * Get suggestion statistics
   * @param {Array<Object>} suggestions - Array of suggestions
   * @returns {Object} Statistics
   */
  getSuggestionStats(suggestions) {
    const stats = {
      total: suggestions.length,
      byType: {},
      byConfidence: {
        high: 0,
        medium: 0,
        low: 0
      },
      bySource: {},
      averageConfidence: 0
    }

    let totalConfidence = 0

    for (const suggestion of suggestions) {
      // Count by type
      stats.byType[suggestion.type] = (stats.byType[suggestion.type] || 0) + 1

      // Count by confidence level
      if (suggestion.confidence >= 0.8) {
        stats.byConfidence.high++
      } else if (suggestion.confidence >= 0.6) {
        stats.byConfidence.medium++
      } else {
        stats.byConfidence.low++
      }

      // Count by source
      const source = suggestion.source || 'unknown'
      stats.bySource[source] = (stats.bySource[source] || 0) + 1

      totalConfidence += suggestion.confidence
    }

    stats.averageConfidence =
      suggestions.length > 0 ? totalConfidence / suggestions.length : 0

    return stats
  }

  /**
   * Validate suggestions
   * @param {Array<Object>} suggestions - Array of suggestions
   * @param {CodeKnowledgeGraph} ckg - CKG for validation
   * @returns {Object} Validation results
   */
  validateSuggestions(suggestions, ckg) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      conflicts: []
    }

    for (const suggestion of suggestions) {
      // Check if target node exists
      if (!ckg.getNode(suggestion.nodeId)) {
        validation.errors.push(`Target node not found: ${suggestion.nodeId}`)
        validation.isValid = false
        continue
      }

      // Check if suggested name conflicts with existing names
      const existingNode = ckg
        .getAllNodes()
        .find(
          (node) =>
            node.name === suggestion.suggestedName &&
            node.id !== suggestion.nodeId
        )

      if (existingNode) {
        validation.conflicts.push({
          suggestion: suggestion,
          conflictingNode: existingNode,
          type: 'name_conflict'
        })
      }

      // Check if suggested name is a JavaScript reserved word
      const reservedWords = [
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'enum',
        'export',
        'extends',
        'false',
        'finally',
        'for',
        'function',
        'if',
        'implements',
        'import',
        'in',
        'instanceof',
        'interface',
        'let',
        'new',
        'null',
        'package',
        'private',
        'protected',
        'public',
        'return',
        'super',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'typeof',
        'var',
        'void',
        'while',
        'with',
        'yield'
      ]

      if (reservedWords.includes(suggestion.suggestedName)) {
        validation.warnings.push({
          suggestion: suggestion,
          type: 'reserved_word',
          message: `Suggested name '${suggestion.suggestedName}' is a JavaScript reserved word`
        })
      }

      // Check naming conventions
      if (
        suggestion.type === 'class' &&
        !this._isPascalCase(suggestion.suggestedName)
      ) {
        validation.warnings.push({
          suggestion: suggestion,
          type: 'naming_convention',
          message: `Class name '${suggestion.suggestedName}' should use PascalCase`
        })
      }

      if (
        (suggestion.type === 'function' || suggestion.type === 'variable') &&
        !this._isCamelCase(suggestion.suggestedName)
      ) {
        validation.warnings.push({
          suggestion: suggestion,
          type: 'naming_convention',
          message: `${suggestion.type} name '${suggestion.suggestedName}' should use camelCase`
        })
      }
    }

    return validation
  }

  /**
   * Check if string is PascalCase
   * @param {string} str - String to check
   * @returns {boolean} True if PascalCase
   */
  _isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str)
  }

  /**
   * Check if string is camelCase
   * @param {string} str - String to check
   * @returns {boolean} True if camelCase
   */
  _isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str)
  }

  /**
   * Clear suggestion cache
   */
  clearCache() {
    this.suggestionCache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.suggestionCache.size,
      enabled: this.enableCache
    }
  }
}
