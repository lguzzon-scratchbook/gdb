# GenosDB Roadmap

Welcome to the roadmap for **GenosDB**, a decentralized P2P graph database powering modern Web3 applications, including our 3D metaverse built with Babylon.js. This document outlines our vision and next steps. Share your feedback in [GitHub Discussions](https://github.com/estebanrfp/gdb/discussions) or on Twitter/X (@estebanrfp)!

## Vision
To empower developers to build secure, real-time decentralized applications—from chats and Kanban boards to immersive 3D metaverses—without relying on centralized servers, with a simple API and a focus on security and performance.

## Current Status (Beta, August 2025)
- **Key Features**:
  - Graph database with `put`, `get`, `link`, `map`, `remove` operations ([See details](https://medium.com/genosdb/genosdb-distributed-graph-based-database-7f03b878507b), [See overview](https://medium.com/genosdb/genosdb-distributed-graph-database-with-module-support-a71452d0b472)).
  - Recursive graph traversal with `$edge` operator ([See article](https://medium.com/genosdb/introducing-recursive-graph-traversal-queries-in-genosdb-7a2eff62c5bf), [See design decisions](https://medium.com/genosdb/understanding-graph-traversal-in-genosdb-design-decisions-and-developer-control-5c6be90d2be7), [See hierarchies](https://medium.com/genosdb/genosdb-represents-hierarchical-and-inheritance-relationships-6ca66b4dcc24)).
  - GenosRTC: P2P streaming for audio ([See tutorial](https://medium.com/genosdb/real-time-p2p-audio-streaming-using-genosdb-and-modern-javascript-c5aaa8dbe670)), video ([See tutorial](https://medium.com/genosdb/real-time-p2p-video-streaming-using-genosdb-and-modern-javascript-809f7e77c2d0)), and files ([See tutorial](https://medium.com/genosdb/real-time-p2p-file-transfer-using-genosdb-and-modern-javascript-a095ee059a47)).
  - Security Module: Role-Based Access Control (RBAC) and WebAuthn authentication ([See RBAC](https://medium.com/genosdb/role-based-access-control-rbac-in-genosdb-bde218a1a0df), [See RBAC overview](https://medium.com/genosdb/rbac-role-based-access-control-cb490b14c426), [See trust paradox](https://medium.com/genosdb/how-genosdb-solved-the-distributed-trust-paradox-a-guide-to-p2p-security-a552aa3e3318)).
  - Delta synchronization with oplog and Nostr ([See article](https://medium.com/genosdb/genosdb-v0-4-0-introducing-oplog-driven-intelligent-delta-sync-and-full-state-fallback-741fe8ff132c), [See Nostr integration](https://medium.com/genosdb/genosdb-and-the-nostr-network-powering-the-future-of-decentralized-data-93db03b7c2d7)).
  - Async engine for high performance ([See article](https://medium.com/genosdb/genosdbs-new-async-engine-unlocking-unparalleled-performance-and-simplicity-in-a-real-time-c666f1a9a5d2)).
  - Flagship use case: 3D metaverse with Babylon.js, using GenosDB for avatar sync, chat, and object management ([OVGrid](https://ovgrid.com)).
- **Available**: Free minified builds via NPM/CDN ([Repo](https://github.com/estebanrfp/gdb)).
- **Demos**: Examples on JSFiddle/CodePen, including real-time chat ([See tutorial](https://medium.com/genosdb/build-a-realtime-chat-app-in-7-lines-of-javascript-using-genosdb-ff8eb73558a3)), to-do lists ([See tutorial](https://medium.com/genosdb/build-a-to-do-list-in-minutes-with-genosdb-384216b808bb), [See full to-do list](https://medium.com/genosdb/build-a-full-to-do-list-with-genosdb-1605f0d8c0a9)), and Kanban boards ([See tutorial](https://medium.com/genosdb/build-a-kanban-board-in-minutes-with-genosdb-a4ae06a99ac9)).
- **Competitive analysis**: Comparison with other P2P databases ([See article](https://medium.com/genosdb/most-popular-peer-to-peer-distributed-databases-5668d4869a56)).
- **Technical overview**: [See features](https://medium.com/genosdb/technical-features-of-genosdb-gdb-307fe8cc6618), [See P2P protocol](https://medium.com/genosdb/designing-a-next-generation-p2p-protocol-architecture-for-genosdb-4833c1f6e069).
- **Limitations**: Beta with potential API changes. Source code private to protect IP, but functional builds are free.

## Roadmap
### Short Term (Q3-Q4 2025)
- [x] Publish practical tutorials on Medium for chat, Kanban, to-do lists, and streaming ([See articles](https://medium.com/genosdb)).
- [ ] Launch public demo of the 3D metaverse with Babylon.js and GenosDB ([See upcoming article](https://medium.com/genosdb)).
- [x] Release a technical whitepaper on GenosDB architecture ([Inspired by](https://github.com/estebanrfp/gdb/blob/main/WHITEPAPER.md)).
- [x] Add GIFs/videos of demos (including metaverse) to README and docs ([See technical features](https://medium.com/genosdb/technical-features-of-genosdb-gdb-307fe8cc6618)).
- [x] Optimize GenosRTC for mobile browsers (iOS/Android).

### Mid Term (Q1-Q2 2026)
- [ ] Release v1.0 with stable API and SemVer versioning.
- [x] GenosDB Solved the Distributed Trust Paradox ([See](https://medium.com/genosdb/how-genosdb-solved-the-distributed-trust-paradox-a-guide-to-p2p-security-a552aa3e3318)).
- [ ] Active community: [Github discussions](https://github.com/estebanrfp/gdb/discussions).
- [ ] Public API: Explore developer API model ([Inspired by](https://x.ai/api)).

### Long Term (2026+)
- [ ] Web3 ecosystem integration: Nostr ([See Nostr](https://medium.com/genosdb/genosdb-and-the-nostr-network-powering-the-future-of-decentralized-data-93db03b7c2d7)).
- [ ] Monetization: Explore premium support or consulting for enterprise metaverses.
- [ ] Scalability: Support for large P2P clusters and external security audits fallback nodes.

## How to Contribute
Although the source code is private, you can help GenosDB:
- Test minified builds and report bugs in [Issues](https://github.com/estebanrfp/gdb/issues).
- Create demos (e.g., metaverses, chats) on JSFiddle/CodePen ([See](https://github.com/estebanrfp/gdb/blob/main/CONTRIBUTING.md)).
- Share feedback in [Discussions](https://github.com/estebanrfp/gdb/discussions) or on Twitter/X (@estebanrfp).
- Write tutorials on Medium/Dev.to.

## Contact
- Got ideas or want to collaborate? Reach out at [your-email] or [Discussions](https://github.com/estebanrfp/gdb/discussions).
- Follow updates on [Medium](https://medium.com/genosdb), Twitter/X (@estebanrfp), and [GenosDB.com](https://genosdb.com).

## Notes
- This roadmap will be updated quarterly based on feedback and progress.
- Thank you for supporting GenosDB and our decentralized metaverse!
