# GDB (GraphDB) + RBAC (Role Based Access Control)

Graph database with Role-Based Access Control (RBAC), P2P synchronization, and local storage in OPFS.

![GraphDB](https://i.imgur.com/7Xqrht1.png)

---

[![](https://data.jsdelivr.com/v1/package/npm/gdb-p2p/badge)](https://www.jsdelivr.com/package/npm/gdb-p2p)

## Main Features

### ✅ **GraphDB Core**

- Efficient storage in OPFS
- Real-time synchronization between tabs and devices
- CRUD operations for nodes and relationships
- Compressed serialization with MessagePack
- Automatic indexing for fast searches

## Warning

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

```javascript
import { GraphDB } from "gdb-p2p"
```

### 2. Direct use in browser from a CDN

```html
<script type="module">
  import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p@0/+esm"
</script>
```

**Note**: Available CDNs:

```javascript
// jsDelivr
import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p@0/+esm"

// UNPKG
import { GraphDB } from "https://unpkg.com/gdb-p2p@latest"

// Skypack
import { GraphDB } from "https://cdn.skypack.dev/gdb-p2p@latest"
```

## Documentation

For detailed documentation, visit our [GitHub Wiki](https://github.com/estebanrfp/gdb/wiki).

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


## Community

We value community contributions and discussions! Here's how you can get involved:

- **Ask questions or share ideas**: Join our [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions).
- **Real-time chat**: For quick conversations, join us on [Gitter](https://app.gitter.im/#/room/#graphdb:gitter.im).

For more details on contributing, check out our [Contributing Guidelines](https://github.com/estebanrfp/gdb/wiki/Contributing).

## Licenses

This project includes third-party dependencies with their respective licenses. For detailed information, see the [Licenses page](https://github.com/estebanrfp/gdb/wiki/Licenses/) in the Wiki.

The source code of this project is licensed under the [MIT License](https://opensource.org/licenses/MIT). For more information, see the [LICENSE](LICENSE) file.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_shield&issueType=security)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_large&issueType=license)