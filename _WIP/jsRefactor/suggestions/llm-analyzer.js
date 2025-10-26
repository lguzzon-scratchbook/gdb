/**
 * LLM analyzer for context-aware rename suggestions
 */

export class LLMAnalyzer {
  constructor(config = {}) {
    this.model = config.model || 'z-ai/glm-4.6:exacto'
    this.confidenceThreshold = config.confidenceThreshold || 0.7
    this.maxBatchSize = config.maxBatchSize || 10
    this.timeout = config.timeout || 30000 * 10
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY
    this.baseURL = config.baseURL || 'https://openrouter.ai/api/v1'

    // LLM prompt templates
    this.prompts = {
      rename: this._getRenamePrompt(),
      validate: this._getValidationPrompt(),
      batch: this._getBatchPrompt()
    }
  }

  /**
   * Analyze CKG using LLM for suggestions
   * @param {CodeKnowledgeGraph} ckg - Code Knowledge Graph
   * @param {Object} options - Analysis options
   * @returns {Array<Object>} Array of suggestions
   */
  async analyze(ckg, options = {}) {
    const nodes = ckg.getAllNodes()
    const batchSize = options.batchSize || this.maxBatchSize

    const suggestions = []

    // Process nodes in batches
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize)
      const batchSuggestions = await this._analyzeBatch(batch, ckg, options)
      suggestions.push(...batchSuggestions)
    }

    return suggestions
  }

  /**
   * Analyze a batch of nodes
   * @param {Array<Object>} nodes - Array of nodes to analyze
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @param {Object} options - Analysis options
   * @returns {Array<Object>} Array of suggestions
   */
  async _analyzeBatch(nodes, ckg, _options) {
    const batchPrompt = this._buildBatchPrompt(nodes, ckg)

    try {
      const response = await this._makeLLMRequest(batchPrompt)
      return this._parseBatchResponse(response, nodes, ckg)
    } catch (error) {
      console.error(`LLM batch analysis failed: ${error.message}`)
      return []
    }
  }

  /**
   * Build batch prompt for LLM
   * @param {Array<Object>} nodes - Array of nodes
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Batch prompt
   */
  _buildBatchPrompt(nodes, ckg) {
    const nodeContexts = nodes.map((node) => this._buildNodeContext(node, ckg))

    const prompt = `${this.prompts.batch}

## Code Knowledge Graph Context:
${JSON.stringify(
      {
        totalNodes: ckg.getNodeCount(),
        totalEdges: ckg.getEdgeCount(),
        fileCount: ckg.getFileCount()
      },
      null,
      2
    )}

## Nodes to Analyze:
${JSON.stringify(nodeContexts, null, 2)}

## Instructions:
1. Analyze each node for potential renaming opportunities
2. Consider the node's role, usage patterns, and relationships
3. Suggest better names that are more descriptive and follow conventions
4. Provide confidence scores for each suggestion
5. Return suggestions in the specified JSON format

## Response Format:
{
  "suggestions": [
    {
      "nodeId": "node_id",
      "currentName": "current_name",
      "suggestedName": "suggested_name",
      "confidence": 0.85,
      "reasoning": "Detailed reasoning for the suggestion",
      "alternatives": ["alt1", "alt2"],
      "context": {
        "type": "node_type",
        "file": "file_path",
        "usage": "usage_description"
      }
    }
  ]
}

SUGGESTIONS:`

    return prompt
  }

  /**
   * Build context for a single node
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Object} Node context
   */
  _buildNodeContext(node, ckg) {
    const edges = ckg.getEdgesForNode(node.id)
    const connectedNodes = ckg.getConnectedNodes(node.id, 2)

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      file: node.file,
      loc: node.loc,
      edges: edges.map((edge) => ({
        type: edge.type,
        relationship: edge.relationship,
        target: edge.target,
        weight: edge.weight
      })),
      connectedNodes: connectedNodes.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        relationship: this._getNodeRelationship(node, n, ckg)
      })),
      metadata: {
        edgeCount: edges.length,
        connectedCount: connectedNodes.length,
        inDegree: ckg.getIncomingEdges(node.id).length,
        outDegree: ckg.getOutgoingEdges(node.id).length
      }
    }
  }

  /**
   * Get relationship between two nodes
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Relationship description
   */
  _getNodeRelationship(sourceNode, targetNode, ckg) {
    const path = ckg.findPath(sourceNode.id, targetNode.id)

    if (path.length === 0) {
      return 'direct'
    } else if (path.length === 1) {
      return 'indirect'
    } else {
      return `path_${path.length}`
    }
  }

  /**
   * Make request to LLM API
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} LLM response
   */
  async _makeLLMRequest(prompt) {
    console.log(`_makeLLMRequest prompt:[ ${prompt} ]`)
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.01,
      max_tokens: 4000
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/jsrefactor',
        'X-Title': 'JSRefactor LLM Analyzer'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.timeout)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from LLM API')
    }
    console.log(`_makeLLMRequest return:[ ${data.choices[0].message.content} ]`)
    return data.choices[0].message.content
  }

  /**
   * Parse batch response from LLM
   * @param {string} response - LLM response
   * @param {Array<Object>} nodes - Original nodes
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Array<Object>} Array of suggestions
   */
  _parseBatchResponse(response, nodes, ckg) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid suggestions format in LLM response')
      }

      // Validate and enhance suggestions
      return parsed.suggestions
        .map((suggestion) => {
          // Find corresponding node
          const node = nodes.find((n) => n.id === suggestion.nodeId)
          if (!node) {
            console.warn(`No node found for suggestion: ${suggestion.nodeId}`)
            return null
          }

          // Validate suggestion
          if (
            !suggestion.suggestedName ||
            suggestion.suggestedName === node.name
          ) {
            return null
          }

          // Add metadata
          return {
            ...suggestion,
            source: 'llm',
            model: this.model,
            nodeId: node.id,
            currentNode: node.name,
            confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.5)),
            metadata: {
              ...suggestion.context,
              ckgContext: {
                totalNodes: ckg.getNodeCount(),
                totalEdges: ckg.getEdgeCount(),
                fileCount: ckg.getFileCount()
              }
            }
          }
        })
        .filter(Boolean)
    } catch (error) {
      console.error(`Failed to parse LLM response: ${error.message}`)
      return []
    }
  }

  /**
   * Get rename prompt template
   * @returns {string} Rename prompt template
   */
  _getRenamePrompt() {
    return `You are an expert JavaScript developer specializing in code naming and refactoring.

TASK: Analyze JavaScript code and suggest better names for identifiers.

REQUIREMENTS:
1. Follow JavaScript naming conventions (camelCase for variables/functions, PascalCase for classes)
2. Be descriptive but concise
3. Avoid generic names like "data", "item", "result"
4. Consider the identifier's purpose and scope
5. Use domain-specific terminology when appropriate
6. Ensure the name is not a JavaScript reserved word
7. Make it semantically meaningful

CONTEXT: You will be analyzing a Code Knowledge Graph (CKG) that contains:
- Node information (type, name, file, location)
- Edge relationships (dependencies, usage patterns)
- File and module structure
- Cross-module relationships

RESPONSE FORMAT:
Provide your response as a JSON object with the following structure:
{
  "suggestions": [
    {
      "nodeId": "node_id",
      "currentName": "current_name",
      "suggestedName": "suggested_name",
      "confidence": 0.9,
      "reasoning": "Detailed explanation of why this name is better",
      "alternatives": ["alternative1", "alternative2"],
      "context": {
        "type": "node_type",
        "file": "file_path",
        "usage": "usage_description"
      }
    }
  ]
}

Focus on identifiers that would benefit from renaming based on:
- Generic or non-descriptive names
- Naming convention violations
- Contextual improvements
- Domain-specific terminology`
  }

  /**
   * Get validation prompt template
   * @returns {string} Validation prompt template
   */
  _getValidationPrompt() {
    return `You are an expert JavaScript developer specializing in code naming validation.

TASK: Validate suggested renames for JavaScript identifiers.

REQUIREMENTS:
1. Check if the suggested name follows JavaScript conventions
2. Ensure the name is not a JavaScript reserved word
3. Verify the name is descriptive and appropriate for its type
4. Check for potential naming conflicts
5. Validate that the name improves code readability

RESPONSE FORMAT:
{
  "validations": [
    {
      "nodeId": "node_id",
      "suggestedName": "suggested_name",
      "isValid": true,
      "issues": [],
      "score": 0.9,
      "recommendations": []
    }
  ]
}

Focus on:
- Naming convention compliance
- Reserved word conflicts
- Descriptive appropriateness
- Readability improvements`
  }

  /**
   * Get batch prompt template
   * @returns {string} Batch prompt template
   */
  _getBatchPrompt() {
    return `You are an expert JavaScript developer specializing in code naming and refactoring.

TASK: Analyze multiple JavaScript identifiers and suggest better names.

REQUIREMENTS:
1. Follow JavaScript naming conventions (camelCase for variables/functions, PascalCase for classes)
2. Be descriptive but concise
3. Avoid generic names like "data", "item", "result"
4. Consider each identifier's purpose and scope
5. Use domain-specific terminology when appropriate
6. Ensure names are not JavaScript reserved words
7. Make them semantically meaningful

CONTEXT: You will be analyzing a Code Knowledge Graph (CKG) that contains:
- Node information (type, name, file, location)
- Edge relationships (dependencies, usage patterns)
- File and module structure
- Cross-module relationships

RESPONSE FORMAT:
{
  "suggestions": [
    {
      "nodeId": "node_id",
      "currentName": "current_name",
      "suggestedName": "suggested_name",
      "confidence": 0.9,
      "reasoning": "Detailed explanation of why this name is better",
      "alternatives": ["alternative1", "alternative2"],
      "context": {
        "type": "node_type",
        "file": "file_path",
        "usage": "usage_description"
      }
    }
  ]
}

Process all provided nodes and return suggestions for those that would benefit from renaming.`
  }

  /**
   * Validate a single suggestion
   * @param {Object} suggestion - Suggestion to validate
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {Object} Validation result
   */
  async validateSuggestion(suggestion, ckg) {
    const node = ckg.getNode(suggestion.nodeId)

    if (!node) {
      return {
        isValid: false,
        issues: [`Node not found: ${suggestion.nodeId}`],
        score: 0,
        recommendations: []
      }
    }

    const prompt = this._buildValidationPrompt(suggestion, node, ckg)

    try {
      const response = await this._makeLLMRequest(prompt)
      const parsed = JSON.parse(response.match(/\{[\s\S]*\}/)[0])

      return (
        parsed.validations[0] || {
          isValid: false,
          issues: ['Failed to validate suggestion'],
          score: 0,
          recommendations: []
        }
      )
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation failed: ${error.message}`],
        score: 0,
        recommendations: []
      }
    }
  }

  /**
   * Build validation prompt for a suggestion
   * @param {Object} suggestion - Suggestion to validate
   * @param {Object} node - Node data
   * @param {CodeKnowledgeGraph} ckg - CKG context
   * @returns {string} Validation prompt
   */
  _buildValidationPrompt(suggestion, node, ckg) {
    return `${this.prompts.validate}

## Suggestion to Validate:
${JSON.stringify(suggestion, null, 2)}

## Node Context:
${JSON.stringify(
      {
        id: node.id,
        name: node.name,
        type: node.type,
        file: node.file,
        loc: node.loc
      },
      null,
      2
    )}

## CKG Context:
${JSON.stringify(
      {
        totalNodes: ckg.getNodeCount(),
        totalEdges: ckg.getEdgeCount(),
        fileCount: ckg.getFileCount()
      },
      null,
      2
    )}

## Instructions:
1. Validate if the suggested name follows JavaScript conventions
2. Check for naming conflicts with existing identifiers
3. Ensure the name is appropriate for the node type
4. Verify the name improves code readability
5. Provide a confidence score for the validation

RESPONSE FORMAT:
{
  "validations": [
    {
      "nodeId": "${suggestion.nodeId}",
      "suggestedName": "${suggestion.suggestedName}",
      "isValid": true,
      "issues": [],
      "score": 0.9,
      "recommendations": []
    }
  ]
}

VALIDATION:`
  }
}
