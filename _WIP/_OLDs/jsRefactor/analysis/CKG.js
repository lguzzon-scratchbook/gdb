/**
 * Code Knowledge Graph (CKG) data structure
 * Stores nodes (declarations) and edges (relationships) extracted from AST
 */

export class CodeKnowledgeGraph {
  constructor() {
    this.nodes = new Map() // nodeId -> node data
    this.edges = new Map() // edgeId -> edge data
    this.nodeIndex = new Map() // type -> Set(nodeId)
    this.fileIndex = new Map() // filePath -> Set(nodeId)
    this.metadata = {
      nodeCount: 0,
      edgeCount: 0,
      fileCount: 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * Add a node to the CKG
   * @param {Object} node - Node data
   * @returns {string} Node ID
   */
  addNode(node) {
    const nodeId = this._generateNodeId(node)

    // Add node to main storage
    this.nodes.set(nodeId, {
      id: nodeId,
      ...node,
      edges: new Set(),
      createdAt: Date.now()
    })

    // Update indexes
    this._updateNodeIndexes(nodeId, node)

    // Update metadata
    this.metadata.nodeCount++
    this.metadata.lastUpdated = Date.now()

    return nodeId
  }

  /**
   * Add an edge to the CKG
   * @param {Object} edge - Edge data
   * @returns {string} Edge ID
   */
  addEdge(edge) {
    const edgeId = this._generateEdgeId(edge)

    // Add edge to main storage
    this.edges.set(edgeId, {
      id: edgeId,
      ...edge,
      createdAt: Date.now()
    })

    // Update node edge references
    if (edge.source && this.nodes.has(edge.source)) {
      this.nodes.get(edge.source).edges.add(edgeId)
    }
    if (edge.target && this.nodes.has(edge.target)) {
      this.nodes.get(edge.target).edges.add(edgeId)
    }

    // Update metadata
    this.metadata.edgeCount++
    this.metadata.lastUpdated = Date.now()

    return edgeId
  }

  /**
   * Get node by ID
   * @param {string} nodeId - Node ID
   * @returns {Object|null} Node data or null
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null
  }

  /**
   * Get edge by ID
   * @param {string} edgeId - Edge ID
   * @returns {Object|null} Edge data or null
   */
  getEdge(edgeId) {
    return this.edges.get(edgeId) || null
  }

  /**
   * Get all nodes
   * @returns {Array<Object>} Array of all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values())
  }

  /**
   * Get all edges
   * @returns {Array<Object>} Array of all edges
   */
  getAllEdges() {
    return Array.from(this.edges.values())
  }

  /**
   * Get nodes by type
   * @param {string} type - Node type
   * @returns {Array<Object>} Array of nodes of specified type
   */
  getNodesByType(type) {
    const nodeIds = this.nodeIndex.get(type) || new Set()
    return Array.from(nodeIds)
      .map((id) => this.nodes.get(id))
      .filter(Boolean)
  }

  /**
   * Get nodes by file
   * @param {string} filePath - File path
   * @returns {Array<Object>} Array of nodes from specified file
   */
  getNodesByFile(filePath) {
    const nodeIds = this.fileIndex.get(filePath) || new Set()
    return Array.from(nodeIds)
      .map((id) => this.nodes.get(id))
      .filter(Boolean)
  }

  /**
   * Get edges by type
   * @param {string} type - Edge type
   * @returns {Array<Object>} Array of edges of specified type
   */
  getEdgesByType(type) {
    return this.getAllEdges().filter((edge) => edge.type === type)
  }

  /**
   * Get edges for a node
   * @param {string} nodeId - Node ID
   * @returns {Array<Object>} Array of edges connected to the node
   */
  getEdgesForNode(nodeId) {
    const node = this.nodes.get(nodeId)
    if (!node) {
      return []
    }

    return Array.from(node.edges)
      .map((edgeId) => this.edges.get(edgeId))
      .filter(Boolean)
  }

  /**
   * Get incoming edges for a node
   * @param {string} nodeId - Node ID
   * @returns {Array<Object>} Array of incoming edges
   */
  getIncomingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter((edge) => edge.target === nodeId)
  }

  /**
   * Get outgoing edges for a node
   * @param {string} nodeId - Node ID
   * @returns {Array<Object>} Array of outgoing edges
   */
  getOutgoingEdges(nodeId) {
    return this.getEdgesForNode(nodeId).filter((edge) => edge.source === nodeId)
  }

  /**
   * Get connected nodes (neighbors)
   * @param {string} nodeId - Node ID
   * @param {number} depth - Depth of search (1 for direct neighbors)
   * @returns {Array<Object>} Array of connected nodes
   */
  getConnectedNodes(nodeId, depth = 1) {
    const connected = new Set()
    const visited = new Set([nodeId])
    const queue = [{ id: nodeId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth: currentDepth } = queue.shift()

      if (currentDepth >= depth) {
        continue
      }

      const edges = this.getEdgesForNode(id)

      for (const edge of edges) {
        const neighborId = edge.source === id ? edge.target : edge.source

        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          connected.add(neighborId)
          queue.push({ id: neighborId, depth: currentDepth + 1 })
        }
      }
    }

    return Array.from(connected)
      .map((id) => this.nodes.get(id))
      .filter(Boolean)
  }

  /**
   * Find path between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {Array<Object>} Array of edges representing the path
   */
  findPath(sourceId, targetId) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return []
    }

    const visited = new Set([sourceId])
    const queue = [{ id: sourceId, path: [] }]
    const parent = new Map()

    while (queue.length > 0) {
      const { id, path } = queue.shift()

      if (id === targetId) {
        // Reconstruct path
        const fullPath = [...path, id]
        const edgePath = []

        for (let i = 0; i < fullPath.length - 1; i++) {
          const currentId = fullPath[i]
          const nextId = fullPath[i + 1]

          const edge = this.getEdgesForNode(currentId).find(
            (e) =>
              (e.source === currentId && e.target === nextId) ||
              (e.target === currentId && e.source === nextId)
          )

          if (edge) {
            edgePath.push(edge)
          }
        }

        return edgePath
      }

      const edges = this.getEdgesForNode(id)

      for (const edge of edges) {
        const neighborId = edge.source === id ? edge.target : edge.source

        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          parent.set(neighborId, id)
          queue.push({ id: neighborId, path: [...path, id] })
        }
      }
    }

    return [] // No path found
  }

  /**
   * Get node count
   * @returns {number} Number of nodes
   */
  getNodeCount() {
    return this.nodes.size
  }

  /**
   * Get edge count
   * @returns {number} Number of edges
   */
  getEdgeCount() {
    return this.edges.size
  }

  /**
   * Get file count
   * @returns {number} Number of unique files
   */
  getFileCount() {
    return this.fileIndex.size
  }

  /**
   * Get CKG metadata
   * @returns {Object} Metadata
   */
  getMetadata() {
    return {
      ...this.metadata,
      nodeCount: this.getNodeCount(),
      edgeCount: this.getEdgeCount(),
      fileCount: this.getFileCount()
    }
  }

  /**
   * Merge another CKG into this one
   * @param {CodeKnowledgeGraph} otherCKG - Other CKG to merge
   */
  merge(otherCKG) {
    // Merge nodes
    for (const node of otherCKG.getAllNodes()) {
      if (!this.nodes.has(node.id)) {
        this.addNode(node)
      }
    }

    // Merge edges
    for (const edge of otherCKG.getAllEdges()) {
      if (!this.edges.has(edge.id)) {
        this.addEdge(edge)
      }
    }

    // Update metadata
    this.metadata.lastUpdated = Date.now()
  }

  /**
   * Export CKG to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      metadata: this.getMetadata(),
      nodes: this.getAllNodes(),
      edges: this.getAllEdges()
    }
  }

  /**
   * Import CKG from JSON
   * @param {Object} json - JSON representation
   */
  fromJSON(json) {
    if (json.nodes) {
      for (const node of json.nodes) {
        this.addNode(node)
      }
    }

    if (json.edges) {
      for (const edge of json.edges) {
        this.addEdge(edge)
      }
    }
  }

  /**
   * Clear CKG
   */
  clear() {
    this.nodes.clear()
    this.edges.clear()
    this.nodeIndex.clear()
    this.fileIndex.clear()
    this.metadata = {
      nodeCount: 0,
      edgeCount: 0,
      fileCount: 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * Generate unique node ID
   * @param {Object} node - Node data
   * @returns {string} Node ID
   */
  _generateNodeId(node) {
    const parts = [
      node.type || 'unknown',
      node.name || 'anonymous',
      node.file || 'unknown',
      node.loc ? `${node.loc.start.line}-${node.loc.start.column}` : '0-0'
    ]

    return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '_')
  }

  /**
   * Generate unique edge ID
   * @param {Object} edge - Edge data
   * @returns {string} Edge ID
   */
  _generateEdgeId(edge) {
    const parts = [
      edge.type || 'unknown',
      edge.source || 'unknown',
      edge.target || 'unknown',
      Date.now().toString(36)
    ]

    return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '_')
  }

  /**
   * Update node indexes
   * @param {string} nodeId - Node ID
   * @param {Object} node - Node data
   */
  _updateNodeIndexes(nodeId, node) {
    // Type index
    if (node.type) {
      if (!this.nodeIndex.has(node.type)) {
        this.nodeIndex.set(node.type, new Set())
      }
      this.nodeIndex.get(node.type).add(nodeId)
    }

    // File index
    if (node.file) {
      if (!this.fileIndex.has(node.file)) {
        this.fileIndex.set(node.file, new Set())
      }
      this.fileIndex.get(node.file).add(nodeId)
    }
  }
}
