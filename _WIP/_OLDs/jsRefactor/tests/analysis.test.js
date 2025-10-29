/**
 * Tests for the analysis module
 */

import { CodeKnowledgeGraph } from '../analysis/CKG.js'
import { AnalysisWorkerPool } from '../analysis/worker-pool.js'
import { runner } from './test-runner.js'

runner.test('CodeKnowledgeGraph should initialize correctly', () => {
  const ckg = new CodeKnowledgeGraph()

  if (!ckg.nodes) {
    throw new Error('CKG should have nodes property')
  }

  if (!ckg.edges) {
    throw new Error('CKG should have edges property')
  }

  if (ckg.nodes.size !== 0) {
    throw new Error('CKG should start with empty nodes')
  }

  if (ckg.edges.size !== 0) {
    throw new Error('CKG should start with empty edges')
  }
})

runner.test('CodeKnowledgeGraph should add nodes', () => {
  const ckg = new CodeKnowledgeGraph()

  const node = {
    id: 'test-node',
    type: 'function',
    name: 'testFunction',
    file: 'test.js',
    loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } }
  }

  ckg.addNode(node)

  if (ckg.nodes.size !== 1) {
    throw new Error('Should have added one node')
  }

  const retrievedNode = ckg.getNode('test-node')
  if (!retrievedNode || retrievedNode.name !== 'testFunction') {
    throw new Error('Node not retrieved correctly')
  }
})

runner.test('CodeKnowledgeGraph should add edges', () => {
  const ckg = new CodeKnowledgeGraph()

  // Add nodes first
  ckg.addNode({ id: 'node1', type: 'function', name: 'func1' })
  ckg.addNode({ id: 'node2', type: 'variable', name: 'var1' })

  // Add edge
  const edge = {
    from: 'node1',
    to: 'node2',
    type: 'uses',
    weight: 1
  }

  ckg.addEdge(edge)

  if (ckg.edges.size !== 1) {
    throw new Error('Should have added one edge')
  }

  const retrievedEdges = ckg.getEdges('node1')
  if (retrievedEdges.length !== 1) {
    throw new Error('Edge not retrieved correctly')
  }
})

runner.test('CodeKnowledgeGraph should find related nodes', () => {
  const ckg = new CodeKnowledgeGraph()

  // Create a small graph
  ckg.addNode({ id: 'func1', type: 'function', name: 'func1' })
  ckg.addNode({ id: 'func2', type: 'function', name: 'func2' })
  ckg.addNode({ id: 'var1', type: 'variable', name: 'var1' })

  ckg.addEdge({ from: 'func1', to: 'var1', type: 'uses' })
  ckg.addEdge({ from: 'func2', to: 'var1', type: 'uses' })

  const relatedNodes = ckg.findRelatedNodes('var1')

  if (relatedNodes.length !== 2) {
    throw new Error('Should find 2 related nodes')
  }
})

runner.test('CodeKnowledgeGraph should calculate metrics', () => {
  const ckg = new CodeKnowledgeGraph()

  // Add some nodes and edges
  for (let i = 0; i < 10; i++) {
    ckg.addNode({ id: `node${i}`, type: 'function', name: `func${i}` })
  }

  for (let i = 0; i < 5; i++) {
    ckg.addEdge({ from: `node${i}`, to: `node${i + 1}`, type: 'calls' })
  }

  const metrics = ckg.getMetrics()

  if (metrics.nodeCount !== 10) {
    throw new Error('Should report 10 nodes')
  }

  if (metrics.edgeCount !== 5) {
    throw new Error('Should report 5 edges')
  }

  if (metrics.density <= 0 || metrics.density > 1) {
    throw new Error('Density should be between 0 and 1')
  }
})

runner.test('AnalysisWorkerPool should initialize with config', () => {
  const config = {
    maxWorkers: 2,
    workerTimeout: 5000
  }

  const pool = new AnalysisWorkerPool(config)

  if (pool.config.maxWorkers !== 2) {
    throw new Error('Worker pool should use provided config')
  }
})

runner.test('AnalysisWorkerPool should handle empty file list', async () => {
  const pool = new AnalysisWorkerPool({ maxWorkers: 1 })

  const results = await pool.analyzeFiles([])

  if (!results || results.length !== 0) {
    throw new Error('Should return empty results for empty file list')
  }
})

runner.test('CodeKnowledgeGraph should export to JSON', () => {
  const ckg = new CodeKnowledgeGraph()

  ckg.addNode({ id: 'test', type: 'function', name: 'test' })
  ckg.addEdge({ from: 'test', to: 'other', type: 'uses' })

  const json = ckg.toJSON()

  if (!json.nodes || !json.edges) {
    throw new Error('JSON export should include nodes and edges')
  }

  if (json.nodes.length !== 1) {
    throw new Error('JSON export should include all nodes')
  }
})

runner.test('CodeKnowledgeGraph should import from JSON', () => {
  const ckg = new CodeKnowledgeGraph()

  const jsonData = {
    nodes: [{ id: 'imported1', type: 'function', name: 'importedFunc' }],
    edges: [{ from: 'imported1', to: 'imported2', type: 'uses' }]
  }

  ckg.fromJSON(jsonData)

  if (ckg.nodes.size !== 1) {
    throw new Error('Should import nodes from JSON')
  }

  if (ckg.edges.size !== 1) {
    throw new Error('Should import edges from JSON')
  }
})

runner.test('CodeKnowledgeGraph should clear data', () => {
  const ckg = new CodeKnowledgeGraph()

  // Add some data
  ckg.addNode({ id: 'test', type: 'function', name: 'test' })
  ckg.addEdge({ from: 'test', to: 'other', type: 'uses' })

  // Clear it
  ckg.clear()

  if (ckg.nodes.size !== 0) {
    throw new Error('Clear should remove all nodes')
  }

  if (ckg.edges.size !== 0) {
    throw new Error('Clear should remove all edges')
  }
})
