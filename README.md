# GDB (GraphDB) + RBAC (Role Based Access Control)

Graph database with Role-Based Access Control (RBAC), P2P synchronization, and local storage in OPFS.

---

[![](https://data.jsdelivr.com/v1/package/npm/gdb-p2p/badge)](https://www.jsdelivr.com/package/npm/gdb-p2p)

## Main Features

### ✅ **GraphDB Core**

- Efficient storage in OPFS
- Real-time synchronization between tabs and devices
- CRUD operations for nodes and relationships
- Compressed serialization with MessagePack
- Automatic indexing for fast searches

## Advertencia

This project is under active development. Do not use it in production environments until it reaches the beta or stable phase. Check the [Project Status](#project-status) section for more details.

## Project Status

- **Phase**: Alpha
- **Completed Features**:
  - Basic queries.
  - Distributed storage.
  
- **Pending Features**:
  - Conflict resolution module.
  - Performance optimization.

### ✅ **Role Based Access Control (RBAC)**

- Customizable role hierarchy (`superadmin`, `admin`, etc)
- Authentication with Metamask
- Granular permissions (`read`/`write`/`delete`/`publish`)
- Role assignment with automatic expiration
- Cryptographic transaction verification

### ✅ **Security**

- Digital signature of critical operations
- Real-time permission validation
- Secure storage of roles in internal graph

> **Important Notice**: This project is currently in the research and development phase and is not yet ready for production use. Please wait until it reaches the beta or stable phase before deploying it in a live environment. Refer to the [Project Status](#project-status) section for more details.
---

## Installation

### 1. Via NPM

```bash
npm install gdb-p2p
```

## Basic Usage

### Initialize Database

```javascript
import GraphDB from "gdb-p2p"

const db = new GraphDB("myDatabase")
await db.ready // Esperar inicialización
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import {
    GraphDB,
    setCustomRoles,
    executeWithPermission,
  } from "https://cdn.jsdelivr.net/npm/gdb-p2p@0/+esm"

  const db = new GraphDB("myDatabase")
  await db.ready // Wait for initialization
</script>
```

**Nota**: CDNS disponibles:

```javascript
// jsDelivr
import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p@0/+esm"

// UNPKG
import { GraphDB } from "https://unpkg.com/gdb-p2p@latest"

// Skypack
import { GraphDB } from "https://cdn.skypack.dev/gdb-p2p@latest"
```

### Operaciones CRUD

```javascript
// Insert / update node
const nodeId = await db.put({ name: "Alice", age: 30 })

// Get node by ID
const node = await db.get(nodeId)

// Search by value
const found = await db.find({ name: "Alice" })

// Create relationship between nodes
await db.link(nodeId, "targetNodeId")

// Delete node
await db.remove(nodeId)
```

## Role-Based Access Control (RBAC)

### Custom Roles Configuration

```javascript
import { setCustomRoles } from "gdb-p2p"

// Custom roles definition
const customRoles = {
  admin: { can: ["delete", "assignRole"], inherits: ["editor"] },
  editor: { can: ["edit", "write"], inherits: ["guest"] },
  guest: { can: ["read"] },

  // Override default roles with custom configurations.
  // This allows for granular control over permissions and role inheritance.
};

setCustomRoles(customRoles)
```

### Authentication Flow

1. The user initiates authentication via Metamask.
2. The system verifies the user's credentials and signs the transaction cryptographically.
3. Roles and permissions are fetched from the internal graph storage.
4. Access is granted based on the user's role and permissions.

> **Note**: Currently, this implementation is a proof of concept (PoC) where roles are managed locally. In the future, role verification will be performed through a smart contract to ensure decentralized and tamper-proof authorization.

### Example: Protected Operation with Permission Verification

The following example demonstrates how to use `executeWithPermission` to verify permissions via Metamask before performing a protected operation.

Role assignments with expiration are useful for temporary access control. This implementation ensures that roles automatically expire after the specified duration, enhancing security in decentralized applications.

```javascript
import { executeWithPermission } from "gdb-p2p"

// Connects with Metamask to sign and verify permissions before executing the function
const userAddress = await executeWithPermission(db, "write")

// Executes a protected operation
await db.remove("nodeIdToDelete")
```

### Example: Assigning a Role with Expiration

```javascript
import { assignRole } from "gdb-p2p"

// Assign 'admin' role with expiration in 30 days
await assignRole(
  db,
  "0xUserAddress...",
  "admin",
  Date.now() + 30 * 24 * 60 * 60 * 1000
)
```

> **Note**: The goal of this implementation is to avoid centralized servers entirely. All operations are executed client-side, ensuring decentralization. We are actively researching options to enhance security in distributed applications, including code obfuscation, smart contracts, and other decentralized solutions. For now, this remains a proof of concept.

## Usage Examples

You can find practical examples of how to use this library in the [examples](https://github.com/estebanrfp/gdb/tree/main/examples) folder.

### Features

The following capabilities are supported by the system:

- **Basic Query**: Learn how to perform simple queries in the system.
- **Distributed Storage**: Understand how to configure and manage a distributed database.

Some examples include:
- Querying nodes by ID or value.
- Setting up peer-to-peer synchronization across devices.
- Defining custom roles and permissions for secure access.

## API Reference

### GraphDB API Reference

| Method                     | Description                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `put(value, id)`           | Inserts or updates a node with the provided value. If `id` is not specified, it is automatically generated.  |
| `get(id)`                  | Retrieves a node by its ID. Returns `null` if the node does not exist.                                       |
| `find(value)`              | Searches for nodes that match the provided value. Returns the most recently found node.                      |
| `link(sourceId, targetId)` | Creates a relationship between two nodes identified by `sourceId` and `targetId`.                            |
| `map(callback)`            | Iterates over all nodes in the database. Executes `callback` for each node.                                  |
| `remove(id)`               | Deletes a node by its ID. Also removes references to this node in other nodes.                               |
| `update(id, newValue)`     | Updates the value of an existing node.                                                                        |
| `clear()`                  | Deletes all nodes and relationships from the database.                                                       |

### RBAC API Reference

| Method                     | Description                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `put(value, id)`           | Inserts or updates a node with the provided value. If `id` is not specified, it is automatically generated.  |
| `get(id)`                  | Retrieves a node by its ID. Returns `null` if the node does not exist.                                       |
| `find(value)`              | Searches for nodes that match the provided value. Returns the most recently found node.                      |
| `link(sourceId, targetId)` | Creates a relationship between two nodes identified by `sourceId` and `targetId`.                            |
| `map(callback)`            | Iterates over all nodes in the database. Executes `callback` for each node.                                  |
| `remove(id)`               | Deletes a node by its ID. Also removes references to this node in other nodes.                               |
| `update(id, newValue)`     | Updates the value of an existing node.                                                                        |
| `clear()`                  | Deletes all nodes and relationships from the database.                                                       |

### **Events and Synchronization**

| Method/Event    | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| `on(callback)`  | Registers a listener for custom events (e.g., changes in the graph).                 |
| `off(callback)` | Unregisters a specific listener or all listeners.                                    |

### **Internal Dependencies**

Below is a list of internal dependencies and their purposes within the project:

| Dependency         | Usage                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------|
| `@msgpack/msgpack` | Data serialization/deserialization in MessagePack format.                              |
| `pako`             | Data compression/decompression using gzip.                                            |
| `trystero`         | P2P synchronization for sharing changes in real-time between tabs/devices.            |
| `BroadcastChannel` | Communication between browser tabs to notify local changes.                           |

#### Additional Information

- **`@msgpack/msgpack`**:  
  This library is used to efficiently serialize and deserialize data, reducing payload sizes for storage and transmission.

- **`pako`**:  
  Provides gzip compression to optimize data storage and network communication.

- **`trystero`**:  
  Enables peer-to-peer synchronization, ensuring real-time updates across multiple instances of the application.  
  > **Note**: Among the available networks supported by Trystero, this project specifically uses the **Nostr** protocol for decentralized communication.  
  >
  > **What is Nostr?**  
  > Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol designed for censorship-resistant global communication. It operates without relying on centralized servers, instead using a network of relays to transmit signed messages between peers. Nostr is particularly well-suited for applications requiring secure, private, and scalable peer-to-peer interactions, such as social networks, messaging systems, or collaborative tools.

- **`BroadcastChannel`**:  
  Facilitates lightweight communication between browser tabs, allowing seamless updates without relying on external servers.

> **General Note**: These dependencies are integral to the project's performance and functionality, ensuring efficient data handling and real-time synchronization while leveraging decentralized technologies like Nostr.

### Contributing

We welcome contributions to improve this project! Please read our [Contribution Guidelines](https://github.com/estebanrfp/gdb/wiki/Contributing) for details on how to get started.

### Licenses

This project includes third-party dependencies with their respective licenses. For detailed information, see the [Licenses page](https://github.com/estebanrfp/gdb/wiki/Licenses/) in the Wiki.

The source code of this project is licensed under the [MIT License](https://opensource.org/licenses/MIT). For more information, see the [LICENSE](LICENSE) file.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_shield&issueType=security)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_large&issueType=license)