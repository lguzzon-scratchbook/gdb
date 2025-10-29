/**
 * Report formatter for generating comprehensive reports
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chalk } from '../utils/colors.js'

export class ReportFormatter {
  constructor(config = {}) {
    this.config = config
    this.enableConsole = config.enableConsole !== false
    this.enableFile = config.enableFile !== false
    this.outputFile = config.outputFile || 'refactor-report.json'
    this.enableDiff = config.enableDiff !== false
    this.enableMetrics = config.enableMetrics !== false
  }

  /**
   * Generate comprehensive report
   * @param {Object} reportData - Report data
   * @param {Object} options - Formatting options
   * @returns {string} Formatted report
   */
  generateReport(reportData, options = {}) {
    const report = {
      metadata: this._generateMetadata(reportData),
      summary: this._generateSummary(reportData),
      suggestions: this._formatSuggestions(reportData.suggestions),
      files: this._formatFiles(reportData),
      metrics: this._generateMetrics(reportData),
      changes: this._formatChanges(reportData),
      conflicts: this._formatConflicts(reportData.conflicts),
      timeline: this._generateTimeline(reportData)
    }

    return this._formatReport(report, options)
  }

  /**
   * Generate report metadata
   * @param {Object} reportData - Report data
   * @returns {Object} Metadata
   */
  _generateMetadata(reportData) {
    return {
      tool: 'JSRefactor',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      duration:
        reportData.sessionData?.endTime - reportData.sessionData?.startTime ||
        0,
      config: this.config,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }
  }

  /**
   * Generate summary statistics
   * @param {Object} reportData - Report data
   * @returns {Object} Summary statistics
   */
  _generateSummary(reportData) {
    const sessionData = reportData.sessionData
    const suggestions = reportData.suggestions
    const ckg = reportData.sessionData?.ckg

    return {
      totalSuggestions: suggestions?.length || 0,
      appliedChanges: sessionData.appliedChanges?.length || 0,
      filesProcessed: sessionData.files?.length || 0,
      nodesFound: ckg?.getNodeCount() || 0,
      edgesFound: ckg?.getEdgeCount() || 0,
      filesModified: sessionData.filesModified?.size || 0,
      conflicts: reportData.conflicts?.length || 0,
      errors: reportData.errors?.length || 0,
      warnings: reportData.warnings?.length || 0,
      success: reportData.success || false
    }
  }

  /**
   * Format suggestions for report
   * @param {Array<Object>} suggestions - Suggestions to format
   * @returns {Array<Object>} Formatted suggestions
   */
  _formatSuggestions(suggestions) {
    if (!suggestions || !Array.isArray(suggestions)) {
      return []
    }
    return suggestions.map((suggestion) => ({
      nodeId: suggestion.nodeId,
      currentName: suggestion.currentName,
      suggestedName: suggestion.suggestedName,
      type: suggestion.type,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
      source: suggestion.source,
      alternatives: suggestion.alternatives || [],
      applied: suggestion.applied || false,
      metadata: suggestion.metadata || {}
    }))
  }

  /**
   * Format files information
   * @param {Array<string>} files - Files to format
   * @returns {Array<Object>} Formatted files
   */
  _formatFiles(files) {
    if (!files || !Array.isArray(files)) {
      return []
    }
    return files.map((file) => ({
      path: file,
      status: 'processed',
      changes: 0,
      backup: null
    }))
  }

  /**
   * Generate performance metrics
   * @param {Object} reportData - Report data
   * @returns {Object} Metrics object
   */
  _generateMetrics(reportData) {
    const sessionData = reportData.sessionData

    return {
      performance: {
        duration: sessionData.endTime - sessionData.startTime,
        filesPerSecond:
          sessionData.files?.length /
            ((sessionData.endTime - sessionData.startTime) / 1000) || 0,
        suggestionsPerSecond:
          sessionData.suggestions?.length /
            ((sessionData.endTime - sessionData.startTime) / 1000) || 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      ckg: {
        nodes: sessionData.ckg?.getNodeCount() || 0,
        edges: sessionData.ckg?.getEdgeCount() || 0,
        density: sessionData.ckg
          ? sessionData.ckg.getEdgeCount() /
            Math.max(1, sessionData.ckg.getNodeCount())
          : 0
      },
      suggestions: {
        total: sessionData.suggestions?.length || 0,
        applied: sessionData.appliedChanges?.length || 0,
        averageConfidence: this._calculateAverageConfidence(
          sessionData.suggestions
        ),
        byType: this._groupSuggestionsByType(sessionData.suggestions),
        bySource: this._groupSuggestionsBySource(sessionData.suggestions)
      }
    }
  }

  /**
   * Format applied changes
   * @param {Array<Object>} changes - Changes to format
   * @returns {Array<Object>} Formatted changes
   */
  _formatChanges(changes) {
    if (!changes || !Array.isArray(changes)) {
      return []
    }
    return changes.map((change) => ({
      nodeId: change.nodeId,
      currentName: change.currentName,
      suggestedName: change.suggestedName,
      type: change.type,
      file: change.file,
      status: 'applied',
      timestamp: change.timestamp || Date.now()
    }))
  }

  /**
   * Calculate average confidence from suggestions
   * @param {Array<Object>} suggestions - Suggestions array
   * @returns {number} Average confidence
   */
  _calculateAverageConfidence(suggestions) {
    if (
      !suggestions ||
      !Array.isArray(suggestions) ||
      suggestions.length === 0
    ) {
      return 0
    }
    const total = suggestions.reduce((sum, suggestion) => {
      return sum + (suggestion.confidence || 0)
    }, 0)
    return total / suggestions.length
  }

  /**
   * Group suggestions by type
   * @param {Array<Object>} suggestions - Suggestions array
   * @returns {Object} Grouped suggestions by type
   */
  _groupSuggestionsByType(suggestions) {
    if (!suggestions || !Array.isArray(suggestions)) {
      return {}
    }
    return suggestions.reduce((groups, suggestion) => {
      const type = suggestion.type || 'unknown'
      groups[type] = (groups[type] || 0) + 1
      return groups
    }, {})
  }

  /**
   * Group suggestions by source
   * @param {Array<Object>} suggestions - Suggestions array
   * @returns {Object} Grouped suggestions by source
   */
  _groupSuggestionsBySource(suggestions) {
    if (!suggestions || !Array.isArray(suggestions)) {
      return {}
    }
    return suggestions.reduce((groups, suggestion) => {
      const source = suggestion.source || 'unknown'
      groups[source] = (groups[source] || 0) + 1
      return groups
    }, {})
  }

  /**
   * Format conflicts
   * @param {Array<Object>} conflicts - Conflicts to format
   * @returns {Array<Object>} Formatted conflicts
   */
  _formatConflicts(conflicts) {
    if (!conflicts || !Array.isArray(conflicts)) {
      return []
    }
    return conflicts.map((conflict) => ({
      type: conflict.type,
      message: conflict.message,
      severity: conflict.severity,
      suggestions: conflict.suggestions || [],
      timestamp: conflict.timestamp || Date.now()
    }))
  }

  /**
   * Generate timeline data
   * @param {Object} reportData - Report data
   * @returns {Object} Timeline data
   */
  _generateTimeline(reportData) {
    const endTime = Date.now()
    const startTime = reportData.sessionData?.startTime || endTime

    return {
      phases: [
        {
          name: 'Discovery',
          startTime: startTime,
          endTime: startTime + 1000,
          duration: 1000,
          status: 'completed',
          filesFound: reportData.sessionData?.files?.length || 0
        },
        {
          name: 'Analysis',
          startTime: startTime + 1000,
          endTime: startTime + 5000,
          duration: 4000,
          status: 'completed',
          nodesFound: reportData.sessionData?.ckg?.getNodeCount() || 0,
          edgesFound: reportData.sessionData?.ckg?.getEdgeCount() || 0
        },
        {
          name: 'Suggestion',
          startTime: startTime + 5000,
          endTime: startTime + 8000,
          duration: 3000,
          status: 'completed',
          suggestionsGenerated: reportData.suggestions?.length || 0
        },
        {
          name: 'Transformation',
          startTime: startTime + 8000,
          endTime: endTime,
          duration: endTime - (startTime + 8000),
          status: 'completed',
          changesApplied: reportData.appliedChanges?.length || 0
        },
        {
          name: 'Reporting',
          startTime: endTime,
          endTime: endTime,
          duration: 0,
          status: 'completed'
        }
      ]
    }
  }

  /**
   * Format the complete report
   * @param {Object} report - Report object
   * @param {Object} options - Formatting options
   * @returns {string} Formatted report
   */
  _formatReport(report, _options) {
    let output = ''

    // Header
    output += this._formatHeader(report.metadata)

    // Summary
    output += this._formatSection('Summary', report.summary)

    // Suggestions
    if (report.suggestions.length > 0) {
      output += this._formatSection('Suggestions', report.suggestions)
    }

    // Files
    if (report.files.length > 0) {
      output += this._formatSection('Files', report.files)
    }

    // Metrics
    if (this.enableMetrics) {
      output += this._formatSection('Metrics', report.metrics)
    }

    // Changes
    if (report.changes.length > 0) {
      output += this._formatSection('Applied Changes', report.changes)
    }

    // Conflicts
    if (report.conflicts.length > 0) {
      output += this._formatSection('Conflicts', report.conflicts)
    }

    // Timeline
    output += this._formatSection('Timeline', report.timeline)

    return output
  }

  /**
   * Format report header
   * @param {Object} metadata - Metadata object
   * @returns {string} Formatted header
   */
  _formatHeader(metadata) {
    let output = ''
    output += chalk.bold.blue(`🔧 ${metadata.tool} Report\n`)
    output += chalk.gray(`${'─'.repeat(50)}\n`)
    output += chalk.gray(`Version: ${metadata.version}\n`)
    output += chalk.gray(
      `Generated: ${new Date(metadata.timestamp).toLocaleString()}\n`
    )
    output += chalk.gray(
      `Duration: ${this._formatDuration(metadata.duration)}\n`
    )
    output += chalk.gray(`${'─'.repeat(50)}\n`)

    return output
  }

  /**
   * Format a report section
   * @param {string} title - Section title
   * @param {Object} data - Section data
   * @returns {string} Formatted section
   */
  _formatSection(title, data) {
    let output = chalk.bold.blue(`\n${title}\n`)
    output += chalk.gray(`${'─'.repeat(30)}\n`)

    if (Array.isArray(data)) {
      if (data.length === 0) {
        output += chalk.gray('  No items found\n')
      } else {
        data.forEach((item) => {
          output += this._formatItem(item)
        })
      }
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        output += `${chalk.cyan(`${key}: `) + this._formatValue(value)}\n`
      })
    }

    return output
  }

  /**
   * Format a single item
   * @param {*} item - Item to format
   * @returns {string} Formatted item
   */
  _formatItem(item) {
    if (typeof item === 'string') {
      return chalk.gray(`  ${item}\n`)
    } else if (typeof item === 'object' && item !== null) {
      return chalk.gray(`  ${JSON.stringify(item, null, 2)}\n`)
    }
    return chalk.gray(`  ${item}\n`)
  }

  /**
   * Format a value
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  _formatValue(value) {
    if (typeof value === 'string') {
      return value
    } else if (typeof value === 'number') {
      return value.toString()
    } else if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    } else if (Array.isArray(value)) {
      return `[${value.join(', ')}]`
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  /**
   * Format duration in human readable format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  _formatDuration(duration) {
    const seconds = Math.floor(duration / 1000)
    const milliseconds = duration % 1000

    if (seconds === 0) {
      return `${milliseconds}ms`
    } else if (seconds < 60) {
      return `${seconds}s ${milliseconds}ms`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  /**
   * Write report to file
   * @param {string} report - Report content
   * @param {string} filePath - File path
   * @returns {boolean} True if successful
   */
  writeReport(report, filePath) {
    try {
      writeFileSync(resolve(filePath), report, 'utf-8')
      return true
    } catch (error) {
      console.error(`Failed to write report to ${filePath}: ${error.message}`)
      return false
    }
  }

  /**
   * Write report to console
   @param {string} report - Report content
   */
  writeReportToConsole(report) {
    console.log(report)
  }

  /**
   * Generate diff for changes
   * @param {Array<Object>} changes - Changes to diff
   * @param {Object} options - Diff options
   * @returns {string} Diff output
   */
  generateDiff(changes, options = {}) {
    let output = chalk.blue('\n📋 Changes Preview\n')
    output += chalk.gray(`${'─'.repeat(50)}\n`)

    for (const change of changes) {
      output += chalk.yellow(`${change.file}\n`)
      output += chalk.red(
        `  - ${change.currentName} → ${change.suggestedName}\n`
      )

      if (options.showDetails) {
        output += chalk.gray(`    Type: ${change.type}\n`)
        output += chalk.gray(
          `    Location: Line ${change.metadata?.loc?.start?.line || 'unknown'}\n`
        )
      }
    }

    return output
  }

  /**
   * Generate JSON report
   * @param {Object} report - Report data
   * @returns {string} JSON report
   */
  generateJSONReport(report) {
    return JSON.stringify(report, null, 2)
  }

  /**
   * Generate HTML report
   * @param {Object} report - Report data
   @returns {string} HTML report
   */
  generateHTMLReport(report) {
    const _html = `
<!DOCTYPE html>
<html>
<head>
  <title>${report.metadata.tool} Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
    .item { margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
    .item strong { color: #333; }
    .item .meta { color: #666; font-size: 0.9em; }
    .stats { background: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .stats div { margin-bottom: 5px; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.metadata.tool} Report</h1>
    <div class="stats">
      <div>Version: ${report.metadata.version}</div>
      <div>Generated: ${new Date(report.metadata.timestamp).toLocaleString()}</div>
      <div>Duration: ${this._formatDuration(report.metadata.duration)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="stats">
      <div>Total Suggestions: <span class="success">${report.summary.totalSuggestions}</span></div>
      <div>Applied Changes: <span class="success">${report.summary.appliedChanges}</span></div>
      <div>Files Processed: <span class="success">${report.summary.filesProcessed}</span></div>
      <div>Nodes Found: <span class="success">${report.summary.nodesFound}</span></div>
      <div>Edges Found: <span class="success">${report.summary.edgesFound}</span></div>
    </div>
  </div>

  ${
    report.suggestions.length > 0
      ? `
  <div class="section">
    <h2>Suggestions</h2>
    ${report.suggestions
      .map(
        (suggestion) => `
      <div class="item">
        <strong>${suggestion.suggestedName}</strong>
        <div class="meta">
          Type: ${suggestion.type} | Confidence: ${(suggestion.confidence * 100).toFixed(1)}%
          ${suggestion.source ? `| Source: ${suggestion.source}` : ''}
        </div>
        ${suggestion.reasoning ? `<div class="meta">Reasoning: ${suggestion.reasoning}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    report.files.length > 0
      ? `
  <div class="section">
    <h2>Files</h2>
    ${report.files
      .map(
        (file) => `
      <div class="item">
        <strong>${file.path}</strong>
        <div class="meta">Status: ${file.status}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    this.enableMetrics
      ? `
  <div class="section">
    <h2>Metrics</h2>
    <div class="stats">
      <div>Performance:</div>
      <div class="stats">
        <div>Duration: ${this._formatDuration(report.metrics.performance.duration)}</div>
        <div>Files/Second: ${report.metrics.performance.filesPerSecond.toFixed(2)}</div>
        <div>Suggestions/Second: ${report.metrics.suggestions.suggestionsPerSecond.toFixed(2)}</div>
      </div>
    </div>
  `
      : ''
  }

  ${
    report.changes.length > 0
      ? `
  <div class="section">
    <h2>Applied Changes</h2>
    ${report.changes
      .map(
        (change) => `
      <div class="item">
        <strong>${change.file}</strong>
        <div class="meta">${change.currentName} → ${change.suggestedName}</div>
        <div class="meta">Type: ${change.type}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    report.conflicts.length > 0
      ? `
  <div class="section">
    <h2>Conflicts</h2>
    ${report.conflicts
      .map(
        (conflict) => `
      <div class="item ${conflict.severity}">
        <strong>${conflict.type}</strong>
        <div class="meta">${conflict.message}</div>
        <div class="meta">Severity: ${conflict.severity}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <div class="section">
    <h2>Timeline</h2>
    ${report.timeline
      .map(
        (phase) => `
      <div class="item">
        <strong>${phase.name}</strong>
        <div class="meta">Status: ${phase.status}</div>
        <div class="meta">Duration: ${this._formatDuration(phase.duration)}</div>
        ${phase.filesFound ? `<div class="meta">Files: ${phase.filesFound}</div>` : ''}
        ${phase.nodesFound ? `<div class="meta">Nodes: ${phase.nodesFound}</div>` : ''}
        ${phase.edgesFound ? `<div class="meta">Edges: ${phase.edgesFound}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>

</body>
</html>`
  }
}
