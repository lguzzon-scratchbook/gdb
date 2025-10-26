/**
 * Interactive mode for user approval/rejection of suggestions
 */

import { createInterface } from 'node:readline'
import { chalk } from '../utils/colors.js'

export class InteractiveMode {
  constructor(config = {}) {
    this.config = config
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  /**
   * Process suggestions interactively
   * @param {Array<Object>} suggestions - Suggestions to process
   * @returns {Array<Object>} Approved suggestions
   */
  async processSuggestions(suggestions) {
    if (suggestions.length === 0) {
      console.log(chalk.yellow('No suggestions to process.'))
      return []
    }

    console.log(
      chalk.blue(
        `\n🔍 Interactive Mode - ${suggestions.length} suggestions to review\n`
      )
    )

    const approved = []
    const rejected = []

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i]
      const decision = await this._processSuggestion(
        suggestion,
        i + 1,
        suggestions.length
      )

      if (decision.approved) {
        approved.push(suggestion)
        console.log(
          chalk.green(
            `✅ Approved: ${suggestion.currentName} → ${suggestion.suggestedName}`
          )
        )
      } else {
        rejected.push(suggestion)
        console.log(chalk.red(`❌ Rejected: ${suggestion.currentName}`))
      }

      console.log() // Add spacing
    }

    // Show summary
    console.log(chalk.blue('\n📊 Summary:'))
    console.log(chalk.green(`✅ Approved: ${approved.length}`))
    console.log(chalk.red(`❌ Rejected: ${rejected.length}`))

    return approved
  }

  /**
   * Process a single suggestion interactively
   * @param {Object} suggestion - Suggestion to process
   * @param {number} index - Suggestion index
   * @param {number} total - Total suggestions
   * @returns {Object} Decision result
   */
  async _processSuggestion(suggestion, index, total) {
    // Display suggestion details
    this._displaySuggestion(suggestion, index, total)

    // Get user decision
    const decision = await this._getUserDecision(suggestion)

    return decision
  }

  /**
   * Display suggestion details
   * @param {Object} suggestion - Suggestion to display
   * @param {number} index - Suggestion index
   * @param {number} total - Total suggestions
   */
  _displaySuggestion(suggestion, index, total) {
    console.log(chalk.blue(`\n📝 Suggestion ${index}/${total}`))
    console.log(chalk.yellow(`  Current: ${suggestion.currentName}`))
    console.log(chalk.green(`  Suggested: ${suggestion.suggestedName}`))
    console.log(chalk.gray(`  Type: ${suggestion.type}`))
    console.log(
      chalk.gray(`  Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`)
    )

    if (suggestion.reasoning) {
      console.log(chalk.gray(`  Reasoning: ${suggestion.reasoning}`))
    }

    if (suggestion.alternatives && suggestion.alternatives.length > 0) {
      console.log(
        chalk.gray(`  Alternatives: ${suggestion.alternatives.join(', ')}`)
      )
    }

    if (suggestion.metadata) {
      console.log(chalk.gray(`  File: ${suggestion.metadata.file}`))
      console.log(
        chalk.gray(
          `  Location: Line ${suggestion.metadata.loc?.start?.line || 'unknown'}`
        )
      )
    }
  }

  /**
   * Get user decision for suggestion
   * @param {Object} suggestion - Suggestion to decide on
   * @returns {Object} Decision result
   */
  async _getUserDecision(suggestion) {
    return new Promise((resolve) => {
      const question = chalk.cyan('Approve this suggestion? (y/n/a/d/q) ')

      this.rl.question(question, (answer) => {
        const decision = answer.toLowerCase().trim()

        switch (decision) {
          case 'y':
          case 'yes':
            resolve({ approved: true, answer: decision })
            break
          case 'n':
          case 'no':
            resolve({ approved: false, answer: decision })
            break
          case 'a':
          case 'all':
            resolve({ approved: true, answer: decision, applyAll: true })
            break
          case 'd':
          case 'details':
            this._showDetails(suggestion).then(() => {
              return this._getUserDecision(suggestion).then(resolve)
            })
            break
          case 'q':
          case 'quit':
            resolve({ approved: false, answer: decision, quit: true })
            break
          default:
            console.log(
              chalk.red('Invalid choice. Please enter y, n, a, d, or q.')
            )
            return this._getUserDecision(suggestion).then(resolve)
        }
      })
    })
  }

  /**
   * Show detailed information about suggestion
   * @param {Object} suggestion - Suggestion to show details for
   * @returns {Promise} Promise that resolves when done
   {
    console.log(chalk.blue('\n📋 Detailed Information:'));
    
    if (suggestion.metadata) {
      console.log(chalk.gray('  Metadata:'));
      Object.entries(suggestion.metadata).forEach(([key, value]) => {
        console.log(chalk.gray(`    ${key}: ${JSON.stringify(value)}`));
      });
    }
    
    if (suggestion.source) {
      console.log(chalk.gray('  Source:'));
      console.log(chalk.gray(`    ${suggestion.source}`));
    }
    
    if (suggestion.pattern) {
      console.log(chalk.gray('  Pattern:'));
      console.log(chalk.gray(`    ${suggestion.pattern}`));
    }
    
    return new Promise(resolve => {
      console.log(chalk.gray('\nPress Enter to continue...'));
      this.rl.question('', () => resolve());
    });
  }

  /**
   * Show statistics about suggestions
   * @param {Array<Object>} suggestions - Suggestions to analyze
   */
  showStatistics(suggestions) {
    console.log(chalk.blue('\n📊 Statistics:'))

    const stats = this._calculateStatistics(suggestions)

    console.log(chalk.gray(`  Total suggestions: ${stats.total}`))
    console.log(
      chalk.gray(`  By type: ${JSON.stringify(stats.byType, null, 2)}`)
    )
    console.log(
      chalk.gray(
        `  By confidence: ${JSON.stringify(stats.byConfidence, null, 2)}`
      )
    )
    console.log(
      chalk.gray(`  By source: ${JSON.stringify(stats.bySource, null, 2)}`)
    )

    if (stats.averageConfidence) {
      console.log(
        chalk.gray(
          `  Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`
        )
      )
    }
  }

  /**
   * Calculate statistics for suggestions
   * @param {Array<Object>} suggestions - Suggestions to analyze
   * @returns {Object} Statistics
   */
  _calculateStatistics(suggestions) {
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
      const type = suggestion.type || 'unknown'
      stats.byType[type] = (stats.byType[type] || 0) + 1

      // Count by confidence
      const confidence = suggestion.confidence || 0
      totalConfidence += confidence

      if (confidence >= 0.8) {
        stats.byConfidence.high++
      } else if (confidence >= 0.6) {
        stats.byConfidence.medium++
      } else {
        stats.byConfidence.low++
      }

      // Count by source
      const source = suggestion.source || 'unknown'
      stats.bySource[source] = (stats.bySource[source] || 0) + 1
    }

    stats.averageConfidence =
      suggestions.length > 0 ? totalConfidence / suggestions.length : 0

    return stats
  }

  /**
   * Show preview of changes
   * @param {Array<Object>} suggestions - Suggestions to preview
   * @param {Object} previewConfig - Preview configuration
   */
  showPreview(suggestions, previewConfig = {}) {
    console.log(chalk.blue('\n🔍 Preview of Changes:'))

    const maxItems = previewConfig.maxItems || 10
    const showDetails = previewConfig.showDetails || false

    for (let i = 0; i < Math.min(suggestions.length, maxItems); i++) {
      const suggestion = suggestions[i]

      console.log(
        chalk.yellow(
          `${i + 1}. ${suggestion.currentName} → ${suggestion.suggestedName}`
        )
      )

      if (showDetails) {
        console.log(chalk.gray(`   Type: ${suggestion.type}`))
        console.log(
          chalk.gray(
            `   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`
          )
        )
        console.log(
          chalk.gray(`   File: ${suggestion.metadata?.file || 'unknown'}`)
        )
        console.log(
          chalk.gray(
            `   Reasoning: ${suggestion.reasoning || 'No reasoning provided'}`
          )
        )
      }
    }

    if (suggestions.length > maxItems) {
      console.log(chalk.gray(`... and ${suggestions.length - maxItems} more`))
    }
  }

  /**
   * Show menu of available actions
   * @returns {Promise<string>} Selected action
   */
  async showMenu() {
    return new Promise((resolve) => {
      console.log(chalk.blue('\n📋 Interactive Menu:'))
      console.log(chalk.cyan('  1. Review suggestions'))
      console.log(chalk.cyan(' 2. Show statistics'))
      console.log(chalk.cyan(' 3. Show preview'))
      console.log(chalk.cyan(' 4. Apply all'))
      console.log(chalk.cyan(' 5. Quit'))

      this.rl.question(chalk.cyan('Select an action (1-5): '), (answer) => {
        resolve(answer.trim())
      })
    })
  }

  /**
   * Close readline interface
   */
  close() {
    this.rl.close()
  }
}
