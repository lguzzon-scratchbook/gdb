# Detailed GenosRTC Modularization Implementation Plan

## Phase 1: Foundation - Utils and Constants

### Step 1.1: Create Directory Structure
```bash
mkdir -p crypto keys webrtc communication network utils
```

### Step 1.2: Extract Constants (`utils/constants.js`)
**Source**: Global constants from the original file
**Variables to extract**:
- `e8 = 'AES-GCM'`
- `a = 'GenosRTC'`
- `sQ = 5000` (ice gathering timeout)
- `w8 = 12` (action type byte length)
- `J8 = 16384` (max chunk size)
- `Q$ = 100` (max chunks)
- `QJ = 3` (max send retries)
- `JJ = 200` (retry delay)
- `qJ = 20` (max connections)
- `GJ = 5333` (announce interval)
- `UQ = 57333` (connection cleanup interval)
- `YQ = 3333` (reconnect delay)
- `zJ = 5` (relay redundancy)
- Nostr relay URLs and other network constants

### Step 1.3: Extract Basic Utilities (`utils/helpers.js`)
**Functions to extract**:
- `F0` - Array creation utility
- `$8` - Random string generator
- `N0` - Random ID generator
- `V0` - Promise.all.bind(Promise)
- `e$`, `R8`, `J1` - Object utilities
- `$Q` - Empty function
- `J0` - Error factory
- `Q8` - String joiner
- `QQ` - Array shuffler
- `rQ`, `pQ`, `j0`, `f0` - Text encoding/decoding
- `H8`, `e`, `v0` - JSON utilities
- `O8` - Hash utility

### Step 1.4: Extract Validation (`utils/validation.js`)
**Functions to extract**:
- `w0` - Uint8Array validation
- `d0` - Positive integer validation
- `$0` - Uint8Array length validation
- `p0` - Boolean validation
- `x0` - Uint8Array validation with length
- `m` - Hex/Uint8Array validation with length
- `a0` - Range validation
- `D$` - Range validation with error message

## Phase 2: Cryptography Foundation

### Step 2.1: Extract Crypto Utils (`crypto/utils.js`)
**Functions to extract**:
- `A0` - Global crypto detection
- `S0` - Random bytes generation
- `I0` - Array clearing
- `X8` - DataView creation
- `Q0` - Bit rotation
- `Z0` - Bytes to hex
- `z$` - Hex character parsing
- `k0` - Hex to bytes
- `Z8` - String to bytes
- `o0` - Input normalization
- `o` - Array concatenation
- `Y$` - Hash wrapper creator
- `j$`, `OQ`, `X0` - Hex-related constants

### Step 2.2: Extract Hashing (`crypto/hashing.js`)
**Classes and functions to extract**:
- `r0` - Base hash class
- `E8` - SHA-2 base implementation
- `K$` - SHA-256 implementation
- `K8` - SHA-256 hash function
- `f8` - HMAC implementation
- `v8` - HMAC function
- `RQ` - BigUint64 setter
- `X$`, `Z$` - SHA-2 helper functions
- `K0`, `LQ`, `B0` - SHA-256 constants

### Step 2.3: Extract Field Operations (`crypto/field.js`)
**Functions to extract**:
- `g8`, `_8`, `b8` - BigInt constants and validation
- `H0` - Bit mask creator
- `p` - Modulo operation
- `i` - Power operation
- `N$` - Modular inverse
- `F8`, `O$`, `IQ`, `kQ` - Square root algorithms
- `R$` - General square root finder
- `SQ` - Square root algorithm selector
- `h8` - Field validation
- `EQ` - Exponentiation
- `D8` - Batch inversion
- `V$` - Legendre symbol
- `W8` - Bit/byte length calculation
- `O0` - Field creator
- `L$`, `l8`, `N8` - Field utilities

### Step 2.4: Extract Curve Operations (`crypto/curve.js`)
**Functions to extract**:
- `l`, `h`, `P0`, `C$`, `T$`, `B$`, `AQ`, `x$`, `wQ`, `H$` - BigInt constants
- `PQ` - Field method names
- `s0`, `V8` - Point utilities
- `k$`, `c8`, `A$` - Windowed NAF utilities
- `fQ`, `vQ`, `o8`, `w$` - Validation utilities
- `P$`, `E$` - Point multiplication algorithms
- `I$`, `f$` - Curve validation
- `g0`, `E0`, `d8`, `S$` - Point constants
- `r8` - Point multiplication class
- `bQ` - Endomorphism scalar splitting

## Phase 3: Keys and Signatures

### Step 3.1: Extract secp256k1 (`keys/secp256k1.js`)
**Classes and functions to extract**:
- `i8`, `p8` - Signature format validation
- `R0` - Private key normalization
- `gQ` - Weierstrass curve creator
- `y$`, `g$` - Point encoding utilities
- `yQ` - ECDH key agreement
- `uQ` - ECDSA implementation
- `mQ`, `FQ`, `hQ` - Curve configuration
- `u$` - secp256k1 curve factory

### Step 3.2: Extract Signatures (`keys/signatures.js`)
**Classes and functions to extract**:
- `D0` - DER encoding/decoding utilities
- `b$` - DER error class
- `W0`, `y0`, `_$`, `C8`, `_Q` - BigInt constants
- `m$` - Curve wrapper creator

### Step 3.3: Extract Key Generation (`keys/keygen.js`)
**Functions to extract**:
- `dQ` - Square root for secp256k1
- `B8` - Tagged hash cache
- `n8` - Nonce generation
- `d$` - Point lifting
- `o$` - Challenge hash
- `l$` - Point to bytes
- `oQ` - Schnorr signature
- `r$` - Schnorr verification
- `u0`, `lQ` - secp256k1 parameters
- `cQ`, `F$`, `a8` - Schnorr constants
- `T8` - secp256k1 field
- `c$` - secp256k1 curve
- `h$`, `s8`, `m0`, `t8`, `t0` - Schnorr utilities
- `x8` - Schnorr interface

## Phase 4: WebRTC Implementation

### Step 4.1: Extract Connection Management (`webrtc/connection.js`)
**Functions to extract**:
- `L8` - RTCPeerConnection wrapper
- `eQ` - Default STUN servers
- All WebRTC-related connection logic

### Step 4.2: Extract Data Channel (`webrtc/datachannel.js`)
**Functions to extract**:
- `zQ` - Data channel manager
- Message chunking and reassembly
- Channel event handling

### Step 4.3: Extract ICE Management (`webrtc/ice.js`)
**Functions to extract**:
- ICE candidate handling
- STUN/TURN server configuration
- Connection state management

## Phase 5: Communication Layer

### Step 5.1: Extract Protocol (`communication/protocol.js`)
**Functions to extract**:
- Message format definitions
- Protocol constants
- Message validation

### Step 5.2: Extract Transport (`communication/transport.js`)
**Functions to extract**:
- Data chunking logic
- Message reassembly
- Progress tracking

### Step 5.3: Extract Signaling (`communication/signaling.js`)
**Functions to extract**:
- Signaling message handling
- Offer/answer processing
- Connection establishment

## Phase 6: Network Layer

### Step 6.1: Extract WebSocket Management (`network/websocket.js`)
**Functions to extract**:
- `ZQ` - WebSocket connection manager
- Reconnection logic
- Network event handling

### Step 6.2: Extract Nostr Protocol (`network/nostr.js`)
**Functions to extract**:
- `VQ`, `CQ`, `UJ` - Nostr constants
- `J$`, `TQ`, `jJ`, `q$`, `z8`, `YJ` - Nostr state
- `BQ`, `xQ` - Time utilities
- `XJ` - Default relays
- `ZJ`, `KJ`, `DQ`, `WQ`, `NQ` - Nostr protocol
- `MJ` - Nostr signaling implementation

### Step 6.3: Extract Relay Management (`network/relay.js`)
**Functions to extract**:
- `jQ` - Relay manager factory
- `MQ` - Relay URL selection
- `DJ` - Relay socket getter

## Phase 7: Main Entry Point

### Step 7.1: Create Main Interface (`index.js`)
**Tasks**:
- Import all modules
- Create clean public API
- Maintain backward compatibility
- Export: `selfId`, `join`, `getRelaySockets`

## Phase 8: Testing and Validation

### Step 8.1: Biome Compliance
**Tasks**:
- Run `bunx @biomejs/biome check --write --unsafe` on each file
- Fix all linting issues
- Ensure consistent formatting
- Resolve any style violations

### Step 8.2: Functional Testing
**Tasks**:
- Verify all exports work correctly
- Test WebRTC functionality
- Validate Nostr integration
- Ensure backward compatibility

## Implementation Order

1. **Phase 1**: Foundation (utils/constants, utils/helpers, utils/validation)
2. **Phase 2**: Cryptography foundation (crypto/utils, crypto/hashing, crypto/field, crypto/curve)
3. **Phase 3**: Keys and signatures (keys/secp256k1, keys/signatures, keys/keygen)
4. **Phase 4**: WebRTC layer (webrtc/connection, webrtc/datachannel, webrtc/ice)
5. **Phase 5**: Communication layer (communication/protocol, communication/transport, communication/signaling)
6. **Phase 6**: Network layer (network/websocket, network/nostr, network/relay)
7. **Phase 7**: Main entry point (index.js)
8. **Phase 8**: Testing and validation

## Key Implementation Notes

### Variable Renaming
- Minified variables will be renamed to descriptive names
- Functions will be properly documented with JSDoc
- Constants will use UPPER_SNAKE_CASE

### Dependency Management
- Each module will explicitly declare its dependencies
- Circular dependencies will be avoided
- Proper import/export statements will be used

### Error Handling
- Error messages will be made more descriptive
- Proper error types will be used
- Validation will be moved to appropriate modules

### Code Quality
- All functions will be properly documented
- Complex logic will be commented
- Magic numbers will be replaced with named constants

## Success Metrics

- ✅ All files pass Biome checks without warnings
- ✅ Public API remains unchanged
- ✅ No functional regressions
- ✅ Code is more readable and maintainable
- ✅ Modules have clear responsibilities
- ✅ Dependencies are well-managed
- ✅ Documentation is comprehensive
