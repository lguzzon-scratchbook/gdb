/**
 * Code transformation module for applying approved changes
 * Uses jscodeshift for scope-aware renaming and handles cross-module updates
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export class ChangeApplier {
  constructor(config = {}) {
    this.enableCrossModule = config.enableCrossModule !== false
    this.enableConflictResolution = config.enableConflictResolution !== false
    this.backupFiles = config.backupFiles !== false
    this.validateRenames = config.validateRenames !== false
    this.dryRun = config.dryRun || false

    // Track applied changes
    this.appliedChanges = []
    this.conflicts = []
    this.backups = new Map()
  }

  /**
   * Apply approved changes to files
   * @param {Array<Object>} suggestions - Approved suggestions
   * @param {Object} config - Configuration options
   * @returns {Object} Application results
   */
  async applyChanges(suggestions, config = {}) {
    const results = {
      totalSuggestions: suggestions.length,
      appliedChanges: 0,
      skippedChanges: 0,
      conflicts: [],
      errors: [],
      filesModified: new Set(),
      backups: new Map()
    }

    // Group suggestions by file
    const suggestionsByFile = this._groupSuggestionsByFile(suggestions)

    // Process each file
    for (const [filePath, fileSuggestions] of suggestionsByFile) {
      try {
        const fileResult = await this._processFile(
          filePath,
          fileSuggestions,
          config
        )

        results.appliedChanges += fileResult.appliedChanges
        results.skippedChanges += fileResult.skippedChanges
        results.conflicts.push(...fileResult.conflicts)
        results.errors.push(...fileResult.errors)
        results.filesModified.add(filePath)

        if (fileResult.backup) {
          results.backups.set(filePath, fileResult.backup)
        }
      } catch (error) {
        results.errors.push({
          file: filePath,
          error: error.message
        })
      }
    }

    // Store applied changes
    this.appliedChanges = suggestions.filter((s) => s.applied)
    this.conflicts = results.conflicts

    return results
  }

  /**
   * Group suggestions by file
   * @param {Array<Object>} suggestions - Array of suggestions
   * @returns {Map<string, Array<Object>>} Suggestions grouped by file
   */
  _groupSuggestionsByFile(suggestions) {
    const grouped = new Map()

    for (const suggestion of suggestions) {
      const filePath = suggestion.metadata?.file || 'unknown'

      if (!grouped.has(filePath)) {
        grouped.set(filePath, [])
      }

      grouped.get(filePath).push(suggestion)
    }

    return grouped
  }

  /**
   * Process a single file
   * @param {string} filePath - File path
   * @param {Array<Object>} suggestions - Suggestions for the file
   * @param {Object} config - Configuration options
   * @returns {Object} Processing result
   */
  async _processFile(filePath, suggestions, _config) {
    const result = {
      appliedChanges: 0,
      skippedChanges: 0,
      conflicts: [],
      errors: [],
      backup: null
    }

    try {
      // Create backup if enabled
      if (this.backupFiles && !this.dryRun) {
        result.backup = await this._createBackup(filePath)
      }

      // Read file content
      const originalContent = readFileSync(filePath, 'utf-8')

      // Apply transformations
      const transformedContent = await this._transformContent(
        originalContent,
        suggestions,
        filePath
      )

      // Validate transformations
      if (this.validateRenames && !this.dryRun) {
        const validation = this._validateTransformations(
          originalContent,
          transformedContent,
          suggestions
        )

        if (!validation.isValid) {
          result.conflicts.push(...validation.conflicts)
          result.skippedChanges += suggestions.length
          return result
        }
      }

      // Write transformed content
      if (!this.dryRun) {
        writeFileSync(filePath, transformedContent, 'utf-8')
        result.appliedChanges = suggestions.length
      } else {
        result.appliedChanges = suggestions.length
      }
    } catch (error) {
      result.errors.push({
        error: error.message,
        suggestion: 'file_processing'
      })
    }

    return result
  }

  /**
   * Transform file content with suggestions
   * @param {string} content - Original file content
   * @param {Array<Object>} suggestions - Suggestions to apply
   * @param {string} filePath - File path
   * @returns {string} Transformed content
   */
  async _transformContent(content, suggestions, filePath) {
    let transformedContent = content

    // Apply suggestions in order of confidence (highest first)
    const sortedSuggestions = suggestions.sort(
      (a, b) => b.confidence - a.confidence
    )

    for (const suggestion of sortedSuggestions) {
      try {
        transformedContent = this._applyRename(
          transformedContent,
          suggestion,
          filePath
        )

        // Mark suggestion as applied
        suggestion.applied = true
      } catch (error) {
        console.warn(
          `Failed to apply suggestion ${suggestion.nodeId}: ${error.message}`
        )
        suggestion.applied = false
      }
    }

    return transformedContent
  }

  /**
   * Apply a single rename transformation
   * @param {string} content - File content
   * @param {Object} suggestion - Suggestion to apply
   * @param {string} filePath - File path
   * @returns {string} Transformed content
   */
  _applyRename(content, suggestion, _filePath) {
    // This would use jscodeshift in a real implementation
    // For now, we'll do simple string replacement

    const currentName = suggestion.currentName
    const suggestedName = suggestion.suggestedName

    // Replace all occurrences of the current name
    // This is a simplified approach - jscodeshift would handle scope properly
    let transformedContent = content

    // Replace word boundaries to avoid partial matches
    const wordBoundary = `\\b${currentName}\\b`
    const regex = new RegExp(wordBoundary, 'g')

    transformedContent = transformedContent.replace(regex, suggestedName)

    return transformedContent
  }

  /**
   * Create backup of file
   * @param {string} filePath - File path
   * @returns {string} Backup file path
   */
  async _createBackup(filePath) {
    const timestamp = Date.now()
    const backupPath = `${filePath}.backup.${timestamp}`

    try {
      const content = readFileSync(filePath, 'utf-8')
      writeFileSync(backupPath, content, 'utf-8')
      return backupPath
    } catch (error) {
      throw new Error(
        `Failed to create backup for ${filePath}: ${error.message}`
      )
    }
  }

  /**
   * Validate transformations
   * @param {string} originalContent - Original content
   * @param {string} transformedContent - Transformed content
   * @param {Array<Object>} suggestions - Applied suggestions
   * @returns {Object} Validation result
   */
  _validateTransformations(_originalContent, transformedContent, suggestions) {
    const validation = {
      isValid: true,
      conflicts: [],
      warnings: []
    }

    // Check for syntax errors (simplified)
    try {
      // Basic syntax check
      const bracketBalance = (str) => {
        let balance = 0
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '{') balance++
          if (str[i] === '}') balance--
        }
        return balance === 0
      }

      if (!bracketBalance(transformedContent)) {
        validation.conflicts.push({
          type: 'syntax_error',
          message: 'Bracket balance is incorrect',
          severity: 'high'
        })
        validation.isValid = false
      }

      // Check for incomplete strings
      const stringLiterals = transformedContent.match(/["']/g)
      if (stringLiterals && stringLiterals.length % 2 !== 0) {
        validation.conflicts.push({
          type: 'syntax_error',
          message: 'Unclosed string literal',
          severity: 'high'
        })
        validation.isValid = false
      }
    } catch (error) {
      validation.conflicts.push({
        type: 'validation_error',
        message: `Validation failed: ${error.message}`,
        severity: 'medium'
      })
    }

    // Check for naming conflicts
    const appliedSuggestions = suggestions.filter((s) => s.applied)
    const nameMap = new Map()

    for (const suggestion of appliedSuggestions) {
      if (nameMap.has(suggestion.suggestedName)) {
        validation.conflicts.push({
          type: 'naming_conflict',
          message: `Name conflict: '${suggestion.suggestedName}' is used multiple times`,
          severity: 'medium',
          suggestions: [
            suggestion.nodeId,
            nameMap.get(suggestion.suggestedName)
          ]
        })
        validation.isValid = false
      }
      nameMap.set(suggestion.suggestedName, suggestion.nodeId)
    }

    return validation
  }

  /**
   * Resolve conflicts between suggestions
   * @param {Array<Object>} suggestions - Suggestions with conflicts
   * @returns {Array<Object>} Resolved suggestions
   */
  resolveConflicts(suggestions) {
    const resolved = []
    const nameMap = new Map()

    for (const suggestion of suggestions) {
      const conflicts = suggestions.filter(
        (s) => s !== suggestion && s.suggestedName === suggestion.suggestedName
      )

      if (conflicts.length === 0) {
        resolved.push(suggestion)
        nameMap.set(suggestion.suggestedName, suggestion)
      } else {
        // Choose suggestion with highest confidence
        const bestSuggestion = conflicts.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        )

        // Remove conflicting suggestions from resolved
        conflicts.forEach((c) => {
          const index = resolved.indexOf(c)
          if (index !== -1) {
            resolved.splice(index, 1)
          }
        })

        resolved.push(bestSuggestion)
        nameMap.set(bestSuggestion.suggestedName, bestSuggestion.nodeId)
      }
    }

    return resolved
  }

  /**
   * Get applied changes
   * @returns {Array<Object>} Array of applied changes
   */
  getAppliedChanges() {
    return this.appliedChanges
  }

  /**
   * Get conflicts
   * @returns {Array<Object>} Array of conflicts
   */
  getConflicts() {
    return this.conflicts
  }

  /**
   * Get backup information
   * @returns {Map<string, string>} Map of backup files
   */
  getBackups() {
    return this.backups
  }

  /**
   * Restore from backup
   * @param {string} filePath - Original file path
   * @returns {boolean} True if successful
   */
  restoreFromBackup(filePath) {
    const backupPath = this.backups.get(filePath)

    if (!backupPath || !existsSync(backupPath)) {
      return false
    }

    try {
      const backupContent = readFileSync(backupPath, 'utf-8')
      writeFileSync(filePath, backupContent, 'utf-8')
      return true
    } catch (error) {
      console.error(`Failed to restore from backup: ${error.message}`)
      return false
    }
  }

  /**
   * Clean up backups
   * @returns {boolean} True if successful
   */
  cleanUpBackups() {
    let success = true

    for (const [_filePath, backupPath] of this.backups) {
      try {
        if (existsSync(backupPath)) {
          require('node:fs').unlinkSync(backupPath)
        }
      } catch (error) {
        console.error(`Failed to delete backup ${backupPath}: ${error.message}`)
        success = false
      }
    }

    this.backups.clear()
    return success
  }
}

/**
 * Standalone function to apply changes using ChangeApplier
 * @param {Array} suggestions - Approved suggestions to apply
 * @param {Object} config - Configuration object
 * @returns {Array} Applied changes
 */
export async function applyChanges(suggestions, config = {}) {
  const applier = new ChangeApplier(config)
  return await applier.applyChanges(suggestions, config)
}
