#!/bin/bash

# Bash script to rename obfuscated variables and functions in genosrtc.min.js
# This script sequentially executes js-renamer.sh for each substitution

# Crypto and utility functions
./js-renamer.sh genosrtc.min.js A0 globalCrypto
./js-renamer.sh genosrtc.min.js w0 isUint8Array
./js-renamer.sh genosrtc.min.js d0 assertPositiveInteger
./js-renamer.sh genosrtc.min.js $0 validateUint8Array
./js-renamer.sh genosrtc.min.js Y8 validateHashFunction
./js-renamer.sh genosrtc.min.js b0 checkHashState
./js-renamer.sh genosrtc.min.js U$ validateDigestBuffer
./js-renamer.sh genosrtc.min.js I0 clearArrays
./js-renamer.sh genosrtc.min.js X8 createDataView
./js-renamer.sh genosrtc.min.js Q0 rotl32
./js-renamer.sh genosrtc.min.js Z0 bytesToHex
./js-renamer.sh genosrtc.min.js z$ hexCharToInt
./js-renamer.sh genosrtc.min.js k0 hexToBytes
./js-renamer.sh genosrtc.min.js Z8 stringToBytes
./js-renamer.sh genosrtc.min.js o0 ensureBytes
./js-renamer.sh genosrtc.min.js o concatBytes
./js-renamer.sh genosrtc.min.js Y$ createHashWrapper
./js-renamer.sh genosrtc.min.js S0 getRandomBytes

# Hex and encoding utilities
./js-renamer.sh genosrtc.min.js j$ supportsNativeHex
./js-renamer.sh genosrtc.min.js OQ hexLookupTable
./js-renamer.sh genosrtc.min.js X0 hexCharCodes

# Hash classes and functions
./js-renamer.sh genosrtc.min.js r0 HashBase
./js-renamer.sh genosrtc.min.js RQ setBigUint64
./js-renamer.sh genosrtc.min.js X$ sha256Ch
./js-renamer.sh genosrtc.min.js Z$ sha256Maj
./js-renamer.sh genosrtc.min.js E8 Sha256Base
./js-renamer.sh genosrtc.min.js K0 sha256InitialHash
./js-renamer.sh genosrtc.min.js LQ sha256RoundConstants
./js-renamer.sh genosrtc.min.js B0 sha256MessageSchedule
./js-renamer.sh genosrtc.min.js K$ Sha256
./js-renamer.sh genosrtc.min.js K8 sha256

# HMAC and crypto utilities
./js-renamer.sh genosrtc.min.js f8 Hmac
./js-renamer.sh genosrtc.min.js v8 hmacDigest

# Validation and utility functions
./js-renamer.sh genosrtc.min.js assertBoolean validateBoolean
./js-renamer.sh genosrtc.min.js x0 validateBytes
./js-renamer.sh genosrtc.min.js i0 intToHex
./js-renamer.sh genosrtc.min.js M$ hexToBigInt
./js-renamer.sh genosrtc.min.js M0 bytesToBigInt
./js-renamer.sh genosrtc.min.js y8 bytesToBigIntLE
./js-renamer.sh genosrtc.min.js _0 bigIntToBytes
./js-renamer.sh genosrtc.min.js u8 bigIntToBytesLE
./js-renamer.sh genosrtc.min.js m validateInput
./js-renamer.sh genosrtc.min.js a0 inRange
./js-renamer.sh genosrtc.min.js D$ validateRange
./js-renamer.sh genosrtc.min.js M8 bitLength
./js-renamer.sh genosrtc.min.js W$ createDRBG

# Field and curve operations
./js-renamer.sh genosrtc.min.js n0 validateOptions
./js-renamer.sh genosrtc.min.js m8 memoize
./js-renamer.sh genosrtc.min.js g8 ZERO
./js-renamer.sh genosrtc.min.js _8 ONE
./js-renamer.sh genosrtc.min.js b8 isBigInt
./js-renamer.sh genosrtc.min.js H0 createMask
./js-renamer.sh genosrtc.min.js p mod
./js-renamer.sh genosrtc.min.js i pow
./js-renamer.sh genosrtc.min.js N$ invert
./js-renamer.sh genosrtc.min.js F8 validateSquareRoot
./js-renamer.sh genosrtc.min.js O$ tonelliShanks
./js-renamer.sh genosrtc.min.js IQ$ tonelliShanks5Mod8
./js-renamer.sh genosrtc.min.js kQ$ tonelliShanksComplex
./js-renamer.sh genosrtc.min.js R$ createSqrtFunction
./js-renamer.sh genosrtc.min.js SQ createOptimalSqrt
./js-renamer.sh genosrtc.min.js h8 validateField

# Exponentiation and field operations
./js-renamer.sh genosrtc.min.js EQ powMod
./js-renamer.sh genosrtc.min.js D8 invertBatch
./js-renamer.sh genosrtc.min.js V$ legendreSymbol
./js-renamer.sh genosrtc.min.js W8 getFieldInfo
./js-renamer.sh genosrtc.min.js O0 createField

# Byte conversion utilities
./js-renamer.sh genosrtc.min.js L$ fieldOrderToBytes
./js-renamer.sh genosrtc.min.js l8 hashToBytes
./js-renamer.sh genosrtc.min.js N8 normalizePrivateKey

# Curve constants and operations
./js-renamer.sh genosrtc.min.js l ZERO_BIGINT
./js-renamer.sh genosrtc.min.js h ONE_BIGINT
./js-renamer.sh genosrtc.min.js P0 TWO_BIGINT
./js-renamer.sh genosrtc.min.js C$ THREE_BIGINT
./js-renamer.sh genosrtc.min.js T$ FOUR_BIGINT
./js-renamer.sh genosrtc.min.js B$ FIVE_BIGINT
./js-renamer.sh genosrtc.min.js AQ SEVEN_BIGINT
./js-renamer.sh genosrtc.min.js x$ EIGHT_BIGINT
./js-renamer.sh genosrtc.min.js wQ NINE_BIGINT
./js-renamer.sh genosrtc.min.js H$ SIXTEEN_BIGINT
./js-renamer.sh genosrtc.min.js PQ fieldMethods

# Point operations
./js-renamer.sh genosrtc.min.js s0 conditionalNegate
./js-renamer.sh genosrtc.min.js V8 normalizeZ
./js-renamer.sh genosrtc.min.js k$ validateWindowSize
./js-renamer.sh genosrtc.min.js c8 createWindowConfig
./js-renamer.sh genosrtc.min.js A$ getWindowParams
./js-renamer.sh genosrtc.min.js fQ validatePoints
./js-renamer.sh genosrtc.min.js vQ validateScalars
./js-renamer.sh genosrtc.min.js o8 getWindowSize
./js-renamer.sh genosrtc.min.js w$ validateWNAF

# Scalar multiplication
./js-renamer.sh genosrtc.min.js P$ doubleScalarMul
./js-renamer.sh genosrtc.min.js E$ multiScalarMul
./js-renamer.sh genosrtc.min.js I$ createField__

# Curve validation and setup
./js-renamer.sh genosrtc.min.js f$ validateCurve
./js-renamer.sh genosrtc.min.js g0 ZERO_BIGINT2
./js-renamer.sh genosrtc.min.js E0 ONE_BIGINT2
./js-renamer.sh genosrtc.min.js d8 pointCache
./js-renamer.sh genosrtc.min.js S$ windowCache
./js-renamer.sh genosrtc.min.js r8 PointMultiplier

# Endomorphism and point operations
./js-renamer.sh genosrtc.min.js bQ splitScalarEndomorphism
./js-renamer.sh genosrtc.min.js i8 validateSignatureFormat
./js-renamer.sh genosrtc.min.js p8 mergeOptions
./js-renamer.sh genosrtc.min.js R0 normalizePrivateKey_

# Elliptic curve operations
./js-renamer.sh genosrtc.min.js gQ createCurve
./js-renamer.sh genosrtc.min.js uQ createECDSA

# DER encoding
./js-renamer.sh genosrtc.min.js mQ extractCurveParams
./js-renamer.sh genosrtc.min.js FQ extractECDSAOptions
./js-renamer.sh genosrtc.min.js hQ createCurveWithPoint

# Schnorr signatures
./js-renamer.sh genosrtc.min.js u$ createSchnorr
./js-renamer.sh genosrtc.min.js v$ modPositive
./js-renamer.sh genosrtc.min.js b$ DERError
./js-renamer.sh genosrtc.min.js D0 DERUtils

# Schnorr curve parameters
./js-renamer.sh genosrtc.min.js dQ schnorrSqrt
./js-renamer.sh genosrtc.min.js B8 taggedHash
./js-renamer.sh genosrtc.min.js n8 schnorrGetScalar
./js-renamer.sh genosrtc.min.js d$ schnorrLiftX
./js-renamer.sh genosrtc.min.js o$ schnorrChallenge
./js-renamer.sh genosrtc.min.js l$ schnorrGetPublicKey
./js-renamer.sh genosrtc.min.js oQ schnorrSign
./js-renamer.sh genosrtc.min.js r$ schnorrVerify

# Bitcoin curve parameters
./js-renamer.sh genosrtc.min.js u0 secp256k1Params
./js-renamer.sh genosrtc.min.js lQ endomorphismParams
./js-renamer.sh genosrtc.min.js cQ ZERO_BIGINT3
./js-renamer.sh genosrtc.min.js F$ ONE_BIGINT3
./js-renamer.sh genosrtc.min.js a8 TWO_BIGINT2
./js-renamer.sh genosrtc.min.js T8 secp256k1Field
./js-renamer.sh genosrtc.min.js c$ secp256k1Curve
./js-renamer.sh genosrtc.min.js h$ taggedHashCache
./js-renamer.sh genosrtc.min.js s8 pointToBytesSchnorr
./js-renamer.sh genosrtc.min.js m0 secp256k1Point
./js-renamer.sh genosrtc.min.js t8 isEven
./js-renamer.sh genosrtc.min.js t0 bytesToBigIntDefault
./js-renamer.sh genosrtc.min.js x8 schnorr

# Text encoding and utilities
./js-renamer.sh genosrtc.min.js rQ textEncoder
./js-renamer.sh genosrtc.min.js pQ textDecoder
./js-renamer.sh genosrtc.min.js j0 encodeText
./js-renamer.sh genosrtc.min.js f0 decodeText
./js-renamer.sh genosrtc.min.js H8 bytesToHexSpaced
./js-renamer.sh genosrtc.min.js e stringifyJSON
./js-renamer.sh genosrtc.min.js v0 parseJSON
./js-renamer.sh genosrtc.min.js O8 simpleHash

# Encryption utilities
./js-renamer.sh genosrtc.min.js e8 encryptionAlgorithm
./js-renamer.sh genosrtc.min.js iQ encryptionCache
./js-renamer.sh genosrtc.min.js p$ separatorChar
./js-renamer.sh genosrtc.min.js i$ separatorChar2
./js-renamer.sh genosrtc.min.js aQ base64Encode
./js-renamer.sh genosrtc.min.js nQ base64Decode
./js-renamer.sh genosrtc.min.js e0 hashString
./js-renamer.sh genosrtc.min.js a$ deriveKey
./js-renamer.sh genosrtc.min.js n$ encryptData
./js-renamer.sh genosrtc.min.js s$ decryptData

# GenosRTC main variables
./js-renamer.sh genosrtc.min.js a libraryName
./js-renamer.sh genosrtc.min.js F0 createArray
./js-renamer.sh genosrtc.min.js $8 randomString
./js-renamer.sh genosrtc.min.js N0 selfId
./js-renamer.sh genosrtc.min.js V0 promiseAll
./js-renamer.sh genosrtc.min.js t$ isBrowser
./js-renamer.sh genosrtc.min.js e$ objectEntries
./js-renamer.sh genosrtc.min.js R8 objectFromEntries
./js-renamer.sh genosrtc.min.js J1 objectKeys
./js-renamer.sh genosrtc.min.js $Q noop
./js-renamer.sh genosrtc.min.js J0 createError
./js-renamer.sh genosrtc.min.js Q8 joinWithAt
./js-renamer.sh genosrtc.min.js QQ shuffleArray

# WebRTC constants
./js-renamer.sh genosrtc.min.js sQ iceGatheringTimeout
./js-renamer.sh genosrtc.min.js JQ iceGatheringStateChangeEvent
./js-renamer.sh genosrtc.min.js qQ offerType
./js-renamer.sh genosrtc.min.js tQ answerType
./js-renamer.sh genosrtc.min.js eQ defaultSTUNServers

# WebRTC connection management
./js-renamer.sh genosrtc.min.js L8 createPeerConnection
./js-renamer.sh genosrtc.min.js $J uint8ArrayProto

# Message protocol constants
./js-renamer.sh genosrtc.min.js w8 actionTypeBytes
./js-renamer.sh genosrtc.min.js GQ actionTypeStart
./js-renamer.sh genosrtc.min.js I8 nonceStart
./js-renamer.sh genosrtc.min.js k8 flagsStart
./js-renamer.sh genosrtc.min.js q8 progressStart
./js-renamer.sh genosrtc.min.js G8 dataStart
./js-renamer.sh genosrtc.min.js J8 maxChunkSize
./js-renamer.sh genosrtc.min.js A8 progressMax
./js-renamer.sh genosrtc.min.js $$ bufferedAmountLowEvent
./js-renamer.sh genosrtc.min.js h0 prefixWithUnderscore
./js-renamer.sh genosrtc.min.js Q$ maxChunks
./js-renamer.sh genosrtc.min.js QJ maxRetries
./js-renamer.sh genosrtc.min.js JJ retryDelay

# Peer management
./js-renamer.sh genosrtc.min.js zQ createPeerManager
./js-renamer.sh genosrtc.min.js qJ maxOffers
./js-renamer.sh genosrtc.min.js GJ defaultPort
./js-renamer.sh genosrtc.min.js UQ offerLifetime

# Signaling server management
./js-renamer.sh genosrtc.min.js jQ createSignalingManager
./js-renamer.sh genosrtc.min.js YQ reconnectDelay
./js-renamer.sh genosrtc.min.js S8 socketCache
./js-renamer.sh genosrtc.min.js XQ activeSockets
./js-renamer.sh genosrtc.min.js ZQ createWebSocket

# Nostr protocol
./js-renamer.sh genosrtc.min.js KQ getRelaySockets
./js-renamer.sh genosrtc.min.js MQ selectRelayUrls
./js-renamer.sh genosrtc.min.js l0 relayConnections
./js-renamer.sh genosrtc.min.js zJ maxRelays
./js-renamer.sh genosrtc.min.js VQ nostrTag
./js-renamer.sh genosrtc.min.js CQ nostrEventType
./js-renamer.sh genosrtc.min.js UJ powRegex
./js-renamer.sh genosrtc.min.js J$ blockedRelays
./js-renamer.sh genosrtc.min.js TQ nostrSecretKey
./js-renamer.sh genosrtc.min.js jJ nostrPublicKey
./js-renamer.sh genosrtc.min.js q$ nostrSubscriptions
./js-renamer.sh genosrtc.min.js z8 nostrMessageHandlers
./js-renamer.sh genosrtc.min.js YJ nostrTimestampCache
./js-renamer.sh genosrtc.min.js BQ getCurrentTimestamp
./js-renamer.sh genosrtc.min.js xQ getNostrKind
./js-renamer.sh genosrtc.min.js P8 normalizeUrl
./js-renamer.sh genosrtc.min.js XJ defaultRelays
./js-renamer.sh genosrtc.min.js ZJ handleNostrMessage
./js-renamer.sh genosrtc.min.js KJ getRelayConnection
./js-renamer.sh genosrtc.min.js DQ createNostrEvent
./js-renamer.sh genosrtc.min.js WQ createNostrSubscription
./js-renamer.sh genosrtc.min.js NQ closeNostrSubscription
./js-renamer.sh genosrtc.min.js MJ nostrJoin

echo "All renames completed successfully!"