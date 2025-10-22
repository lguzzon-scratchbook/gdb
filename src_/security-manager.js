// Security Manager (SM) - Role-Based Access Control with WebAuthn
// Implements authentication, authorization, and cryptographic operations

import * as ethers from 'ethers';

/**
 * Security Manager class
 * Handles RBAC, WebAuthn authentication, and cryptographic signing
 */
export default class SecurityManager {
    constructor(database, options = {}) {
        this.db = database;
        this.config = {
            roleHierarchy: ['guest', 'user', 'manager', 'admin', 'superadmin'],
            defaultRole: 'guest',
            sessionTimeout: options.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
            ...options
        };
        
        // Internal state
        this.currentUser = null;
        this.sessions = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        
        // Initialize security
        this._initSecurity();
    }
    
    /**
     * Register a new user with WebAuthn
     * @param {string} username - Username
     * @param {Object} options - Registration options
     * @returns {Promise<Object>} Registration result
     */
    async register(username, options = {}) {
        try {
            const userId = this._generateUserId();
            const challenge = this._generateChallenge();
            
            // Create WebAuthn credential
            const credential = await this._createWebAuthnCredential(userId, username, challenge);
            
            // Create user record
            const user = {
                id: userId,
                username,
                credentialId: credential.id,
                publicKey: credential.publicKey,
                role: options.role || this.config.defaultRole,
                createdAt: new Date().toISOString(),
                permissions: await this._getDefaultPermissions(options.role || this.config.defaultRole)
            };
            
            // Store user in database
            await this.db.put(`user:${userId}`, user);
            
            // Initialize role
            await this._initUserRole(userId, user.role);
            
            return {
                success: true,
                userId,
                username,
                role: user.role
            };
            
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(`Registration failed: ${error.message}`);
        }
    }
    
    /**
     * Authenticate user with WebAuthn
     * @param {string} username - Username
     * @param {Object} options - Authentication options
     * @returns {Promise<Object>} Authentication result
     */
    async authenticate(username, options = {}) {
        try {
            // Find user
            const user = await this._findUserByUsername(username);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Generate challenge
            const challenge = this._generateChallenge();
            
            // Get WebAuthn assertion
            const assertion = await this._getWebAuthnAssertion(user.credentialId, challenge, username);
            
            // Verify assertion
            const isValid = await this._verifyWebAuthnAssertion(user.publicKey, assertion.rawSignature, assertion.authenticatorData, assertion.clientDataJSON, challenge);
            
            if (!isValid) {
                throw new Error('Authentication failed');
            }
            
            // Create session
            const sessionId = this._generateSessionId();
            const session = {
                sessionId,
                userId: user.id,
                username: user.username,
                role: user.role,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.config.sessionTimeout
            };
            
            this.sessions.set(sessionId, session);
            this.currentUser = session;
            
            return {
                success: true,
                sessionId,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            };
            
        } catch (error) {
            console.error('Authentication failed:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }
    
    /**
     * Check if current user has permission
     * @param {string} permission - Permission to check
     * @returns {boolean} Whether user has permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userPermissions = this.permissions.get(this.currentUser.userId) || [];
        return userPermissions.includes(permission);
    }
    
    /**
     * Check if current user has role or higher
     * @param {string} role - Role to check
     * @returns {boolean} Whether user has role or higher
     */
    hasRole(role) {
        if (!this.currentUser) return false;
        
        const userRole = this.currentUser.role;
        const userRoleIndex = this.config.roleHierarchy.indexOf(userRole);
        const requiredRoleIndex = this.config.roleHierarchy.indexOf(role);
        
        return userRoleIndex >= requiredRoleIndex;
    }
    
    /**
     * Assign role to user
     * @param {string} userId - User ID
     * @param {string} role - Role to assign
     * @param {string} assignedBy - Who is assigning the role
     * @returns {Promise<boolean>} Success status
     */
    async assignRole(userId, role, assignedBy) {
        // Check if assigner has permission
        if (!this.hasPermission('role.assign')) {
            throw new Error('Insufficient permissions to assign role');
        }
        
        // Validate role
        if (!this.config.roleHierarchy.includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        
        try {
            // Update user role
            const user = await this.db.get(`user:${userId}`);
            if (!user) {
                throw new Error('User not found');
            }
            
            const oldRole = user.role;
            user.role = role;
            user.roleAssignedAt = new Date().toISOString();
            user.assignedBy = assignedBy;
            
            await this.db.put(`user:${userId}`, user);
            
            // Update role dependencies
            await this._initUserRole(userId, role);
            
            // Log role assignment
            await this._logSecurityEvent('role.assigned', {
                userId,
                oldRole,
                newRole: role,
                assignedBy
            });
            
            return true;
            
        } catch (error) {
            console.error('Role assignment failed:', error);
            throw new Error(`Role assignment failed: ${error.message}`);
        }
    }
    
    /**
     * Sign data with user's private key
     * @param {any} data - Data to sign
     * @param {Object} options - Signing options
     * @returns {Promise<string>} Digital signature
     */
    async sign(data, options = {}) {
        if (!this.currentUser) {
            throw new Error('Not authenticated');
        }
        
        try {
            // Prepare message for signing
            const message = this._prepareMessageForSigning(data);
            
            // Get user's WebAuthn credential
            const user = await this.db.get(`user:${this.currentUser.userId}`);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Create assertion for signing
            const challenge = this._generateChallenge();
            const assertion = await this._getWebAuthnAssertion(user.credentialId, challenge, user.username);
            
            // Verify the assertion
            const isValid = await this._verifyWebAuthnAssertion(user.publicKey, assertion.rawSignature, assertion.authenticatorData, assertion.clientDataJSON, challenge);
            
            if (!isValid) {
                throw new Error('Signature verification failed');
            }
            
            // Return signature data
            return {
                signature: assertion.rawSignature,
                authenticatorData: assertion.authenticatorData,
                clientDataJSON: assertion.clientDataJSON,
                userId: this.currentUser.userId,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error(`Signing failed: ${error.message}`);
        }
    }
    
    /**
     * Verify signature
     * @param {any} data - Original data
     * @param {Object} signature - Signature to verify
     * @param {string} publicKey - Public key for verification
     * @returns {Promise<boolean>} Verification result
     */
    async verify(data, signature, publicKey) {
        try {
            const message = this._prepareMessageForSigning(data);
            return await this._verifyWebAuthnSignature(
                publicKey,
                signature.signature,
                signature.authenticatorData,
                signature.clientDataJSON,
                message
            );
        } catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }
    
    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    async logout() {
        if (!this.currentUser) return;
        
        const sessionId = this.currentUser.sessionId;
        this.sessions.delete(sessionId);
        this.currentUser = null;
        
        // Clear any local storage
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('genosdb-session');
        }
    }
    
    /**
     * Get current user
     * @returns {Object|null} Current user session
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Validate operation permission
     * @param {string} operation - Operation to validate
     * @param {Object} context - Operation context
     * @returns {Promise<boolean>} Whether operation is allowed
     */
    async validateOperation(operation, context = {}) {
        if (!this.currentUser) {
            return operation === 'read' && context.public === true;
        }
        
        // Check role-based permissions
        const requiredPermission = this._getPermissionForOperation(operation);
        return this.hasPermission(requiredPermission);
    }
    
    /**
     * Get all users (admin only)
     * @returns {Promise<Array>} List of users
     */
    async getAllUsers() {
        if (!this.hasPermission('user.read')) {
            throw new Error('Insufficient permissions');
        }
        
        const users = [];
        const results = await this.db.map({
            type: 'user'
        });
        
        for (const user of results) {
            // Don't include sensitive information
            users.push({
                id: user.id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt
            });
        }
        
        return users;
    }
    
    /**
     * Initialize security system
     * @private
     */
    _initSecurity() {
        // Initialize default roles and permissions
        this._initDefaultRoles();
        this._initDefaultPermissions();
        
        // Check for existing session
        this._restoreExistingSession();
    }
    
    /**
     * Initialize default roles
     * @private
     */
    _initDefaultRoles() {
        const defaultRoles = {
            guest: ['read.public'],
            user: ['read.own', 'write.own'],
            manager: ['read.team', 'write.team', 'role.assign:user'],
            admin: ['read.all', 'write.all', 'role.assign:manager', 'user.manage'],
            superadmin: ['system.admin', 'role.assign:admin', 'security.manage']
        };
        
        for (const [role, permissions] of Object.entries(defaultRoles)) {
            this.roles.set(role, permissions);
        }
    }
    
    /**
     * Initialize default permissions
     * @private
     */
    _initDefaultPermissions() {
        const allPermissions = new Set();
        
        for (const permissions of this.roles.values()) {
            for (const permission of permissions) {
                allPermissions.add(permission);
            }
        }
        
        // Store all permissions for validation
        this.allPermissions = Array.from(allPermissions);
    }
    
    /**
     * Initialize user role and permissions
     * @private
     */
    async _initUserRole(userId, role) {
        const rolePermissions = this.roles.get(role) || [];
        this.permissions.set(userId, rolePermissions);
    }
    
    /**
     * Get default permissions for role
     * @private
     */
    async _getDefaultPermissions(role) {
        return this.roles.get(role) || [];
    }
    
    /**
     * Generate user ID
     * @private
     */
    _generateUserId() {
        return 'user_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Generate session ID
     * @private
     */
    _generateSessionId() {
        return 'session_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Generate challenge for WebAuthn
     * @private
     */
    _generateChallenge() {
        return crypto.getRandomValues(new Uint8Array(32));
    }
    
    /**
     * Create WebAuthn credential
     * @private
     */
    async _createWebAuthnCredential(userId, username, challenge) {
        const credentialRequestOptions = {
            publicKey: {
                challenge: challenge,
                rp: {
                    name: 'GenosDB',
                    id: window.location.hostname
                },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: username,
                    displayName: username
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' }, // ES256
                    { alg: -257, type: 'public-key' } // RS256
                ],
                authenticatorSelection: {
                    userVerification: 'required',
                    residentKey: 'preferred'
                },
                timeout: 60000
            }
        };
        
        const credential = await navigator.credentials.create(credentialRequestOptions);
        
        return {
            id: credential.id,
            publicKey: credential.response.publicKey,
            publicKeyAlgorithm: credential.response.publicKeyAlgorithm
        };
    }
    
    /**
     * Get WebAuthn assertion
     * @private
     */
    async _getWebAuthnAssertion(credentialId, challenge, username) {
        const allowCredentials = [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal', 'usb', 'ble', 'nfc']
        }];
        
        const assertionRequestOptions = {
            publicKey: {
                challenge: challenge,
                allowCredentials: allowCredentials,
                userVerification: 'required',
                timeout: 60000
            }
        };
        
        const assertion = await navigator.credentials.get(assertionRequestOptions);
        
        return {
            rawSignature: assertion.response.signature,
            authenticatorData: assertion.response.authenticatorData,
            clientDataJSON: assertion.response.clientDataJSON,
            userHandle: assertion.response.userHandle
        };
    }
    
    /**
     * Verify WebAuthn assertion
     * @private
     */
    async _verifyWebAuthnAssertion(publicKey, signature, authenticatorData, clientDataJSON, expectedChallenge) {
        try {
            // This is a simplified verification
            // In production, you'd use a proper WebAuthn library
            
            // Parse client data
            const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
            
            // Verify challenge
            const clientChallenge = base64url.decode(clientData.challenge);
            if (!this._arraysEqual(clientChallenge, expectedChallenge)) {
                return false;
            }
            
            // Verify origin
            const expectedOrigin = window.location.origin;
            if (clientData.origin !== expectedOrigin) {
                return false;
            }
            
            // Verify type
            if (clientData.type !== 'webauthn.get') {
                return false;
            }
            
            // Verify signature using ethers
            const hash = ethers.keccak256.concat([authenticatorData, clientDataJSON]);
            const recoveredAddress = ethers.verifyMessage(hash, signature);
            
            return recoveredAddress !== null;
            
        } catch (error) {
            console.error('WebAuthn verification error:', error);
            return false;
        }
    }
    
    /**
     * Verify WebAuthn signature for data
     * @private
     */
    async _verifyWebAuthnSignature(publicKey, signature, authenticatorData, clientDataJSON, data) {
        // Similar to _verifyWebAuthnAssertion but with custom data
        try {
            const messageHash = ethers.keccak256(data);
            const isValidSignature = ethers.verifyMessage(messageHash, signature);
            
            return isValidSignature !== null;
            
        } catch (error) {
            console.error('WebAuthn signature verification error:', error);
            return false;
        }
    }
    
    /**
     * Find user by username
     * @private
     */
    async _findUserByUsername(username) {
        const results = await this.db.map({
            type: 'user',
            username: username
        });
        
        return results.length > 0 ? results[0] : null;
    }
    
    /**
     * Prepare message for signing
     * @private
     */
    _prepareMessageForSigning(data) {
        const message = JSON.stringify(data);
        return new TextEncoder().encode(message);
    }
    
    /**
     * Get permission required for operation
     * @private
     */
    _getPermissionForOperation(operation) {
        const operationPermissions = {
            'read': 'read.own',
            'write': 'write.own',
            'delete': 'write.own',
            'admin': 'system.admin'
        };
        
        return operationPermissions[operation] || 'read.own';
    }
    
    /**
     * Log security event
     * @private
     */
    async _logSecurityEvent(event, data) {
        const logEntry = {
            type: 'security-event',
            event,
            data,
            userId: this.currentUser?.userId,
            timestamp: new Date().toISOString()
        };
        
        await this.db.put(`security:${Date.now()}`, logEntry);
    }
    
    /**
     * Restore existing session
     * @private
     */
    _restoreExistingSession() {
        if (typeof window !== 'undefined' && window.localStorage) {
            const sessionData = window.localStorage.getItem('genosdb-session');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    
                    // Check if session is still valid
                    if (session.expiresAt > Date.now()) {
                        this.sessions.set(session.sessionId, session);
                        this.currentUser = session;
                    } else {
                        // Remove expired session
                        window.localStorage.removeItem('genosdb-session');
                    }
                } catch (error) {
                    console.warn('Invalid session data:', error);
                    window.localStorage.removeItem('genosdb-session');
                }
            }
        }
    }
    
    /**
     * Save session to local storage
     * @private
     */
    _saveSession(session) {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('genosdb-session', JSON.stringify(session));
        }
    }
    
    /**
     * Compare arrays
     * @private
     */
    _arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

// Base64 URL encoding utilities
const base64url = {
    encode: (arrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer);
        let string = '';
        for (const b of bytes) {
            string += String.fromCharCode(b);
        }
        return btoa(string).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    
    decode: (base64urlString) => {
        const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
};
