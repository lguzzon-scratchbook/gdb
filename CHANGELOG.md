# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.7] - 2025-08-26

### Added

- **Autonomous Governance Engine (`governanceRules`):** Introduced a new, optional Governance Module that allows for the automatic enforcement of high-level business logic and data policies across the database. The engine is configured by passing a `governanceRules` array in the `sm` options. Operated exclusively by a logged-in `superadmin`, the engine periodically evaluates these rules, leveraging the full power of the `gdb.map` query engine to identify and act upon nodes that meet specific criteria.

### Changed

- **`sm` Configuration Extended for Governance:** The Security Manager configuration object now accepts a `governanceRules` property. This array of rule objects allows developers to define conditional logic using the same query syntax as `gdb.map`, enabling powerful, declarative data policies (e.g., role promotions, state changes, etc.).

### Improved

- **Hybrid Query Architecture for Governance Rules:** The governance engine employs a highly efficient hybrid strategy for rule evaluation. It first uses `gdb.map` to perform an optimized pre-filtering of candidate nodes based on indexable `value` properties (like `role`). It then applies more complex, non-indexable checks (such as time-based conditions on `node.timestamp.physical`) in-memory on the much smaller, pre-filtered set. This approach minimizes computational load while enabling sophisticated, multi-faceted rule definitions.

### Security

- **Strict Super Admin Control Over Governance:** The governance engine is designed as a trusted system component. It can only be activated and operated by a `superadmin` user who has successfully authenticated. This ensures that all automated data transformations are initiated and controlled exclusively by the highest authority within the network, maintaining a clear and secure chain of command.

## [0.9.6] - 2025-08-25

### Security

- **Enhanced "Secure-by-Default" User Onboarding:** The security model has been upgraded to enforce a principle of least privilege. New users now join with a `guest` role, ensuring read-only access until a `superadmin` explicitly promotes them. This architectural choice provides administrators with granular control over write permissions from the very start.
- **Instantaneous Super Admin Recognition:** The authority of `superadmin` users is now derived directly and exclusively from the static client configuration. This change guarantees that their administrative privileges are recognized immediately upon login, locally and without any dependency on network synchronization, solidifying a robust and predictable root of trust for the entire network.

### Changed

- **Streamlined Security State Management:** The internal API for managing user sessions and cryptographic signers has been refactored for superior encapsulation. All state transitions now flow through a single, well-defined public method, which enhances system stability and eliminates potential race conditions during login and logout sequences.

### Improved

- **Architectural Clarity in Role Verification:** The logic for role verification is now clearly delineated. `Superadmin` authority is confirmed via a static, immutable configuration, while all other user roles are dynamically verified against the distributed database. This clear separation of concerns makes the security model more auditable and easier to reason about.

## [0.9.5] - 2025-08-24

### Changed

- **Security Manager (SM) Initialization Hardened:** The configuration for the SM module has been made stricter to ensure secure and correct setups.
  - The `rtc: true` option is now **mandatory** when enabling the SM module, reinforcing that its core security features operate in a P2P context.
  - The module must be initialized with a full configuration object, including the mandatory `superAdmins` array (e.g., `sm: { superAdmins: [...] }`).

### Improved

- **API Encapsulation and Clarity:** The public API of the Security Manager (`db.sm`) has been significantly streamlined. Internal helper and utility functions are now properly encapsulated, resulting in a cleaner, more focused, and easier-to-use API for developers.
- **Bundle Size Reduction:** The improved encapsulation enhances tree-shaking, which can lead to a smaller final bundle size for applications that include the Security Manager module.

## [0.9.3] - 2025-08-21

### ⚠️ Breaking Change

- **P2P/RTC networking now requires explicit activation:**  
  The `rtc` flag must be set to `true` in the `gdb()` factory options to enable real-time P2P synchronization.  
  If omitted, the database will operate in local-only mode and will not connect to the network or relays.
  **Migration Guide:**  
  Update your initialization:
  ```js
  const db = await gdb("myDB", { rtc: true })
  ```
  Apps relying on automatic network sync must update their configuration to restore previous behavior.

### Changed

- **`relayUrls` and `turnConfig` options are now passed inside the `rtc` object:**  
  To customize relay URLs or TURN configuration, use:
  ```js
  const db = await gdb("myDB", {
    rtc: {
      relayUrls: ["wss://relay1.example.com", "wss://relay2.example.com"],
      turnConfig: [
        /* TURN server config objects */
      ],
    },
  })
  ```
  If you only want to enable RTC with default settings, simply use `rtc: true`.

### Improved

- Significantly reduced bundle size: GenosRTC is now dynamically imported only if RTC is required.
- Prevents unwanted network connections, improving privacy and audit scores.

## [0.9.0] - 2025-08-21

### ⚠️ Breaking Change

- **P2P/RTC networking now requires explicit activation:**  
  The `rtc` flag must be set to `true` in the `gdb()` factory options to enable real-time P2P synchronization.  
  If omitted, the database will operate in local-only mode and will not connect to the network or relays.
  **Migration Guide:**  
  Update your initialization:
  ```js
  const db = await gdb("myDB", { rtc: true })
  ```
  Apps relying on automatic network sync must update their configuration to restore previous behavior.

### Improved

- Significantly reduced bundle size: GenosRTC is now dynamically imported only if RTC is required.
- Prevents unwanted network connections, improving privacy and audit scores.

## [0.8.5] - 2025-08-20

### Added

- **Audit Parameter:** Introduced the `audit` parameter to the database factory. This enables real-time auditing of the operation log (oplog) using AI. The audit module can analyze, detect, and act on patterns or prohibited content in oplog entries, providing automated moderation and data integrity features.

## [0.8.3] - 2025-08-19

### Added

- **Modular Extension Support:** The GDB core now allows the creation and integration of new custom modules in a simple and secure way. The architecture enables extension without modifying the core.

### Changed

- **Secure Public API:** The public API exposes only the minimal resources required for extension and operation, without revealing internal method names or sensitive details, strengthening security and encapsulation.

### Notes

- Indexing modules are fully compatible with version 0.8.0 and above.

## [0.8.0] - 2025-08-19

### Added

- **Configurable Persistence Delay:** Added a `saveDelay` option to the `gdb()` factory function, allowing fine-grained control over the OPFS save debounce timing. This improves the balance between performance and data persistence.
- **Configurable Oplog Size:** Introduced the `oplogSize` option to configure the operation log's capacity, enabling optimization of delta-sync performance based on application needs.

### Changed

- **Unprecedented Write Performance:** The core engine's debouncing and asynchronous architecture have been optimized to handle extreme write loads. GDB can now process tens of thousands of operations per second across all modern browsers without blocking the main UI thread, ensuring a fluid user experience.
- **Performance:** Refactored the `createDebouncedTask` utility to be more concise and efficient. It continues to leverage `requestIdleCallback` to minimize main-thread impact during background tasks.

### Fixed

- **High-Throughput Stability:** Addressed potential UI hangs during massive batch operations. It is now recommended to set `saveDelay: 0` for such scenarios to ensure maximum stability and immediate persistence.

## [0.7.3] - 2025-08-18

### Fixed

- Fixed a bug affecting WebAuthn registration and login flows, which was introduced after refactoring core security modules to a factory pattern. This ensures that WebAuthn-protected identities can be created and accessed reliably.

### Notes

- If you encounter a similar error after updating, force a cache-less reload of your browser or append a version suffix to your import during development.

## [0.7.2] - 2025-08-18

### Changed

- Security modules moved to lightweight factory functions: `SoftwareSecurityManager` and `SoftwareWalletManager`. Public APIs preserved and behavior unchanged.
- `sm.js` updated to use the new factories, with idempotent middleware registration and a safer activation flow for signing/verification.
- Configuration is now passed explicitly as function parameters from GDB into composed modules (e.g., `sm`), avoiding hidden globals and enabling cleaner composition and testing.

Example (passing Security config into SM from GDB):

```js
const db = await gdb("rbacChatAppDB", {
  sm: {
    superAdmins: SUPERADMIN_ADDRESSES,
    customRoles: CHAT_APP_ROLES,
  },
})
const { sm } = db // Access the Security Manager
```

### Improved

- `sm.js` hardening around the middleware and storage path: middleware always returns an array; stable base IDs in `put()`; avoidance of double ID prefixes; `put()` returns the base ID consistently.
- Logging consistency across GDB core and Security Manager with unified icons/severity (❌/⚠️/✅/ℹ️). Messages during WebAuthn and security activation are clearer and less ambiguous.

### Fixed

- Avoided edge cases where `sm.put()` could generate malformed IDs.

### Notes

- Public `gdb.js` API unchanged. Builds passed; bundle sizes remain approximately the same.

## [0.7.0] - 2025-08-18

### ⚠️ Breaking Change

- Migrated GenosDB to an async factory function. You must now initialize the database using `const db = await gdb(...)` instead of `new GDB(...)`. This change enables asynchronous setup, better error handling, and future extensibility for remote and dynamic backends.

### Improved

- All database initialization is now promise-based, allowing for more robust startup flows and integration with async application logic.
- Updated documentation and examples to reflect the new async initialization pattern.

### Migration Guide

- Replace all instances of `new GDB(...)` with `await gdb(...)`.
- Ensure your application entry points and database-dependent logic are inside an `async` function or properly handle promises.

### Why?

- This change prepares GenosDB for advanced features such as remote initialization, dynamic configuration, and improved error reporting. It also aligns with modern JavaScript best practices for resource-heavy or network-dependent modules.

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

- **New Channel-Based Communication Architecture:** GenosRTC introduces a brand-new, event-driven real-time communication layer built from the ground up. All P2P interactions are now managed through a robust `channel` primitive, offering a unified, clear, and powerful interface for real-time data exchange.
  - **Example:** `const channel = room.channel('type'); channel.on('message', ...);`

### 🚀 Key Features & Capabilities

- **Standardized Event-Driven API:** The `channel` object delivers complete data payloads via the `on('message', ...)` event, providing a predictable and consistent interface for incoming data handling.
- **Built-in Transfer Progress Monitoring:** Supports an `on('progress', ...)` event for real-time monitoring of large data transfers without extra implementation.
- **Incomparable Network-Level Robustness:** Data transmission includes automatic timeouts and intelligent retries to prevent deadlocks and ensure reliability under unstable network conditions.
- **Encapsulated and Organized Communication:** Each communication type is fully encapsulated within its own `channel` object, formalizing data flow, reducing complexity, and strengthening overall system stability.

## [0.5.0] - 2025-08-10

### 🚀 Features & Major Enhancements

- **Introduced Recursive Graph Traversal Queries:** The query engine has been fundamentally enhanced with the new, recursive `$edge` operator. This powerful feature allows you to use an initial query to find starting points, then explore the entire descendant graph to return a complete list of all connected nodes that match a powerful sub-query. It resolves complex, multi-hop traversal logic within a single, declarative statement, eliminating the need for manual, client-side lookups.

### Changed

- **Internal Query Engine Architecture:** The core query processor has been re-architected to natively support recursive graph traversal. This architectural enhancement allows the query engine to evaluate and follow relational paths, making the new `$edge` operator possible within the `.map()` method.

## [0.4.3] - 2025‑08‑09

### 🚀 Features & Enhancements

- **Added `relayUrls` option to `GDB` constructor** — When provided, this replaces the default relay list and overrides relayRedundancy.

## [0.4.2] - 2025-08-08

### 🐛 Bug Fixes & Security Improvements

- **Fixed Critical P2P Authority Bug for Super Admins:** Resolved a fundamental flaw where a `superadmin` was incorrectly treated as a `guest` by receiving peers, causing legitimate administrative actions to be rejected. The permission system now correctly recognizes `superadmin` authority directly from the static configuration, allowing them to operate across the network without needing a pre-existing user node in the database.
- **Refactored and Simplified Permission Verification Logic:** The `verifyIncomingOperations` method in the `SecurityManager` has been significantly refactored. The complex, multi-stage logic for determining a sender's role has been replaced with a cleaner, hierarchical model. This not only fixes the Super Admin bug but also makes the entire permission validation process more robust and easier to audit for all roles.

### 🏛️ Architectural Notes & Security Design

- **Clarified "Source of Truth" for Permissions:** This version solidifies the security model for role-based permissions:
  1.  **Static Source of Truth (for Super Admins):** The ultimate authority for `superadmin` roles is the static list provided in the client configuration. This list is immutable during runtime and acts as the "root of trust" for the entire network, following a **Gobernanza por Consenso de Software** model. Each peer independently validates incoming super-admin actions against its own local copy of this list.
  2.  **Dynamic Source of Truth (for all other roles):** The authority for all other roles (`admin`, `manager`, `user`, etc.) is derived from data written to the distributed database itself (i.e., `user:*` nodes). These roles can only be assigned by a user who already holds the `assignRole` permission (typically a `superadmin`), creating a secure and auditable chain of trust.

## [0.4.1] - 2025-08-07

### 🐛 Bug Fixes & Stability Improvements

- **Fixed Critical RBAC Signature Verification Failure:** Resolved a bug where signature validation for incoming operations would incorrectly fail. The process for reconstructing the data payload for verification now correctly matches the payload that was originally signed, making P2P security checks reliable.
- **Resolved Distributed Permission Paradox in Delta Sync:** Corrected a critical logic flaw where a user could not receive their own role update from an authorized peer. The `SecurityManager` now correctly bases all permission checks for operations inside a delta on the **sender's role**, not the receiver's, ensuring permission changes propagate correctly across the network.
- **Enhanced RBAC Action Mapping:** Improved the `mapChangeTypeToRbacAction` helper function to be context-aware. It can now correctly distinguish a specific `assignRole` action from a generic `write` action, which was essential for fixing the permission paradox.

### Changed

- **Refactored Permission Logic:** The core permission validation logic within the `SecurityManager` has been refactored to be clearer and more robust, consistently using the sender's authority as the single source of truth for all permission checks.

## [0.4.0] - 2025-08-06

### 🚀 Features & Major Enhancements

- **Delta Synchronization Engine:** This version introduces a complete architectural overhaul of the P2P synchronization mechanism. GenosDB now uses a sliding-window Operation Log (Oplog) to exchange only the minimal set of required changes (deltas) between peers. This drastically improves network efficiency, reduces bandwidth consumption by up to 90%+, and makes real-time sync significantly faster, especially for large databases.
- **Robust Full-State Sync Fallback:** A smart fallback system has been implemented. If a peer is too far out of sync to be updated via deltas (e.g., after being offline for a long time), the system automatically detects this and sends the full, current state of the graph. This guarantees eventual consistency under all circumstances.
- **Compressed Delta Payloads:** All delta-sync network payloads are now compressed using `pako` (deflate) before transmission, further optimizing network performance and reducing latency.

### 🐛 Bug Fixes & Stability Improvements

- **Resolved Cross-Session Sync Corruption:** Fixed a critical bug where a rejoining peer could accidentally overwrite a more recent database state due to incorrect timestamp management on initialization. The system is now fully resilient to this scenario.
- **Eliminated Repetitive Sync Loops:** Corrected an issue where a peer could get stuck in a loop requesting deltas it had just received. `globalTimestamp` management is now more robust, ensuring a peer only requests data it genuinely lacks.
- **Enforced Strict Conflict Resolution:** Conflict resolution logic (LWW-CRDT) is now rigorously applied to all remote write operations (`upsert`, `remove`, `link`), preventing outdated messages from causing data loss.

### Changed

- **Internal Sync Protocol:** The internal `sync` message now initiates the new, more sophisticated delta-sync handshake protocol.

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
  const db = new GraphDB "todoList"

  // Now
  import { GDB } from "gdb-p2p"
  const db = new GDB "todoList"
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
