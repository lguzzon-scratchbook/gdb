/**
 * Worker pool for parallel file analysis using Bun Workers
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class AnalysisWorkerPool {
  constructor(config = {}) {
    this.maxWorkers = config.maxWorkers || 4
    this.workerTimeout = config.workerTimeout || 30000
    this.workers = []
    this.availableWorkers = []
    this.busyWorkers = new Map()
    this.taskQueue = []
    this.results = []
    this.isInitialized = false
  }

  /**
   * Initialize worker pool
   */
  async initialize() {
    // Create worker threads
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(resolve(__dirname, 'analysis-worker.js'))

      worker.on('message', (result) => {
        this.handleWorkerMessage(worker, result)
      })

      worker.on('error', (error) => {
        this.handleWorkerError(worker, error)
      })

      worker.on('exit', (code) => {
        this.handleWorkerExit(worker, code)
      })

      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }

    this.isInitialized = true
  }

  /**
   * Process files in parallel using workers
   * @param {Array<string>} files - Array of file paths to process
   * @param {CodeKnowledgeGraph} ckg - CKG to populate
   * @returns {Object} Processing results
   */
  async processFiles(files, ckg) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()
    const results = {
      files: files.length,
      processed: 0,
      failed: 0,
      totalTime: 0,
      workerResults: [],
      errors: []
    }

    // Create tasks for each file
    for (const file of files) {
      this.taskQueue.push({
        filepath: file,
        ckg: ckg,
        startTime: Date.now(),
        timeout: this.workerTimeout
      })
    }

    // Process tasks
    await this.processTaskQueue(results)

    // Calculate total time
    results.totalTime = Date.now() - startTime
    results.workerResults = this.results

    return results
  }

  /**
   * Process task queue
   * @param {Object} results - Results object to populate
   */
  async processTaskQueue(results) {
    return new Promise((resolve, _reject) => {
      const checkCompletion = () => {
        if (this.taskQueue.length === 0 && this.busyWorkers.size === 0) {
          resolve(results)
        } else {
          // Try to process more tasks
          this.processNextTask(results)
          // Check again after a short delay
          setTimeout(checkCompletion, 10)
        }
      }

      checkCompletion()
    })
  }

  /**
   * Process next available task
   * @param {Object} results - Results object to populate
   */
  processNextTask(results) {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return
    }

    const task = this.taskQueue.shift()
    const worker = this.availableWorkers.shift()

    // Set up timeout
    const timeoutId = setTimeout(() => {
      this.handleWorkerTimeout(worker, task, results)
    }, task.timeout)

    // Mark worker as busy
    this.busyWorkers.set(worker, {
      task: task,
      timeoutId: timeoutId,
      startTime: Date.now()
    })

    // Send task to worker
    worker.postMessage({
      filepath: task.filepath
    })
  }

  /**
   * Handle worker message
   * @param {Worker} worker - Worker instance
   * @param {Object} result - Worker result
   */
  handleWorkerMessage(worker, result) {
    const workerInfo = this.busyWorkers.get(worker)

    if (!workerInfo) {
      return // Worker not in busy list
    }

    // Clear timeout
    clearTimeout(workerInfo.timeoutId)

    // Process result
    if (result.success) {
      // Add nodes and edges to CKG
      if (workerInfo.task.ckg) {
        for (const node of result.nodes) {
          workerInfo.task.ckg.addNode(node)
        }
        for (const edge of result.edges) {
          workerInfo.task.ckg.addEdge(edge)
        }
      }

      this.results.push(result)
      result.processingTime = Date.now() - workerInfo.startTime
    } else {
      // Handle error
      this.results.push({
        ...result,
        processingTime: Date.now() - workerInfo.startTime
      })
    }

    // Mark worker as available
    this.busyWorkers.delete(worker)
    this.availableWorkers.push(worker)
  }

  /**
   * Handle worker error
   * @param {Worker} worker - Worker instance
   * @param {Error} error - Error object
   */
  handleWorkerError(worker, error) {
    const workerInfo = this.busyWorkers.get(worker)

    if (workerInfo) {
      clearTimeout(workerInfo.timeoutId)

      this.results.push({
        success: false,
        filepath: workerInfo.task.filepath,
        error: error.message,
        nodes: [],
        edges: [],
        processingTime: Date.now() - workerInfo.startTime
      })

      this.busyWorkers.delete(worker)
      this.availableWorkers.push(worker)
    }

    console.error(`Worker error: ${error.message}`)
  }

  /**
   * Handle worker exit
   * @param {Worker} worker - Worker instance
   * @param {number} code - Exit code
   */
  handleWorkerExit(worker, code) {
    const workerInfo = this.busyWorkers.get(worker)

    if (workerInfo) {
      clearTimeout(workerInfo.timeoutId)

      this.results.push({
        success: false,
        filepath: workerInfo.task.filepath,
        error: `Worker exited with code ${code}`,
        nodes: [],
        edges: [],
        processingTime: Date.now() - workerInfo.startTime
      })

      this.busyWorkers.delete(worker)
    }

    // Remove worker from pool
    const workerIndex = this.workers.indexOf(worker)
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1)
    }

    const availableIndex = this.availableWorkers.indexOf(worker)
    if (availableIndex !== -1) {
      this.availableWorkers.splice(availableIndex, 1)
    }

    console.warn(`Worker exited with code ${code}`)
  }

  /**
   * Handle worker timeout
   * @param {Worker} worker - Worker instance
   * @param {Object} task - Task that timed out
   * @param {Object} results - Results object
   */
  handleWorkerTimeout(worker, task, _results) {
    // Terminate worker
    worker.terminate()

    // Mark as failed
    this.results.push({
      success: false,
      filepath: task.filepath,
      error: `Worker timeout after ${task.timeout}ms`,
      nodes: [],
      edges: [],
      processingTime: Date.now() - task.startTime
    })

    // Remove from busy workers
    this.busyWorkers.delete(worker)

    // Remove from pool
    const workerIndex = this.workers.indexOf(worker)
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1)
    }

    const availableIndex = this.availableWorkers.indexOf(worker)
    if (availableIndex !== -1) {
      this.availableWorkers.splice(availableIndex, 1)
    }

    console.warn(`Worker timeout for file: ${task.filepath}`)
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      taskQueueLength: this.taskQueue.length,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Cleanup worker pool
   */
  async cleanup() {
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate()
    }

    // Clear arrays and maps
    this.workers = []
    this.availableWorkers = []
    this.busyWorkers.clear()
    this.taskQueue = []
    this.results = []
    this.isInitialized = false
  }

  /**
   * Wait for all tasks to complete
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise} Promise that resolves when all tasks are complete
   */
  async waitForCompletion(timeout = 60000) {
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (this.taskQueue.length === 0 && this.busyWorkers.size === 0) {
          resolve()
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Worker pool timeout after ${timeout}ms`))
        } else {
          setTimeout(checkCompletion, 100)
        }
      }

      checkCompletion()
    })
  }
}
