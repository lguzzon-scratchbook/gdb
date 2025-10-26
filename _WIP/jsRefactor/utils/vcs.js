/**
 * Version Control System safety checks and Git integration
 */

import { execSync } from 'node:child_process'

export class VCSManager {
  constructor(config = {}) {
    this.enabled = config.enabled !== false
    this.autoBranch = config.autoBranch !== false
    this.branchPrefix = config.branchPrefix || 'refactor/'
    this.requireClean = config.requireClean !== false
  }

  /**
   * Check if Git repository exists
   * @returns {boolean} True if Git repo exists
   */
  isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' })
      return true
    } catch (_error) {
      return false
    }
  }

  /**
   * Check if working directory is clean
   * @returns {boolean} True if working directory is clean
   */
  isWorkingDirectoryClean() {
    try {
      const result = execSync('git status --porcelain', { encoding: 'utf-8' })
      return result.trim().length === 0
    } catch (_error) {
      return false
    }
  }

  /**
   * Get current branch name
   * @returns {string} Current branch name
   */
  getCurrentBranch() {
    try {
      const result = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8'
      })
      return result.trim()
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`)
    }
  }

  /**
   * Create a new branch for refactoring
   * @param {string} branchName - Branch name (without prefix)
   * @returns {string} Created branch name
   */
  createBranch(branchName) {
    if (!this.enabled) {
      return null
    }

    if (!this.isGitRepository()) {
      throw new Error('Not a Git repository')
    }

    if (this.requireClean && !this.isWorkingDirectoryClean()) {
      throw new Error(
        'Working directory is not clean. Commit or stash changes first.'
      )
    }

    const fullBranchName = this.branchPrefix + branchName
    const currentBranch = this.getCurrentBranch()

    try {
      // Create and checkout new branch
      execSync(`git checkout -b ${fullBranchName}`, { stdio: 'ignore' })

      return {
        success: true,
        branch: fullBranchName,
        previousBranch: currentBranch
      }
    } catch (error) {
      throw new Error(
        `Failed to create branch ${fullBranchName}: ${error.message}`
      )
    }
  }

  /**
   * Switch back to previous branch
   * @param {string} previousBranch - Branch to switch back to
   * @returns {boolean} True if successful
   */
  switchToBranch(previousBranch) {
    try {
      execSync(`git checkout ${previousBranch}`, { stdio: 'ignore' })
      return true
    } catch (error) {
      console.warn(
        `Failed to switch back to branch ${previousBranch}: ${error.message}`
      )
      return false
    }
  }

  /**
   * Delete a branch
   * @param {string} branchName - Branch name to delete
   * @returns {boolean} True if successful
   */
  deleteBranch(branchName) {
    try {
      // Switch to main branch first if we're on the branch to delete
      const currentBranch = this.getCurrentBranch()
      if (currentBranch === branchName) {
        this.switchToBranch('main') || this.switchToBranch('master')
      }

      execSync(`git branch -D ${branchName}`, { stdio: 'ignore' })
      return true
    } catch (error) {
      console.warn(`Failed to delete branch ${branchName}: ${error.message}`)
      return false
    }
  }

  /**
   * Get commit hash for current HEAD
   * @returns {string} Commit hash
   */
  getCurrentCommit() {
    try {
      const result = execSync('git rev-parse HEAD', { encoding: 'utf-8' })
      return result.trim()
    } catch (error) {
      throw new Error(`Failed to get current commit: ${error.message}`)
    }
  }

  /**
   * Create a commit with changes
   * @param {string} message - Commit message
   * @param {Array<string>} files - Files to add (empty for all)
   * @returns {string} Commit hash
   */
  commitChanges(message, files = []) {
    try {
      // Add files
      if (files.length > 0) {
        execSync(`git add ${files.join(' ')}`, { stdio: 'ignore' })
      } else {
        execSync('git add .', { stdio: 'ignore' })
      }

      // Commit
      execSync(`git commit -m "${message}"`, { stdio: 'ignore' })

      return this.getCurrentCommit()
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error.message}`)
    }
  }

  /**
   * Get diff for files
   * @param {Array<string>} files - Files to get diff for (empty for all)
   * @returns {string} Git diff
   */
  getDiff(files = []) {
    try {
      const args = files.length > 0 ? files.join(' ') : ''
      const result = execSync(`git diff ${args}`, { encoding: 'utf-8' })
      return result
    } catch (_error) {
      return ''
    }
  }

  /**
   * Stash current changes
   * @returns {string} Stash hash
   */
  stashChanges() {
    try {
      execSync('git stash push -m "Auto-stash before refactoring"', {
        stdio: 'ignore'
      })

      // Get stash hash
      const result = execSync('git stash list -n 1 --format="%H"', {
        encoding: 'utf-8'
      })
      return result.trim()
    } catch (error) {
      throw new Error(`Failed to stash changes: ${error.message}`)
    }
  }

  /**
   * Pop stashed changes
   * @param {string} stashHash - Specific stash hash (optional)
   * @returns {boolean} True if successful
   */
  popStash(stashHash = null) {
    try {
      if (stashHash) {
        execSync(`git stash pop ${stashHash}`, { stdio: 'ignore' })
      } else {
        execSync('git stash pop', { stdio: 'ignore' })
      }
      return true
    } catch (error) {
      console.warn(`Failed to pop stash: ${error.message}`)
      return false
    }
  }

  /**
   * Perform VCS safety checks before starting
   * @returns {Object} Safety check results
   */
  performSafetyChecks() {
    const results = {
      gitRepo: false,
      workingDirClean: false,
      currentBranch: null,
      currentCommit: null,
      canProceed: false,
      warnings: [],
      errors: []
    }

    if (!this.enabled) {
      results.canProceed = true
      results.warnings.push('VCS integration is disabled')
      return results
    }

    // Check if Git repository
    results.gitRepo = this.isGitRepository()
    if (!results.gitRepo) {
      results.errors.push('Not a Git repository')
      return results
    }

    // Get current branch and commit
    try {
      results.currentBranch = this.getCurrentBranch()
      results.currentCommit = this.getCurrentCommit()
    } catch (error) {
      results.errors.push(`Failed to get Git info: ${error.message}`)
      return results
    }

    // Check if working directory is clean
    results.workingDirClean = this.isWorkingDirectoryClean()
    if (!results.workingDirClean && this.requireClean) {
      results.errors.push('Working directory has uncommitted changes')
      return results
    }

    if (!results.workingDirClean) {
      results.warnings.push('Working directory has uncommitted changes')
    }

    results.canProceed = true
    return results
  }

  /**
   * Setup VCS for refactoring session
   * @param {string} sessionName - Name for the refactoring session
   * @returns {Object} Setup results
   */
  setupForRefactoring(sessionName) {
    const safetyCheck = this.performSafetyChecks()

    if (!safetyCheck.canProceed) {
      throw new Error(
        `VCS safety checks failed: ${safetyCheck.errors.join(', ')}`
      )
    }

    const results = {
      ...safetyCheck,
      branchCreated: false,
      stashCreated: false,
      sessionBranch: null,
      sessionStash: null
    }

    // Create branch if auto-branch is enabled
    if (this.autoBranch) {
      try {
        const branchResult = this.createBranch(sessionName)
        results.branchCreated = true
        results.sessionBranch = branchResult.branch
        results.previousBranch = branchResult.previousBranch
      } catch (error) {
        results.warnings.push(`Failed to create branch: ${error.message}`)
      }
    }

    // Stash changes if working directory is not clean
    if (!safetyCheck.workingDirClean && !results.branchCreated) {
      try {
        results.sessionStash = this.stashChanges()
        results.stashCreated = true
      } catch (error) {
        results.warnings.push(`Failed to stash changes: ${error.message}`)
      }
    }

    return results
  }

  /**
   * Cleanup VCS after refactoring session
   * @param {Object} setupResults - Results from setup
   * @param {boolean} keepChanges - Whether to keep the changes
   * @returns {Object} Cleanup results
   */
  cleanupAfterRefactoring(setupResults, keepChanges = false) {
    const results = {
      branchDeleted: false,
      stashPopped: false,
      switchedBack: false,
      errors: [],
      warnings: []
    }

    try {
      // Switch back to previous branch if we created a new one
      if (results.branchCreated && setupResults.previousBranch) {
        if (this.switchToBranch(setupResults.previousBranch)) {
          results.switchedBack = true

          // Delete the session branch if we don't want to keep changes
          if (!keepChanges && setupResults.sessionBranch) {
            if (this.deleteBranch(setupResults.sessionBranch)) {
              results.branchDeleted = true
            }
          }
        }
      }

      // Pop stash if we created one and didn't keep changes
      if (results.stashCreated && !keepChanges && setupResults.sessionStash) {
        if (this.popStash(setupResults.sessionStash)) {
          results.stashPopped = true
        }
      }
    } catch (error) {
      results.errors.push(error.message)
    }

    return results
  }
}
