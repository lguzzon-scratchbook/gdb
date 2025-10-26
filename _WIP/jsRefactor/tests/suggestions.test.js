/**
 * Tests for the suggestions module
 */

import { SuggestionGenerator } from '../suggestions/suggestion-generator.js'
import { runner } from './test-runner.js'

runner.test('SuggestionGenerator should initialize with config', () => {
  const config = {
    enableHeuristics: true,
    enableLLM: false,
    confidenceThreshold: 0.8
  }

  const generator = new SuggestionGenerator(config)

  if (generator.config.confidenceThreshold !== 0.8) {
    throw new Error('Generator should use provided config')
  }
})

runner.test('SuggestionGenerator should create suggestions', () => {
  const generator = new SuggestionGenerator({ confidenceThreshold: 0.5 })

  const suggestion = generator.createSuggestion({
    nodeId: 'test-node',
    currentName: 'oldName',
    suggestedName: 'newName',
    type: 'variable',
    confidence: 0.9,
    reasoning: 'Better naming convention',
    source: 'heuristic'
  })

  if (!suggestion || suggestion.currentName !== 'oldName') {
    throw new Error('Suggestion not created correctly')
  }

  if (suggestion.confidence !== 0.9) {
    throw new Error('Suggestion confidence not set correctly')
  }
})

runner.test('SuggestionGenerator should filter by confidence threshold', () => {
  const generator = new SuggestionGenerator({ confidenceThreshold: 0.8 })

  const suggestions = [
    { confidence: 0.9, nodeId: 'high1' },
    { confidence: 0.7, nodeId: 'low1' },
    { confidence: 0.95, nodeId: 'high2' }
  ]

  const filtered = generator.filterByConfidence(suggestions)

  if (filtered.length !== 2) {
    throw new Error('Should filter out low confidence suggestions')
  }

  for (const suggestion of filtered) {
    if (suggestion.confidence < 0.8) {
      throw new Error('Filtered suggestion should meet confidence threshold')
    }
  }
})

runner.test('SuggestionGenerator should group suggestions by type', () => {
  const generator = new SuggestionGenerator({})

  const suggestions = [
    { type: 'variable', nodeId: 'var1' },
    { type: 'function', nodeId: 'func1' },
    { type: 'variable', nodeId: 'var2' },
    { type: 'class', nodeId: 'class1' }
  ]

  const grouped = generator.groupByType(suggestions)

  if (grouped.variable.length !== 2) {
    throw new Error('Should group variable suggestions correctly')
  }

  if (grouped.function.length !== 1) {
    throw new Error('Should group function suggestions correctly')
  }

  if (grouped.class.length !== 1) {
    throw new Error('Should group class suggestions correctly')
  }
})

runner.test('SuggestionGenerator should validate suggestions', () => {
  const generator = new SuggestionGenerator({})

  const validSuggestion = {
    nodeId: 'test',
    currentName: 'old',
    suggestedName: 'new',
    type: 'variable',
    confidence: 0.8
  }

  const invalidSuggestion = {
    nodeId: '', // Empty node ID should be invalid
    currentName: 'old',
    suggestedName: 'new',
    type: 'variable',
    confidence: 0.8
  }

  if (!generator.validateSuggestion(validSuggestion)) {
    throw new Error('Valid suggestion should pass validation')
  }

  if (generator.validateSuggestion(invalidSuggestion)) {
    throw new Error('Invalid suggestion should fail validation')
  }
})

runner.test('SuggestionGenerator should sort suggestions by confidence', () => {
  const generator = new SuggestionGenerator({})

  const suggestions = [
    { confidence: 0.7, nodeId: 'low' },
    { confidence: 0.9, nodeId: 'high' },
    { confidence: 0.8, nodeId: 'medium' }
  ]

  const sorted = generator.sortByConfidence(suggestions)

  if (sorted[0].confidence !== 0.9) {
    throw new Error('Highest confidence should be first')
  }

  if (sorted[2].confidence !== 0.7) {
    throw new Error('Lowest confidence should be last')
  }
})

runner.test('SuggestionGenerator should handle empty suggestion list', () => {
  const generator = new SuggestionGenerator({})

  const filtered = generator.filterByConfidence([])
  const grouped = generator.groupByType([])
  const sorted = generator.sortByConfidence([])

  if (filtered.length !== 0 || grouped.variable !== 0 || sorted.length !== 0) {
    throw new Error('Should handle empty lists gracefully')
  }
})

runner.test('SuggestionGenerator should detect conflicts', () => {
  const generator = new SuggestionGenerator({})

  const suggestions = [
    { nodeId: 'node1', currentName: 'old', suggestedName: 'new' },
    { nodeId: 'node2', currentName: 'old', suggestedName: 'new' }, // Same rename - conflict
    { nodeId: 'node3', currentName: 'old', suggestedName: 'different' }
  ]

  const conflicts = generator.detectConflicts(suggestions)

  if (conflicts.length === 0) {
    throw new Error('Should detect naming conflicts')
  }
})

runner.test('SuggestionGenerator should resolve conflicts', () => {
  const generator = new SuggestionGenerator({})

  const conflictingSuggestions = [
    {
      nodeId: 'node1',
      currentName: 'old',
      suggestedName: 'new',
      confidence: 0.9
    },
    {
      nodeId: 'node2',
      currentName: 'old',
      suggestedName: 'new',
      confidence: 0.7
    }
  ]

  const resolved = generator.resolveConflicts(conflictingSuggestions)

  // Should keep the higher confidence suggestion
  if (resolved.length !== 1) {
    throw new Error('Should resolve conflicts by keeping best suggestion')
  }

  if (resolved[0].nodeId !== 'node1') {
    throw new Error('Should keep higher confidence suggestion')
  }
})
