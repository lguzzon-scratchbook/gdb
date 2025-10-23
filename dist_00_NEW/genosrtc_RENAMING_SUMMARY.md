# GenosRTC Variable Refactoring Summary

This document tracks all variable name changes made during the systematic refactoring of genosrtc.min.js to improve code readability and maintainability.

## Refactoring Guidelines
- Variables should have meaningful, descriptive names
- Single-letter variables should be renamed to indicate their purpose
- Cryptographic and mathematical variables should indicate their role
- Function parameters should describe their expected input

## Function Index

### Utility Functions
1. A0 → globalCrypto
2. w0 → isUint8Array  
3. d0 → validatePositiveInteger
4. $0 → validateUint8Array
5. Y8 → validateHasher
6. b0 → checkHashState
7. U$ → validateDigestOutput
8. I0 → clearArrays
9. X8 → createDataView
10. Q0 → rotl32
11. Z0 → bytesToHex
12. z$ → hexCharToValue
13. k0 → hexToBytes
14. Z8 → stringToBytes
15. o0 → normalizeBytes
16. o → concatBytes
17. Y$ → wrapHasher
18. S0 → getRandomBytes

### Hash Functions and Classes
19. r0 → HashBase
20. RQ → setBigUint64LE
21. X$ → ch
22. Z$ → maj
23. E8 → SHA2
24. K$ → SHA256
25. f8 → HMAC
26. v8 → hmac

### Field and Math Functions
27. p0 → validateBoolean
28. x0 → validateUint8ArrayOptional
29. i0 → toHexUnpadded
30. M$ → hexToBigInt
31. M0 → bytesToBigInt
32. y8 → bytesReversedToBigInt
33. _0 → bigIntToBytesLE
34. u8 → bigIntToBytesBE
35. m → normalizeInput
36. a0 → isWithinRange
37. D$ → validateWithinRange
38. M8 → bitLength
39. W$ → createDRBG

### Cryptographic Core Functions
40. n0 → validateOptions
41. m8 → memoize
42. p → mod
43. i → pow
44. N$ → invert
45. F8 → validateSqrtResult
46. O$ → sqrtP4k3
47. IQ → sqrtP8k3
48. kQ → sqrtP16k7
49. R$ → sqrtAlgorithm
50. SQ → selectSqrtAlgorithm
51. h8 → validateFieldConfig
52. EQ → powFast
53. D8 → invertBatch
54. V$ → legendreSymbol

### Field Creation Functions
55. W8 → getFieldLengths
56. O0 → createField
57. L$ → fieldByteLength
58. l8 → fieldScalarLength
59. N8 → hashToField

### Elliptic Curve Functions
60. s0 → conditionalNegate
61. V8 → normalizeProjectivePoints
62. k$ → validateWindowSize
63. c8 → getWNAFConfig
64. A$ → getWNAFWindow
65. fQ → validatePointArray
66. vQ → validateScalarArray
67. o8 → getOptimalWindowSize
68. w$ → validateWNAFResult
69. P$ → ladder
70. E$ → msm
71. I$ → createFieldInstance
72. f$ → validateCurveConfig

### Point Class and Related Functions
73. r8 → PointBase
74. bQ → splitScalarEndomorphism
75. i8 → validateSignatureFormat
76. p8 → normalizeSignOptions
77. R0 → normalizePrivateKey
78. gQ → createWeierstrassCurve
79. y$ → getCurveLengths

### Projective Point Class
80. I → ProjectivePoint

### Key Generation and Utilities
81. yQ → createCurveAPI
82. uQ → createECDSA
83. g$ → getPrefixByte

### Signature Class
84. _ → Signature

### DER Encoding/Decoding
85. D0 → DER

### Bitcoin and Nostr Functions
86. dQ → sqrtModP
87. B8 → taggedHash
88. n8 → nonceToScalar
89. d$ → liftX
90. o$ → challenge
91. l$ → publicKeyToBytes
92. oQ → signSchnorr
93. r$ → verifySchnorr
94. u0 → secp256k1Params
95. lQ → secp256k1Endomorphism
96. c$ → secp256k1
97. h$ → taggedHashCache
98. s8 → pointToBytesCompressed
99. m0 → secp256k1Point
100. t8 → isEven
101. t0 → bytesToNumberBE
102. x8 → secp256k1Utils

### WebRTC Functions
103. L8 → createPeerConnection
104. $J → Uint8ArrayPrototype
105. GQ → messageTypeOffset
106. I8 → chunkIndexOffset
107. k8 → flagOffset
108. q8 → progressOffset
109. G8 → dataOffset
110. J8 → maxChunkSize
111. A8 → counterMask
112. $$ → bufferedAmountLowEvent
113. h0 → internalChannel
114. Q$ → maxChunks
115. QJ → maxRetries
116. JJ → retryDelay
117. zQ → createPeerManager

### Network Functions
118. qJ → poolSize
119. GJ → announceInterval
120. UQ → connectionTimeout
121. jQ → createRoomManager
122. YQ → reconnectBaseDelay
123. S8 → reconnectDelayMap
124. XQ → socketConnections
125. ZQ → createWebSocket
126. KQ → getRelaySocketGetter
127. MQ → selectRelayUrls
128. l0 → relayConnections
129. zJ → maxRelays
130. VQ → tagId
131. CQ → eventType
132. UJ → powPattern
133. J$ → powRequiredUrls
134. TQ → nostrSecretKey
135. jJ → nostrPublicKey
136. q$ → subscriptionHandlers
137. z8 → eventHandlers
138. YJ → urlCache
139. BQ → getCurrentTimestamp
140. xQ → getEventKind
141. P8 → normalizeUrl
142. XJ → defaultRelays
143. ZJ → handleRelayMessage
144. KJ → getRelayConnection
145. DQ → createNostrEvent
146. WQ → createSubscription
147. NQ → closeSubscription
148. MJ → nostrJoinAdapter
149. DJ → getRelaySockets

## Refactoring Log

### Function 1: A0 → globalCrypto
**File**: genosrtc.min.js
**Line**: 1  
**Original**: 
```javascript
var A0 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : undefined;
```
**Refactored**:
```javascript  
var globalCrypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : undefined;
```
**Rationale**: A0 is a generic variable name that doesn't indicate its purpose. `globalCrypto` clearly indicates it holds the global crypto object for cryptographic operations.

---

### Function 2: w0 → isUint8Array
**File**: genosrtc.min.js  
**Line**: 3
**Original**:
```javascript
function w0($) {
	return (
		$ instanceof Uint8Array ||
		(ArrayBuffer.isView($) && $.constructor.name === "Uint8Array")
	);
}
```
**Refactored**:
```javascript
function isUint8Array(input) {
	return (
		input instanceof Uint8Array ||
		(ArrayBuffer.isView(input) && input.constructor.name === "Uint8Array")
	);
}
```
**Rationale**: `w0` is meaningless and doesn't indicate this is a type checking function. `isUint8Array` clearly describes its purpose of validating Uint8Array inputs.

---

### Function 3: d0 → validatePositiveInteger
**File**: genosrtc.min.js
**Line**: 8
**Original**:
```javascript
function d0($) {
	if (!Number.isSafeInteger($) || $ < 0) {
		throw new Error(`positive integer expected, got ${$}`);
	}
}
```
**Refactored**:
```javascript
function validatePositiveInteger(value) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error(`positive integer expected, got ${value}`);
	}
}
```
**Rationale**: `d0` is meaningless. `validatePositiveInteger` clearly describes the validation purpose.

---

### Function 4: $0 → validateUint8Array
**File**: genosrtc.min.js
**Line**: 14
**Original**:
```javascript
function $0($, ...J) {
	if (!w0($)) {
		throw new Error("Uint8Array expected");
	}
	if (J.length > 0 && !J.includes($.length)) {
		throw new Error(
			`Uint8Array expected of length ${J}, got length=${$.length}`,
		);
	}
}
```
**Refactored**:
```javascript
function validateUint8Array(input, ...validLengths) {
	if (!isUint8Array(input)) {
		throw new Error("Uint8Array expected");
	}
	if (validLengths.length > 0 && !validLengths.includes(input.length)) {
		throw new Error(
			`Uint8Array expected of length ${validLengths}, got length=${input.length}`,
		);
	}
}
```
**Rationale**: `$0` is meaningless. `validateUint8Array` clearly describes the validation purpose.

---

### Function 5: Y8 → validateHasher
**File**: genosrtc.min.js
**Line**: 26
**Original**:
```javascript
function Y8($) {
	if (typeof $ !== "function" || typeof $.create !== "function") {
		throw new Error("Hash should be wrapped by utils.createHasher");
	}
	d0($.outputLen);
	d0($.blockLen);
}
```
**Refactored**:
```javascript
function validateHasher(hasher) {
	if (typeof hasher !== "function" || typeof hasher.create !== "function") {
		throw new Error("Hash should be wrapped by utils.createHasher");
	}
	validatePositiveInteger(hasher.outputLen);
	validatePositiveInteger(hasher.blockLen);
}
```
**Rationale**: `Y8` is meaningless. `validateHasher` clearly describes the validation purpose for hash objects.

---

### Function 6: b0 → checkHashState
**File**: genosrtc.min.js
**Line**: 33
**Original**:
```javascript
function b0($, J = true) {
	if ($.destroyed) {
		throw new Error("Hash instance has been destroyed");
	}
	if (J && $.finished) {
		throw new Error("Hash#digest() has already been called");
	}
}
```
**Refactored**:
```javascript
function checkHashState(hashInstance, checkFinished = true) {
	if (hashInstance.destroyed) {
		throw new Error("Hash instance has been destroyed");
	}
	if (checkFinished && hashInstance.finished) {
		throw new Error("Hash#digest() has already been called");
	}
}
```
**Rationale**: `b0` is meaningless. `checkHashState` clearly describes its purpose of checking hash instance state.

---

### Function 7: U$ → validateDigestOutput
**File**: genosrtc.min.js
**Line**: 41
**Original**:
```javascript
function U$($, J) {
	$0($);
	const q = J.outputLen;
	if ($.length < q) {
		throw new Error(
			`digestInto() expects output buffer of length at least ${q}`,
		);
	}
}
```
**Refactored**:
```javascript
function validateDigestOutput(outputBuffer, hashInstance) {
	validateUint8Array(outputBuffer);
	const expectedLength = hashInstance.outputLen;
	if (outputBuffer.length < expectedLength) {
		throw new Error(
			`digestInto() expects output buffer of length at least ${expectedLength}`,
		);
	}
}
```
**Rationale**: `U$` is meaningless. `validateDigestOutput` clearly describes its purpose of validating digest output buffers.

---

### Function 8: I0 → clearArrays
**File**: genosrtc.min.js
**Line**: 50
**Original**:
```javascript
function I0(...$) {
	for (let J = 0; J < $.length; J++) {
		$[J].fill(0);
	}
}
```
**Refactored**:
```javascript
function clearArrays(...arrays) {
	for (let i = 0; i < arrays.length; i++) {
		arrays[i].fill(0);
	}
}
```
**Rationale**: `I0` is meaningless. `clearArrays` clearly describes its purpose of clearing array contents.

---

### Function 9: X8 → createDataView
**File**: genosrtc.min.js
**Line**: 55
**Original**:
```javascript
function X8($) {
	return new DataView($.buffer, $.byteOffset, $.byteLength);
}
```
**Refactored**:
```javascript
function createDataView(uint8Array) {
	return new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
}
```
**Rationale**: `X8` is meaningless. `createDataView` clearly describes its purpose of creating DataView objects.

---

### Function 10: Q0 → rotl32
**File**: genosrtc.min.js
**Line**: 58
**Original**:
```javascript
function Q0($, J) {
	return ($ << (32 - J)) | ($ >>> J);
}
```
**Refactored**:
```javascript
function rotl32(value, shift) {
	return (value << (32 - shift)) | (value >>> shift);
}
```
**Rationale**: `Q0` is meaningless. `rotl32` clearly describes its purpose as a 32-bit left rotate operation.

---

### Function 11: Z0 → bytesToHex
**File**: genosrtc.min.js
**Line**: 61
**Original**:
```javascript
function Z0($) {
	$0($);
	if (j$) {
		return $.toHex();
	}
	let J = "";
	for (let q = 0; q < $.length; q++) {
		J += OQ[$[q]];
	}
	return J;
}
```
**Refactored**:
```javascript
function bytesToHex(bytes) {
	validateUint8Array(bytes);
	if (nativeHexSupport) {
		return bytes.toHex();
	}
	let hex = "";
	for (let i = 0; i < bytes.length; i++) {
		hex += hexLookupTable[bytes[i]];
	}
	return hex;
}
```
**Rationale**: `Z0` is meaningless. `bytesToHex` clearly describes its purpose of converting bytes to hexadecimal strings.

---

### Function 12: z$ → hexCharToValue
**File**: genosrtc.min.js
**Line**: 72
**Original**:
```javascript
function z$($) {
	if ($ >= X0._0 && $ <= X0._9) {
		return $ - X0._0;
	}
	if ($ >= X0.A && $ <= X0.F) {
		return $ - (X0.A - 10);
	}
	if ($ >= X0.a && $ <= X0.f) {
		return $ - (X0.a - 10);
	}
	return;
}
```
**Refactored**:
```javascript
function hexCharToValue(charCode) {
	if (charCode >= hexChars._0 && charCode <= hexChars._9) {
		return charCode - hexChars._0;
	}
	if (charCode >= hexChars.A && charCode <= hexChars.F) {
		return charCode - (hexChars.A - 10);
	}
	if (charCode >= hexChars.a && charCode <= hexChars.f) {
		return charCode - (hexChars.a - 10);
	}
	return;
}
```
**Rationale**: `z$` is meaningless. `hexCharToValue` clearly describes its purpose of converting hex character codes to numeric values.

---

### Function 13: k0 → hexToBytes
**File**: genosrtc.min.js
**Line**: 84
**Original**:
```javascript
function k0($) {
	if (typeof $ !== "string") {
		throw new Error(`hex string expected, got ${typeof $}`);
	}
	if (j$) {
		return Uint8Array.fromHex($);
	}
	const J = $.length;
	const q = J / 2;
	if (J % 2) {
		throw new Error(`hex string expected, got unpadded hex of length ${J}`);
	}
	const Q = new Uint8Array(q);
	for (let G = 0, z = 0; G < q; G++, z += 2) {
		const U = z$($.charCodeAt(z));
		const X = z$($.charCodeAt(z + 1));
		if (U === undefined || X === undefined) {
			const Z = $[z] + $[z + 1];
			throw new Error(
				`hex string expected, got non-hex character "${Z}" at index ${z}`,
			);
		}
		Q[G] = U * 16 + X;
	}
	return Q;
}
```
**Refactored**:
```javascript
function hexToBytes(hexString) {
	if (typeof hexString !== "string") {
		throw new Error(`hex string expected, got ${typeof hexString}`);
	}
	if (nativeHexSupport) {
		return Uint8Array.fromHex(hexString);
	}
	const length = hexString.length;
	const byteLength = length / 2;
	if (length % 2) {
		throw new Error(`hex string expected, got unpadded hex of length ${length}`);
	}
	const result = new Uint8Array(byteLength);
	for (let i = 0, pos = 0; i < byteLength; i++, pos += 2) {
		const highNibble = hexCharToValue(hexString.charCodeAt(pos));
		const lowNibble = hexCharToValue(hexString.charCodeAt(pos + 1));
		if (highNibble === undefined || lowNibble === undefined) {
			const invalidChar = hexString[pos] + hexString[pos + 1];
			throw new Error(
				`hex string expected, got non-hex character "${invalidChar}" at index ${pos}`,
			);
		}
		result[i] = highNibble * 16 + lowNibble;
	}
	return result;
}
```
**Rationale**: `k0` is meaningless. `hexToBytes` clearly describes its purpose of converting hexadecimal strings to byte arrays.

---

### Function 14: Z8 → stringToBytes
**File**: genosrtc.min.js
**Line**: 110
**Original**:
```javascript
function Z8($) {
	if (typeof $ !== "string") {
		throw new Error("string expected");
	}
	return new Uint8Array(new TextEncoder().encode($));
}
```
**Refactored**:
```javascript
function stringToBytes(input) {
	if (typeof input !== "string") {
		throw new Error("string expected");
	}
	return new Uint8Array(new TextEncoder().encode(input));
}
```
**Rationale**: `Z8` is meaningless. `stringToBytes` clearly describes its purpose of converting strings to byte arrays.

---

### Function 15: o0 → normalizeBytes
**File**: genosrtc.min.js
**Line**: 116
**Original**:
```javascript
function o0($) {
	if (typeof $ === "string") {
		$ = Z8($);
	}
	$0($);
	return $;
}
```
**Refactored**:
```javascript
function normalizeBytes(input) {
	if (typeof input === "string") {
		input = stringToBytes(input);
	}
	validateUint8Array(input);
	return input;
}
```
**Rationale**: `o0` is meaningless. `normalizeBytes` clearly describes its purpose of normalizing input to byte arrays.

---

### Function 16: o → concatBytes
**File**: genosrtc.min.js
**Line**: 123
**Original**:
```javascript
function o(...$) {
	let J = 0;
	for (let Q = 0; Q < $.length; Q++) {
		const G = $[Q];
		$0(G);
		J += G.length;
	}
	const q = new Uint8Array(J);
	for (let Q = 0, G = 0; Q < $.length; Q++) {
		const z = $[Q];
		q.set(z, G);
		G += z.length;
	}
	return q;
}
```
**Refactored**:
```javascript
function concatBytes(...arrays) {
	let totalLength = 0;
	for (let i = 0; i < arrays.length; i++) {
		const array = arrays[i];
		validateUint8Array(array);
		totalLength += array.length;
	}
	const result = new Uint8Array(totalLength);
	for (let i = 0, offset = 0; i < arrays.length; i++) {
		const array = arrays[i];
		result.set(array, offset);
		offset += array.length;
	}
	return result;
}
```
**Rationale**: `o` is meaningless. `concatBytes` clearly describes its purpose of concatenating byte arrays.

---

### Function 17: Y$ → wrapHasher
**File**: genosrtc.min.js
**Line**: 138
**Original**:
```javascript
function Y$($) {
	const J = (Q) => $().update(o0(Q)).digest();
	const q = $();
	J.outputLen = q.outputLen;
	J.blockLen = q.blockLen;
	J.create = () => $();
	return J;
}
```
**Refactored**:
```javascript
function wrapHasher(hasherFactory) {
	const hash = (data) => hasherFactory().update(normalizeBytes(data)).digest();
	const hasherInstance = hasherFactory();
	hash.outputLen = hasherInstance.outputLen;
	hash.blockLen = hasherInstance.blockLen;
	hash.create = () => hasherFactory();
	return hash;
}
```
**Rationale**: `Y$` is meaningless. `wrapHasher` clearly describes its purpose of wrapping hasher objects with additional functionality.

---

### Function 18: S0 → getRandomBytes
**File**: genosrtc.min.js
**Line**: 146
**Original**:
```javascript
function S0($ = 32) {
	if (A0 && typeof A0.getRandomValues === "function") {
		return A0.getRandomValues(new Uint8Array($));
	}
	if (A0 && typeof A0.randomBytes === "function") {
		return Uint8Array.from(A0.randomBytes($));
	}
	throw new Error("crypto.getRandomValues must be defined");
}
```
**Refactored**:
```javascript
function getRandomBytes(length = 32) {
	if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
		return globalCrypto.getRandomValues(new Uint8Array(length));
	}
	if (globalCrypto && typeof globalCrypto.randomBytes === "function") {
		return Uint8Array.from(globalCrypto.randomBytes(length));
	}
	throw new Error("crypto.getRandomValues must be defined");
}
```
**Rationale**: `S0` is meaningless. `getRandomBytes` clearly describes its purpose of generating cryptographically secure random bytes.

---

### Global Variables Updated:
- `j$` → `nativeHexSupport`: Indicates whether native hex methods are available
- `OQ` → `hexLookupTable`: Lookup table for byte-to-hex conversion
- `X0` → `hexChars`: Character codes for hex digits
- `A0` → `globalCrypto`: Reference to global crypto object

## Progress Summary
✅ **Completed**: All 18 utility functions have been successfully refactored with meaningful variable names that improve code readability and maintainability.

---

## Hash Functions and Classes Completed

### Function 19: r0 → HashBase
**File**: genosrtc.min.js
**Line**: 172
**Original**:
```javascript
class r0 {}
```
**Refactored**:
```javascript
class HashBase {}
```
**Rationale**: `r0` is meaningless. `HashBase` clearly describes its purpose as the base class for hash implementations.

---

### Function 20: RQ → setBigUint64LE
**File**: genosrtc.min.js
**Line**: 173
**Original**:
```javascript
function RQ($, J, q, Q) {
	if (typeof $.setBigUint64 === "function") {
		return $.setBigUint64(J, q, Q);
	}
	const G = BigInt(32);
	const z = BigInt(4294967295);
	const U = Number((q >> G) & z);
	const X = Number(q & z);
	const Z = Q ? 4 : 0;
	const V = Q ? 0 : 4;
	$.setUint32(J + Z, U, Q);
	$.setUint32(J + V, X, Q);
}
```
**Refactored**:
```javascript
function setBigUint64LE(dataView, offset, value, isLittleEndian) {
	if (typeof dataView.setBigUint64 === "function") {
		return dataView.setBigUint64(offset, value, isLittleEndian);
	}
	const shiftBits = BigInt(32);
	const mask32 = BigInt(4294967295);
	const highWord = Number((value >> shiftBits) & mask32);
	const lowWord = Number(value & mask32);
	const highOffset = isLittleEndian ? 4 : 0;
	const lowOffset = isLittleEndian ? 0 : 4;
	dataView.setUint32(offset + highOffset, highWord, isLittleEndian);
	dataView.setUint32(offset + lowOffset, lowWord, isLittleEndian);
}
```
**Rationale**: `RQ` is meaningless. `setBigUint64LE` clearly describes its purpose of setting 64-bit values in little-endian format.

---

### Function 21: X$ → ch
**File**: genosrtc.min.js
**Line**: 186
**Original**:
```javascript
function X$($, J, q) {
	return ($ & J) ^ (~$ & q);
}
```
**Refactored**:
```javascript
function ch(x, y, z) {
	return (x & y) ^ (~x & z);
}
```
**Rationale**: `X$` is meaningless. `ch` is the standard name for the SHA-256 "Ch" function (choice function).

---

### Function 22: Z$ → maj
**File**: genosrtc.min.js
**Line**: 189
**Original**:
```javascript
function Z$($, J, q) {
	return ($ & J) ^ ($ & q) ^ (J & q);
}
```
**Refactored**:
```javascript
function maj(x, y, z) {
	return (x & y) ^ (x & z) ^ (y & z);
}
```
**Rationale**: `Z$` is meaningless. `maj` is the standard name for the SHA-256 "Maj" function (majority function).

---

### Function 23: E8 → SHA2
**File**: genosrtc.min.js
**Line**: 192
**Original**:
```javascript
class E8 extends r0 {
```
**Refactored**:
```javascript
class SHA2 extends HashBase {
```
**Rationale**: `E8` is meaningless. `SHA2` clearly identifies this as the SHA-2 family base class.

---

### Function 24: K$ → SHA256  
**File**: genosrtc.min.js
**Line**: 313
**Original**:
```javascript
class K$ extends E8 {
```
**Refactored**:
```javascript
class SHA256 extends SHA2 {
```
**Rationale**: `K$` is meaningless. `SHA256` clearly identifies this as the SHA-256 implementation.

---

### Function 25: f8 → HMAC
**File**: genosrtc.min.js
**Line**: 383  
**Original**:
```javascript
class f8 extends r0 {
```
**Refactored**:
```javascript
class HMAC extends HashBase {
```
**Rationale**: `f8` is meaningless. `HMAC` clearly identifies this as the HMAC implementation.

---

### Function 26: v8 → hmac
**File**: genosrtc.min.js
**Line**: 457
**Original**:
```javascript
var v8 = ($, J, q) => new f8($, J).update(q).digest();
```
**Refactored**:
```javascript
var hmac = (hasher, key, data) => new HMAC(hasher, key).update(data).digest();
```
**Rationale**: `v8` is meaningless. `hmac` clearly describes its purpose as an HMAC function.

### Updated Constants:
- `K0` → `SHA256_INIT`: SHA-256 initial hash values
- `LQ` → `SHA256_K`: SHA-256 round constants  
- `K8` → `sha256`: SHA-256 hash function wrapper
- `B0` → `messageSchedule`: SHA-256 message schedule array

## Progress Summary
✅ **Completed**: All 8 hash-related functions have been successfully refactored with meaningful variable names.

---

*Refactoring in progress... Next section: Field and Math Functions*
