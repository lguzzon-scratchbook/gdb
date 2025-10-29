/**
 * Heuristic analyzer for detecting anti-patterns and suggesting simple renames
 */

export class HeuristicAnalyzer {
  constructor(config = {}) {
    this.antiPatterns = config.antiPatterns || this._getDefaultAntiPatterns()
    this.confidenceWeights =
      config.confidenceWeights || this._getDefaultConfidenceWeights()
  }

  /**
   * Analyze CKG for heuristic suggestions
   * @param {CodeKnowledgeGraph} ckg - Code Knowledge Graph
   * @returns {Array<Object>} Array of suggestions
   */
  async analyze(ckg) {
    const suggestions = []
    const nodes = ckg.getAllNodes()

    for (const node of nodes) {
      const nodeSuggestions = this._analyzeNode(node, ckg)
      suggestions.push(...nodeSuggestions)
    }

    return suggestions
  }

  /**
   * Analyze individual node for heuristic suggestions
   * @param {Object} node - Node to analyze
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<Object>} Array of suggestions
   */
  _analyzeNode(node, ckg) {
    const suggestions = []

    // Check anti-patterns
    for (const pattern of this.antiPatterns) {
      if (this._matchesPattern(node, pattern)) {
        const suggestion = this._createSuggestion(node, pattern, ckg)
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }
    }

    return suggestions
  }

  /**
   * Check if node matches anti-pattern
   * @param {Object} node - Node to check
   * @param {Object} pattern - Anti-pattern definition
   * @returns {boolean} True if matches pattern
   */
  _matchesPattern(node, pattern) {
    // Check type match
    if (pattern.types && !pattern.types.includes(node.type)) {
      return false
    }

    // Check name pattern
    if (pattern.namePattern && !pattern.namePattern.test(node.name)) {
      return false
    }

    // Check custom matcher
    if (pattern.matcher && !pattern.matcher(node, ckg)) {
      return false
    }

    return true
  }

  /**
   * Create suggestion from anti-pattern match
   * @param {Object} node - Node that matched
   * @param {Object} pattern - Anti-pattern definition
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Object|null} Suggestion object or null
   */
  _createSuggestion(node, pattern, ckg) {
    const suggestedName = pattern.generateName(node, ckg)

    if (!suggestedName || suggestedName === node.name) {
      return null
    }

    const confidence = this._calculateConfidence(node, pattern, ckg)

    return {
      nodeId: node.id,
      type: pattern.type || 'rename',
      currentName: node.name,
      suggestedName: suggestedName,
      confidence: confidence,
      reasoning:
        pattern.reasoning || `Anti-pattern detected: ${pattern.description}`,
      source: 'heuristic',
      pattern: pattern.name,
      alternatives: pattern.alternatives ? pattern.alternatives(node, ckg) : [],
      metadata: {
        nodeType: node.type,
        file: node.file,
        pattern: pattern.name,
        matchedRules: pattern.matchedRules || []
      }
    }
  }

  /**
   * Calculate confidence for suggestion
   * @param {Object} node - Node being analyzed
   * @param {Object} pattern - Anti-pattern definition
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {number} Confidence score (0-1)
   */
  _calculateConfidence(node, pattern, ckg) {
    let confidence = pattern.baseConfidence || 0.5

    // Apply confidence weights
    for (const [factor, weight] of Object.entries(this.confidenceWeights)) {
      if (pattern[factor] !== undefined) {
        confidence *= weight
      }
    }

    // Context-based adjustments
    if (pattern.contextAdjustment) {
      confidence = pattern.contextAdjustment(confidence, node, ckg)
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Get default anti-patterns
   * @returns {Array<Object>} Default anti-patterns
   */
  _getDefaultAntiPatterns() {
    return [
      {
        name: 'generic_data',
        description: 'Generic data variable names',
        types: ['variable'],
        namePattern: /^(data|item|obj|value|result|output|input)$/i,
        type: 'rename',
        baseConfidence: 0.8,
        reasoning: 'Generic data names are not descriptive',
        generateName: (node, ckg) => this._generateDataName(node, ckg),
        alternatives: (node, ckg) => this._generateDataAlternatives(node, ckg)
      },
      {
        name: 'single_letter',
        description: 'Single letter variable names',
        types: ['variable'],
        namePattern: /^[a-z]$/i,
        type: 'rename',
        baseConfidence: 0.9,
        reasoning: 'Single letter names are not descriptive',
        generateName: (node, ckg) => this._generateSingleLetterName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateSingleLetterAlternatives(node, ckg)
      },
      {
        name: 'temp_var',
        description: 'Temporary variable names',
        types: ['variable'],
        namePattern: /^(temp|tmp|_|[a-z]_?[a-z]_?[a-z]_?)$/i,
        type: 'rename',
        baseConfidence: 0.7,
        reasoning: 'Temporary variable names should be more descriptive',
        generateName: (node, ckg) => this._generateTempVarName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateTempVarAlternatives(node, ckg)
      },
      {
        name: 'generic_func',
        description: 'Generic function names',
        types: ['function'],
        namePattern: /^(process|handle|do|run|execute|perform|get|set)$/i,
        type: 'rename',
        baseConfidence: 0.6,
        reasoning: 'Generic function names should be more specific',
        generateName: (node, ckg) => this._generateFunctionName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateFunctionAlternatives(node, ckg)
      },
      {
        name: 'boolean_prefix',
        description: 'Boolean variables with is/has prefix',
        types: ['variable'],
        namePattern: /^(is|has)[A-Z]/,
        type: 'rename',
        baseConfidence: 0.5,
        reasoning:
          'Boolean variables should not use is/has prefix for non-boolean values',
        generateName: (node, ckg) => this._generateBooleanName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateBooleanAlternatives(node, ckg)
      },
      {
        name: 'util_class',
        description: 'Utility class names',
        types: ['class'],
        namePattern: /^(Util|Helper|Manager|Handler|Processor)$/i,
        type: 'rename',
        baseConfidence: 0.4,
        reasoning: 'Utility class names should be more specific',
        generateName: (node, ckg) => this._generateClassName(node, ckg),
        alternatives: (node, ckg) => this._generateClassAlternatives(node, ckg)
      },
      {
        name: 'short_var',
        description: 'Very short variable names',
        types: ['variable'],
        matcher: (node, _ckg) =>
          node.name.length < 3 && !/^[i]$/i.test(node.name),
        type: 'rename',
        baseConfidence: 0.7,
        reasoning: 'Variable names should be at least 3 characters',
        generateName: (node, ckg) => this._generateShortVarName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateShortVarAlternatives(node, ckg)
      },
      {
        name: 'number_suffix',
        description: 'Variables with number suffixes',
        types: ['variable'],
        namePattern: /\d+$/,
        type: 'rename',
        baseConfidence: 0.6,
        reasoning: 'Variables should not use number suffixes',
        generateName: (node, ckg) => this._generateNumberSuffixName(node, ckg),
        alternatives: (node, ckg) =>
          this._generateNumberSuffixAlternatives(node, ckg)
      }
    ]
  }

  /**
   * Get default confidence weights
   * @returns {Object} Default confidence weights
   */
  _getDefaultConfidenceWeights() {
    return {
      highContext: 1.2,
      lowContext: 0.8,
      highUsage: 1.1,
      lowUsage: 0.9,
      highComplexity: 1.15,
      lowComplexity: 0.85
    }
  }

  /**
   * Generate descriptive data name
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateDataName(node, ckg) {
    // Try to infer data type from usage
    const edges = ckg.getEdgesForNode(node.id)
    const usage = this._analyzeUsage(edges)

    if (usage.isArray) {
      return `${usage.type}Array`
    }

    if (usage.isString) {
      return `${usage.type}String`
    }

    if (usage.isNumber) {
      return `${usage.type}Number`
    }

    if (usage.isObject) {
      return `${usage.type}Object`
    }

    if (usage.isBoolean) {
      return `${usage.type}Boolean`
    }

    // Default suggestions based on context
    const context = this._getNodeContext(node, ckg)
    if (context.file) {
      const fileName = context.file.split('/').pop().split('.')[0]
      return `${fileName}Data`
    }

    return 'processedData'
  }

  /**
   * Generate name for single letter variable
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateSingleLetterName(node, ckg) {
    // Try to infer purpose from usage
    const edges = ckg.getEdgesForNode(node.id)
    const usage = this._analyzeUsage(edges)

    if (usage.isIndex) {
      return 'index'
    }

    if (usage.isKey) {
      return 'key'
    }

    if (usage.isId) {
      return 'id'
    }

    if (usage.isLength) {
      return 'length'
    }

    if (usage.isCount) {
      return 'count'
    }

    // Default based on type
    if (node.type === 'variable') {
      return 'value'
    }

    return 'item'
  }

  /**
   * Generate name for temporary variable
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateTempVarName(node, ckg) {
    const edges = ckg.getEdgesForNode(node.id)
    const usage = this._analyzeUsage(edges)

    if (usage.isTemporary) {
      return 'temporaryValue'
    }

    if (usage.isBuffer) {
      return 'buffer'
    }

    if (usage.isCache) {
      return 'cache'
    }

    return 'result'
  }

  /**
   * Generate function name
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateFunctionName(node, ckg) {
    const edges = ckg.getEdgesForNode(node.id)
    const usage = this._analyzeUsage(edges)

    if (usage.returnsArray) {
      return 'createArray'
    }

    if (usage.returnsObject) {
      return 'createObject'
    }

    if (usage.returnsString) {
      return 'createString'
    }

    if (usage.returnsNumber) {
      return 'calculateNumber'
    }

    if (usage.returnsBoolean) {
      return 'checkCondition'
    }

    // Default based on context
    const context = this._getNodeContext(node, ckg)
    if (context.file) {
      const fileName = context.file.split('/').pop().split('.')[0]
      return `${fileName}Function`
    }

    return 'processValue'
  }

  /**
   * Generate alternatives for data names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateDataAlternatives(node, ckg) {
    const primary = this._generateDataName(node, ckg)
    const alternatives = []

    if (primary !== 'processedData') {
      alternatives.push('data', 'value', 'result')
    }

    return alternatives
  }

  /**
   * Generate alternatives for single letter names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateSingleLetterAlternatives(node, ckg) {
    const primary = this._generateSingleLetterName(node, ckg)
    const alternatives = []

    if (primary !== 'item') {
      alternatives.push('value', 'element', 'entity')
    }

    return alternatives
  }

  /**
   * Generate alternatives for temporary variables
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateTempVarAlternatives(node, ckg) {
    const _primary = this._generateTempVarName(node, ckg)
    const alternatives = ['temp', 'temporary', 'result', 'output']

    return alternatives
  }

  /**
   * Generate alternatives for function names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateFunctionAlternatives(node, ckg) {
    const _primary = this._generateFunctionName(node, ckg)
    const alternatives = ['handle', 'process', 'execute', 'perform']

    return alternatives
  }

  /**
   * Generate boolean variable name
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateBooleanName(node, _ckg) {
    const name = node.name

    // Remove is/has prefix
    const cleanName = name.replace(/^(is|has)/i, '')

    // Convert to camelCase
    const camelCaseName = cleanName.charAt(0).toLowerCase() + cleanName.slice(1)

    return camelCaseName
  }

  /**
   * Generate alternatives for boolean names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateBooleanAlternatives(node, ckg) {
    const _primary = this._generateBooleanName(node, ckg)
    const alternatives = [node.name] // Keep original as alternative

    return alternatives
  }

  /**
   * Generate class name
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateClassName(node, ckg) {
    const context = this._getNodeContext(node, ckg)

    if (context.file) {
      const fileName = context.file.split('/').pop().split('.')[0]
      return `${this._toPascalCase(fileName)}Service`
    }

    return 'DataService'
  }

  /**
   * Generate alternatives for class names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateClassAlternatives(node, ckg) {
    const _primary = this._generateClassName(node, ckg)
    const alternatives = ['Service', 'Manager', 'Handler', 'Processor']

    return alternatives
  }

  /**
   * Generate name for short variables
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateShortVarName(node, ckg) {
    const edges = ckg.getEdgesForNode(node.id)
    const usage = this._analyzeUsage(edges)

    if (usage.isCounter) {
      return 'counter'
    }

    if (usage.isFlag) {
      return 'flag'
    }

    if (usage.isState) {
      return 'state'
    }

    return 'value'
  }

  /**
   * Generate alternatives for short variable names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateShortVarAlternatives(node, ckg) {
    const _primary = this._generateShortVarName(node, ckg)
    const alternatives = ['value', 'item', 'data', 'result']

    return alternatives
  }

  /**
   * Generate name for variables with number suffixes
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Suggested name
   */
  _generateNumberSuffixName(node, _ckg) {
    const name = node.name.replace(/\d+$/, '')

    if (name.length === 0) {
      return 'item'
    }

    return name
  }

  /**
   * Generate alternatives for number suffix names
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<string>} Alternative names
   */
  _generateNumberSuffixAlternatives(node, ckg) {
    const _primary = this._generateNumberSuffixName(node, ckg)
    const alternatives = [node.name] // Keep original

    return alternatives
  }

  /**
   * Analyze usage patterns from edges
   * @param {Array<Object>} edges - Array of edges
   * @returns {Object} Usage analysis
   */
  _analyzeUsage(edges) {
    const usage = {
      isArray: false,
      isString: false,
      isNumber: false,
      isObject: false,
      isBoolean: false,
      isIndex: false,
      isKey: false,
      isId: false,
      isLength: false,
      isCount: false,
      isTemporary: false,
      isBuffer: false,
      isCache: false,
      isCounter: false,
      isFlag: false,
      isState: false,
      returnsArray: false,
      returnsObject: false,
      returnsString: false,
      returnsNumber: false,
      returnsBoolean: false
    }

    for (const edge of edges) {
      // Analyze edge type and relationship
      if (edge.type === 'array-access') {
        usage.isArray = true
      }

      if (edge.type === 'property-access') {
        if (edge.relationship === 'array-length') {
          usage.isLength = true
        }
      }

      if (edge.type === 'method-call') {
        if (edge.relationship === 'array-push') {
          usage.isArray = true
        }
      }
    }

    return usage
  }

  /**
   * Get node context
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Object} Node context
   */
  _getNodeContext(node, ckg) {
    return {
      file: node.file,
      type: node.type,
      edges: ckg.getEdgesForNode(node.id).length,
      connectedNodes: ckg.getConnectedNodes(node.id, 1).length
    }
  }

  /**
   * Convert string to PascalCase
   * @param {string} str - String to convert
   * @returns {string} PascalCase string
   */
  _toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
