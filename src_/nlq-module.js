// Natural Language Query (NLQ) Module
// Provides natural language querying capabilities for the database

/**
 * NLQ Module - Natural language querying
 */
export default class NLQModule {
    constructor(database, options = {}) {
        this.db = database;
        this.config = {
            modelProvider: options.modelProvider || 'openai',
            apiKey: options.apiKey,
            model: options.model || 'gpt-3.5-turbo',
            temperature: options.temperature || 0.1,
            maxTokens: options.maxTokens || 500,
            ...options
        };
        
        // Query patterns for common operations
        this.patterns = {
            search: [
                /find/i,
                /search/i,
                /look for/i,
                /show me/i,
                /get/i
            ],
            create: [
                /create/i,
                /add/i,
                /insert/i,
                /new/i
            ],
            update: [
                /update/i,
                /change/i,
                /modify/i,
                /edit/i
            ],
            delete: [
                /delete/i,
                /remove/i,
                /erase/i
            ],
            count: [
                /count/i,
                /how many/i,
                /number of/i
            ]
        };
        
        // Field mapping for common field names
        this.fieldMappings = {
            name: ['name', 'title', 'label', 'subject'],
            description: ['description', 'desc', 'details', 'info'],
            date: ['date', 'created', 'time', 'timestamp'],
            status: ['status', 'state', 'condition'],
            category: ['category', 'type', 'kind', 'sort']
        };
    }
    
    /**
     * Execute natural language query
     * @param {string} query - Natural language query
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Query results
     */
    async query(query, options = {}) {
        try {
            // Parse the natural language query
            const parsedQuery = await this._parseQuery(query, options);
            
            // Execute the structured query
            const results = await this._executeParsedQuery(parsedQuery, options);
            
            return results;
            
        } catch (error) {
            console.error('NLQ failed:', error);
            throw new Error(`Natural language query failed: ${error.message}`);
        }
    }
    
    /**
     * Translate natural language query to structured query
     * @param {string} query - Natural language query
     * @param {Object} options - Options
     * @returns {Promise<Object>} Structured query
     */
    async translateQuery(query, options = {}) {
        return await this._parseQuery(query, options);
    }
    
    /**
     * Get query explanation
     * @param {string} query - Natural language query
     * @returns {Promise<string>} Explanation of how the query was interpreted
     */
    async explainQuery(query) {
        try {
            const parsedQuery = await this._parseQuery(query);
            return this._generateExplanation(query, parsedQuery);
        } catch (error) {
            return `Failed to process query: ${error.message}`;
        }
    }
    
    /**
     * Parse natural language query
     * @private
     */
    async _parseQuery(query, options = {}) {
        // Clean and normalize query
        const cleanQuery = query.trim().toLowerCase();
        
        // Try to match query patterns
        const operation = this._detectOperation(cleanQuery);
        
        switch (operation) {
            case 'search':
                return this._parseSearchQuery(cleanQuery, options);
            case 'create':
                return this._parseCreateQuery(cleanQuery, options);
            case 'update':
                return this._parseUpdateQuery(cleanQuery, options);
            case 'delete':
                return this._parseDeleteQuery(cleanQuery, options);
            case 'count':
                return this._parseCountQuery(cleanQuery, options);
            default:
                // Fallback to AI model for complex queries
                return await this._parseWithAI(query, options);
        }
    }
    
    /**
     * Execute parsed query
     * @private
     */
    async _executeParsedQuery(parsedQuery, options = {}) {
        switch (parsedQuery.type) {
            case 'search':
                return await this._executeSearch(parsedQuery, options);
            case 'create':
                return await this._executeCreate(parsedQuery, options);
            case 'update':
                return await this._executeUpdate(parsedQuery, options);
            case 'delete':
                return await this._executeDelete(parsedQuery, options);
            case 'count':
                return await this._executeCount(parsedQuery, options);
            default:
                throw new Error(`Unknown query type: ${parsedQuery.type}`);
        }
    }
    
    /**
     * Detect query operation type
     * @private
     */
    _detectOperation(query) {
        for (const [operation, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                if (pattern.test(query)) {
                    return operation;
                }
            }
        }
        return 'unknown';
    }
    
    /**
     * Parse search query
     * @private
     */
    _parseSearchQuery(query, options = {}) {
        const conditions = {};
        let fields = null;
        
        // Extract field:value patterns
        const fieldPattern = /(\w+):(["'`])(.*?)\2/g;
        let match;
        
        while ((match = fieldPattern.exec(query)) !== null) {
            const fieldName = this._normalizeFieldName(match[1]);
            const value = match[3];
            
            // Handle numeric values
            if (!isNaN(value)) {
                conditions[fieldName] = Number(value);
            } else {
                conditions[fieldName] = value;
            }
        }
        
        // Extract quoted search terms
        const quotedPattern = /["'`]([^"'`]+)["'`]/g;
        const searchTerms = [];
        
        while ((match = quotedPattern.exec(query)) !== null) {
            searchTerms.push(match[1]);
        }
        
        // Extract unquoted search terms (excluding field patterns)
        const cleanQuery = query.replace(fieldPattern, '').replace(quotedPattern, '');
        const unquotedTerms = cleanQuery
            .split(/\s+/)
            .filter(term => term.length > 1 && !this._isKeyword(term));
        
        // Combine search terms
        const allTerms = [...searchTerms, ...unquotedTerms];
        
        if (allTerms.length > 0) {
            // Match against common text fields
            const textFields = ['name', 'title', 'description', 'desc', 'content'];
            const orConditions = textFields.map(field => ({
                [field]: { $regex: allTerms.join('|'), $options: 'i' }
            }));
            
            if (Object.keys(conditions).length > 0) {
                return {
                    type: 'search',
                    conditions: {
                        $and: [
                            ...Object.entries(conditions).map(([key, value]) => ({ [key]: value })),
                            { $or: orConditions }
                        ]
                    },
                    fields,
                    searchTerms: allTerms
                };
            } else {
                return {
                    type: 'search',
                    conditions: { $or: orConditions },
                    fields,
                    searchTerms: allTerms
                };
            }
        }
        
        return {
            type: 'search',
            conditions: Object.keys(conditions).length > 0 ? conditions : {},
            fields,
            searchTerms: allTerms
        };
    }
    
    /**
     * Parse create query
     * @private
     */
    _parseCreateQuery(query, options = {}) {
        // Extract entity type and properties
        const match = query.match(/(?:create|add|insert)\s+(?:a\s+)?(\w+)\s+(?:with|that has|named)\s+(.+)/i);
        
        if (!match) {
            throw new Error('Invalid create query format');
        }
        
        const entityType = match[1].toLowerCase();
        const properties = this._parseProperties(match[2]);
        
        return {
            type: 'create',
            entityType,
            properties
        };
    }
    
    /**
     * Parse update query
     * @private
     */
    _parseUpdateQuery(query, options = {}) {
        // Parse update: "update user with name John where age > 25"
        const match = query.match(/(?:update|change)\s+(\w+)\s+(?:with|that has)\s+(.+?)(?:\s+where\s+(.+))?$/i);
        
        if (!match) {
            throw new Error('Invalid update query format');
        }
        
        const entityType = match[1].toLowerCase();
        const properties = this._parseProperties(match[2]);
        const conditionStr = match[3] || '';
        const conditions = conditionStr ? this._parseConditions(conditionStr) : {};
        
        return {
            type: 'update',
            entityType,
            properties,
            conditions
        };
    }
    
    /**
     * Parse delete query
     * @private
     */
    _parseDeleteQuery(query, options = {}) {
        // Parse delete: "delete users where age > 25"
        const match = query.match(/(?:delete|remove)\s+(.+?)(?:\s+where\s+(.+))?$/i);
        
        if (!match) {
            throw new Error('Invalid delete query format');
        }
        
        const entityType = match[1].toLowerCase();
        const conditionStr = match[2] || '';
        const conditions = conditionStr ? this._parseConditions(conditionStr) : {};
        
        return {
            type: 'delete',
            entityType,
            conditions
        };
    }
    
    /**
     * Parse count query
     * @private
     */
    _parseCountQuery(query, options = {}) {
        // Parse count: "count users where age > 25"
        const match = query.match(/(?:count|how many)\s+(.+?)(?:\s+where\s+(.+))?$/i);
        
        if (!match) {
            throw new Error('Invalid count query format');
        }
        
        const entityType = match[1].toLowerCase();
        const conditionStr = match[2] || '';
        const conditions = conditionStr ? this._parseConditions(conditionStr) : {};
        
        return {
            type: 'count',
            entityType,
            conditions
        };
    }
    
    /**
     * Parse complex query with AI model
     * @private
     */
    async _parseWithAI(query, options = {}) {
        if (!this.config.apiKey) {
            // Fallback to simple parsing
            return this._parseSearchQuery(query, options);
        }
        
        const prompt = `
Convert this natural language query into a structured JSON query:
"${query}"

Available operations: search, create, update, delete, count
Available fields: name, description, date, status, category
Operators: =, >, <, >=, <=, !=, contains, starts with, ends with

Return only valid JSON with this format:
{
    "type": "operation",
    "entityType": "type",
    "conditions": { "field": "value" },
    "properties": { "field": "value" }
}`;
        
        try {
            const response = await this._callAIModel(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.warn('AI parsing failed, using simple parsing:', error);
            return this._parseSearchQuery(query, options);
        }
    }
    
    /**
     * Parse properties string
     * @private
     */
    _parseProperties(str) {
        const properties = {};
        
        // Parse "name:John, age:25" format
        const pairs = str.split(/\s*,\s*/);
        
        for (const pair of pairs) {
            const [field, value] = pair.split(/\s*:\s*/);
            if (field && value) {
                const normalizedField = this._normalizeFieldName(field);
                
                // Parse value types
                if (!isNaN(value)) {
                    properties[normalizedField] = Number(value);
                } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                    properties[normalizedField] = value.toLowerCase() === 'true';
                } else {
                    properties[normalizedField] = value.replace(/^["'`]|["'`]$/g, '');
                }
            }
        }
        
        return properties;
    }
    
    /**
     * Parse conditions string
     * @private
     */
    _parseConditions(str) {
        const conditions = {};
        
        // Parse simple conditions: "age > 25"
        const conditionPattern = /(\w+)\s*([><=!]+)\s*(.+)/g;
        let match;
        
        while ((match = conditionPattern.exec(str)) !== null) {
            const field = this._normalizeFieldName(match[1]);
            const operator = match[2];
            const value = match[3];
            
            let parsedValue;
            if (!isNaN(value)) {
                parsedValue = Number(value);
            } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                parsedValue = value.toLowerCase() === 'true';
            } else {
                parsedValue = value.replace(/^["'`]|["'`]$/g, '');
            }
            
            // Convert operators to database format
            switch (operator) {
                case '>':
                    conditions[field] = { $gt: parsedValue };
                    break;
                case '<':
                    conditions[field] = { $lt: parsedValue };
                    break;
                case '>=':
                    conditions[field] = { $gte: parsedValue };
                    break;
                case '<=':
                    conditions[field] = { $lte: parsedValue };
                    break;
                case '!=':
                    conditions[field] = { $ne: parsedValue };
                    break;
                case '=':
                default:
                    conditions[field] = parsedValue;
                    break;
            }
        }
        
        return conditions;
    }
    
    /**
     * Normalize field name
     * @private
     */
    _normalizeFieldName(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        
        // Check field mappings
        for (const [canonical, aliases] of Object.entries(this.fieldMappings)) {
            if (aliases.includes(lowerFieldName)) {
                return canonical;
            }
        }
        
        return lowerFieldName;
    }
    
    /**
     * Check if word is a keyword
     * @private
     */
    _isKeyword(word) {
        const keywords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'that', 'this',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
            'find', 'search', 'look', 'show', 'get', 'create', 'add', 'insert',
            'update', 'change', 'modify', 'edit', 'delete', 'remove', 'erase',
            'count', 'how', 'many', 'where', 'when', 'what', 'who', 'why'
        ];
        
        return keywords.includes(word.toLowerCase());
    }
    
    /**
     * Execute search query
     * @private
     */
    async _executeSearch(parsedQuery, options = {}) {
        return await this.db.map(parsedQuery.conditions, options);
    }
    
    /**
     * Execute create query
     * @private
     */
    async _executeCreate(parsedQuery, options = {}) {
        const id = `${parsedQuery.entityType}_${Date.now()}_${Math.random()}`;
        return await this.db.put(id, parsedQuery.properties, options);
    }
    
    /**
     * Execute update query
     * @private
     */
    async _executeUpdate(parsedQuery, options = {}) {
        // Find matching entities
        const matches = await this.db.map(parsedQuery.conditions);
        
        const results = [];
        for (const match of matches) {
            const updated = { ...match.data, ...parsedQuery.properties };
            await this.db.put(match.id, updated, options);
            results.push({ id: match.id, ...updated });
        }
        
        return results;
    }
    
    /**
     * Execute delete query
     * @private
     */
    async _executeDelete(parsedQuery, options = {}) {
        const matches = await this.db.map(parsedQuery.conditions);
        const results = [];
        
        for (const match of matches) {
            const removed = await this.db.remove(match.id);
            if (removed) {
                results.push(match);
            }
        }
        
        return results;
    }
    
    /**
     * Execute count query
     * @private
     */
    async _executeCount(parsedQuery, options = {}) {
        const matches = await this.db.map(parsedQuery.conditions);
        return {
            count: matches.length,
            entityType: parsedQuery.entityType
        };
    }
    
    /**
     * Generate query explanation
     * @private
     */
    _generateExplanation(originalQuery, parsedQuery) {
        const operation = parsedQuery.type;
        const entityType = parsedQuery.entityType || 'items';
        
        let explanation = `I interpreted "${originalQuery}" as a ${operation} query`;
        
        if (operation === 'search') {
            const conditions = Object.keys(parsedQuery.conditions);
            if (conditions.length > 0) {
                explanation += ` looking for ${entityType} that match these criteria: ${conditions.join(', ')}`;
            } else {
                explanation += ` searching all ${entityType}`;
            }
            
            if (parsedQuery.searchTerms && parsedQuery.searchTerms.length > 0) {
                explanation += ` containing the terms: ${parsedQuery.searchTerms.join(', ')}`;
            }
        } else if (operation === 'create') {
            explanation += ` to create a new ${entityType} with these properties: ${Object.keys(parsedQuery.properties).join(', ')}`;
        } else if (operation === 'update') {
            explanation += ` to modify existing ${entityType} matching these conditions: ${Object.keys(parsedQuery.conditions).join(', ')}`;
        } else if (operation === 'delete') {
            explanation += ` to remove ${entityType} matching these conditions: ${Object.keys(parsedQuery.conditions).join(', ')}`;
        } else if (operation === 'count') {
            explanation += ` to count ${entityType} matching these conditions: ${Object.keys(parsedQuery.conditions).join(', ')}`;
        }
        
        return explanation;
    }
    
    /**
     * Call AI model for query processing
     * @private
     */
    async _callAIModel(prompt) {
        // This is a placeholder for AI model integration
        // In production, you would integrate with OpenAI, Claude, etc.
        
        if (this.config.modelProvider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        }
        
        throw new Error(`Unsupported AI model provider: ${this.config.modelProvider}`);
    }
}
