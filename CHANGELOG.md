# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.3] - 2025-08-13

### Improved
Optimized the peer synchronization protocol. The connection flow has been redesigned, making the newly connecting client responsible for initiating the sync process. This prevents the initial "sync storm," reducing network overhead and making the network join process more robust and efficient.

### Fixed
Fixed a critical synchronization loop that caused redundant data requests. A client reconnecting after being offline was not correctly updating its sync state (globalTimestamp), causing it to repeatedly request the same deltas or the full graph.
As a result of the above fix, the visual "flickering" effect in client applications has been resolved. Data is now processed in a single, coherent batch, ensuring smooth and atomic UI updates.

## [0.6.1] - 2025-08-11

### Fixed
- **RBAC Compatibility:** Restored full RBAC functionality by adapting the security module to the new GenosRTC P2P layer. The `rbac.js` component now correctly intercepts and signs outgoing messages via `syncChannel.send`, ensuring that role-based security and data signing operate as intended with the new architecture.

## [0.6.0] - 2025-08-11

### ⚠️ Breaking Change & Major Architectural Evolution

*   **New Channel-Based Communication Architecture:** GenosRTC introduces a brand-new, event-driven real-time communication layer built from the ground up. All P2P interactions are now managed through a robust `channel` primitive, offering a unified, clear, and powerful interface for real-time data exchange.  
    *   **Example:** `const channel = room.channel('type'); channel.on('message', ...);`

### 🚀 Key Features & Capabilities

*   **Standardized Event-Driven API:** The `channel` object delivers complete data payloads via the `on('message', ...)` event, providing a predictable and consistent interface for incoming data handling.
*   **Built-in Transfer Progress Monitoring:** Supports an `on('progress', ...)` event for real-time monitoring of large data transfers without extra implementation.
*   **Incomparable Network-Level Robustness:** Data transmission includes automatic timeouts and intelligent retries to prevent deadlocks and ensure reliability under unstable network conditions.
*   **Encapsulated and Organized Communication:** Each communication type is fully encapsulated within its own `channel` object, formalizing data flow, reducing complexity, and strengthening overall system stability.

## [0.5.0] - 2025-08-10

### 🚀 Features & Major Enhancements

*   **Introduced Recursive Graph Traversal Queries:** The query engine has been fundamentally enhanced with the new, recursive `$edge` operator. This powerful feature allows you to use an initial query to find starting points, then explore the entire descendant graph to return a complete list of all connected nodes that match a powerful sub-query. It resolves complex, multi-hop traversal logic within a single, declarative statement, eliminating the need for manual, client-side lookups.

### Changed

*   **Internal Query Engine Architecture:** The core query processor has been re-architected to natively support recursive graph traversal. This architectural enhancement allows the query engine to evaluate and follow relational paths, making the new `$edge` operator possible within the `.map()` method.

## [0.4.3] - 2025‑08‑09

### 🚀 Features & Enhancements

* **Added `relayUrls` option to `GDB` constructor** — When provided, this replaces the default relay list and overrides relayRedundancy.

## [0.4.2] - 2025-08-08

### 🐛 Bug Fixes & Security Improvements

*   **Fixed Critical P2P Authority Bug for Super Admins:** Resolved a fundamental flaw where a `superadmin` was incorrectly treated as a `guest` by receiving peers, causing legitimate administrative actions to be rejected. The permission system now correctly recognizes `superadmin` authority directly from the static configuration, allowing them to operate across the network without needing a pre-existing user node in the database.
*   **Refactored and Simplified Permission Verification Logic:** The `verifyIncomingOperations` method in the `SecurityManager` has been significantly refactored. The complex, multi-stage logic for determining a sender's role has been replaced with a cleaner, hierarchical model. This not only fixes the Super Admin bug but also makes the entire permission validation process more robust and easier to audit for all roles.

### 🏛️ Architectural Notes & Security Design

*   **Clarified "Source of Truth" for Permissions:** This version solidifies the security model for role-based permissions:
    1.  **Static Source of Truth (for Super Admins):** The ultimate authority for `superadmin` roles is the static list provided in the client configuration. This list is immutable during runtime and acts as the "root of trust" for the entire network, following a **Gobernanza por Consenso de Software** model. Each peer independently validates incoming super-admin actions against its own local copy of this list.
    2.  **Dynamic Source of Truth (for all other roles):** The authority for all other roles (`admin`, `manager`, `user`, etc.) is derived from data written to the distributed database itself (i.e., `user:*` nodes). These roles can only be assigned by a user who already holds the `assignRole` permission (typically a `superadmin`), creating a secure and auditable chain of trust.

## [0.4.1] - 2025-08-07

### 🐛 Bug Fixes & Stability Improvements

*   **Fixed Critical RBAC Signature Verification Failure:** Resolved a bug where signature validation for incoming operations would incorrectly fail. The process for reconstructing the data payload for verification now correctly matches the payload that was originally signed, making P2P security checks reliable.
*   **Resolved Distributed Permission Paradox in Delta Sync:** Corrected a critical logic flaw where a user could not receive their own role update from an authorized peer. The `SecurityManager` now correctly bases all permission checks for operations inside a delta on the **sender's role**, not the receiver's, ensuring permission changes propagate correctly across the network.
*   **Enhanced RBAC Action Mapping:** Improved the `mapChangeTypeToRbacAction` helper function to be context-aware. It can now correctly distinguish a specific `assignRole` action from a generic `write` action, which was essential for fixing the permission paradox.

### Changed

*   **Refactored Permission Logic:** The core permission validation logic within the `SecurityManager` has been refactored to be clearer and more robust, consistently using the sender's authority as the single source of truth for all permission checks.

## [0.4.0] - 2025-08-06

### 🚀 Features & Major Enhancements

*   **Delta Synchronization Engine:** This version introduces a complete architectural overhaul of the P2P synchronization mechanism. GenosDB now uses a sliding-window Operation Log (Oplog) to exchange only the minimal set of required changes (deltas) between peers. This drastically improves network efficiency, reduces bandwidth consumption by up to 90%+, and makes real-time sync significantly faster, especially for large databases.
*   **Robust Full-State Sync Fallback:** A smart fallback system has been implemented. If a peer is too far out of sync to be updated via deltas (e.g., after being offline for a long time), the system automatically detects this and sends the full, current state of the graph. This guarantees eventual consistency under all circumstances.
*   **Compressed Delta Payloads:** All delta-sync network payloads are now compressed using `pako` (deflate) before transmission, further optimizing network performance and reducing latency.

### 🐛 Bug Fixes & Stability Improvements

*   **Resolved Cross-Session Sync Corruption:** Fixed a critical bug where a rejoining peer could accidentally overwrite a more recent database state due to incorrect timestamp management on initialization. The system is now fully resilient to this scenario.
*   **Eliminated Repetitive Sync Loops:** Corrected an issue where a peer could get stuck in a loop requesting deltas it had just received. `globalTimestamp` management is now more robust, ensuring a peer only requests data it genuinely lacks.
*   **Enforced Strict Conflict Resolution:** Conflict resolution logic (LWW-CRDT) is now rigorously applied to all remote write operations (`upsert`, `remove`, `link`), preventing outdated messages from causing data loss.

### Changed

*   **Internal Sync Protocol:** The internal `sync` message now initiates the new, more sophisticated delta-sync handshake protocol.


## [0.3.0] - 2025-08-05

### Changed
- Internal write operations now use a more descriptive `upsert` type instead of `insert`.
- Added backward compatibility to accept `insert` operations from older clients to ensure smooth network transition.

### Added
- Improved clarity and robustness in the internal write logic.

## [0.2.4] - 2025‑07‑30

### ⚠️ Breaking Change
- Package renamed from `gdb-p2p@0.2.3` to `genosdb@0.2.4`.
- Update imports accordingly:
  ```diff
  - import { GDB } from "gdb-p2p"
  + import { GDB } from "genosdb"
  ```

## [0.2.0] - 2025-07-30

### ⚠️ Breaking Change
- The database class has been renamed:
  ```js
  // Before
  import { GraphDB } from "gdb-p2p"
  const db = new GraphDB("todoList")

  // Now
  import { GDB } from "gdb-p2p"
  const db = new GDB("todoList")
  ```
## [0.0.31] - 2025-03-15

### Added
- New `put()` method for node creation.
- Link functionality for relationships between nodes.

### Fixed
- Fixed data deletion bug causing synchronization corruption with OPFS.

## [0.0.2] - 2025-05-05

### Changed
- Improved OPFS Worker module.