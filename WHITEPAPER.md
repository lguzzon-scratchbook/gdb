# GenosDB Whitepaper
[![image](https://i.imgur.com/llWHG9z.jpg)](https://github.com/estebanrfp/gdb)
# GenosDB: A Decentralized P2P Graph Database for Web3 Applications

## Abstract
GenosDB is a lightweight, decentralized peer-to-peer (P2P) graph database designed for real-time Web3 applications. Built with modern web technologies, it integrates a flexible graph data model, real-time P2P synchronization via GenosRTC, advanced query capabilities, and robust security through Role-Based Access Control (RBAC) and WebAuthn authentication. Its modular architecture leverages WebRTC, Nostr, MessagePack, and Last-Write-Wins (LWW) Conflict-Free Replicated Data Types (CRDTs) to ensure scalability, performance, and developer simplicity. This whitepaper explores GenosDB’s architecture, query system, extensible modules, security features, and use cases, positioning it as a cornerstone for decentralized applications like collaborative tools, real-time streaming platforms, and distributed data systems.

## 1. Introduction
The Web3 era demands decentralized, serverless data management solutions that prioritize real-time performance, security, and scalability. Traditional databases, reliant on centralized infrastructure, are ill-suited for P2P applications requiring low-latency synchronization and trustless operation. GenosDB addresses these challenges with a browser-native graph database that leverages WebRTC for P2P communication, Nostr for peer discovery, and LWW-CRDTs for conflict resolution. Its intuitive API, advanced query capabilities, modular extensibility, and cryptographic security make it ideal for building secure, scalable Web3 applications with minimal complexity.

This whitepaper details GenosDB’s technical architecture, query system, module ecosystem, and practical applications, drawing from its public APIs and documentation ([github.com/estebanrfp/gdb](https://github.com/estebanrfp/gdb)). By offering free minified builds via NPM and CDN, and fostering an active community (@estebanrfp), GenosDB aims to accelerate Web3 adoption while protecting its core intellectual property.

## 2. Architecture
GenosDB’s architecture is modular and optimized for browser environments, integrating a graph database engine, P2P streaming, security, and persistence layers.

### 2.1 Core Components
- **GDB (Graph Database Engine)**: A lightweight engine supporting CRUD operations (`put`, `get`, `link`, `map`, `remove`, `clear`) and recursive graph traversal via the `$edge` operator. It uses MessagePack for serialization and Brotli (via `pako`) for compression, minimizing network and storage overhead.
- **GenosRTC**: A P2P streaming module built on WebRTC, enabling real-time data, audio, and video transfers through named data channels. It supports Nostr relays for peer discovery and optional encryption via passwords.
- **Security Module (SM)**: Implements RBAC with hierarchical roles (`guest`, `user`, `manager`, `admin`, `superadmin`) and WebAuthn for passwordless authentication. Operations are signed and verified using Ethereum keys.
- **Oplog**: A persistent operation log stored in `localStorage`, supporting delta synchronization with a configurable window (default: 20 operations). It ensures efficient P2P sync by sharing recent changes.
- **Conflict Resolution**: Employs LWW-CRDTs with Hybrid Logical Clocks (HLCs) to resolve conflicts, with a customizable `resolveConflict` hook for advanced scenarios.
- **Persistence**: Uses the Origin Private File System (OPFS) for local storage, with cross-tab synchronization via `BroadcastChannel`.

### 2.2 Data Pipeline
1. **Serialization**: Data is serialized using MessagePack for compact representation.
2. **Compression**: Brotli (`pako`) compresses serialized data for efficient P2P transfer.
3. **Networking**: WebRTC handles P2P communication, with Nostr relays for peer discovery and optional TURN servers for NAT traversal.
4. **Persistence**: OPFS stores graph data and indexes, with `BroadcastChannel` ensuring cross-tab consistency.
5. **Conflict Resolution**: LWW-CRDTs with HLCs (capped at a 2-hour drift limit) ensure consistent state across peers.

### 2.3 Diagram
```plaintext
+-------------------+       +-------------------+       +-------------------+
|   GDB (GenosDB)   |<----->|  GenosRTC (P2P)   |<----->| Security Manager  |
| put, get, link,   |       | WebRTC, Nostr,    |       | RBAC, WebAuthn,   |
| map, remove, clear|       | Data Channels     |       | Signing/Verify    |
+-------------------+       +-------------------+       +-------------------+
          |                          |                          |
          v                          v                          v
+-------------------+       +-------------------+       +-------------------+
|     Oplog         |       |  BroadcastChannel |       |      OPFS         |
| Delta Sync,       |       | Cross-Tab Sync    |       | Persistent Storage|
| Conflict Resolver |       |                   |       | Indexes (Radix)   |
+-------------------+       +-------------------+       +-------------------+
          |
          v
+-------------------+
|    Audit Module   |
| AI-Based Analysis |
+-------------------+
```

## 3. Query Capabilities
GenosDB’s query system is a cornerstone of its flexibility, supporting both simple CRUD operations and advanced graph traversals. The `map` method, combined with operators, enables powerful querying of nodes and relationships.

### 3.1 Core Operations
- **put(value, id?)**: Inserts or updates a node with a value and optional ID.
- **get(id, callback?)**: Retrieves a node by ID, with optional reactive updates.
- **link(sourceId, targetId)**: Creates a directed edge between two nodes.
- **remove(id)**: Deletes a node and its edges.
- **map(...args)**: Queries nodes with logical operators, pagination, sorting, and real-time updates.
- **clear()**: Removes all nodes and indexes.

**Example (Storing and Querying Nodes)**:
```javascript
const db = await gdb("my-db", { rtc: true, password: "secure-key" });
const id = await db.put({ name: "Alice", age: 30 });
await db.link(id, "group1");
const results = await db.map({ query: { name: { $eq: "Alice" } }, $limit: 10 });
```

### 3.2 Query Operators
GenosDB supports a rich set of operators for filtering and traversing data:
- **Comparison**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$between`, `$exists`.
- **Text Search**: `$text` (global or field-specific, case-insensitive, diacritic-normalized).
- **Pattern Matching**: `$like`, `$regex`.
- **Logical**: `$and`, `$or`, `$not`.
- **Graph Traversal**: `$edge` for recursive multi-hop queries.

**Example (Text Search and Graph Traversal)**:
```javascript
// Search for nodes with "ali" in any field
const results = await db.map({ query: { $text: "ali" } });
// Traverse edges to find nodes connected to a group
const groupMembers = await db.map({ query: { type: "Group", name: "group1", $edge: { type: "User" } } });
```

### 3.3 Advanced Query Features
- **Pagination**: Use `$limit`, `$after`, `$before` to control result sets.
- **Sorting**: Specify `field` and `order` (asc/desc) for sorted results.
- **Nested Properties**: Access nested fields using dot notation (e.g., `profile.name`).
- **Prefix Search**: With the Radix Indexer module, `searchByPrefix` enables efficient prefix-based queries.

**Example (Paginated and Sorted Query)**:
```javascript
const results = await db.map({
  query: { age: { $between: [20, 40] } },
  field: "age",
  order: "asc",
  $limit: 10,
  $after: "user10"
});
```

## 4. Modular Architecture
GenosDB’s extensibility is driven by its modular design, allowing developers to enable optional features during initialization. Modules are activated via the `options` parameter in the `gdb` factory function.

### 4.1 Available Modules
- **Security Module (SM)**: Enabled with `sm: true` or `{ sm: { superAdmins: ["0x1234..."], customRoles: {...} } }`. Provides RBAC and WebAuthn (see Section 6).
- **Radix Indexer**: Enabled with `rx: true`. Uses a Radix Tree for prefix-based indexing, stored in OPFS, and enhances queries with `$startsWith`.
- **Inverted Index**: Enabled with `ii: true`. Supports full-text search and indexing of node values.
- **Geo Module**: Enabled with `geo: true`. Adds geospatial indexing and queries for location-based applications.
- **AI Audit Module**: Enabled with `audit: true`. Analyzes oplog data for offensive content, spam, or anomalies using an external AI API.

**Example (Enabling Modules)**:
```javascript
const db = await gdb("my-db", {
  rtc: true,
  sm: { superAdmins: ["0x1234..."], customRoles: { editor: { can: ["write"], inherits: ["guest"] } } },
  rx: true,
  audit: { prompt: "detect offensive content or spam" }
});
```

### 4.2 Radix Indexer
The Radix Indexer enhances query performance by maintaining a Radix Tree index in OPFS. It supports prefix-based searches and automatically updates on `put` and `remove` operations.

**Example (Prefix Search)**:
```javascript
const db = await gdb("my-db", { rtc: true, rx: true });
await db.put("user123", { name: "Alice" });
const results = await db.searchByPrefix("user"); // Returns nodes with IDs starting with "user"
```

### 4.3 AI Audit Module
The AI Audit module monitors oplog entries for problematic content (e.g., offensive language, spam) using an external AI API. It supports custom prompts and debounced execution to avoid excessive API calls.

**Example (Audit Configuration)**:
```javascript
const db = await gdb("my-db", { rtc: true, audit: { prompt: "detect spam or inappropriate content" } });
await db.put("post1", { content: "spam text" }); // Triggers audit
```

## 5. Real-Time P2P Streaming (GenosRTC)
GenosRTC, exposed via `db.room`, enables real-time P2P communication using WebRTC. It supports data channels for structured data, and audio/video streaming.

### 5.1 Data Channels
Named channels allow sending JSON, strings, or binary data to all or specific peers.

**Example (Chat Application)**:
```javascript
const db = await gdb("chat-room", { rtc: true, password: "secure-key" });
const chatChannel = db.room.channel("messages");
chatChannel.on("message", (msg, peerId) => {
  console.log(`${peerId}: ${msg.text}`);
});
chatChannel.send({ text: "Hello, everyone!" });
```

### 5.2 Media Streams
GenosRTC supports P2P audio and video streaming, with methods like `addStream`, `removeStream`, and `replaceTrack`.

**Example (Video Streaming)**:
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
db.room.addStream(stream);
db.room.on("stream:add", (stream, peerId) => {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  document.getElementById("videos").appendChild(video);
});
```

### 5.3 File Transfer
Data channels support file transfers with metadata, with recommendations for chunking files larger than 256KB.

**Example (File Sharing)**:
```javascript
const fileChannel = db.room.channel("file-transfer");
document.getElementById("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  const buffer = await file.arrayBuffer();
  fileChannel.send({ metadata: { name: file.name, type: file.type }, payload: buffer });
});
fileChannel.on("message", ({ metadata, payload }) => {
  const blob = new Blob([payload], { type: metadata.type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = metadata.name;
  link.click();
});
```

## 6. Security
The Security Module (SM) ensures trust and access control in P2P environments.

### 6.1 Role-Based Access Control (RBAC)
RBAC defines hierarchical roles with permissions:
- **guest**: `read`, `sync`
- **user**: `write`, `link`, `sync`
- **manager**: `publish`, inherits `user`
- **admin**: `delete`, inherits `manager`
- **superadmin**: `assignRole`, `deleteAny`, inherits `admin`

Roles are stored in the graph and synchronized P2P, with `superadmin` addresses configured at initialization.

**Example (Role Assignment)**:
```javascript
const db = await gdb("secure-db", { rtc: true, sm: { superAdmins: ["0x1234..."] } });
await db.sm.assignRole("0x5678...", "manager", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
await db.sm.executeWithPermission("delete"); // Verifies permission
```

### 6.2 WebAuthn Authentication
WebAuthn enables passwordless authentication using biometrics or hardware keys, securing Ethereum private keys.

**Example (WebAuthn Login)**:
```javascript
const address = await db.sm.loginCurrentUserWithWebAuthn();
console.log(`Logged in as ${address}`);
```

### 6.3 Cryptographic Signing
Operations are signed with Ethereum keys and verified by peers, ensuring integrity and authenticity.

**Example (Signed Operation)**:
```javascript
await db.sm.executeWithPermission("write");
const id = await db.put({ x: 10 });
```

## 7. Synchronization and Conflict Resolution
GenosDB uses an oplog for delta synchronization, storing recent operations (default: 20) in `localStorage`. Conflicts are resolved using LWW-CRDTs with Hybrid Logical Clocks, capped at a 2-hour drift.

**Example (Oplog Sync)**:
```javascript
const db = await gdb("my-db", { rtc: true });
await db.put("node1", { x: 10 }); // Adds to oplog
// Peers sync delta changes via WebRTC
```

The `resolveConflict` function applies LWW at the object level, with a customizable hook for advanced logic.

## 8. Use Cases
### 8.1 Real-Time Collaboration
- **Chat Application**: Build a P2P chat in 7 lines of code ([Medium](https://medium.com/genosdb/build-a-realtime-chat-app-in-7-lines-of-javascript-using-genosdb-ff8eb73558a3)).
- **Kanban Board**: Synchronize tasks across peers ([Medium](https://medium.com/genosdb/build-a-kanban-board-in-minutes-with-genosdb-a4ae06a99ac9)).
- **To-Do List**: Share lists with real-time updates ([Medium](https://medium.com/genosdb/build-a-to-do-list-in-minutes-with-genosdb-384216b808bb)).

### 8.2 Streaming Applications
- **Video Conferencing**: Stream webcam feeds P2P ([Medium](https://medium.com/genosdb/real-time-p2p-video-streaming-using-genosdb-and-modern-javascript-809f7e77c2d0)).
- **File Sharing**: Transfer files securely without servers ([Medium](https://medium.com/genosdb/real-time-p2p-file-transfer-using-genosdb-and-modern-javascript-a095ee059a47)).

### 8.3 Data-Driven Applications
- **Inventory Management**: Use graph queries to track relationships between items and categories.
- **Social Networks**: Model user connections with `$edge` for recursive traversal.

**Example (Inventory Query)**:
```javascript
const db = await gdb("inventory", { rtc: true, rx: true });
const id = await db.put({ name: "Laptop", category: "Electronics" });
await db.link(id, "cat1");
const electronics = await db.map({ query: { type: "Category", name: "cat1", $edge: { type: "Item" } } });
```

## 9. Competitive Analysis
Compared to GunDB and OrbitDB, GenosDB offers:
- **Simpler API**: Intuitive operations like `put`, `get`, and `$edge`.
- **Integrated Streaming**: GenosRTC eliminates external WebRTC dependencies.
- **Advanced Queries**: Rich operators (`$text`, `$edge`) and Radix indexing.
- **Robust Security**: RBAC and WebAuthn for enterprise-grade trust.
- **Modularity**: Extensible with modules like Radix Indexer and AI Audit.

See [Medium](https://medium.com/genosdb/most-popular-peer-to-peer-distributed-databases-5668d4869a56) for details.

## 10. Roadmap
### 10.1 Short Term (Q3-Q4 2025)
- Publish additional tutorials on Medium.
- Optimize GenosRTC for mobile browsers.
- Enhance Radix Indexer performance.

### 10.2 Mid Term (Q1-Q2 2026)
- Release v1.0 with stable API.
- Add framework integrations (React, Vue, Svelte).
- Explore smart contract-based RBAC verification.

### 10.3 Long Term (2026+)
- Integrate with IPFS, Filecoin, and ENS.
- Support multi-language SDKs (Python, Go, Rust).
- Conduct external security audits.

See [ROADMAP.md](https://github.com/estebanrfp/gdb/blob/main/ROADMAP.md) for details.

## 11. Conclusion
GenosDB is a powerful, developer-friendly platform for decentralized Web3 applications, combining a flexible graph database, real-time P2P streaming, advanced query capabilities, and robust security. Its modular design and rich ecosystem make it ideal for collaborative tools, streaming platforms, and data-driven applications. Join the community (@estebanrfp) to build the future of Web3.

**Get Started**:
- Repository: [github.com/estebanrfp/gdb](https://github.com/estebanrfp/gdb)
- Documentation: [/docs](https://github.com/estebanrfp/gdb/blob/main/docs/index.md)
- Tutorials: [Medium](https://medium.com/genosdb)
- Community: [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions), [Twitter/X @estebanrfp](https://twitter.com/estebanrfp)

## References
1. estebanrfp, “GenosDB: Distributed Graph-Based Database,” Medium, 2025. [Link](https://medium.com/genosdb/genosdb-distributed-graph-based-database-7f03b878507b)
2. estebanrfp, “Designing a Next-Generation P2P Protocol Architecture,” Medium, 2025. [Link](https://medium.com/genosdb/designing-a-next-generation-p2p-protocol-architecture-for-genosdb-4833c1f6e069)
3. estebanrfp, “How GenosDB Solved the Distributed Trust Paradox,” Medium, 2025. [Link](https://medium.com/genosdb/how-genosdb-solved-the-distributed-trust-paradox-a-guide-to-p2p-security-a552aa3e3318)
4. estebanrfp, “GenosDB and the Nostr Network,” Medium, 2025. [Link](https://medium.com/genosdb/genosdb-and-the-nostr-network-powering-the-future-of-decentralized-data-93db03b7c2d7)
5. estebanrfp, “GenosDB v0.4.0: Oplog-Driven Delta Sync,” Medium, 2025. [Link](https://medium.com/genosdb/genosdb-v0-4-0-introducing-oplog-driven-intelligent-delta-sync-and-full-state-fallback-741fe8ff132c)
