// Radix Tree Index Module
// Provides prefix-based indexing for fast string searches

/**
 * Radix Tree implementation for prefix searches
 */
export default class RadixIndex {
    constructor(options = {}) {
        this.root = new Map();
        this.caseSensitive = options.caseSensitive !== false;
        this.maxResults = options.maxResults || 100;
    }
    
    /**
     * Insert a key-value pair into the radix tree
     * @param {string} key - Key to index
     * @param {any} value - Associated value
     * @param {string} field - Field name for context
     */
    insert(key, value, field = 'default') {
        if (!key || typeof key !== 'string') return;
        
        const processedKey = this.caseSensitive ? key : key.toLowerCase();
        let node = this.root;
        
        // Insert each character into radix tree
        for (let i = 0; i < processedKey.length; i++) {
            const char = processedKey[i];
            
            if (!node.has(char)) {
                node.set(char, {
                    children: new Map(),
                    values: null,
                    isEnd: false
                });
            }
            
            node = node.get(char).children;
        }
        
        // Store the value at the leaf
        if (!node.has('')) {
            const leafNode = {
                children: new Map(),
                values: [],
                isEnd: true
            };
            node.set('', leafNode);
        }
        
        const leafNode = node.get('');
        leafNode.values = leafNode.values || [];
        leafNode.values.push({
            value,
            field,
            originalKey: key,
            key: processedKey
        });
        leafNode.isEnd = true;
    }
    
    /**
     * Search for values by prefix
     * @param {string} prefix - Prefix to search for
     * @returns {Array} Matching values
     */
    searchByPrefix(prefix) {
        if (!prefix || typeof prefix !== 'string') return [];
        
        const processedPrefix = this.caseSensitive ? prefix : prefix.toLowerCase();
        let node = this.root;
        
        // Navigate to prefix
        for (let i = 0; i < processedPrefix.length; i++) {
            const char = processedPrefix[i];
            if (!node.has(char)) {
                return [];
            }
            node = node.get(char).children;
        }
        
        // Collect all values from this node downward
        const results = [];
        this._collectValues(node, results, this.maxResults);
        
        return results.map(item => ({
            ...item,
            score: this._calculateRelevance(item.key, processedPrefix)
        })).sort((a, b) => b.score - a.score);
    }
    
    /**
     * Remove an entry from the index
     * @param {string} key - Key to remove
     * @param {any} value - Value to remove
     */
    remove(key, value) {
        if (!key || typeof key !== 'string') return false;
        
        const processedKey = this.caseSensitive ? key : key.toLowerCase();
        const nodes = [];
        let node = this.root;
        
        // Find path to the key
        for (let i = 0; i < processedKey.length; i++) {
            const char = processedKey[i];
            if (!node.has(char)) {
                return false;
            }
            
            const charNode = node.get(char);
            nodes.push({ char, node: charNode, parent: node });
            node = charNode.children;
        }
        
        // Check if leaf exists
        if (!node.has('')) {
            return false;
        }
        
        const leafNode = node.get('');
        if (!leafNode.values) {
            return false;
        }
        
        // Remove the specific value
        const index = leafNode.values.findIndex(item => item.value === value);
        if (index === -1) {
            return false;
        }
        
        leafNode.values.splice(index, 1);
        
        // Clean up empty nodes
        if (leafNode.values.length === 0) {
            node.set('', null);
        }
        
        this._cleanupEmptyNodes(nodes);
        return true;
    }
    
    /**
     * Get all values in the index
     * @returns {Array} All values
     */
    getAll() {
        const results = [];
        this._collectValues(this.root, results);
        return results;
    }
    
    /**
     * Clear the entire index
     */
    clear() {
        this.root = new Map();
    }
    
    /**
     * Get statistics about the index
     * @returns {Object} Index statistics
     */
    getStats() {
        const stats = {
            nodeCount: 0,
            valueCount: 0,
            depth: 0
        };
        
        this._calculateStats(this.root, stats, 0);
        return stats;
    }
    
    /**
     * Collect all values from a node downward
     * @private
     */
    _collectValues(node, results, maxResults = null) {
        if (maxResults && results.length >= maxResults) {
            return;
        }
        
        for (const [char, childNode] of node) {
            if (char === '' && childNode && childNode.values) {
                results.push(...childNode.values);
            } else if (childNode && childNode.children) {
                this._collectValues(childNode.children, results, maxResults);
            }
        }
    }
    
    /**
     * Calculate relevance score for sorting
     * @private
     */
    _calculateRelevance(key, query) {
        let score = 0;
        
        // Exact match gets highest score
        if (key === query) {
            score = 100;
        } 
        // Starts with query gets high score
        else if (key.startsWith(query)) {
            score = 80 + (query.length / key.length) * 20;
        }
        // Contains query gets lower score
        else if (key.includes(query)) {
            score = 60 + (query.length / key.length) * 20;
        }
        // Levenshtein distance for fuzzy matching
        else {
            const distance = this._levenshteinDistance(key, query);
            score = Math.max(0, 40 - distance);
        }
        
        return score;
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     * @private
     */
    _levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * Clean up empty nodes after deletion
     * @private
     */
    _cleanupEmptyNodes(nodes) {
        for (let i = nodes.length - 1; i >= 0; i--) {
            const { char, node, parent } = nodes[i];
            
            if (node.children.size === 1 && node.children.has('') && 
                node.children.get('').values && node.children.get('').values.length === 0) {
                parent.delete(char);
            }
        }
    }
    
    /**
     * Calculate index statistics
     * @private
     */
    _calculateStats(node, stats, depth) {
        stats.nodeCount++;
        stats.depth = Math.max(stats.depth, depth);
        
        for (const [char, childNode] of node) {
            if (char === '' && childNode && childNode.values) {
                stats.valueCount += childNode.values.length;
            } else if (childNode && childNode.children) {
                this._calculateStats(childNode.children, stats, depth + 1);
            }
        }
    }
}
