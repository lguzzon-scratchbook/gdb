[![Tests](https://github.com/estebanrfp/gdb/actions/workflows/test.yml/badge.svg)](https://github.com/estebanrfp/gdb/actions/workflows/test.yml)

# GenosDB Tests

Unit test suite for GenosDB, a distributed graph database. These tests validate API operations, security, P2P synchronization, CRDTs, WebRTC, and OPFS functionality using Vitest and jsdom.

## Test Files

- **`acls.test.js`** (7 tests): Access control (ACLs) tests - node creation, permissions, middleware
- **`api.test.js`** (4 tests): Basic API operations - remove, map, link, performance
- **`crdt.test.js`** (13 tests): Conflict-free Replicated Data Types - add, update, delete, merge, conflict resolution, peer synchronization
- **`errors.test.js`** (1 test): Error handling with invalid IDs
- **`first.test.js`** (1 test): Basic put/get test
- **`operators.test.js`** (3 tests): GenosDB operators validation
- **`opfs.test.js`** (6 tests): Origin Private File System - file writing, reading, deletion, listing, large files
- **`p2p.test.js`** (3 tests): Peer-to-peer synchronization - custom relays, TURN configuration
- **`security.test.js`** (6 tests): Security features - encryption, WebAuthn authentication, RBAC
- **`webrtc.test.js`** (4 tests): WebRTC direct connections - P2P connections, data channels, ICE candidates

**Total**: 48 tests in 10 files

## Requirements

- GenosDB built in `../dist/index.js`
- Node.js with jsdom for DOM simulation
- Mocks configured in `../setupTests.js`

## Running Tests

```bash
# All tests
npm test

# Specific test
npx vitest run --testNamePattern="Basic Put and Get"

# With HTML report
npm test  # Generates tests/html/test-results.html
```

## Technologies

- **Vitest**: Testing framework
- **jsdom**: Browser environment simulation
- **Mocks**: Simulate browser APIs (OPFS, WebRTC, WebAuthn, etc.)

## Notes

- Tests run in Node.js with jsdom, not in real browser
- Mocks in `setupTests.js` simulate `navigator.storage`, `RTCPeerConnection`, `navigator.credentials`, etc.
- Compatible with CI/CD (GitHub Actions)
Mocks: Custom mocks for WebRTC, OPFS, WebAuthn, and console logs.
Contributing
Fork the repository.
Create a feature branch: git checkout -b feature/new-tests.
Add tests or improve mocks.
Run tests: npm test.
Commit changes and push.
Open a pull request.
License
This project is licensed under the MIT License. See the LICENSE file for details.

For more information on GenosDB, visit the main repository. 🚀

# Tests

[![Tests](https://github.com/estebanrfp/gdb/actions/workflows/test.yml/badge.svg)](https://github.com/estebanrfp/gdb/actions?query=workflow:Tests)

