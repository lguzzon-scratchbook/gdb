/**
 * File discovery module using Bun.glob
 * Finds all relevant JavaScript/TypeScript files respecting exclusions and .gitignore
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'

// Simple glob implementation for basic patterns
async function simpleGlob(pattern, basePath = process.cwd()) {
  const results = []
  const seen = new Set() // Track seen files to avoid duplicates

  async function scanDirectory(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relativePath = fullPath.replace(`${basePath}/`, '')

        // Skip excluded directories
        if (entry.isDirectory() && shouldSkipDirectory(relativePath)) {
          continue
        }

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile()) {
          // Check if file matches the pattern and hasn't been seen
          if (matchesPattern(fullPath, pattern) && !seen.has(fullPath)) {
            results.push(fullPath)
            seen.add(fullPath)
          }
        }
      }
    } catch (_error) {
      // Ignore directories we can't read
    }
  }

  await scanDirectory(basePath)
  return results
}

function shouldSkipDirectory(relativePath) {
  const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage']
  return skipDirs.some((dir) => relativePath.includes(dir))
}

function matchesPattern(filePath, pattern) {
  // Simple pattern matching for *.js, *.jsx, etc.
  if (pattern.includes('*.js')) {
    return extname(filePath) === '.js'
  }
  if (pattern.includes('*.jsx')) {
    return extname(filePath) === '.jsx'
  }
  if (pattern.includes('*.mjs')) {
    return extname(filePath) === '.mjs'
  }
  if (pattern.includes('*.cjs')) {
    return extname(filePath) === '.cjs'
  }

  return false
}

export class FileDiscovery {
  constructor(config = {}) {
    this.includePatterns = config.includePatterns || [
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs'
    ]
    this.excludePatterns = config.excludePatterns || [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      'build'
    ]
    this.useGitignore = config.useGitignore !== false
    this.targetPath = config.targetPath || '.'
  }

  /**
   * Parse .gitignore file
   * @param {string} gitignorePath - Path to .gitignore file
   * @returns {Array<string>} Parsed ignore patterns
   */
  parseGitignore(gitignorePath) {
    if (!existsSync(gitignorePath)) {
      return []
    }

    const content = readFileSync(gitignorePath, 'utf-8')
    const lines = content.split('\n')

    return lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        // Handle negation patterns
        if (line.startsWith('!')) {
          return { pattern: line.slice(1), negate: true }
        }
        return { pattern: line, negate: false }
      })
  }

  /**
   * Find .gitignore file
   * @param {string} startPath - Starting path to search from
   * @returns {string|null} Path to .gitignore file or null
   */
  findGitignore(startPath) {
    let currentPath = resolve(startPath)

    while (currentPath !== '/') {
      const gitignorePath = resolve(currentPath, '.gitignore')

      if (existsSync(gitignorePath)) {
        return gitignorePath
      }

      currentPath = dirname(currentPath)
    }

    return null
  }

  /**
   * Check if file matches any pattern
   * @param {string} filePath - File path to check
   * @param {Array<string>} patterns - Patterns to match against
   * @returns {boolean} True if file matches any pattern
   */
  matchesPattern(filePath, patterns) {
    const normalizedPath = filePath.replace(/\\/g, '/')

    return patterns.some((pattern) => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/\./g, '\\.')

      const regex = new RegExp(`^${regexPattern}$`)
      return regex.test(normalizedPath)
    })
  }

  /**
   * Check if file should be excluded based on .gitignore rules
   * @param {string} filePath - File path to check
   * @param {Array<Object>} gitignoreRules - Parsed .gitignore rules
   * @returns {boolean} True if file should be excluded
   */
  shouldExcludeByGitignore(filePath, gitignoreRules) {
    const relativePath = filePath.replace(/^(\.\.\/)+/, '')

    let excluded = false

    for (const rule of gitignoreRules) {
      const matches = this.matchesPattern(relativePath, [rule.pattern])

      if (matches) {
        if (rule.negate) {
          excluded = false // Negate previous exclusion
        } else {
          excluded = true // Exclude this file
        }
      }
    }

    return excluded
  }

  /**
   * Find all target files
   * @returns {Array<string>} Array of file paths
   */
  async findFiles() {
    const results = {
      files: [],
      excluded: [],
      gitignoreRules: [],
      stats: {
        totalScanned: 0,
        included: 0,
        excluded: 0
      }
    }

    // Get .gitignore rules if enabled
    if (this.useGitignore) {
      const gitignorePath = this.findGitignore(this.targetPath)
      if (gitignorePath) {
        results.gitignoreRules = this.parseGitignore(gitignorePath)
      }
    }

    // Build glob patterns
    const _globPatterns = this.includePatterns.map((pattern) => {
      if (pattern.startsWith('/')) {
        return pattern.slice(1) // Remove leading slash
      }
      return pattern
    })

    // Find all files once and then filter by patterns
    const allFiles = await simpleGlob('**/*.js', this.targetPath)
    const allJsxFiles = await simpleGlob('**/*.jsx', this.targetPath)
    const allMjsFiles = await simpleGlob('**/*.mjs', this.targetPath)
    const allCjsFiles = await simpleGlob('**/*.cjs', this.targetPath)

    // Combine all files
    const combinedFiles = [
      ...allFiles,
      ...allJsxFiles,
      ...allMjsFiles,
      ...allCjsFiles
    ]
    const uniqueFiles = [...new Set(combinedFiles)] // Remove duplicates

    try {
      for (const file of uniqueFiles) {
        results.stats.totalScanned++

        // Skip directories
        if (file.endsWith('/')) {
          continue
        }

        // Check if file should be excluded
        let excluded = false

        // Check default exclude patterns
        if (this.matchesPattern(file, this.excludePatterns)) {
          excluded = true
          results.stats.excluded++
        }

        // Check .gitignore rules
        if (
          !excluded &&
          this.useGitignore &&
          results.gitignoreRules.length > 0
        ) {
          if (this.shouldExcludeByGitignore(file, results.gitignoreRules)) {
            excluded = true
            results.stats.excluded++
          }
        }

        if (excluded) {
          results.excluded.push(file)
        } else {
          results.files.push(file)
          results.stats.included++
        }
      }
    } catch (error) {
      console.warn(`Failed to discover files: ${error.message}`)
    }

    // Sort files for consistent results
    results.files.sort()
    results.excluded.sort()

    return results
  }

  /**
   * Get file statistics
   * @param {Array<string>} files - Array of file paths
   * @returns {Object} File statistics
   */
  getFileStats(files) {
    const stats = {
      total: files.length,
      byExtension: {},
      byDirectory: {},
      totalSize: 0
    }

    for (const file of files) {
      // Extension stats
      const ext = file.split('.').pop() || 'no-extension'
      stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1

      // Directory stats
      const dir = dirname(file)
      stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1

      // File size (would need to read file for actual size)
      // For now, just count
    }

    return stats
  }

  /**
   * Validate file discovery results
   * @param {Object} results - Discovery results
   * @returns {Object} Validation results
   */
  validateResults(results) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    }

    // Check if any files were found
    if (results.files.length === 0) {
      validation.errors.push('No files found matching the criteria')
      validation.isValid = false
    }

    // Check if too many files were excluded
    if (results.stats.excluded > results.stats.included * 10) {
      validation.warnings.push(
        `High exclusion ratio: ${results.stats.excluded} excluded vs ${results.stats.included} included`
      )
    }

    // Check for potential issues with patterns
    if (this.includePatterns.length === 0) {
      validation.errors.push('No include patterns specified')
      validation.isValid = false
    }

    return validation
  }
}

/**
 * Main file discovery function
 * @param {Object} config - Configuration options
 * @returns {Promise<Array<string>>} Array of discovered file paths
 */
export async function findFiles(config = {}) {
  const discovery = new FileDiscovery(config)
  const results = await discovery.findFiles()

  const validation = discovery.validateResults(results)

  if (!validation.isValid) {
    throw new Error(
      `File discovery validation failed: ${validation.errors.join(', ')}`
    )
  }

  if (validation.warnings.length > 0) {
    console.warn('File discovery warnings:')
    validation.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`)
    })
  }

  return results.files
}
