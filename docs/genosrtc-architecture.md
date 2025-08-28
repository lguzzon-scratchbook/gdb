# GenosDB: GenosRTC Module Architecture Overview

## Introduction

**GenosRTC** is the integrated peer-to-peer (P2P) communication module within the GenosDB (`GDB`) ecosystem. It is designed to provide developers with a high-level, robust, and decentralized framework for building real-time applications directly in the browser. By abstracting the complexities of WebRTC and leveraging a decentralized signaling network, GenosRTC enables seamless data, audio, and video streaming between peers.

The core architectural goal of GenosRTC is to deliver a "serverless" communication model where peers connect directly to one another, minimizing latency, enhancing privacy, and eliminating the need for centralized data-handling servers.

---

## Core Architectural Principles

The design of GenosRTC is guided by several key principles:

1.  **Decentralization First**: The architecture prioritizes decentralized patterns. While helper services (signaling relays) are used for peer discovery, the actual data and media exchange occurs directly between peers, ensuring no central point of failure or data bottleneck.
2.  **Simplicity through Abstraction**: GenosRTC exposes a clean, event-driven API (`db.room`) that hides the intricate low-level details of WebRTC, such as ICE negotiation, session description protocols (SDP), and connection state management. This allows developers to focus on application logic rather than P2P plumbing.
3.  **Room-Based Scoping**: All P2P interactions are scoped within a logical "room." This concept provides a natural container for managing a group of connected peers, simplifying session management, broadcasting, and peer lifecycle events. Architecturally, the room ID (which corresponds to the GDB database name) acts as a shared topic for discovery.
4.  **Secure by Design**: Communication is designed to be private and secure, with built-in support for end-to-end encryption for both signaling messages and data channel communications.

---

## Architectural Components

GenosRTC is composed of several distinct logical layers that work together to establish and maintain P2P connections.

### 1. Signaling Layer (Peer Discovery)

Unlike traditional WebRTC implementations that rely on a custom, centralized WebSocket server for signaling, **GenosRTC utilizes the decentralized Nostr (Notes and Other Stuff from Transmitted Relays) network**.

-   **Function**: The signaling layer is responsible for the "handshake" process where peers discover each other and exchange the necessary metadata (like network addresses and media capabilities) to establish a direct connection.
-   **Mechanism**:
    1.  When a peer initializes a `GDB` instance with `rtc: true`, it connects to a set of Nostr relays.
    2.  It subscribes to a specific "topic" derived from the room ID.
    3.  It announces its presence in this topic, effectively saying, "I am here and ready to connect."
    4.  It listens for announcements from other peers in the same topic.
    5.  Once two peers discover each other, they use the Nostr relay as a secure message bus to exchange the WebRTC session descriptions (offer/answer) and network candidates required to form a direct P2P link.
-   **Key Advantages**: This decentralized approach provides several architectural benefits:
    -   **Resilience and Censorship Resistance**: By relying on a distributed network of relays, the system avoids a single point of failure and is inherently more robust against network disruptions or censorship.
    -   **Zero Infrastructure Overhead**: Developers are freed from the complexity and cost of deploying, scaling, and maintaining their own signaling servers.
    -   **Adaptive Network Intelligence**: The architecture is not passive; it actively manages its connections to the Nostr network. It can identify non-performant or restrictive relays—for example, those requiring Proof-of-Work (PoW)—and dynamically adapt. Upon detecting a PoW requirement or other connection-blocking issue, the system automatically disconnects from that specific relay and excludes it from future use during the session. This self-healing behavior ensures that resources are focused on healthy signaling paths, dramatically increasing the reliability and speed of peer discovery.

### 2. P2P Transport Layer (WebRTC)

This layer is the core of the P2P connection, powered by the browser's native WebRTC capabilities.

-   **Function**: It manages the establishment and maintenance of direct, low-latency `RTCPeerConnection`s between peers.
-   **Mechanism**: It leverages the standard WebRTC ICE (Interactive Connectivity Establishment) framework, using STUN and TURN protocols (if configured) to traverse NATs and firewalls, ensuring that a direct connection is possible in the majority of network environments. All data and media transported over this layer are encrypted by default (using DTLS-SRTP).

### 3. Session Management (The Room)

The `db.room` object serves as the primary interface for session management.

-   **Function**: It orchestrates the entire lifecycle of a P2P session. This includes managing the set of connected peers, handling new arrivals, and cleaning up after departures.
-   **Mechanism**: The room maintains a state of all active peer connections, forming a mesh network where each peer is connected to every other peer in the room. It emits lifecycle events (`peer:join`, `peer:leave`) that allow the application to react to changes in the room's participant list.

### 4. Communication Abstractions

Once a P2P connection is established, GenosRTC provides two distinct, high-level channels for communication, each optimized for a different type of data.

#### a. Data Channels (`db.room.channel`)

-   **Architecture**: Built on top of WebRTC's `RTCDataChannel` API, this abstraction is designed for sending arbitrary, structured data. It provides a reliable and ordered messaging system.
-   **Use Cases**: Ideal for chat messages, game state synchronization, real-time collaboration events (e.g., cursor positions, text edits), file transfer metadata, and any other form of application-specific data. Developers can create multiple named channels to logically separate different types of data streams (e.g., a "chat" channel and a "game-actions" channel).

#### b. Media Streams (`db.room.addStream`)

-   **Architecture**: This abstraction leverages WebRTC's `MediaStream` capabilities, which are highly optimized for real-time audio and video. It handles the negotiation of codecs and the efficient transport of media packets.
-   **Use Cases**: Designed specifically for applications like video conferencing, voice chat, live broadcasting, and screen sharing. The API simplifies the process of capturing media from a user's device (`getUserMedia`) and broadcasting it to all other peers in the room.

---

## Lifecycle of a Peer Connection

From an architectural perspective, the typical flow for a peer is as follows:

1.  **Initialization**: A client instantiates `GDB` with `rtc: true`, joining a specific room.
2.  **Discovery**: The client connects to the Nostr network and subscribes to the room's topic, discovering other peers.
3.  **Signaling Handshake**: The client securely exchanges connection offers, answers, and network candidates with other peers via the Nostr relays.
4.  **Direct Connection**: A direct `RTCPeerConnection` is established with each peer. The signaling relay is no longer needed for communication between these two peers.
5.  **Communication**: The application uses the high-level Data Channel and Media Stream APIs to send and receive information directly with other peers.
6.  **Disconnection**: When a user leaves the room (e.g., closes the tab or calls `db.room.leave()`), the connections are torn down, and a `peer:leave` event is broadcast to the remaining peers.

## Security Model

Security is a fundamental component of the GenosRTC architecture.

-   **Transport Encryption**: All WebRTC communications (both data and media) are mandatorily encrypted using DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-time Transport Protocol). This prevents eavesdropping on the P2P link.
-   **End-to-End Encryption (E2EE)**: GenosRTC adds an additional layer of security. By providing an optional `password` during initialization, all signaling data exchanged over Nostr relays is encrypted. Furthermore, all data sent through the `Data Channels` is also end-to-end encrypted using this shared secret. This ensures that not even the signaling relays can decipher the application's data.