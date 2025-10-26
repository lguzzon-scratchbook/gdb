#!/usr/bin/env bun

/**
 * Main orchestrator for the JavaScript refactoring tool
 * Implements the 5-phase workflow: Discovery, Analysis, Suggestion, Transformation, and Reporting
 */

import { CodeKnowledgeGraph } from './analysis/CKG.js'
import { AnalysisWorkerPool } from './analysis/worker-pool.js'
import { ReportFormatter } from './cli/formatter.js'
import { InteractiveMode } from './cli/interactive.js'
import { loadConfig, validateConfig } from './config/loader.js'
import { findFiles } from './discovery/findFiles.js'
import { SuggestionGenerator } from './suggestions/suggestion-generator.js'
import { applyChanges } from './transformation/apply-changes.js'
import { closeLogger, getLogger } from './utils/logger.js'
import { VCSManager } from './utils/vcs.js'

/**
 * Main Refactor class implementing the 5-phase workflow
 */
export class Refactor {
  constructor(configPath = null) {
    // Load and validate configuration
    this.config = loadConfig(configPath)
    const validation = validateConfig(this.config)

    if (!validation.isValid) {
      console.error('Configuration validation failed:')
      validation.errors.forEach((error) => {
        console.error(`  - ${error}`)
      })
      process.exit(1)
    }

    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:')
      validation.warnings.forEach((warning) => {
        console.warn(`  - ${warning}`)
      })
    }

    // Initialize logger
    this.logger = getLogger(this.config.logging)
    this.logger.info('refactor_init', { config: this.config })

    // Initialize VCS manager
    this.vcs = new VCSManager(this.config.vcs)

    // Initialize components
    this.ckg = new CodeKnowledgeGraph()
    this.workerPool = new AnalysisWorkerPool(this.config.analysis)
    this.suggestionGenerator = new SuggestionGenerator(this.config.suggestions)
    this.interactiveMode = new InteractiveMode(this.config)
    this.reportFormatter = new ReportFormatter(this.config)

    // Session data
    this.sessionData = {
      startTime: Date.now(),
      files: [],
      ckg: null,
      suggestions: [],
      appliedChanges: [],
      vcsSetup: null
    }
  }

  /**
   * Main execution method - implements 5-phase workflow
   * @param {Object} options - Execution options
   * @returns {Object} Execution results
   */
  async execute(options = {}) {
    try {
      this.logger.info('execution_start', { options })

      // Phase 1: Discovery
      await this.phase1_Discovery(options)

      // Phase 2: Analysis
      await this.phase2_Analysis(options)

      // Phase 3: Suggestion
      await this.phase3_Suggestion(options)

      // Phase 4: Transformation
      await this.phase4_Transformation(options)

      // Phase 5: Reporting
      const results = await this.phase5_Reporting(options)

      this.logger.info('execution_complete', { results })
      return results
    } catch (error) {
      this.logger.error('execution_failed', {
        error: error.message,
        stack: error.stack
      })
      throw error
    } finally {
      // Cleanup
      await this.cleanup()
    }
  }

  /**
   * Phase 1: Discovery - Find all target files
   * @param {Object} options - Execution options
   */
  async phase1_Discovery(options) {
    this.logger.info('phase1_start', { phase: 'Discovery' })

    const discoveryOptions = {
      targetPath: options.targetPath || this.config.discovery.targetPath,
      includePatterns:
        options.includePatterns || this.config.discovery.includePatterns,
      excludePatterns:
        options.excludePatterns || this.config.discovery.excludePatterns,
      useGitignore: options.useGitignore ?? this.config.discovery.useGitignore
    }

    // Find all target files
    this.sessionData.files = await findFiles(discoveryOptions)

    this.logger.info('phase1_complete', {
      phase: 'Discovery',
      filesFound: this.sessionData.files.length,
      files: this.sessionData.files
    })
  }

  /**
   * Phase 2: Analysis - Parse files and build CKG
   * @param {Object} options - Execution options
   */
  async phase2_Analysis(_options) {
    this.logger.info('phase2_start', { phase: 'Analysis' })

    // Initialize CKG
    this.ckg = new CodeKnowledgeGraph()

    // Setup worker pool
    await this.workerPool.initialize()

    // Process files in parallel
    const analysisResults = await this.workerPool.processFiles(
      this.sessionData.files,
      this.ckg
    )

    // Build final CKG
    this.sessionData.ckg = this.ckg

    this.logger.info('phase2_complete', {
      phase: 'Analysis',
      nodes: this.ckg.getNodeCount(),
      edges: this.ckg.getEdgeCount(),
      processingTime: analysisResults.totalTime,
      workerResults: analysisResults.results
    })
  }

  /**
   * Phase 3: Suggestion - Generate rename suggestions
   * @param {Object} options - Execution options
   */
  async phase3_Suggestion(options) {
    this.logger.info('phase3_start', { phase: 'Suggestion' })

    // Generate suggestions using CKG
    this.sessionData.suggestions =
      await this.suggestionGenerator.generateSuggestions(
        this.sessionData.ckg,
        options
      )

    this.logger.info('phase3_complete', {
      phase: 'Suggestion',
      suggestionsGenerated: this.sessionData.suggestions.length,
      suggestions: this.sessionData.suggestions
    })
  }

  /**
   * Phase 4: Transformation - Apply approved changes
   * @param {Object} options - Execution options
   */
  async phase4_Transformation(options) {
    this.logger.info('phase4_start', { phase: 'Transformation' })

    // Interactive mode if requested
    let approvedSuggestions = this.sessionData.suggestions
    if (options.interactive) {
      approvedSuggestions = await this.interactiveMode.processSuggestions(
        this.sessionData.suggestions
      )
    }

    // Apply changes
    if (!options.dryRun && approvedSuggestions.length > 0) {
      this.sessionData.appliedChanges = await applyChanges(
        approvedSuggestions,
        this.config.transformation
      )
    }

    this.logger.info('phase4_complete', {
      phase: 'Transformation',
      suggestionsApproved: approvedSuggestions.length,
      changesApplied: this.sessionData.appliedChanges.length,
      dryRun: options.dryRun || false
    })
  }

  /**
   * Phase 5: Reporting - Generate final report
   * @param {Object} options - Execution options
   */
  async phase5_Reporting(options) {
    this.logger.info('phase5_start', { phase: 'Reporting' })

    // Generate comprehensive report
    const report = await this.reportFormatter.generateReport({
      sessionData: this.sessionData,
      config: this.config,
      options: options
    })

    // Output report
    if (options.outputFile) {
      await this.reportFormatter.writeReport(report, options.outputFile)
    } else {
      console.log(report)
    }

    this.logger.info('phase5_complete', {
      phase: 'Reporting',
      reportGenerated: true,
      outputFile: options.outputFile
    })

    return {
      success: true,
      sessionData: this.sessionData,
      report: report
    }
  }

  /**
   * Setup VCS for refactoring session
   * @param {string} sessionName - Name for the session
   */
  async setupVCS(sessionName) {
    if (!this.vcs.enabled) {
      return null
    }

    try {
      this.sessionData.vcsSetup =
        await this.vcs.setupForRefactoring(sessionName)
      this.logger.info('vcs_setup_complete', this.sessionData.vcsSetup)
      return this.sessionData.vcsSetup
    } catch (error) {
      this.logger.error('vcs_setup_failed', { error: error.message })
      throw error
    }
  }

  /**
   * Cleanup VCS and other resources
   */
  async cleanup() {
    this.logger.info('cleanup_start')

    // Cleanup VCS if needed
    if (this.sessionData.vcsSetup) {
      try {
        await this.vcs.cleanupAfterRefactoring(
          this.sessionData.vcsSetup,
          false // Don't keep changes by default
        )
        this.logger.info('vcs_cleanup_complete')
      } catch (error) {
        this.logger.error('vcs_cleanup_failed', { error: error.message })
      }
    }

    // Cleanup worker pool
    await this.workerPool.cleanup()

    // Close logger
    closeLogger()

    this.logger.info('cleanup_complete')
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    return {
      duration: Date.now() - this.sessionData.startTime,
      files: this.sessionData.files.length,
      nodes: this.ckg ? this.ckg.getNodeCount() : 0,
      edges: this.ckg ? this.ckg.getEdgeCount() : 0,
      suggestions: this.sessionData.suggestions.length,
      appliedChanges: this.sessionData.appliedChanges.length
    }
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2)
  const options = parseCLIArgs(args)

  try {
    const refactor = new Refactor(options.config)

    // Setup VCS if enabled
    if (options.sessionName) {
      await refactor.setupVCS(options.sessionName)
    }

    // Execute refactoring
    const results = await refactor.execute(options)

    // Output results
    if (options.json) {
      console.log(JSON.stringify(results, null, 2))
    }

    process.exit(0)
  } catch (error) {
    console.error('Refactoring failed:', error.message)
    if (options.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

/**
 * Parse CLI arguments
 * @param {Array<string>} args - CLI arguments
 * @returns {Object} Parsed options
 */
function parseCLIArgs(args) {
  const options = {
    targetPath: '.',
    dryRun: false,
    interactive: false,
    verbose: false,
    json: false,
    configFile: null,
    outputFile: null,
    sessionName: null
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--interactive':
      case '-i':
        options.interactive = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--json':
        options.json = true
        break
      case '--config':
      case '-c':
        options.configFile = args[++i]
        break
      case '--output':
      case '-o':
        options.outputFile = args[++i]
        break
      case '--session':
      case '-s':
        options.sessionName = args[++i]
        break
      default:
        if (!arg.startsWith('-')) {
          options.targetPath = arg
        }
        break
    }
  }

  return options
}

// Run if called directly
if (import.meta.main) {
  main()
}
