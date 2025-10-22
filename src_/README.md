# GenosDB Source Code

This directory contains the development source code for GenosDB, reconstructed from the minified distributions.

## Structure

```
src/
├── index.js              # Main entry point
├── gdb.js                # Core graph database engine  
├── genosrtc.js           # P2P WebRTC communication
├── security-manager.js   # RBAC and WebAuthn security
├── radix-index.js        # Prefix-based search index
├── geo-index.js          # Geospatial indexing
├── nlq-module.js         # Natural language querying
├── audit-module.js       # Content moderation
├── acl-module.js         # Access control lists
├── gov-module.js         # Role governance
├── ii-module.js          # Identity & Intelligence
├── ai-module.js          # AI capabilities
├── multirtc.js           # Multi-peer RTC
├── inverted-index.js      # Text search indexing
├── build.js              # Build script
├── package.json          # Development package config
└── README.md             # This file
```

## Architecture

### Core Components

**GDB Core** (`gdb.js`)
- Graph database with CRUD operations
- Recursive edge traversal with `$edge` operator
- OPFS persistence and cross-tab sync
- MessagePack serialization and Pako compression

**GenosRTC** (`genosrtc.js`) 
- WebRTC P2P communication
- Nostr signaling for peer discovery
- Data channels and media streaming
- Connection management and statistics

**Security Manager** (`security-manager.js`)
- RBAC with hierarchical roles
- WebAuthn biometric authentication  
- Cryptographic signing/verification
- Session management

### Supporting Modules

**Indexing**
- Radix tree for prefix search
- Geospatial indexing with $near/$bbox
- Inverted index for full-text search

**Intelligence**
- Natural language query processing
- AI-powered content auditing
- Analytics and predictions

**Multi-Peer**
- Multi-room RTC management
- Connection pooling
- Load balancing

## Development

### Installation

```bash
# Install dependencies
npm install

# Or use Bun
bun install
```

### Building

```bash
# Development build
npm run build

# Production build  
npm run build:production

# Bundle for browser
npm run bundle

# Individual modules
npm run bundle:modules
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Linting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Usage

```javascript
import { gdb } from './index.js';

// Initialize database
const db = await gdb({ rtc: true });

// Create nodes
await db.put('user:1', { name: 'Alice', age: 30 });

// Create relationships
await db.link('user:1', 'user:2', { type: 'friend' });

// Query with traversal
const results = await db.map({
  $edge: { type: 'friend' }
});

// Natural language query
const nlq = await db.query('find users named Alice');
```

## Module System

Each module can be imported separately:

```javascript
import GDB from './gdb.js';
import GenosRTC from './genosrtc.js';
import SecurityManager from './security-manager.js';
```

## Configuration

Modules accept configuration options:

```javascript
const db = new GDB({
  oplogWindow: 1000,
  resolveConflict: customConflictResolution
});

const rtc = new GenosRTC({
  appId: 'my-app',
  relayUrls: ['wss://relay.example.com']
});
```

## API Compatibility

The source code maintains API compatibility with the original minified distributions while providing:

- ✅ Clean, readable source code
- ✅ Comprehensive documentation  
- ✅ TypeScript-ready exports
- ✅ Development tooling support
- ✅ Modular architecture

## Reversing Process

This source code was reconstructed by:

1. Analyzing minified distributions in `dist/`
2. Understanding module structure and dependencies
3. Reverse engineering core functionality
4. Reimplementing with best practices
5. Adding comprehensive documentation

The resulting code maintains functional compatibility while being significantly more maintainable and extensible.
