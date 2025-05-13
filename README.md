# GDB (GraphDB) + RBAC (Role Based Access Control)

Graph database with Role-Based Access Control (RBAC), P2P synchronization, and local storage in OPFS.

![GraphDB](https://i.imgur.com/7Xqrht1.png)

---

[![NPM Version](https://img.shields.io/npm/v/gdb-p2p.svg?style=for-the-badge)](https://www.npmjs.org/package/gdb-p2p)
[![NPM License](https://img.shields.io/npm/l/gdb-p2p.svg?style=for-the-badge)](https://github.com/estebanrfp/gdb/blob/main/LICENSE)


![Downloads on NPM](https://img.shields.io/npm/dw/gdb-p2p)
[![](https://data.jsdelivr.com/v1/package/npm/gdb-p2p/badge)](https://www.jsdelivr.com/package/npm/gdb-p2p)

![Project Status](https://img.shields.io/badge/state-development-green)

<!-- [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/estebanrfp/gdb&build=dist) -->

![NPM Unpacked Size (with version)](https://img.shields.io/npm/unpacked-size/gdb-p2p/latest)

![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/gdb-p2p)

<!-- ### Nostr.band Followers

![Nostr.band Followers](https://img.shields.io/nostr-band/followers/npub18c556t7n8xa3df2q82rwxejfglw5przds7sqvefylzjh8tjne28qld0we7) -->

<!-- ![GitHub Sponsors](https://img.shields.io/github/sponsors/estebanrfp) -->

## Main Features

### ✅ **GraphDB Core**

- Efficient storage in OPFS.
- Real-time synchronization between tabs and devices.
- CRUD operations for nodes and relationships.
- Efficient serialization using MessagePack and compression with Pako.
- Enabling reverse or Radix Tree indexing through external modules.
- GraphDB supports external modules that extend its capabilities.

## Warning

This project is under active development. Do not use it in production environments until it reaches the beta or stable phase. Check the [Project Status](#project-status) section for more details.

## Project Status

- **Phase**: Alpha
- **Completed Features**:
  - Basic queries.
  - Advanced queries.
  - Modules for AI queries.
  - Distributed storage.

- **Pending Features**:
  - Improve conflict resolution module.
  - Performance optimization.

> ⚠️ The API is under active development and may change without notice. Use fixed versions and check the [changelog](https://github.com/estebanrfp/gdb/wiki/CHANGELOG.md) before upgrading.

### ✅ **Role Based Access Control (RBAC)**

- Customizable role hierarchy (`superadmin`, `admin`, etc)
- Authentication with Metamask
- Biometric Registration and Authentication with WebAuthn
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
  import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p/+esm"
</script>
```

## Documentation

For detailed documentation, visit our [GitHub Wiki](https://github.com/estebanrfp/gdb/wiki).

For interactive, AI-assisted GraphDB documentation, visit our [Devin Wiki](https://deepwiki.com/estebanrfp/gdb).

## Examples

We’ve created a collection of interactive examples to help you understand how GDB works in real-world scenarios. These examples cover everything from basic setup to advanced features like RBAC and P2P synchronization.

👉 [Explore Examples](https://github.com/estebanrfp/gdb/wiki/EXAMPLES.md)

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

## Repository Diagram

The project includes an interactive visualization of the repository’s history and structure, which you can explore by clicking the following link: gdb repository diagram.

The project includes an interactive visualization of the repository's history and structure, which you can explore here:  

[gdb repository diagram](https://gitdiagram.com/estebanrfp/gdb)  

This graphical view is especially useful for new contributors or anyone looking to gain deeper insight into the project’s evolution and structure, providing a clear and visual understanding of the workflow.

## Contributing

We welcome contributions to improve this project! Please read our [Contribution Guidelines](https://github.com/estebanrfp/gdb/wiki/Contributing) for details on how to get started.


## Community

We value community contributions and discussions! Here's how you can get involved:

- **Ask questions or share ideas**: Join our [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions).
- **Real-time chat**: For quick conversations, join us on [Gitter](https://app.gitter.im/#/room/#GDB:gitter.im).

  Here’s how you can participate in the Gitter room:
  
  - `[DEV]`: Discussions about project development, new features, and technical improvements.
  - `[ANNOUNCEMENT]`: Official updates, new releases, and important news about GDB.
  - `[HELP]`: Technical support and troubleshooting for GDB-related questions.

Feel free to ask questions, share ideas, or just say hello! 👋

For more details on contributing, check out our [Contributing Guidelines](https://github.com/estebanrfp/gdb/wiki/Contributing).

## Licenses

This project includes third-party dependencies with their respective licenses. For detailed information, see the [Licenses page](https://github.com/estebanrfp/gdb/wiki/Licenses/) in the Wiki.

The source code of this project is licensed under the [MIT License](https://opensource.org/licenses/MIT). For more information, see the [LICENSE](LICENSE) file.

## Author

[Esteban Fuster Pozzi (@estebanrfp)](https://estebanrfp.com) — Full Stack JavaScript Developer and creator of [GraphDB (GDB)](https://www.npmjs.com/package/gdb-p2p), an open-source real-time graph database built entirely with modern vanilla JavaScript.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_shield&issueType=security)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Festebanrfp%2Fgdb?ref=badge_large&issueType=license)
