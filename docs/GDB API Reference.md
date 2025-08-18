# 📘 API Reference

> Minimalist Graph Database with P2P support and real-time querying.

## 📦 Installation

```bash
npm install genosdb
```

## 📥 Import

### 1. Via NPM

```javascript
import { gdb } from "genosdb"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { gdb } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js"
</script>
```

---

## 🏭 Factory Function

### `await gdb(name, options?)`

Initializes a new database GDB object.

- **Parameters**:
  - `name` `{string}` – Database name (used for local storage or sync).
  - `options` `{Object}` _(optional)_:
    - `sm` `{boolean}` – If `true`, loads the Security Module.
    - `ai` `{boolean}` – If `true`, loads the AIQuery module.
    - `rx` `{boolean}` – If `true`, loads the Radix Index module.
    - `ii` `{boolean}` – If `true`, loads the Inverted Index module.
    - `geo` `{boolean}` – If `true`, loads the Geo module.
    - `password` `{string}` – Optional encryption key.
    - `relayUrls` `{string[]}` – Optional – Custom list of secure WebSocket relay URLs (for Nostr). When provided, this replaces the default relay list and overrides `relayRedundancy`.
    - `turnConfig` `{Array<Object>}` – Optional – Configuration for TURN servers. Each object can include:
      - `urls` `{string | string[]}` – Single URL or array of URLs to access the TURN server.
      - `username` `{string}` – Username for TURN authentication.
      - `credential` `{string}` – Password or token for TURN authentication.

- **Returns**: `gdb` object.

#### Initialize without a password

```js
const db = await gdb("my-db")
```

#### Initialize with a password (optional)

```js
const secureDb = await gdb("secure-db", { password: "secret" })
```

#### `relayUrls` (opcional)

To specify custom relays for Nostr when initializing the database:

```javascript
const db = await gdb("my-db", {
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

const db = await gdb("my-db", { turnConfig })
```

---

## 🧩 Core Methods

### `async put(value, id?)`

Inserts or updates a node.

- **Parameters**:
  - `value` `{Object}` – Node content (must be serializable).
  - `id` `{string}` _(optional)_ – If provided, updates the node.
- **Returns**: `{Promise<string>}` – Node ID (hash or custom).

```js
const id = await db.put({ type: "User", name: "Ana" })
await db.put({ name: "Ana B" }, id)
```

> **More examples**: See [.put()](<https://github.com/estebanrfp/gdb/wiki/.put()>).

---

### `async get(id, callback?)`

Retrieves a node by its ID. If a `callback` is provided, it enters reactive mode, invoking the callback immediately with the node's state and on any subsequent changes.

- **Parameters**:
  - `id` `{string}`
  - `callback` `{Function}` _(optional)_ – The callback function, which receives the full node object (`{ id, value, edges, timestamp }`) or `null` if the node is deleted.
- **Returns**: `{Promise<Object>}` – A promise resolving to an object with:
  - `result`: The initial node state.
  - `unsubscribe`: A function to stop listening for updates (if in reactive mode).

```js
const { result } = await db.get(id)
```

> **More examples**: See [.get()](<https://github.com/estebanrfp/gdb/wiki/.get()>).

---

### `async link(sourceId, targetId)`

Creates a directed relationship between two nodes.

- **Parameters**:
  - `sourceId` `{string}`
  - `targetId` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.link(sourceId, targetId)
```

---

### `async remove(id)`

Deletes a node and its references.

- **Parameters**:
  - `id` `{string}`
- **Returns**: `{Promise<void>}`

```js
await db.remove(id)
```

---

### `async map(...args)`

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

### `async clear()`

Removes all nodes and indexes.

- **Returns**: `{Promise<void>}`

```js
await db.clear()
```

---

### GenosRTC API Reference

Every `GDB` object includes a `db.room` object, powered by the internal **GenosRTC** module, for real-time peer-to-peer communication.

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
