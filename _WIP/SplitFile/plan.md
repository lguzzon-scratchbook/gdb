# GenosRTC Modularization Plan

## Overview
This document outlines the systematic refactoring of the monolithic `genosrtc.min.js` file into separate, maintainable modules based on distinct functional groups.

## Current State Analysis
The original file contains approximately 2,850 lines of minified JavaScript code that implements:
- Cryptographic utilities (hashing, encoding, field operations)
- Elliptic curve mathematics (secp256k1)
- WebRTC peer connection management
- Real-time data channel communication
- Nostr protocol integration for signaling
- Network utilities and helpers

## Proposed Module Structure

### 1. Core Cryptography Module (`crypto/`)
**Purpose**: Fundamental cryptographic primitives and utilities
**Files**:
- `crypto/utils.js` - Basic encoding/decoding, validation, array utilities
- `crypto/hashing.js` - SHA-256 implementation, HMAC, hash utilities
- `crypto/field.js` - Finite field operations, modular arithmetic
- `crypto/curve.js` - Elliptic curve operations, point arithmetic

### 2. Cryptography Keys Module (`keys/`)
**Purpose**: Key generation, management, and cryptographic signatures
**Files**:
- `keys/secp256k1.js` - secp256k1 curve implementation
- `keys/signatures.js` - ECDSA signature operations
- `keys/keygen.js` - Key generation and validation utilities

### 3. WebRTC Core Module (`webrtc/`)
**Purpose**: WebRTC connection management and peer communication
**Files**:
- `webrtc/connection.js` - RTCPeerConnection wrapper and management
- `webrtc/datachannel.js` - Data channel operations and message handling
- `webrtc/ice.js` - ICE candidate handling and STUN/TURN configuration

### 4. Communication Module (`communication/`)
**Purpose**: Message routing, protocol handling, and data transport
**Files**:
- `communication/protocol.js` - Message protocol definition and parsing
- `communication/transport.js` - Data transport layer and chunking
- `communication/signaling.js` - Signaling protocol implementation

### 5. Network Module (`network/`)
**Purpose**: Network connectivity, WebSocket management, and Nostr integration
**Files**:
- `network/websocket.js` - WebSocket connection management
- `network/nostr.js` - Nostr protocol implementation for signaling
- `network/relay.js` - Relay management and redundancy

### 6. Utilities Module (`utils/`)
**Purpose**: General utilities, helpers, and constants
**Files**:
- `utils/constants.js` - Application constants and configuration
- `utils/helpers.js` - General helper functions
- `utils/validation.js` - Input validation and error handling

### 7. Main Entry Point (`index.js`)
**Purpose**: Public API and module orchestration
**Exports**: Clean, well-documented public interface

## Rationale

### Separation of Concerns
- **Cryptography**: Isolated cryptographic operations for security and auditability
- **WebRTC**: Separate WebRTC-specific logic for easier testing and maintenance
- **Communication**: Protocol-agnostic communication layer
- **Network**: Network-specific implementations with fallback strategies

### Maintainability Benefits
- **Single Responsibility**: Each module has a clear, focused purpose
- **Testability**: Smaller modules are easier to unit test
- **Reusability**: Modules can be reused in different contexts
- **Debugging**: Issues can be isolated to specific modules

### Performance Considerations
- **Tree Shaking**: Unused modules can be eliminated during bundling
- **Lazy Loading**: Modules can be loaded on-demand
- **Caching**: Smaller modules cache more effectively

## Dependencies
```
index.js
├── crypto/
│   ├── utils.js (no dependencies)
│   ├── hashing.js → utils.js
│   ├── field.js → utils.js
│   └── curve.js → field.js, utils.js
├── keys/
│   ├── secp256k1.js → crypto/curve.js, crypto/field.js
│   ├── signatures.js → keys/secp256k1.js
│   └── keygen.js → keys/secp256k1.js
├── webrtc/
│   ├── connection.js (no internal dependencies)
│   ├── datachannel.js → webrtc/connection.js
│   └── ice.js (no internal dependencies)
├── communication/
│   ├── protocol.js → utils/constants.js
│   ├── transport.js → communication/protocol.js
│   └── signaling.js → communication/protocol.js
├── network/
│   ├── websocket.js (no internal dependencies)
│   ├── nostr.js → keys/secp256k1.js, network/websocket.js
│   └── relay.js → network/websocket.js, network/nostr.js
└── utils/
    ├── constants.js (no dependencies)
    ├── helpers.js (no dependencies)
    └── validation.js (no dependencies)
```

## Implementation Strategy
1. **Bottom-up approach**: Start with dependency-free modules
2. **Incremental refactoring**: Extract and test one module at a time
3. **Backward compatibility**: Maintain the same public API
4. **Code quality**: Ensure all modules pass Biome linting and formatting

## Success Criteria
- All modules pass `bunx @biomejs/biome check --write --unsafe`
- Public API remains unchanged
- No functional regressions
- Improved code maintainability and testability
- Clear separation of concerns
