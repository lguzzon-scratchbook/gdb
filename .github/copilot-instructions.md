# JavaScript Modern – Style & Performance Guidelines

## Objective
Generate modern JavaScript (ES2020+) code that is **compact**, **high-performance**, and **readable**. Prioritize **clarity**, **efficiency**, and **conciseness** in every suggestion.

Antes de cada respuesta escribe "Respuesta en base a copilot-instructions"

## Guidelines

# GitHub Copilot Guidelines

- All code comments and `console.log` messages must be written in English.
- Use JSDoc comments to describe functions, parameters, and return values.
- Avoid redundant comments; the code should be self-explanatory.

1. **Modern Syntax**:
   - Use arrow functions, destructuring, optional chaining, nullish coalescing, dynamic imports, template literals, `async/await`.
   - Avoid `var`, callbacks, jQuery, or deprecated APIs.
   - Emphasize immutability, pure functions, and composition over inheritance.

2. **Descriptive Naming**:
   - Use clear, semantic names: `isLoading`, `fetchData`, `calculateSum`.
   - Avoid cryptic names like `a`, `b1`.

3. **Compact & Efficient**:
   - Refactor to use array methods (`map`, `filter`, `reduce`); avoid unnecessary loops.
   - Prefer early returns over deep nesting.
   - Minimize lines without losing clarity.

4. **High Performance**:
   - Reduce redundant DOM or variable accesses.
   - Use `Promise.allSettled()` for efficient concurrency.
   - Implement lazy loading (`import()`) and code splitting where applicable.

5. **Clear Explanations**:
   - When modifying or refactoring code, provide brief comments explaining the rationale.

## Example Response

```javascript
// Rule: ArrowFunction + EarlyReturn
const sumEven = arr => arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);

```

# Copilot Instructions

Please refer to the following documents for detailed guidelines:

## GDB API Reference

# 📘 API Reference

> Minimalist Graph Database with P2P support and real-time querying.

## 📦 Installation

```bash
npm install genosdb
```

## 📥 Import

### 1. Via NPM

```javascript
import { GDB } from "genosdb"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { GDB } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"
</script>
```

---

## 📦 Constructor

### `new GDB(name, options?)`

Initializes a new database instance.

- **Parameters**:
  - `name` `{string}` – Database name (used for local storage or sync).
  - `options` `{Object}` _(optional)_:
    - `password` `{string}` – Optional encryption key.
    - `relayUrls` `{string[]}` – Optional – Custom list of secure WebSocket relay URLs (for Nostr). When provided, this replaces the default relay list and overrides `relayRedundancy`.
    - `turnConfig` `{Array<Object>}` – Optional – Configuration for TURN servers. Each object can include:
      - `urls` `{string | string[]}` – Single URL or array of URLs to access the TURN server.
      - `username` `{string}` – Username for TURN authentication.
      - `credential` `{string}` – Password or token for TURN authentication.

- **Returns**: `GDB` instance.

#### Initialize without a password

```js
const db = new GDB("my-db")
```

#### Initialize with a password (optional)

```js
const secureDb = new GDB("secure-db", { password: "secret" })
```

#### `relayUrls` (opcional)

To specify custom relays for Nostr when initializing the database:

```javascript
const db = new GDB("my-db", {
  relayUrls: ["wss://relay1.example.com", "wss://relay2.example.com"],
})
```

#### `turnConfig` (opcional)

Once you have a TURN server, configure GenosDB with it like this:

```javascript
const turnConfig = [
  {
    // single string or list of strings of URLs to access TURN server
    urls: ["turn:your-turn-server.ok:1979"],
    username: "username",
    credential: "password",
  },
]

const db = new GDB("my-db", { turnConfig })
```

---

## 🧩 Core Methods

### `put(data, id?)`

Inserts or updates a node.

- **Parameters**:
  - `data` `{Object}` – Node content (must be serializable).
  - `id` `{string}` _(optional)_ – If provided, updates the node.
- **Returns**: `{Promise<string>}` – Node ID (hash or custom).

```js
const id = await db.put({ type: "User", name: "Ana" })
await db.put({ name: "Ana B" }, id)
```

> **More examples**: See [.put()](<https://github.com/estebanrfp/gdb/wiki/.put()>).

---

### `get(id)`

Retrieves a node by its ID.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<{ result: { id: string, value: Object, timestamp: Object } } | null>}`
  - `result.timestamp`: The node's Hybrid Logical Clock (HLC) timestamp object (e.g., `{ physical: number, logical: number }`).

```js
const { result } = await db.get(id)
```

> **More examples**: See [.get()](<https://github.com/estebanrfp/gdb/wiki/.get()>).

---

### `link(sourceId, targetId, label?)`

Creates a directed relationship between two nodes.

- **Parameters**:
  - `sourceId` `{string}`
  - `targetId` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.link(sourceId, targetId)
```

---

### `remove(id)`

Deletes a node and its references.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.remove(id)
```

---

### `map(...args)`

Queries nodes and can listen for real-time updates.
It flexibly accepts zero or more arguments. Typically, these are:

- An **options object** (for `queryConfig`) to define filtering, sorting, etc.
- A **callback function** to process real-time updates.

The order of these arguments does not matter.

- **Arguments (`...args`)**:

  - `options` `{Object}` _(optional)_ – Configuration for the query. If an object is passed, its properties will be merged with the default query options.
    - `query` `{Object}` – MongoDB-style filter. Defaults to `{}` (all nodes). Supports advanced operators, including the recursive `$edge` operator for graph traversal.
    - `field` `{string}` _(optional)_ – Sort field.
    - `order` `{string}` _(optional)_ – `'asc'` | `'desc'`. Defaults to `'asc'`.
    - `$limit` `{number}` _(optional)_ – Limit the number of results.
    - `$after` `{string}` _(optional)_ – Paginate after a specific node ID.
    - `$before` `{string}` _(optional)_ – Paginate before a specific node ID.
    - `realtime` `{boolean}` _(optional)_ – Explicitly enable or disable real-time mode. If a `callback` is provided and `realtime` is not explicitly set to `false` in options, real-time mode is automatically enabled. Defaults to `false`.
  - `callback` `{Function}` _(optional)_ – If provided, enables real-time mode (unless `realtime: false` is in options). This function is invoked with an event object for:

    1.  Each node initially matching the query (`action: 'initial'`).
    2.  Any subsequent changes (additions, updates, removals) to nodes that match the query.

    - The callback receives a single event object argument. **It's common and recommended to destructure the properties you need directly in the function's signature. The most frequent and often sufficient signature is `({ id, value, action })`**.
    - This full event object contains:

      - `id` `{string}` – The ID of the node.
      - `value` `{Object}` – The content of the node. For the `'removed'` action, `value` will be `null`.
      - `edges` `{Array}` – An array of edges connected to the node. The developer can choose to use this data based on application needs.
      - `timestamp` `{Object}` – The node's Hybrid Logical Clock (HLC) timestamp (e.g., `{ physical: number, logical: number }`). For the 'removed' action, this is the HLC of the removal event.

      - `action` `{string}` – Indicates the type of event:
        - `'initial'`: For existing nodes matching the query when `map` is first subscribed. This provides the initial dataset directly to the callback, often making separate handling of the `results` array (returned by `map`) unnecessary for real-time UI updates.
        - `'added'`: When a new node matching the query is inserted.
        - `'updated'`: When an existing node matching the query is modified.
        - `'removed'`: When a node matching the query is deleted.

    - **If you also need `edges` or `timestamp`, you can easily include them in the destructuring: `({ id, value, action, edges, timestamp })`.**

---

- **Returns**: `Promise<Object>` – A Promise that resolves to an object containing:

  - `results`: `Array<Object>` – An array of nodes that match the query at the time of the call. Each node object includes `id`, `value`, `edges`, and `timestamp`.

  - `unsubscribe`: `Function` _(optional)_ – If real-time mode is active, this function is provided to stop listening for updates. Calling it will remove the real-time listener.

---

### Recursive Graph Traversal Queries with the `$edge` Operator

This is one of the most powerful features of GenosDB. The `$edge` operator transforms a standard query into a **graph exploration tool**. It uses the initial matching nodes as starting points to traverse their entire descendant tree (children, grandchildren, and so on), returning a final, flat list of all descendant nodes that match the specified criteria.

This allows you to perform complex, multi-hop graph traversals within a single, declarative query.

##### How It Works

A query with `$edge` has two logical parts:

1.  **The Starting Point Query:** The main part of the query object (`type`, `name`, etc.) is used to find the node(s) from which the traversal will begin.
2.  **The Descendant Filter:** The object provided as the value for `$edge` is a sub-query that will be applied to **every single node** found during the exploration of the descendant tree.

The final result of `db.map()` will be an array of the descendant nodes that matched the `$edge` sub-query, not the starting nodes.

##### Syntax and Example

```javascript
// From a 'Folder' node named 'Documents', find all descendant 'File' nodes
// that are either images or have a size greater than 1024 bytes.

const { results } = await db.map({
  query: {
    // 1. This part finds the starting point(s) for the traversal.
    type: "Folder",
    name: "Documents",

    // 2. This operator starts the exploration from the found folder(s).
    $edge: {
      // 3. This sub-query is applied to EVERY descendant.
      // It can use any operator, including logical ones.
      type: "File",
      $or: [{ extension: "jpg" }, { size: { $gt: 1024 } }],
    },
  },
})

// `results` will be an array containing only the File nodes that matched the
// $or condition, regardless of their depth in the folder structure.
console.log(results)
```

This approach gives you complete control to pinpoint specific nodes within complex, nested structures, making it an essential tool for any graph-based application.

```js
// --- Static Query ---
// Get filtered and sorted nodes (options object)
const { results } = await db.map({
  query: { type: "user" },
  field: "name",
  order: "asc",
})
console.log("Sorted users:", results)

// --- Real-time Query ---
// Listen to all nodes in real-time (only callback function)
// Note: The `map` call also returns `results` containing the initial data set.
// const { results: initialData, unsubscribe } = await db.map(...);

// Notice how the callback in the example below uses the concise `({ id, value, action })` signature
// to process events, destructuring only the necessary properties.
const { unsubscribe } = await db.map(({ id, value, action }) => {
  // In this example, 'edges' and 'timestamp' are available in the event object
  // but are not explicitly destructured or used for brevity.
  if (action === "initial") {
    console.log(`[INITIAL DATA] ID: ${id}`, value)
  }
  if (action === "added") {
    console.log(`[NODE ADDED] ID: ${id}`, value)
  }
  if (action === "updated") {
    console.log(`[NODE UPDATED] ID: ${id}`, value)
  }
  if (action === "removed") {
    console.log(`[NODE REMOVED] ID: ${id}`) // 'value' might be null or last known state
  }
})

// To stop listening for real-time updates:
// if (unsubscribe) unsubscribe();

// Best practice: When using db.map() callback, prefer destructuring parameters like `({ id, value, action }) => { ... }`.
// This approach improves readability by directly extracting properties from the event object,
// making the code cleaner and easier to maintain.
```

> **More examples**: See [.map()](<https://github.com/estebanrfp/gdb/wiki/.map()>) for logical operators and pagination.

---

### `clear()`

Removes all nodes and indexes.

- **Returns**: `{Promise<void>}`

```js
await db.clear()
```

---

### GenosRTC API Reference

Every `GDB` instance includes a `db.room` object, powered by the internal **GenosRTC** module, for real-time peer-to-peer communication.

The `db.room` object allows you to handle peer connections, send data, and stream audio/video directly between users.

#### Key Concepts

- **Joining a Room**: A room is automatically created and joined when you instantiate `GDB`. The database name serves as the room identifier.
- **Events**: Use `db.room.on(eventName, callback)` to react to events.
- **Data Channels**: Use `db.room.channel(type)` to send and receive any kind of data.
- **Media Streams**: Use `db.room.addStream(stream)` to send audio or video.

---

#### Handling Peer Connections

Listen for peers joining or leaving the room.

```javascript
// A peer joins the room
db.room.on("peer:join", (peerId) => {
  console.log(`Peer ${peerId} has joined.`)
})

// A peer leaves the room
db.room.on("peer:leave", (peerId) => {
  console.log(`Peer ${peerId} has left.`)
})
```

---

#### Sending & Receiving Data

Create a named channel to send and receive data like chat messages or game states.

```javascript
// Create a channel for cursor positions
const cursorChannel = db.room.channel("cursor-positions")

// Listen for data from other peers
cursorChannel.on("message", (position, peerId) => {
  console.log(`Peer ${peerId} moved their cursor to:`, position)
  // Example: update cursor position in the UI
})

// Send your data to all peers
window.addEventListener("mousemove", (e) => {
  cursorChannel.send({ x: e.clientX, y: e.clientY })
})
```

---

#### Streaming Audio & Video

Capture the user's webcam and stream it to other peers in the room.

```javascript
// Get user's camera and microphone
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
})

// Send the stream to everyone in the room
db.room.addStream(localStream)

// Listen for streams from other peers
db.room.on("stream:add", (stream, peerId) => {
  console.log(`Receiving a video stream from ${peerId}.`)
  // Example: create a <video> element and attach the stream
})
```

> For more details and advanced options, please refer to the complete **[GenosRTC API Reference](https://github.com/estebanrfp/gdb/wiki/GenosRTC-API-Reference)** documentation.

---

## ⚠️ API Stability

> This API is under active development. **Breaking changes may occur** in future versions.  
> Check the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) for updates. Use at your own risk in production environments.

---

## RBAC API Reference
> Provides Role-Based Access Control (RBAC), identity management (WebAuthn, Mnemonic), and security features for GDB instances. This system enables fine-grained permission control over data operations in a distributed P2P environment.

## 📥 Import

### 1. Via NPM

```javascript
import * as rbac from "genosdb/dist/rbac.min.js"
// import { createSecurityContext, assignRole, ... } from 'genosdb/dist/rbac.min.js';

```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import * as rbac from 'https://cdn.jsdelivr.net/npm/genosdb/dist/rbac.min.js/+esm';
</script>
```

---

## 📖 Overview & Core Concepts

The RBAC module for GDB integrates several key security aspects:

1.  **Identity Management**: Users are identified by Ethereum addresses. The system supports:
    - **WebAuthn**: Secure, passwordless authentication using biometrics or hardware keys to protect/unseal a user's Ethereum private key.
    - **Mnemonic Phrases**: Traditional BIP39 phrases for account creation and recovery.
2.  **Role-Based Access Control (RBAC)**:
    - A configurable hierarchy of roles (e.g., `guest`, `user`, `admin`) defines what actions users can perform.
    - Permissions are granular (e.g., `read`, `write`, `assignRole`).
    - Role assignments are stored within GDB itself, making them part of the synchronized state.
3.  **P2P Operation Security**:
    - Outgoing database operations are cryptographically signed by the active user.
    - Incoming operations from peers are verified for signature validity and sender permissions before being applied.
4.  **Local Data Encryption**: Authenticated users can encrypt/decrypt data for their own use, tied to their identity.

The **`SoftwareWalletManager`** handles identity material (private keys, mnemonics) and WebAuthn interactions. The **`SoftwareSecurityManager`** (configured on the GDB instance by this RBAC module) enforces P2P security by signing/verifying operations and checking RBAC permissions.

---

## 🚀 Core Setup & Lifecycle

### `createSecurityContext(db, superAdminsArray?)`

Initializes the RBAC security layer for a given GDB instance. This is the **primary entry point** for using the RBAC module. It configures GDB to use a `SoftwareSecurityManager` (initially in a verifier-only mode if no user is logged in), attempts silent WebAuthn login if applicable, and prepares the system for secure operations.

- **Parameters**:
  - `db` `{GDB}` – An initialized instance of `GDB`.
  - `superAdminsArray` `{Array<string>}` _(optional)_ – An array of Ethereum addresses (strings) that should be considered super administrators. These addresses will have the `superadmin` role by default if their user node doesn't exist or has no role.
- **Returns**: `{Promise<void>}`

#### Example

```javascript
import { GDB } from "genosdb"
import * as rbac from "genosdb/dist/rbac.min.js"

const db = new GDB("myAppDB")

const SUPERADMIN_ADDRESSES = ["0xYourSuperAdminEthAddress1"]

async function initializeApp() {
  await rbac.createSecurityContext(db, SUPERADMIN_ADDRESSES)
  console.log("RBAC Security Context Initialized for GDB.")
  // UI can now be updated based on rbac.isSecurityActive(), rbac.getActiveEthAddress(), etc.
}

initializeApp()
```

---

### `clearSecurity()`

Logs out the current user. This deactivates local signing capability by removing the active `signer` from GDB's `SoftwareSecurityManager`. It also clears any volatile identity information (like a just-generated mnemonic) and removes WebAuthn session flags from local storage. GDB's `SoftwareSecurityManager` will revert to (or remain in) a verifier-only mode for incoming P2P operations.

- **Returns**: `{Promise<void>}`

#### Example

```javascript
await rbac.clearSecurity()
console.log("User logged out, local signing capabilities deactivated.")
// Update UI to reflect logged-out state
```

---

### `setSecurityStateChangeCallback(callback)`

Sets a callback function to be notified of changes in the RBAC security state. This is useful for dynamic UI updates reflecting login status, active user, etc.

- **Parameters**:
  - `callback` `{(securityState: Object) => void | null}` – A function that will be called with a `securityState` object, or `null` to remove the existing callback.
    - `securityState` `{Object}`:
      - `isActive` `{boolean}` – True if a local user session is active with signing capabilities.
      - `activeAddress` `{string | null}` – The Ethereum address of the currently active user (if any), or `null`.
      - `isWebAuthnProtected` `{boolean}` – True if the current active session was initiated or is protected by WebAuthn.
      - `hasVolatileIdentity` `{boolean}` – True if a new ETH identity has been generated (e.g., via `startNewUserRegistration`) and is held in memory but not yet secured by WebAuthn.
      - `hasWebAuthnHardwareRegistration` `{boolean}` – True if WebAuthn registration details are found in localStorage for this browser/domain, indicating a WebAuthn credential exists.
- **Returns**: `{void}`

#### Example

```javascript
rbac.setSecurityStateChangeCallback((securityState) => {
  console.log("RBAC Security State Changed:", securityState)
  // Example UI update:
  const statusDisplay = document.getElementById("statusDisplay")
  if (securityState.isActive) {
    statusDisplay.textContent = `Logged in as: ${securityState.activeAddress}`
  } else {
    statusDisplay.textContent = "Logged out. WebAuthn available: " + securityState.hasWebAuthnHardwareRegistration
  }
})
```

---

## 🆔 Identity Management

These methods manage user identities, supporting both WebAuthn and mnemonic-based approaches.

### `startNewUserRegistration()`

Generates a new, temporary Ethereum identity (address, private key, mnemonic). This identity is volatile (held in memory) and is intended for immediate use, typically followed by protection with WebAuthn or a direct mnemonic-based login. If a security session is already active, `clearSecurity()` will be called first.

- **Returns**: `{Promise<{address: string, mnemonic: string, privateKey: string} | null>}` – An object containing the new identity details (address, mnemonic, privateKey), or `null` if generation fails.

#### Example

```javascript
try {
  const newIdentity = await rbac.startNewUserRegistration()
  if (newIdentity) {
    console.log("New ETH Identity Generated (Volatile):")
    console.log("Address:", newIdentity.address)
    console.log("IMPORTANT - Save Mnemonic Phrase NOW:", newIdentity.mnemonic)
    // UI should strongly prompt user to securely save the mnemonic,
    // then offer to protect this new identity with WebAuthn.
  }
} catch (error) {
  console.error("Failed to generate new identity:", error)
}
```
---
## 🆔 Identity Management
_(Esta sección permanece igual: `startNewUserRegistration`, `protectCurrentIdentityWithWebAuthn`, `loginCurrentUserWithWebAuthn`, `loginOrRecoverUserWithMnemonic`)_

---

## 🔒 Secure Data Storage with RBAC

These functions provide a simple API, similar to GDB's core `put` and `get`, but with automatic, implicit data compression and encryption tied to the active user's identity. They use an internal ID prefixing scheme to store data in a separate "namespace" within the GDB instance, preventing clashes with data written by direct `gdb.put` calls.

It's important to note that while these functions handle data encryption, the actual P2P operations generated (and subsequently signed by the `SoftwareSecurityManager`) will contain the encrypted payload.

### `rbac.put(originalValue, userProvidedId?)`

-   **Signature**: `(originalValue: any, userProvidedId?: string): Promise<string>`

Stores data securely in the GDB instance. The `originalValue` is first compressed, then encrypted using a key derived from the active user's Ethereum identity.
-   If a `userProvidedId` (a string) is given, RBAC will internally prefix this ID (e.g., `rbacSecure$<userProvidedId>`) to determine the actual storage key in GDB.
-   If `userProvidedId` is `undefined`, RBAC will generate a unique key for the user (which becomes the user-facing ID), prefix it, and use that as the storage key in GDB.

-   **Parameters**:
    -   `originalValue` `{any}` – The data to store. It must be JSON-serializable.
    -   `userProvidedId` `{string}` _(optional)_ – The user-facing ID for this piece of data. If not provided, a new ID will be generated by RBAC and returned.
-   **Returns**: `{Promise<string>}` – The `userProvidedId` (or the RBAC-generated ID if none was provided) that can be used with `rbac.get()` to retrieve the data.

#### Example

```javascript
// Assuming RBAC is initialized and a user is logged in.
const mySecretData = { task: "Buy milk", details: "Organic, full fat" };
const myNoteId = "shoppingListApril"; // User-friendly ID

try {
  const returnedId = await rbac.put(mySecretData, myNoteId);
  console.log(`Secure data saved with user ID: ${returnedId}`); // Logs: "shoppingListApril"
  // Internally, it's stored in GDB under an ID like "rbacSecure$shoppingListApril"
} catch (error) {
  console.error("Failed to save secure data:", error.message);
}

// Example with RBAC generating the ID
try {
  const generatedId = await rbac.put({ anotherSecret: "meeting notes" });
  console.log(`Secure data saved with RBAC-generated ID: ${generatedId}`);
} catch (error) {
  console.error("Failed to save secure data:", error.message);
}
```

### `rbac.get(userProvidedId, callback?)`

-   **Signature**: `(userProvidedId: string, callback?: Function): Promise<{ result: object | null, unsubscribe?: Function }>`

Retrieves and automatically attempts to decrypt data that was previously stored using `rbac.put()` by the **current active user**.
-   It uses the `userProvidedId` to construct the internal storage ID (e.g., `rbacSecure$<userProvidedId>`) and fetches the data from GDB.
-   If the fetched data is an RBAC-managed encrypted payload and belongs to the current user, it's decrypted and decompressed.
-   The `callback`, if provided, enables real-time updates. The callback will receive a node object where `value` is the processed data.

-   **Parameters**:
    -   `userProvidedId` `{string}` – The user-facing ID of the data to retrieve (this is the ID you used with or got back from `rbac.put`).
    -   `callback` `{Function}` _(optional)_ – A function to call with updates. It receives a node object: `{ id: string, value: any, edges: Array, timestamp: object, decrypted: boolean }`.
-   **Returns**: `{Promise<object>}` – An object containing:
    -   `result` `{object | null}`: The processed node object or `null` if not found. The node object structure is:
        -   `id` `{string}`: The `userProvidedId`.
        -   `value` `{any}`:
            -   If decryption was successful: The original, decrypted (and decompressed) data.
            -   If decryption failed or was not possible (e.g., not owner, no session): The raw encrypted ciphertext (hex string) that was stored.
            -   If the node retrieved from GDB was not an RBAC-encrypted payload (e.g., public data stored under a prefixed ID by mistake): The original value from GDB.
        -   `edges` `{Array}`: Edges of the node (typically empty for simple data).
        -   `timestamp` `{object}`: The GDB timestamp of the node.
        -   `decrypted` `{boolean}`: `true` if the data was successfully decrypted by RBAC in this call, `false` otherwise.
    -   `unsubscribe` `{Function}` _(optional)_: If a `callback` was provided, this function stops the real-time listener.

#### Example: Getting Secure Data

```javascript
// Assuming RBAC is initialized and a user is logged in.
const noteIdToRetrieve = "shoppingListApril";

try {
  const { result: node } = await rbac.get(noteIdToRetrieve);

  if (node) {
    console.log("Node ID:", node.id); // "shoppingListApril"
    console.log("Was Decrypted by RBAC:", node.decrypted);
    
    if (node.decrypted) {
      console.log("Decrypted Content:", node.value); // Should be { task: "Buy milk", ... }
    } else {
      console.warn("Could not decrypt or data was not an RBAC secure payload. Value received:", node.value);
      // node.value here would be the ciphertext or original public data if a non-RBAC node was fetched by mistake
    }
  } else {
    console.log("Node not found with rbac.get using ID:", noteIdToRetrieve);
  }
} catch (error) {
  console.error("Error getting secure data:", error.message);
}
```

#### Example: Real-time Secure Data

```javascript
// Assuming RBAC is initialized and a user is logged in.
const noteIdToWatch = "sharedSecretProjectPlan";

const { unsubscribe } = await rbac.get(noteIdToWatch, (node) => {
  if (node) {
    if (node.decrypted) {
      console.log("Real-time Decrypted Update:", node.id, node.value);
      // Update UI with node.value
    } else {
      console.warn("Real-time Update (Not Decrypted or Not RBAC Payload):", node.id, "Value:", node.value);
      // Update UI to show placeholder or indicate data is ciphertext / public
    }
  } else {
    console.log("Real-time: Node", noteIdToWatch, "was removed or not found.");
    // Update UI to reflect removal
  }
});

// Later, to stop listening:
// if (unsubscribe) unsubscribe();
```
---

### `protectCurrentIdentityWithWebAuthn(ethPrivateKeyForProtection?)`

Initiates the WebAuthn registration process to protect an Ethereum private key. The private key is encrypted using a WebAuthn-derived secret and stored in localStorage.
If `ethPrivateKeyForProtection` (a hex string) is provided, it uses that key. Otherwise, it attempts to use the private key from a `volatileIdentity` (previously generated by `startNewUserRegistration`). Upon successful WebAuthn registration, a local signing session is activated with this identity.

- **Parameters**:
  - `ethPrivateKeyForProtection` `{string}` _(optional)_ – The Ethereum private key (hex string) to protect. If omitted, uses the key from the current volatile identity, if one exists.
- **Returns**: `{Promise<string | null>}` – The Ethereum address of the protected identity if successful, otherwise `null`.

#### Example

```javascript
// Assuming newIdentity was obtained from startNewUserRegistration()
// const privateKey = newIdentity.privateKey;
// Or, if the user provided an existing private key they wish to protect with WebAuthn:
// const privateKey = "0xUserProvidedPrivateKeyHex...";

try {
  // const privateKeyToUse = ... get from newIdentity or user input ...
  const protectedAddress = await rbac.protectCurrentIdentityWithWebAuthn(
    privateKeyToUse // Replace with actual private key variable
  )
  if (protectedAddress) {
    console.log(
      `Identity ${protectedAddress} successfully protected with WebAuthn and session started.`
    )
  } else {
    console.error(
      "WebAuthn protection failed. Ensure browser support and HTTPS/localhost."
    )
  }
} catch (error) {
  console.error("Error during WebAuthn protection:", error)
}
```

---

### `loginCurrentUserWithWebAuthn()`

Initiates the WebAuthn authentication (assertion) process for a user previously registered with WebAuthn on this browser/domain. This requires user interaction with their WebAuthn authenticator (e.g., biometrics, security key). If successful, it decrypts the stored Ethereum private key and activates a local signing session.

- **Returns**: `{Promise<string | null>}` – The Ethereum address of the logged-in user if successful, otherwise `null`.

#### Example

```javascript
try {
  const loggedInAddress = await rbac.loginCurrentUserWithWebAuthn()
  if (loggedInAddress) {
    console.log(`Successfully logged in with WebAuthn as ${loggedInAddress}.`)
  } else {
    console.warn(
      "WebAuthn login failed. Ensure an authenticator is registered and used correctly for this site."
    )
  }
} catch (error) {
  console.error("Error during WebAuthn login:", error)
}
```

---

### `loginOrRecoverUserWithMnemonic(mnemonic)`

Loads or recovers an Ethereum identity using a provided BIP39 mnemonic phrase. If successful, this identity becomes active for the current session with signing capabilities. The session established this way is **not** WebAuthn-protected by this call alone; `protectCurrentIdentityWithWebAuthn` would need to be called subsequently if WebAuthn protection is desired for this identity on this device.

- **Parameters**:
  - `mnemonic` `{string}` – The BIP39 mnemonic phrase.
- **Returns**: `{Promise<{address: string, mnemonic: string, privateKey: string} | null>}` – An object with the identity details if successful, otherwise `null`.

#### Example

```javascript
const mnemonicPhrase = "your twelve word secret recovery phrase goes here..." // User provides this
try {
  const recoveredIdentity = await rbac.loginOrRecoverUserWithMnemonic(
    mnemonicPhrase
  )
  if (recoveredIdentity) {
    console.log(
      `Logged in/Recovered identity for ${recoveredIdentity.address}.`
    )
    // User can now optionally call protectCurrentIdentityWithWebAuthn()
    // using recoveredIdentity.privateKey if they wish to secure this identity with WebAuthn
    // for future logins on this device.
  } else {
    console.error(
      "Failed to log in/recover with mnemonic. Please check the phrase."
    )
  }
} catch (error) {
  console.error("Error during mnemonic login/recovery:", error)
}
```

---

## 👑 Role Management & Permissions

### `setCustomRoles(customRoles)`

Defines or overrides the default role hierarchy and associated permissions. This allows for fine-grained, application-specific access control configurations.
_Note: `customRoles` expects an object structured like `{ roleName: { can: ['permission1'], inherits: ['otherRole'] } }`._

- **Signature**: `(customRoles: CustomRolesObject): void`
- **Returns**: `{void}`

#### Custom Roles Configuration Example

```javascript
// import { setCustomRoles } from "genosdb/dist/rbac.min.js"; // Example import path

const myAppRoles = {
  superadmin: { can: ["assignRole", "deleteAny"], inherits: ["admin"] },
  admin: { can: ["delete"], inherits: ["manager"] },
  manager: { can: ["publish"], inherits: ["user"] },
  user: { can: ["write", "link", "sync"], inherits: ["guest"] },
  guest: { can: ["read"] },
}

rbac.setCustomRoles(myAppRoles) // Use the imported rbac object
console.log("Custom roles have been set.")
```
This allows for granular control over permissions and role inheritance, tailored to the application's needs.

---

### `assignRole(targetUserEthAddress, role, expiresAt?)`

Assigns a specified role to a target user's Ethereum address. **Important:** This function itself does *not* perform an RBAC check on the caller; it's assumed that the caller's permission to assign roles (typically the `'assignRole'` permission) has already been verified, for example, by using `executeWithPermission('assignRole', ...)` before calling this function. Role assignments are stored as nodes within the GDB instance.

- **Signature**: `(targetUserEthAddress: string, role: string, expiresAt?: string | Date | number): Promise<void>`
- **Parameters**:
  - `targetUserEthAddress` `{string}` – The Ethereum address of the user to whom the role will be assigned.
  - `role` `{string}` – The name of the role to assign (e.g., `'user'`, `'manager'`). Must be a role defined in the active role configuration.
  - `expiresAt` `{string | Date | number}` _(optional)_ – An ISO date string, JavaScript Date object, or a timestamp in milliseconds indicating when this role assignment should expire. If `null` or omitted, the role assignment does not expire.
- **Returns**: `{Promise<void>}` – The promise resolves on successful GDB operation. It throws an error if parameters are invalid (e.g., role doesn't exist) or if the GDB `put` operation fails.

#### Example: Assigning a Role with Expiration (after permission check)

```javascript
// Assuming 'db' is your GDB instance.
const targetUser = "0xTargetUserAddressToBeAssignedARole...";
const newRole = "editor";
const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Expires in 30 days

try {
  // First, verify the current user has permission to assign roles
  const assignerAddress = await rbac.executeWithPermission('assignRole');
  console.log(`User ${assignerAddress} has 'assignRole' permission. Proceeding to assign role.`);

  // If permission is granted, then call assignRole
  await rbac.assignRole(targetUser, newRole, thirtyDaysFromNow);
  console.log(
    `Role '${newRole}' assignment for ${targetUser} (expiring ${thirtyDaysFromNow.toISOString()}) written to GDB.`
  );
} catch (error) {
  console.error(`Failed to assign role: ${error.message}`);
  // This will catch errors from executeWithPermission (no permission) or from assignRole (bad role, GDB error)
}
```

---

### `executeWithPermission(operationName)`

Verifies if the currently authenticated user has the specified `operationName` permission based on their role stored in GDB and their current authentication method (WebAuthn or a mnemonic-based session). This function should be called *before* attempting a potentially restricted GDB operation or other sensitive actions.

- **Signature**: `(operationName: string): Promise<string>`
- **Parameters**:
  - `operationName` `{string}` – The name of the permission/action to check against the user's role (e.g., `'write'`, `'delete'`, `'assignRole'`).
- **Returns**: `{Promise<string>}` – A promise that resolves with the Ethereum address of the currently authenticated user if permission is granted. It rejects with an error if permission is denied, if no user is authenticated with signing capability, or if other issues occur during the permission check.

#### Example: Protected Operation with Permission Verification

```javascript
// Attempt to delete a GDB node, but only if the current user has 'delete' permission.
const nodeIdToDelete = "some_node_id";
try {
  // Verify permission first
  const currentUserAddress = await rbac.executeWithPermission("delete");
  
  // If executeWithPermission resolved, the user has permission.
  console.log(`User ${currentUserAddress} has 'delete' permission. Proceeding to delete node ${nodeIdToDelete}.`);
  await db.remove(nodeIdToDelete); // The actual GDB operation; will be signed if security is active.
  console.log(`Node ${nodeIdToDelete} delete operation sent.`);

} catch (error) {
  console.error(`Operation to delete node ${nodeIdToDelete} failed: ${error.message}`);
  // Example error: "RBAC: User 0x123... (role viewer) does not have permission for 'delete'."
}
```

---

## ℹ️ UI State & Helper Functions

These are utility functions primarily intended for querying the current RBAC and identity state, often used for updating user interfaces.

### `getActiveEthAddress()`

- **Description**: Returns the Ethereum address of the currently logged-in user who has an active signing session.
- **Returns**: `{string | null}` – The Ethereum address, or `null` if no session with signing capability is active.

### `isSecurityActive()`

- **Description**: Checks if there is an active local user session with signing capabilities (i.e., GDB's `SoftwareSecurityManager` has an active `signer`).
- **Returns**: `{boolean}` – `true` if signing is active, `false` otherwise.

### `isCurrentSessionProtectedByWebAuthn()`

- **Description**: Indicates if the current active signing session was established or is protected using WebAuthn.
- **Returns**: `{boolean}` – `true` if the session is WebAuthn-based, `false` otherwise (e.g., mnemonic-based).

### `hasExistingWebAuthnRegistration()`

- **Description**: Checks if WebAuthn registration details are found in the browser's `localStorage` for the current website/domain, suggesting a user has previously registered a WebAuthn authenticator.
- **Returns**: `{boolean}` – `true` if registration details exist, `false` otherwise.

### `getMnemonicForDisplayAfterRegistrationOrRecovery()`

- **Description**: Retrieves the mnemonic phrase if a new identity was just generated (via `startNewUserRegistration`) or an identity was just recovered/loaded via mnemonic (via `loginOrRecoverUserWithMnemonic`), AND the session is not yet (or not solely) a WebAuthn-protected one. This is for displaying a "fresh" mnemonic that's still in volatile memory. Returns `null` if the session is purely WebAuthn-based from the start, or no such volatile mnemonic is available.
- **Returns**: `{string | null}` – The mnemonic phrase or `null`.
- **Caution**: Displaying mnemonic phrases should be done with extreme care, warning users about the security risks.

---

## 📝 Notes on Decentralization and PoC Status

> The current RBAC implementation, particularly role management, operates by storing role assignments within GDB itself. While GDB is a P2P database, the authority for assigning roles ultimately relies on the permissions defined (e.g., `superadmin` having `assignRole`).
>
> The goal is to create a fully client-side, decentralized system. All operations are executed client-side. Future research and development may explore:
>
> - Verifying role assignments or complex permissions via smart contracts for a higher degree of decentralized trust and tamper-resistance.
> - Advanced cryptographic techniques for P2P group-based permissions.
>
> For now, the system functions as a robust proof-of-concept for P2P applications requiring sophisticated access control.

---

## ⚠️ API Stability

> This RBAC API is under active development alongside GDB. **Breaking changes may occur** in future versions.
> Always consult the project's [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) or release notes for updates before upgrading. Use with consideration in production environments.

## Usage Examples

You can find practical examples of how to use this library in the [examples](https://github.com/estebanrfp/gdb/wiki/EXAMPLES.md) document.

## GenosRTC API Reference
# 📘 API Reference

> Minimalist Graph Database with P2P support and real-time querying.

## 📦 Installation

```bash
npm install genosdb
```

## 📥 Import

### 1. Via NPM

```javascript
import { GDB } from "genosdb"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { GDB } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"
</script>
```

---

## 📦 Constructor

### `new GDB(name, options?)`

Initializes a new database instance.

- **Parameters**:
  - `name` `{string}` – Database name (used for local storage or sync).
  - `options` `{Object}` _(optional)_:
    - `password` `{string}` – Optional encryption key.
    - `relayUrls` `{string[]}` – Optional – Custom list of secure WebSocket relay URLs (for Nostr). When provided, this replaces the default relay list and overrides `relayRedundancy`.
    - `turnConfig` `{Array<Object>}` – Optional – Configuration for TURN servers. Each object can include:
      - `urls` `{string | string[]}` – Single URL or array of URLs to access the TURN server.
      - `username` `{string}` – Username for TURN authentication.
      - `credential` `{string}` – Password or token for TURN authentication.

- **Returns**: `GDB` instance.

#### Initialize without a password

```js
const db = new GDB("my-db")
```

#### Initialize with a password (optional)

```js
const secureDb = new GDB("secure-db", { password: "secret" })
```

#### `relayUrls` (opcional)

To specify custom relays for Nostr when initializing the database:

```javascript
const db = new GDB("my-db", {
  relayUrls: ["wss://relay1.example.com", "wss://relay2.example.com"],
})
```

#### `turnConfig` (opcional)

Once you have a TURN server, configure GenosDB with it like this:

```javascript
const turnConfig = [
  {
    // single string or list of strings of URLs to access TURN server
    urls: ["turn:your-turn-server.ok:1979"],
    username: "username",
    credential: "password",
  },
]

const db = new GDB("my-db", { turnConfig })
```

---

## 🧩 Core Methods

### `put(data, id?)`

Inserts or updates a node.

- **Parameters**:
  - `data` `{Object}` – Node content (must be serializable).
  - `id` `{string}` _(optional)_ – If provided, updates the node.
- **Returns**: `{Promise<string>}` – Node ID (hash or custom).

```js
const id = await db.put({ type: "User", name: "Ana" })
await db.put({ name: "Ana B" }, id)
```

> **More examples**: See [.put()](<https://github.com/estebanrfp/gdb/wiki/.put()>).

---

### `get(id)`

Retrieves a node by its ID.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<{ result: { id: string, value: Object, timestamp: Object } } | null>}`
  - `result.timestamp`: The node's Hybrid Logical Clock (HLC) timestamp object (e.g., `{ physical: number, logical: number }`).

```js
const { result } = await db.get(id)
```

> **More examples**: See [.get()](<https://github.com/estebanrfp/gdb/wiki/.get()>).

---

### `link(sourceId, targetId, label?)`

Creates a directed relationship between two nodes.

- **Parameters**:
  - `sourceId` `{string}`
  - `targetId` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.link(sourceId, targetId)
```

---

### `remove(id)`

Deletes a node and its references.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.remove(id)
```

---

### `map(...args)`

Queries nodes and can listen for real-time updates.
It flexibly accepts zero or more arguments. Typically, these are:

- An **options object** (for `queryConfig`) to define filtering, sorting, etc.
- A **callback function** to process real-time updates.

The order of these arguments does not matter.

- **Arguments (`...args`)**:

  - `options` `{Object}` _(optional)_ – Configuration for the query. If an object is passed, its properties will be merged with the default query options.
    - `query` `{Object}` – MongoDB-style filter. Defaults to `{}` (all nodes). Supports advanced operators, including the recursive `$edge` operator for graph traversal.
    - `field` `{string}` _(optional)_ – Sort field.
    - `order` `{string}` _(optional)_ – `'asc'` | `'desc'`. Defaults to `'asc'`.
    - `$limit` `{number}` _(optional)_ – Limit the number of results.
    - `$after` `{string}` _(optional)_ – Paginate after a specific node ID.
    - `$before` `{string}` _(optional)_ – Paginate before a specific node ID.
    - `realtime` `{boolean}` _(optional)_ – Explicitly enable or disable real-time mode. If a `callback` is provided and `realtime` is not explicitly set to `false` in options, real-time mode is automatically enabled. Defaults to `false`.
  - `callback` `{Function}` _(optional)_ – If provided, enables real-time mode (unless `realtime: false` is in options). This function is invoked with an event object for:

    1.  Each node initially matching the query (`action: 'initial'`).
    2.  Any subsequent changes (additions, updates, removals) to nodes that match the query.

    - The callback receives a single event object argument. **It's common and recommended to destructure the properties you need directly in the function's signature. The most frequent and often sufficient signature is `({ id, value, action })`**.
    - This full event object contains:

      - `id` `{string}` – The ID of the node.
      - `value` `{Object}` – The content of the node. For the `'removed'` action, `value` will be `null`.
      - `edges` `{Array}` – An array of edges connected to the node. The developer can choose to use this data based on application needs.
      - `timestamp` `{Object}` – The node's Hybrid Logical Clock (HLC) timestamp (e.g., `{ physical: number, logical: number }`). For the 'removed' action, this is the HLC of the removal event.

      - `action` `{string}` – Indicates the type of event:
        - `'initial'`: For existing nodes matching the query when `map` is first subscribed. This provides the initial dataset directly to the callback, often making separate handling of the `results` array (returned by `map`) unnecessary for real-time UI updates.
        - `'added'`: When a new node matching the query is inserted.
        - `'updated'`: When an existing node matching the query is modified.
        - `'removed'`: When a node matching the query is deleted.

    - **If you also need `edges` or `timestamp`, you can easily include them in the destructuring: `({ id, value, action, edges, timestamp })`.**

---

- **Returns**: `Promise<Object>` – A Promise that resolves to an object containing:

  - `results`: `Array<Object>` – An array of nodes that match the query at the time of the call. Each node object includes `id`, `value`, `edges`, and `timestamp`.

  - `unsubscribe`: `Function` _(optional)_ – If real-time mode is active, this function is provided to stop listening for updates. Calling it will remove the real-time listener.

---

### Recursive Graph Traversal Queries with the `$edge` Operator

This is one of the most powerful features of GenosDB. The `$edge` operator transforms a standard query into a **graph exploration tool**. It uses the initial matching nodes as starting points to traverse their entire descendant tree (children, grandchildren, and so on), returning a final, flat list of all descendant nodes that match the specified criteria.

This allows you to perform complex, multi-hop graph traversals within a single, declarative query.

##### How It Works

A query with `$edge` has two logical parts:

1.  **The Starting Point Query:** The main part of the query object (`type`, `name`, etc.) is used to find the node(s) from which the traversal will begin.
2.  **The Descendant Filter:** The object provided as the value for `$edge` is a sub-query that will be applied to **every single node** found during the exploration of the descendant tree.

The final result of `db.map()` will be an array of the descendant nodes that matched the `$edge` sub-query, not the starting nodes.

##### Syntax and Example

```javascript
// From a 'Folder' node named 'Documents', find all descendant 'File' nodes
// that are either images or have a size greater than 1024 bytes.

const { results } = await db.map({
  query: {
    // 1. This part finds the starting point(s) for the traversal.
    type: "Folder",
    name: "Documents",

    // 2. This operator starts the exploration from the found folder(s).
    $edge: {
      // 3. This sub-query is applied to EVERY descendant.
      // It can use any operator, including logical ones.
      type: "File",
      $or: [{ extension: "jpg" }, { size: { $gt: 1024 } }],
    },
  },
})

// `results` will be an array containing only the File nodes that matched the
// $or condition, regardless of their depth in the folder structure.
console.log(results)
```

This approach gives you complete control to pinpoint specific nodes within complex, nested structures, making it an essential tool for any graph-based application.

```js
// --- Static Query ---
// Get filtered and sorted nodes (options object)
const { results } = await db.map({
  query: { type: "user" },
  field: "name",
  order: "asc",
})
console.log("Sorted users:", results)

// --- Real-time Query ---
// Listen to all nodes in real-time (only callback function)
// Note: The `map` call also returns `results` containing the initial data set.
// const { results: initialData, unsubscribe } = await db.map(...);

// Notice how the callback in the example below uses the concise `({ id, value, action })` signature
// to process events, destructuring only the necessary properties.
const { unsubscribe } = await db.map(({ id, value, action }) => {
  // In this example, 'edges' and 'timestamp' are available in the event object
  // but are not explicitly destructured or used for brevity.
  if (action === "initial") {
    console.log(`[INITIAL DATA] ID: ${id}`, value)
  }
  if (action === "added") {
    console.log(`[NODE ADDED] ID: ${id}`, value)
  }
  if (action === "updated") {
    console.log(`[NODE UPDATED] ID: ${id}`, value)
  }
  if (action === "removed") {
    console.log(`[NODE REMOVED] ID: ${id}`) // 'value' might be null or last known state
  }
})

// To stop listening for real-time updates:
// if (unsubscribe) unsubscribe();

// Best practice: When using db.map() callback, prefer destructuring parameters like `({ id, value, action }) => { ... }`.
// This approach improves readability by directly extracting properties from the event object,
// making the code cleaner and easier to maintain.
```

> **More examples**: See [.map()](<https://github.com/estebanrfp/gdb/wiki/.map()>) for logical operators and pagination.

---

### `clear()`

Removes all nodes and indexes.

- **Returns**: `{Promise<void>}`

```js
await db.clear()
```

---

### GenosRTC API Reference

Every `GDB` instance includes a `db.room` object, powered by the internal **GenosRTC** module, for real-time peer-to-peer communication.

The `db.room` object allows you to handle peer connections, send data, and stream audio/video directly between users.

#### Key Concepts

- **Joining a Room**: A room is automatically created and joined when you instantiate `GDB`. The database name serves as the room identifier.
- **Events**: Use `db.room.on(eventName, callback)` to react to events.
- **Data Channels**: Use `db.room.channel(type)` to send and receive any kind of data.
- **Media Streams**: Use `db.room.addStream(stream)` to send audio or video.

---

#### Handling Peer Connections

Listen for peers joining or leaving the room.

```javascript
// A peer joins the room
db.room.on("peer:join", (peerId) => {
  console.log(`Peer ${peerId} has joined.`)
})

// A peer leaves the room
db.room.on("peer:leave", (peerId) => {
  console.log(`Peer ${peerId} has left.`)
})
```

---

#### Sending & Receiving Data

Create a named channel to send and receive data like chat messages or game states.

```javascript
// Create a channel for cursor positions
const cursorChannel = db.room.channel("cursor-positions")

// Listen for data from other peers
cursorChannel.on("message", (position, peerId) => {
  console.log(`Peer ${peerId} moved their cursor to:`, position)
  // Example: update cursor position in the UI
})

// Send your data to all peers
window.addEventListener("mousemove", (e) => {
  cursorChannel.send({ x: e.clientX, y: e.clientY })
})
```

---

#### Streaming Audio & Video

Capture the user's webcam and stream it to other peers in the room.

```javascript
// Get user's camera and microphone
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
})

// Send the stream to everyone in the room
db.room.addStream(localStream)

// Listen for streams from other peers
db.room.on("stream:add", (stream, peerId) => {
  console.log(`Receiving a video stream from ${peerId}.`)
  // Example: create a <video> element and attach the stream
})
```

> For more details and advanced options, please refer to the complete **[GenosRTC API Reference](https://github.com/estebanrfp/gdb/wiki/GenosRTC-API-Reference)** documentation.

---

## ⚠️ API Stability

> This API is under active development. **Breaking changes may occur** in future versions.  
> Check the [CHANGELOG](https://github.com/estebanrfp/gdb/blob/main/CHANGELOG.md) for updates. Use at your own risk in production environments.

---
