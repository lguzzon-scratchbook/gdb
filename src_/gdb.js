// GenosDB Core - Graph Database Engine
// Implements the core GDB functionality with CRUD operations and graph traversal

import MessagePack from '@msgpack/msgpack';
import Pako from 'pako';

/**
 * Core GenosDB class
 * Implements graph database with CRUD operations and recursive traversal
 */
export default class GDB {
    constructor(options = {}) {
        this.config = {
            oplogWindow: options.oplogWindow || 100,
            resolveConflict: options.resolveConflict || this._defaultConflictResolution,
            ...options
        };
        
        // Core storage
        this.nodes = new Map();
        this.edges = new Map();
        this.oplog = [];
        this.subscribers = new Map();
        
        // Initialize persistence layer
        this._initPersistence();
        
        // Initialize cross-tab synchronization
        this._initCrossTabSync();
    }
    
    /**
     * Put operation - create or update a node
     * @param {string} id - Node ID
     * @param {any} data - Node data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Created/updated node
     */
    async put(id, data, options = {}) {
        const timestamp = Date.now();
        const operation = {
            type: 'put',
            id,
            data,
            timestamp,
            version: this._getNextVersion(id)
        };
        
        // Store node
        this.nodes.set(id, {
            data,
            timestamp,
            version: operation.version,
            ...options
        });
        
        // Add to oplog
        this._addToOplog(operation);
        
        // Notify subscribers
        this._notifySubscribers('put', { id, data, ...options });
        
        return { id, data, ...options };
    }
    
    /**
     * Get operation - retrieve a node by ID
     * @param {string} id - Node ID
     * @param {Object} options - Options including real-time subscription
     * @returns {Promise<Object|null>} Node data or null
     */
    async get(id, options = {}) {
        const node = this.nodes.get(id);
        if (!node) return null;
        
        // Handle real-time subscription
        if (options.subscribe) {
            return this._subscribeToNode(id, options);
        }
        
        return node;
    }
    
    /**
     * Link operation - create relationship between nodes
     * @param {string} fromId - Source node ID
     * @param {string} toId - Target node ID
     * @param {Object} edgeData - Edge properties
     * @returns {Promise<Object>} Created edge
     */
    async link(fromId, toId, edgeData = {}) {
        const timestamp = Date.now();
        const edgeId = this._generateEdgeId(fromId, toId);
        
        const edge = {
            id: edgeId,
            from: fromId,
            to: toId,
            data: edgeData,
            timestamp
        };
        
        this.edges.set(edgeId, edge);
        
        const operation = {
            type: 'link',
            edgeId,
            fromId,
            toId,
            edgeData,
            timestamp
        };
        
        this._addToOplog(operation);
        this._notifySubscribers('link', edge);
        
        return edge;
    }
    
    /**
     * Map operation - query operation with graph traversal
     * @param {Object} query - Query object including $edge operators
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Query results
     */
    async map(query, options = {}) {
        const results = [];
        
        // Handle recursive edge traversal with $edge operator
        if (query.$edge) {
            return this._executeEdgeTraversal(query, options);
        }
        
        // Standard query processing
        for (const [id, node] of this.nodes) {
            if (this._matchesQuery(node, query)) {
                results.push({ id, ...node });
            }
        }
        
        // Handle real-time subscription
        if (options.subscribe) {
            return this._subscribeToQuery(query, results, options);
        }
        
        return results;
    }
    
    /**
     * Remove operation - delete a node and its edges
     * @param {string} id - Node ID to remove
     * @returns {Promise<boolean>} Success status
     */
    async remove(id) {
        const node = this.nodes.get(id);
        if (!node) return false;
        
        // Remove node
        this.nodes.delete(id);
        
        // Remove associated edges
        for (const [edgeId, edge] of this.edges) {
            if (edge.from === id || edge.to === id) {
                this.edges.delete(edgeId);
            }
        }
        
        const operation = {
            type: 'remove',
            id,
            timestamp: Date.now()
        };
        
        this._addToOplog(operation);
        this._notifySubscribers('remove', { id });
        
        return true;
    }
    
    /**
     * Clear operation - remove all data
     * @returns {Promise<void>}
     */
    async clear() {
        this.nodes.clear();
        this.edges.clear();
        this.oplog = [];
        
        this._notifySubscribers('clear', {});
        
        // Persist clear operation
        await this._persist();
    }
    
    /**
     * Execute recursive graph traversal using $edge operator
     * @private
     */
    _executeEdgeTraversal(query, options) {
        const { $edge, ...nodeQuery } = query;
        const results = [];
        const visited = new Set();
        const maxDepth = options.maxDepth || 10;
        
        // Starting nodes
        const startNodes = this._findStartNodes(nodeQuery);
        
        for (const startNode of startNodes) {
            this._traverseEdges(
                startNode.id,
                $edge,
                results,
                visited,
                0,
                maxDepth
            );
        }
        
        return results;
    }
    
    /**
     * Recursively traverse edges
     * @private
     */
    _traverseEdges(nodeId, edgeQuery, results, visited, depth, maxDepth) {
        if (depth >= maxDepth || visited.has(nodeId)) return;
        
        visited.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Check if node matches edge query
        if (this._matchesQuery(node, edgeQuery)) {
            results.push({ id: nodeId, ...node });
        }
        
        // Traverse to connected nodes
        for (const [edgeId, edge] of this.edges) {
            let nextId = null;
            
            if (edge.from === nodeId) {
                nextId = edge.to;
            } else if (edge.to === nodeId) {
                nextId = edge.from;
            }
            
            if (nextId && !visited.has(nextId)) {
                this._traverseEdges(
                    nextId,
                    edgeQuery,
                    results,
                    visited,
                    depth + 1,
                    maxDepth
                );
            }
        }
    }
    
    /**
     * Find starting nodes for traversal
     * @private
     */
    _findStartNodes(query) {
        const startNodes = [];
        
        for (const [id, node] of this.nodes) {
            if (this._matchesQuery(node, query)) {
                startNodes.push({ id, ...node });
            }
        }
        
        return startNodes;
    }
    
    /**
     * Check if node matches query criteria
     * @private
     */
    _matchesQuery(node, query) {
        if (!query || Object.keys(query).length === 0) return true;
        
        for (const [key, value] of Object.entries(query)) {
            if (key.startsWith('$')) continue; // Skip operators
            
            if (node.data[key] !== value) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Add operation to oplog
     * @private
     */
    _addToOplog(operation) {
        this.oplog.push(operation);
        
        // Maintain oplog window
        if (this.oplog.length > this.config.oplogWindow) {
            this.oplog.shift();
        }
        
        // Persist asynchronously
        this._persist();
    }
    
    /**
     * Get next version for node
     * @private
     */
    _getNextVersion(id) {
        const node = this.nodes.get(id);
        return node ? node.version + 1 : 1;
    }
    
    /**
     * Generate edge ID
     * @private
     */
    _generateEdgeId(fromId, toId) {
        return `${fromId}->${toId}`;
    }
    
    /**
     * Initialize persistence layer (OPFS)
     * @private
     */
    _initPersistence() {
        if (typeof window !== 'undefined' && 'storage' in navigator) {
            // Browser environment with OPFS
            this._initOPFS();
        } else {
            // Fallback to localStorage
            this._initLocalStorage();
        }
    }
    
    /**
     * Initialize OPFS storage
     * @private
     */
    async _initOPFS() {
        try {
            const opfsRoot = await navigator.storage.getDirectory();
            this.fileHandle = await opfsRoot.getFileHandle('genosdb.data', { create: true });
            
            // Load existing data
            await this._loadFromStorage();
        } catch (error) {
            console.warn('OPFS initialization failed, using fallback:', error);
            this._initLocalStorage();
        }
    }
    
    /**
     * Initialize localStorage fallback
     * @private
     */
    _initLocalStorage() {
        this.storageKey = 'genosdb-data';
        this._loadFromStorage();
    }
    
    /**
     * Load data from storage
     * @private
     */
    async _loadFromStorage() {
        try {
            let data;
            
            if (this.fileHandle) {
                // OPFS
                const file = await this.fileHandle.getFile();
                const buffer = await file.arrayBuffer();
                data = new Uint8Array(buffer);
            } else {
                // localStorage
                const stored = localStorage.getItem(this.storageKey);
                if (!stored) return;
                data = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
            }
            
            // Decompress and deserialize
            const decompressed = Pako.inflate(data);
            const loaded = MessagePack.decode(decompressed);
            
            // Restore state
            this.nodes = new Map(loaded.nodes || []);
            this.edges = new Map(loaded.edges || []);
            this.oplog = loaded.oplog || [];
            
        } catch (error) {
            console.warn('Failed to load data from storage:', error);
        }
    }
    
    /**
     * Persist data to storage
     * @private
     */
    async _persist() {
        try {
            const data = {
                nodes: Array.from(this.nodes.entries()),
                edges: Array.from(this.edges.entries()),
                oplog: this.oplog
            };
            
            // Serialize and compress
            const serialized = MessagePack.encode(data);
            const compressed = Pako.deflate(serialized);
            
            if (this.fileHandle) {
                // OPFS
                const writable = await this.fileHandle.createWritable();
                await writable.write(compressed);
                await writable.close();
            } else {
                // localStorage
                const base64 = btoa(String.fromCharCode(...compressed));
                localStorage.setItem(this.storageKey, base64);
            }
            
        } catch (error) {
            console.warn('Failed to persist data:', error);
        }
    }
    
    /**
     * Initialize cross-tab synchronization
     * @private
     */
    _initCrossTabSync() {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            this.bc = new BroadcastChannel('genosdb');
            
            this.bc.onmessage = (event) => {
                this._handleBroadcastMessage(event.data);
            };
        }
    }
    
    /**
     * Handle broadcast messages from other tabs
     * @private
     */
    _handleBroadcastMessage(data) {
        const { type, operation } = data;
        
        // Apply operation from other tab
        this._applyOperation(operation);
        
        // Notify local subscribers
        this._notifySubscribers(type, operation);
    }
    
    /**
     * Apply operation from oplog or broadcast
     * @private
     */
    _applyOperation(operation) {
        switch (operation.type) {
            case 'put':
                this.nodes.set(operation.id, {
                    data: operation.data,
                    timestamp: operation.timestamp,
                    version: operation.version
                });
                break;
            case 'link':
                this.edges.set(operation.edgeId, {
                    id: operation.edgeId,
                    from: operation.fromId,
                    to: operation.toId,
                    data: operation.edgeData,
                    timestamp: operation.timestamp
                });
                break;
            case 'remove':
                this.nodes.delete(operation.id);
                break;
        }
    }
    
    /**
     * Notify subscribers of changes
     * @private
     */
    _notifySubscribers(type, data) {
        for (const [id, callback] of this.subscribers) {
            try {
                callback(type, data);
            } catch (error) {
                console.error('Subscriber callback error:', error);
            }
        }
        
        // Broadcast to other tabs
        if (this.bc) {
            this.bc.postMessage({ type, operation: data });
        }
    }
    
    /**
     * Subscribe to node changes
     * @private
     */
    _subscribeToNode(id, options) {
        const subscriptionId = this._generateSubscriptionId();
        
        this.subscribers.set(subscriptionId, (type, data) => {
            if (type === 'put' && data.id === id) {
                options.callback?.(data);
            } else if (type === 'remove' && data.id === id) {
                options.callback?.(null);
            }
        });
        
        // Return current node data
        const node = this.nodes.get(id);
        return node ? { id, ...node } : null;
    }
    
    /**
     * Subscribe to query changes
     * @private
     */
    _subscribeToQuery(query, initialResults, options) {
        const subscriptionId = this._generateSubscriptionId();
        
        this.subscribers.set(subscriptionId, (type, data) => {
            if (type === 'put' || type === 'remove') {
                // Re-execute query on changes
                this.map(query, { ...options, subscribe: false })
                    .then(results => options.callback?.(results));
            }
        });
        
        return initialResults;
    }
    
    /**
     * Generate unique subscription ID
     * @private
     */
    _generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random()}`;
    }
    
    /**
     * Default conflict resolution (Last-Write-Wins)
     * @private
     */
    _defaultConflictResolution(op1, op2) {
        return op1.timestamp > op2.timestamp ? op1 : op2;
    }
    
    /**
     * Sync operations with peers (for P2P)
     */
    async syncWithPeer(peerOperations) {
        for (const operation of peerOperations) {
            this._applyOperation(operation);
            this._addToOplog(operation);
        }
    }
    
    /**
     * Get current oplog
     */
    getOplog() {
        return [...this.oplog];
    }
    
    /**
     * Get database statistics
     */
    getStats() {
        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.size,
            oplogSize: this.oplog.length,
            memoryUsage: this._estimateMemoryUsage()
        };
    }
    
    /**
     * Estimate memory usage
     * @private
     */
    _estimateMemoryUsage() {
        // Rough estimation
        const nodeSize = this.nodes.size * 200; // Average node size
        const edgeSize = this.edges.size * 100; // Average edge size
        const oplogSize = this.oplog.length * 150; // Average operation size
        
        return nodeSize + edgeSize + oplogSize;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.subscribers.clear();
        if (this.bc) {
            this.bc.close();
        }
    }
}
