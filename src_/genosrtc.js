// GenosRTC - P2P WebRTC Communication Module
// Handles peer-to-peer connections using WebRTC and Nostr signaling

/**
 * GenosRTC class - P2P communication
 */
export default class GenosRTC {
    constructor(options = {}) {
        this.config = {
            appId: options.appId || 'genosdb-default',
            roomId: options.roomId || 'default',
            password: options.password || '',
            relayUrls: options.relayUrls || this._getDefaultRelays(),
            signalTimeout: options.signalTimeout || 10000,
            iceServers: this._getICEServers(options.turnConfig),
            ...options
        };
        
        this.peers = new Map();
        this.channels = new Map();
        this.subscriptions = new Map();
        this.selfId = this._generateId();
        
        // Initialize networking
        this._initNetworking();
        
        // Initialize Nostr signaling
        this._initNostrSignaling();
        
        // Initialize data channels
        this._initDataChannels();
    }
    
    /**
     * Join a room for P2P communication
     * @param {Object} config - Room configuration
     * @returns {Promise<void>}
     */
    async join(config = {}) {
        const roomConfig = {
            appId: this.config.appId,
            roomId: config.roomId || this.config.roomId,
            password: config.password || this.config.password,
            ...config
        };
        
        try {
            // Subscribe to Nostr events
            await this._subscribeToRoom(roomConfig);
            
            // Start announcing self
            await this._startAnnouncing(roomConfig);
            
            console.log(`GenosRTC: Joined room ${roomConfig.roomId}`);
            
        } catch (error) {
            console.error('GenosRTC: Failed to join room:', error);
            throw error;
        }
    }
    
    /**
     * Leave the current room
     */
    async leave() {
        // Send leave messages to all peers
        for (const [peerId, peer] of this.peers) {
            await this._sendLeaveMessage(peerId);
            peer.destroy();
        }
        
        this.peers.clear();
        this.channels.clear();
        
        // Unsubscribe from Nostr
        await this._unsubscribeFromRoom();
        
        console.log('GenosRTC: Left room');
    }
    
    /**
     * Send data to a specific peer
     * @param {string} peerId - Target peer ID
     * @param {any} data - Data to send
     * @param {Object} options - Send options
     */
    async send(peerId, data, options = {}) {
        const channel = this.channels.get(peerId);
        
        if (!channel || channel.readyState !== 'open') {
            throw new Error(`No open channel to peer ${peerId}`);
        }
        
        const message = {
            type: 'data',
            data,
            id: this._generateMessageId(),
            timestamp: Date.now(),
            ...options
        };
        
        return this._sendData(channel, message);
    }
    
    /**
     * Broadcast data to all connected peers
     * @param {any} data - Data to broadcast
     * @param {Object} options - Broadcast options
     */
    async broadcast(data, options = {}) {
        const promises = [];
        
        for (const [peerId, channel] of this.channels) {
            if (channel.readyState === 'open') {
                promises.push(this.send(peerId, data, options));
            }
        }
        
        return Promise.allSettled(promises);
    }
    
    /**
     * Create and send a data channel
     * @param {string} peerId - Target peer ID
     * @param {string} name - Channel name
     * @param {Object} config - Channel configuration
     */
    async createDataChannel(peerId, name, config = {}) {
        const peer = this.peers.get(peerId);
        if (!peer) {
            throw new Error(`Peer ${peerId} not found`);
        }
        
        const channel = peer.createDataChannel(name, {
            ordered: true,
            negotiated: true,
            id: this._generateChannelId(),
            ...config
        });
        
        return this._setupChannel(channel, peerId, name);
    }
    
    /**
     * Add media stream to peer connection
     * @param {MediaStream} stream - Media stream to add
     * @param {string} peerId - Target peer ID (optional, for specific peer)
     */
    async addStream(stream, peerId = null) {
        if (peerId) {
            const peer = this.peers.get(peerId);
            if (!peer) {
                throw new Error(`Peer ${peerId} not found`);
            }
            
            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream);
            });
            
            // Notify peer about stream
            await this._sendStreamMessage(peerId, { type: 'add', streamId: stream.id });
        } else {
            // Add to all peers
            for (const [id, peer] of this.peers) {
                stream.getTracks().forEach(track => {
                    peer.addTrack(track, stream);
                });
                
                await this._sendStreamMessage(id, { type: 'add', streamId: stream.id });
            }
        }
    }
    
    /**
     * Remove media stream from peer connection
     * @param {MediaStream} stream - Media stream to remove
     * @param {string} peerId - Target peer ID (optional, for specific peer)
     */
    async removeStream(stream, peerId = null) {
        if (peerId) {
            const peer = this.peers.get(peerId);
            if (!peer) {
                throw new Error(`Peer ${peerId} not found`);
            }
            
            const senders = peer.getSenders();
            senders.forEach(sender => {
                if (sender.track && stream.getTracks().includes(sender.track)) {
                    peer.removeTrack(sender);
                }
            });
            
            await this._sendStreamMessage(peerId, { type: 'remove', streamId: stream.id });
        } else {
            // Remove from all peers
            for (const [id, peer] of this.peers) {
                const senders = peer.getSenders();
                senders.forEach(sender => {
                    if (sender.track && stream.getTracks().includes(sender.track)) {
                        peer.removeTrack(sender);
                    }
                });
                
                await this._sendStreamMessage(id, { type: 'remove', streamId: stream.id });
            }
        }
    }
    
    /**
     * Get connection statistics
     * @param {string} peerId - Peer ID (optional)
     */
    async getStats(peerId = null) {
        if (peerId) {
            const peer = this.peers.get(peerId);
            if (!peer) {
                throw new Error(`Peer ${peerId} not found`);
            }
            
            return peer.getStats();
        }
        
        // Get stats for all peers
        const stats = {};
        for (const [id, peer] of this.peers) {
            try {
                stats[id] = await peer.getStats();
            } catch (error) {
                stats[id] = { error: error.message };
            }
        }
        
        return stats;
    }
    
    /**
     * Ping a peer to measure latency
     * @param {string} peerId - Target peer ID
     */
    async ping(peerId) {
        const channel = this.channels.get(peerId);
        if (!channel || channel.readyState !== 'open') {
            throw new Error(`No open channel to peer ${peerId}`);
        }
        
        const startTime = Date.now();
        
        // Send ping message
        await this.send(peerId, { type: 'ping', timestamp: startTime });
        
        // Wait for pong response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);
            
            const onPong = (data) => {
                if (data.type === 'pong' && data.timestamp === startTime) {
                    clearTimeout(timeout);
                    this.off('data', onPong);
                    resolve(Date.now() - startTime);
                }
            };
            
            this.on('data', onPong);
        });
    }
    
    /**
     * Event listener for data messages
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.subscriptions.has(event)) {
            this.subscriptions.set(event, new Set());
        }
        
        this.subscriptions.get(event).add(handler);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        const handlers = this.subscriptions.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    /**
     * Emit event to handlers
     * @private
     */
    _emit(event, data) {
        const handlers = this.subscriptions.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        }
    }
    
    /**
     * Initialize networking components
     * @private
     */
    _initNetworking() {
        // Setup message handlers
        this._setupMessageHandlers();
        
        // Setup cleanup on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.leave();
            });
            
            // Handle network changes
            window.addEventListener('online', () => {
                console.log('GenosRTC: Network restored, reconnecting...');
                this._reconnectAll();
            });
            
            window.addEventListener('offline', () => {
                console.log('GenosRTC: Network lost');
            });
        }
    }
    
    /**
     * Setup message handlers for different message types
     * @private
     */
    _setupMessageHandlers() {
        this.messageHandlers = {
            'data': this._handleDataMessage.bind(this),
            'ping': this._handlePingMessage.bind(this),
            'pong': this._handlePongMessage.bind(this),
            'signal': this._handleSignalMessage.bind(this),
            'stream': this._handleStreamMessage.bind(this),
            'track': this._handleTrackMessage.bind(this),
            'leave': this._handleLeaveMessage.bind(this)
        };
    }
    
    /**
     * Initialize Nostr signaling
     * @private
     */
    async _initNostrSignaling() {
        try {
            // Initialize Nostr relays
            this.relays = await this._connectToRelays();
            
            // Generate key pair for signing
            this.keyPair = await this._generateKeyPair();
            
            console.log('GenosRTC: Nostr signaling initialized');
            
        } catch (error) {
            console.error('GenosRTC: Failed to initialize Nostr signaling:', error);
            throw error;
        }
    }
    
    /**
     * Connect to Nostr relays
     * @private
     */
    async _connectToRelays() {
        const relays = new Map();
        
        for (const relayUrl of this.config.relayUrls) {
            try {
                const relay = await this._connectToRelay(relayUrl);
                relays.set(relayUrl, relay);
            } catch (error) {
                console.warn(`Failed to connect to relay ${relayUrl}:`, error);
            }
        }
        
        if (relays.size === 0) {
            throw new Error('Failed to connect to any Nostr relays');
        }
        
        return relays;
    }
    
    /**
     * Connect to a single Nostr relay
     * @private
     */
    async _connectToRelay(relayUrl) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(relayUrl);
            const relay = { socket: ws, url: relayUrl };
            
            ws.onopen = () => {
                console.log(`GenosRTC: Connected to relay ${relayUrl}`);
                resolve(relay);
            };
            
            ws.onclose = () => {
                console.log(`GenosRTC: Disconnected from relay ${relayUrl}`);
                // Attempt to reconnect after delay
                setTimeout(() => {
                    this._connectToRelay(relayUrl);
                }, 5000);
            };
            
            ws.onmessage = (event) => {
                this._handleNostrMessage(JSON.parse(event.data), relayUrl);
            };
            
            ws.onerror = (error) => {
                console.error(`GenosRTC: Relay error ${relayUrl}:`, error);
                reject(error);
            };
            
            // Connection timeout
            setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                    reject(new Error(`Connection timeout to relay ${relayUrl}`));
                }
            }, 10000);
        });
    }
    
    /**
     * Handle incoming Nostr messages
     * @private
     */
    _handleNostrMessage(message, relayUrl) {
        const [type, ...params] = message;
        
        switch (type) {
            case 'EVENT':
                this._handleNostrEvent(params[0]);
                break;
            case 'NOTICE':
            case 'OK':
                console.log(`GenosRTC: Nostr message from ${relayUrl}:`, message);
                break;
        }
    }
    
    /**
     * Handle Nostr event
     * @private
     */
    _handleNostrEvent(event) {
        if (event.kind === 5000) { // GenosRTC signaling kind
            try {
                const data = JSON.parse(event.content);
                this._handleSignalingEvent(data);
            } catch (error) {
                console.error('GenosRTC: Invalid signaling event:', error);
            }
        }
    }
    
    /**
     * Handle signaling event from peer
     * @private
     */
    async _handleSignalingEvent(event) {
        const { peerId, type, data } = event;
        
        if (peerId === this.selfId) return; // Ignore self messages
        
        switch (type) {
            case 'offer':
                await this._handleOffer(peerId, data);
                break;
            case 'answer':
                await this._handleAnswer(peerId, data);
                break;
            case 'ice-candidate':
                await this._handleICECandidate(peerId, data);
                break;
            case 'announce':
                await this._handlePeerAnnounce(peerId, data);
                break;
            case 'leave':
                await this._handlePeerLeave(peerId);
                break;
        }
    }
    
    /**
     * Initialize data channels
     * @private
     */
    _initDataChannels() {
        // Default data channel
        this.dataChannelManager = {
            createChannel: this._createDataChannel.bind(this),
            destroyChannel: this._destroyDataChannel.bind(this),
            send: this._sendDataChannel.bind(this)
        };
    }
    
    /**
     * Create WebRTC peer connection
     * @private
     */
    _createPeerConnection(isInitiator = false) {
        const pc = new RTCPeerConnection({
            iceServers: this.config.iceServers
        });
        
        // Setup connection state handlers
        pc.onconnectionstatechange = () => {
            console.log('GenosRTC: Connection state:', pc.connectionState);
            
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                // Clean up connection
                this._cleanupConnection(pc);
            }
        };
        
        // Setup ICE candidate handler
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this._sendICECandidate(pc, event.candidate);
            }
        };
        
        // Setup data channel handler for non-initiators
        if (!isInitiator) {
            pc.ondatachannel = (event) => {
                const channel = event.channel;
                this._setupChannel(channel, null, channel.label);
            };
        }
        
        return pc;
    }
    
    /**
     * Setup WebRTC data channel
     * @private
     */
    _setupChannel(channel, peerId, name) {
        channel.binaryType = 'arraybuffer';
        channel.bufferedAmountLowThreshold = 65535;
        
        // Setup message handlers
        channel.onopen = () => {
            console.log(`GenosRTC: Data channel ${name} opened`);
            this._emit('channel:open', { peerId, name, channel });
        };
        
        channel.onmessage = (event) => {
            try {
                const data = this._deserializeMessage(event.data);
                this._handleDataMessage(data, peerId);
            } catch (error) {
                console.error('GenosRTC: Failed to handle message:', error);
            }
        };
        
        channel.onclose = () => {
            console.log(`GenosRTC: Data channel ${name} closed`);
            this._emit('channel:close', { peerId, name, channel });
        };
        
        channel.onerror = (error) => {
            console.error(`GenosRTC: Data channel ${name} error:`, error);
            this._emit('channel:error', { peerId, name, channel, error });
        };
        
        // Store channel
        if (peerId) {
            this.channels.set(peerId, channel);
        }
        
        return channel;
    }
    
    /**
     * Handle data channel message
     * @private
     */
    _handleDataMessage(data, peerId) {
        // Check for message handlers
        const handler = this.messageHandlers[data.type];
        if (handler) {
            handler(data, peerId);
        } else {
            // Emit generic data event
            this._emit('data', { data, peerId });
        }
    }
    
    /**
     * Handle ping message
     * @private
     */
    _handlePingMessage(data, peerId) {
        // Send pong response
        this.send(peerId, { type: 'pong', timestamp: data.timestamp });
    }
    
    /**
     * Handle pong message
     * @private
     */
    _handlePongMessage(data) {
        this._emit('pong', data);
    }
    
    /**
     * Handle signal message
     * @private
     */
    async _handleSignalMessage(data, peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        try {
            await peer.signal(data);
        } catch (error) {
            console.error('GenosRTC: Failed to handle signal:', error);
        }
    }
    
    /**
     * Handle leave message
     * @private
     */
    _handleLeaveMessage(data, peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.destroy();
            this.peers.delete(peerId);
            this.channels.delete(peerId);
        }
        
        this._emit('peer:leave', { peerId });
    }
    
    /**
     * Helper methods
     * @private
     */
    _generateId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map(b => b.toString(36).padStart(2, '0'))
            .join('');
    }
    
    _generateMessageId() {
        return `${Date.now()}_${Math.random()}`;
    }
    
    _generateChannelId() {
        return Math.floor(Math.random() * 65535);
    }
    
    _getDefaultRelays() {
        return [
            'wss://relay.damus.io',
            'wss://relay.nostr.band',
            'wss://nostr.wine',
            'wss://nos.lol',
            'wss://relay.snort.social'
        ];
    }
    
    _getICEServers(turnConfig) {
        const servers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' }
        ];
        
        if (turnConfig) {
            servers.push(...turnConfig);
        }
        
        return servers;
    }
    
    /**
     * Serialize message for transmission
     * @private
     */
    _serializeMessage(data) {
        const serialized = JSON.stringify(data);
        return new TextEncoder().encode(serialized);
    }
    
    /**
     * Deserialize received message
     * @private
     */
    _deserializeMessage(data) {
        const text = new TextDecoder().decode(data);
        return JSON.parse(text);
    }
    
    /**
     * Send data through channel with chunking for large messages
     * @private
     */
    async _sendData(channel, message) {
        const serialized = this._serializeMessage(message);
        const chunkSize = 16384; // 16KB chunks
        const chunks = [];
        
        // Split into chunks if needed
        for (let i = 0; i < serialized.length; i += chunkSize) {
            chunks.push(serialized.slice(i, i + chunkSize));
        }
        
        // Send chunks
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const isLast = i === chunks.length - 1;
            const isFirst = i === 0;
            
            // Wait for buffer to clear if needed
            while (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
                await new Promise(resolve => {
                    const handler = () => {
                        channel.removeEventListener('bufferedamountlow', handler);
                        resolve();
                    };
                    channel.addEventListener('bufferedamountlow', handler);
                    
                    // Timeout fallback
                    setTimeout(() => {
                        channel.removeEventListener('bufferedamountlow', handler);
                        resolve();
                    }, 100);
                });
            }
            
            channel.send(chunk);
        }
    }
    
    /**
     * Clean up connection
     * @private
     */
    _cleanupConnection(pc) {
        for (const [peerId, peer] of this.peers) {
            if (peer === pc) {
                this.peers.delete(peerId);
                this.channels.delete(peerId);
                this._emit('peer:leave', { peerId });
                break;
            }
        }
    }
    
    /**
     * Reconnect all peers
     * @private
     */
    async _reconnectAll() {
        // Implementation for reconnection logic
        console.log('GenosRTC: Attempting to reconnect all peers...');
    }
}
