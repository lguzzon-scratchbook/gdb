/* noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var globalCrypto =
	typeof globalThis === "object" && "crypto" in globalThis
		? globalThis.crypto
		: undefined;
function isUint8Array(arr) {
	return (
		arr instanceof Uint8Array ||
		(ArrayBuffer.isView(arr) && arr.constructor.name === "Uint8Array")
	);
}
function assertNumber(num) {
	if (!Number.isSafeInteger(num) || num < 0) {
		throw new Error(`positive integer expected, got ${num}`);
	}
}
function assertBytes(bytes, ...expectedLengths) {
	if (!isUint8Array(bytes)) {
		throw new Error("Uint8Array expected");
	}
	if (expectedLengths.length > 0 && !expectedLengths.includes(bytes.length)) {
		throw new Error(
			`Uint8Array expected of length ${expectedLengths}, got length=${bytes.length}`,
		);
	}
}
function assertHash(hash) {
	if (typeof hash !== "function" || typeof hash.create !== "function") {
		throw new Error("Hash should be wrapped by utils.createHasher");
	}
	assertNumber(hash.outputLen);
	assertNumber(hash.blockLen);
}
function assertInstance(instance, checkFinished = true) {
	if (instance.destroyed) {
		throw new Error("Hash instance has been destroyed");
	}
	if (checkFinished && instance.finished) {
		throw new Error("Hash#digest() has already been called");
	}
}
function assertDigest(output, hash) {
	assertBytes(output);
	const min = hash.outputLen;
	if (output.length < min) {
		throw new Error(
			`digestInto() expects output buffer of length at least ${min}`,
		);
	}
}
function zeroes(...arrays) {
	for (let i = 0; i < arrays.length; i++) {
		arrays[i].fill(0);
	}
}
function createDataView(bytes) {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
function rotr32(word, bits) {
	return (word << (32 - bits)) | (word >>> bits);
}
const isNativeHex = (() =>
	typeof Uint8Array.from([]).toHex === "function" &&
	typeof Uint8Array.fromHex === "function")();
const HEX_ALPHABET = Array.from(
	{
		length: 256,
	},
	(_v, i) => i.toString(16).padStart(2, "0"),
);
function bytesToHex(bytes) {
	assertBytes(bytes);
	if (isNativeHex) {
		return bytes.toHex();
	}
	let hex = "";
	for (let i = 0; i < bytes.length; i++) {
		hex += HEX_ALPHABET[bytes[i]];
	}
	return hex;
}
const HEX_CHAR_CODES = {
	_0: 48,
	_9: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102,
};
function hexCharToNumber(charCode) {
	if (charCode >= HEX_CHAR_CODES._0 && charCode <= HEX_CHAR_CODES._9) {
		return charCode - HEX_CHAR_CODES._0;
	}
	if (charCode >= HEX_CHAR_CODES.A && charCode <= HEX_CHAR_CODES.F) {
		return charCode - (HEX_CHAR_CODES.A - 10);
	}
	if (charCode >= HEX_CHAR_CODES.a && charCode <= HEX_CHAR_CODES.f) {
		return charCode - (HEX_CHAR_CODES.a - 10);
	}
	return;
}
function hexToBytes(hex) {
	if (typeof hex !== "string") {
		throw new Error(`hex string expected, got ${typeof hex}`);
	}
	if (isNativeHex) {
		return Uint8Array.fromHex(hex);
	}
	const hexLen = hex.length;
	const bytesLen = hexLen / 2;
	if (hexLen % 2) {
		throw new Error(
			`hex string expected, got unpadded hex of length ${hexLen}`,
		);
	}
	const result = new Uint8Array(bytesLen);
	for (let i = 0, j = 0; i < bytesLen; i++, j += 2) {
		const high = hexCharToNumber(hex.charCodeAt(j));
		const low = hexCharToNumber(hex.charCodeAt(j + 1));
		if (high === undefined || low === undefined) {
			const char = hex[j] + hex[j + 1];
			throw new Error(
				`hex string expected, got non-hex character "${char}" at index ${j}`,
			);
		}
		result[i] = high * 16 + low;
	}
	return result;
}
function stringToBytes(str) {
	if (typeof str !== "string") {
		throw new Error("string expected");
	}
	return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
	if (typeof data === "string") {
		data = stringToBytes(data);
	}
	assertBytes(data);
	return data;
}
function concatBytes(...arrays) {
	let totalLength = 0;
	for (let i = 0; i < arrays.length; i++) {
		const arr = arrays[i];
		assertBytes(arr);
		totalLength += arr.length;
	}
	const result = new Uint8Array(totalLength);
	for (let i = 0, pad = 0; i < arrays.length; i++) {
		const arr = arrays[i];
		result.set(arr, pad);
		pad += arr.length;
	}
	return result;
}
function createHasher(hashConstructor) {
	const hasher = (data) => hashConstructor().update(toBytes(data)).digest();
	const hashInstance = hashConstructor();
	hasher.outputLen = hashInstance.outputLen;
	hasher.blockLen = hashInstance.blockLen;
	hasher.create = () => hashConstructor();
	return hasher;
}
function randomBytes(bytesLength = 32) {
	if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
		return globalCrypto.getRandomValues(new Uint8Array(bytesLength));
	}
	if (globalCrypto && typeof globalCrypto.randomBytes === "function") {
		return Uint8Array.from(globalCrypto.randomBytes(bytesLength));
	}
	throw new Error("crypto.getRandomValues must be defined");
}
class Hash {}
function dataViewSetBigUint64(view, byteOffset, value, isLittleEndian) {
	if (typeof view.setBigUint64 === "function") {
		return view.setBigUint64(byteOffset, value, isLittleEndian);
	}
	const BITS_32 = BigInt(32);
	const MASK_32 = BigInt(4294967295);
	const high = Number((value >> BITS_32) & MASK_32);
	const low = Number(value & MASK_32);
	const highOffset = isLittleEndian ? 4 : 0;
	const lowOffset = isLittleEndian ? 0 : 4;
	view.setUint32(byteOffset + highOffset, high, isLittleEndian);
	view.setUint32(byteOffset + lowOffset, low, isLittleEndian);
}
function chi(x, y, z) {
	return (x & y) ^ (~x & z);
}
function maj(x, y, z) {
	return (x & y) ^ (x & z) ^ (y & z);
}
class SHA2 extends Hash {
	constructor(blockLen, outputLen, padOffset, isLE) {
		super();
		this.finished = false;
		this.length = 0;
		this.pos = 0;
		this.destroyed = false;
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createDataView(this.buffer);
	}
	update(data) {
		assertInstance(this);
		data = toBytes(data);
		assertBytes(data);
		const { view, buffer, blockLen } = this;
		const dataLen = data.length;
		for (let i = 0; i < dataLen; ) {
			const diff = Math.min(blockLen - this.pos, dataLen - i);
			if (diff === blockLen) {
				const dataView = createDataView(data);
				for (; blockLen <= dataLen - i; i += blockLen) {
					this.process(dataView, i);
				}
				continue;
			}
			buffer.set(data.subarray(i, i + diff), this.pos);
			this.pos += diff;
			i += diff;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
			}
		}
		this.length += data.length;
		this.roundClean();
		return this;
	}
	digestInto(output) {
		assertInstance(this);
		assertDigest(output, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		zeroes(this.buffer.subarray(pos));
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			pos = 0;
		}
		for (let i = pos; i < blockLen; i++) {
			buffer[i] = 0;
		}
		dataViewSetBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
		this.process(view, 0);
		const resultView = createDataView(output);
		const state = this.get();
		const outputWords = this.outputLen / 4;
		if (outputWords % 1) {
			throw new Error("_sha2: outputLen should be aligned to 32bit");
		}
		if (outputWords > state.length) {
			throw new Error("_sha2: outputLen bigger than state");
		}
		for (let i = 0; i < outputWords; i++) {
			resultView.setUint32(i * 4, state[i], isLE);
		}
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const result = buffer.slice(0, outputLen);
		this.destroy();
		return result;
	}
	_cloneInto(to) {
		to ||= new this.constructor();
		to.set(...this.get());
		const { blockLen, buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (length % blockLen) {
			to.buffer.set(buffer);
		}
		return to;
	}
	clone() {
		return this._cloneInto();
	}
}
const SHA256_INITIAL_STATE = Uint32Array.from([
	1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924,
	528734635, 1541459225,
]);
const SHA256_ROUND_CONSTANTS = Uint32Array.from([
	1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993,
	2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987,
	1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
	264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
	2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711,
	113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
	1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
	3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
	430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063,
	1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474,
	2756734187, 3204031479, 3329325298,
]);
const SHA256_W = new Uint32Array(64);
class SHA256 extends SHA2 {
	constructor(outputLen = 32) {
		super(64, outputLen, 8, false);
		this.A = SHA256_INITIAL_STATE[0] | 0;
		this.B = SHA256_INITIAL_STATE[1] | 0;
		this.C = SHA256_INITIAL_STATE[2] | 0;
		this.D = SHA256_INITIAL_STATE[3] | 0;
		this.E = SHA256_INITIAL_STATE[4] | 0;
		this.F = SHA256_INITIAL_STATE[5] | 0;
		this.G = SHA256_INITIAL_STATE[6] | 0;
		this.H = SHA256_INITIAL_STATE[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [A, B, C, D, E, F, G, H];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	process(dataView, dataOffset) {
		for (let i = 0; i < 16; i++, dataOffset += 4) {
			SHA256_W[i] = dataView.getUint32(dataOffset, false);
		}
		for (let i = 16; i < 64; i++) {
			const s0_ = SHA256_W[i - 15];
			const s1_ = SHA256_W[i - 2];
			const s0 = rotr32(s0_, 7) ^ rotr32(s0_, 18) ^ (s0_ >>> 3);
			const s1 = rotr32(s1_, 17) ^ rotr32(s1_, 19) ^ (s1_ >>> 10);
			SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
		}
		let { A: a, B: b, C: c, D: d, E: e, F: f, G: g, H: h } = this;
		for (let i = 0; i < 64; i++) {
			const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
			const T1 =
				(h + S1 + chi(e, f, g) + SHA256_ROUND_CONSTANTS[i] + SHA256_W[i]) | 0;
			const T2 =
				((rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) + maj(a, b, c)) | 0;
			h = g;
			g = f;
			f = e;
			e = (d + T1) | 0;
			d = c;
			c = b;
			b = a;
			a = (T1 + T2) | 0;
		}
		a = (a + this.A) | 0;
		b = (b + this.B) | 0;
		c = (c + this.C) | 0;
		d = (d + this.D) | 0;
		e = (e + this.E) | 0;
		f = (f + this.F) | 0;
		g = (g + this.G) | 0;
		h = (h + this.H) | 0;
		this.set(a, b, c, d, e, f, g, h);
	}
	roundClean() {
		zeroes(SHA256_W);
	}
	destroy() {
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		zeroes(this.buffer);
	}
}
const sha256 = createHasher(() => new SHA256());
class HMAC extends Hash {
	constructor(hash, key) {
		super();
		this.finished = false;
		this.destroyed = false;
		assertHash(hash);
		const keyBytes = toBytes(key);
		this.iHash = hash.create();
		if (typeof this.iHash.update !== "function") {
			throw new Error("Expected instance of class which extends utils.Hash");
		}
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const block = new Uint8Array(blockLen);
		block.set(
			keyBytes.length > blockLen
				? hash.create().update(keyBytes).digest()
				: keyBytes,
		);
		for (let i = 0; i < block.length; i++) {
			block[i] ^= 54;
		}
		this.iHash.update(block);
		this.oHash = hash.create();
		for (let i = 0; i < block.length; i++) {
			block[i] ^= 106;
		}
		this.oHash.update(block);
		zeroes(block);
	}
	update(data) {
		assertInstance(this);
		this.iHash.update(data);
		return this;
	}
	digestInto(out) {
		assertInstance(this);
		assertBytes(out, this.outputLen);
		this.finished = true;
		this.iHash.digestInto(out);
		this.oHash.update(out);
		this.oHash.digestInto(out);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to ||= Object.create(Object.getPrototypeOf(this), {});
		const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
}
const hmac = (hash, key, message) =>
	new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);
function assertBoolean(value, name = "") {
	if (typeof value !== "boolean") {
		const prop = name && `"${name}"`;
		throw new Error(`${prop}expected boolean, got type=${typeof value}`);
	}
	return value;
}
function assertBytes(bytes, length, name = "") {
	const isBytes = isUint8Array(bytes);
	const len = bytes?.length;
	const hasLength = length !== undefined;
	if (!isBytes || (hasLength && len !== length)) {
		const prop = name && `"${name}" `;
		const lenText = hasLength ? ` of length ${length}` : "";
		const got = isBytes ? `length=${len}` : `type=${typeof bytes}`;
		throw new Error(`${prop}expected Uint8Array${lenText}, got ${got}`);
	}
	return bytes;
}
function numberToHex(num) {
	const hex = num.toString(16);
	if (hex.length & 1) {
		return `0${hex}`;
	} else {
		return hex;
	}
}
function hexToNumber(hex) {
	if (typeof hex !== "string") {
		throw new Error(`hex string expected, got ${typeof hex}`);
	}
	if (hex === "") {
		return BIGINT_ZERO;
	} else {
		return BigInt(`0x${hex}`);
	}
}
function bytesToNumberBE(bytes) {
	return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
	assertBytes(bytes);
	return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(num, len) {
	return hexToBytes(num.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(num, len) {
	return numberToBytesBE(num, len).reverse();
}
function ensureBytes(name, hexOrBytes, len) {
	let bytes;
	if (typeof hexOrBytes === "string") {
		try {
			bytes = hexToBytes(hexOrBytes);
		} catch (e) {
			throw new Error(`${name} must be hex string or Uint8Array, cause: ${e}`);
		}
	} else if (isUint8Array(hexOrBytes)) {
		bytes = Uint8Array.from(hexOrBytes);
	} else {
		throw new Error(`${name} must be hex string or Uint8Array`);
	}
	const bytesLen = bytes.length;
	if (typeof len === "number" && bytesLen !== len) {
		throw new Error(`${name} of length ${len} expected, got ${bytesLen}`);
	}
	return bytes;
}
function isWithinCurveOrder(num, min, max) {
	return (
		isBigInt(num) && isBigInt(min) && isBigInt(max) && min <= num && num < max
	);
}
function assertWithinCurveOrder(name, num, min, max) {
	if (!isWithinCurveOrder(num, min, max)) {
		throw new Error(`expected valid ${name}: ${min} <= n < ${max}, got ${num}`);
	}
}
function bitLength(n) {
	let len;
	for (len = 0; n > BIGINT_ZERO; len += 1) {
		n >>= BIGINT_ONE;
	}
	return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
	if (typeof hashLen !== "number" || hashLen < 2) {
		throw new Error("hashLen must be a number");
	}
	if (typeof qByteLen !== "number" || qByteLen < 2) {
		throw new Error("qByteLen must be a number");
	}
	if (typeof hmacFn !== "function") {
		throw new Error("hmacFn must be a function");
	}
	const u8n = (len) => new Uint8Array(len);
	const u8fr = (val) => Uint8Array.of(val);
	let V = u8n(hashLen);
	let K = u8n(hashLen);
	let counter = 0;
	const reseed = () => {
		V.fill(1);
		K.fill(0);
		counter = 0;
	};
	const hmac = (...args) => hmacFn(K, V, ...args);
	const update = (seed = u8n(0)) => {
		K = hmac(u8fr(0), seed);
		V = hmac();
		if (seed.length === 0) {
			return;
		}
		K = hmac(u8fr(1), seed);
		V = hmac();
	};
	const generate = () => {
		if (counter++ >= 1000) {
			throw new Error("drbg: tried 1000 values");
		}
		let len = 0;
		const out = [];
		while (len < qByteLen) {
			V = hmac();
			const T = V.slice();
			out.push(T);
			len += V.length;
		}
		return concatBytes(...out);
	};
	return (seed, validator) => {
		reseed();
		update(seed);
		let out;
		while (!(out = validator(generate()))) {
			update();
		}
		reseed();
		return out;
	};
}
function validateObject(obj, required, optional = {}) {
	if (!obj || typeof obj !== "object") {
		throw new Error("expected valid options object");
	}
	function check(key, type, isOptional) {
		const val = obj[key];
		if (isOptional && val === undefined) {
			return;
		}
		const valType = typeof val;
		if (valType !== type || val === null) {
			throw new Error(
				`param "${key}" is invalid: expected ${type}, got ${valType}`,
			);
		}
	}
	Object.entries(required).forEach(([key, type]) => check(key, type, false));
	Object.entries(optional).forEach(([key, type]) => check(key, type, true));
}
function memoize(fn) {
	const cache = new WeakMap();
	return (obj, ...args) => {
		const cached = cache.get(obj);
		if (cached !== undefined) {
			return cached;
		}
		const result = fn(obj, ...args);
		cache.set(obj, result);
		return result;
	};
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const isBigInt = (n) => typeof n === "bigint" && BIGINT_ZERO <= n;
const bitMask = (bits) => (BIGINT_ONE << BigInt(bits)) - BIGINT_ONE;
function mod(a, b) {
	const res = a % b;
	if (res >= BIGINT_0) {
		return res;
	} else {
		return b + res;
	}
}
function _power(_base, exp, m) {
	let res = BIGINT_ONE;
	while (exp-- > BIGINT_0) {
		res *= res;
		res %= m;
	}
	return res;
}
function invert(number, modulus) {
	if (number === BIGINT_0) {
		throw new Error("invert: expected non-zero number");
	}
	if (modulus <= BIGINT_0) {
		throw new Error(`invert: expected positive modulus, got ${modulus}`);
	}
	let a = mod(number, modulus);
	let b = modulus;
	let x = BIGINT_0;
	let y = BIGINT_ONE;
	let u = BIGINT_ONE;
	let v = BIGINT_0;
	while (a !== BIGINT_0) {
		const q = b / a;
		const r = b % a;
		const m = x - u * q;
		const n = y - v * q;
		b = a;
		a = r;
		x = u;
		y = v;
		u = m;
		v = n;
	}
	if (b !== BIGINT_ONE) {
		throw new Error("invert: does not exist");
	}
	return mod(x, modulus);
}
function assertSquare(field, root, value) {
	if (!field.eql(field.sqr(root), value)) {
		throw new Error("Cannot find square root");
	}
}
function sqrtMod_p_plus_1_div_4(field, n) {
	const p1div4 = (field.ORDER + BIGINT_ONE) / BIGINT_4;
	const root = field.pow(n, p1div4);
	assertSquare(field, root, n);
	return root;
}
function sqrtMod_p_minus_3_div_8(field, n) {
	const p3div8 = (field.ORDER - BIGINT_5) / BIGINT_8;
	const c1 = field.mul(n, BIGINT_2);
	const c2 = field.pow(c1, p3div8);
	const root = field.mul(n, c2);
	const root2_ = field.mul(field.mul(root, BIGINT_2), c2);
	const check = field.mul(root, field.sub(root2_, field.ONE));
	assertSquare(field, check, n);
	return check;
}
function sqrtMod_p_plus_1_div_16(fieldP) {
	const Fp = createField(fieldP);
	const mul = (a, b) => a(b);
	const Pminus1 = mul(Fp, Fp.neg(Fp.ONE));
	const c2 = mul(Fp, Pminus1);
	const c3 = mul(Fp, c2);
	const exp = (fieldP + BIGINT_7) / BIGINT_16;
	return (F, n) => {
		let root = F.pow(n, exp);
		let c1 = F.mul(root, c2);
		const c2_ = F.mul(root, c3);
		const c3_ = F.mul(root, Pminus1);
		const t1 = F.eql(F.sqr(c1), n);
		const t2 = F.eql(F.sqr(c2_), n);
		root = F.cmov(root, c1, t1);
		c1 = F.cmov(c3_, c2_, t2);
		const t3 = F.eql(F.sqr(c1), n);
		const res = F.cmov(root, c1, t3);
		assertSquare(F, res, n);
		return res;
	};
}
function tonelliShanks(fieldP) {
	if (fieldP < BIGINT_3) {
		throw new Error("sqrt is not defined for small field");
	}
	let S = BIGINT_0;
	let Q = fieldP - BIGINT_ONE;
	while (Q % BIGINT_2 === BIGINT_0) {
		Q /= BIGINT_2;
		S++;
	}
	let Z = BIGINT_2;
	const Fp = createField(fieldP);
	while (legendre(Fp, Z) === 1) {
		if (Z++ > 1000) {
			throw new Error("Cannot find square root: probably non-prime P");
		}
	}
	if (S === 1) {
		return sqrtMod_p_plus_1_div_4;
	}
	const z_inv = Fp.pow(Z, Q);
	const Q_1_2 = (Q + BIGINT_ONE) / BIGINT_2;
	return function sqrt(F, n) {
		if (F.is0(n)) {
			return n;
		}
		if (legendre(F, n) !== 1) {
			throw new Error("Cannot find square root");
		}
		let M = S;
		let c = F.mul(F.ONE, z_inv);
		let t = F.pow(n, Q);
		let R = F.pow(n, Q_1_2);
		while (!F.eql(t, F.ONE)) {
			if (F.is0(t)) {
				return F.ZERO;
			}
			let i = 1;
			let t2i = F.sqr(t);
			while (!F.eql(t2i, F.ONE)) {
				i++;
				t2i = F.sqr(t2i);
				if (i === M) {
					throw new Error("Cannot find square root");
				}
			}
			const exp = BIGINT_ONE << BigInt(M - i - 1);
			const b = F.pow(c, exp);
			M = i;
			c = F.sqr(b);
			t = F.mul(t, c);
			R = F.mul(R, b);
		}
		return R;
	};
}
const BIGINT_2 = BigInt(2);
const BIGINT_3 = BigInt(3);
const BIGINT_4 = BigInt(4);
const BIGINT_5 = BigInt(5);
const BIGINT_7 = BigInt(7);
const BIGINT_8 = BigInt(8);
const BIGINT_9 = BigInt(9);
const BIGINT_16 = BigInt(16);
function getPowSqrt(fieldP) {
	if (fieldP % BIGINT_4 === BIGINT_3) {
		return sqrtMod_p_plus_1_div_4;
	}
	if (fieldP % BIGINT_8 === BIGINT_5) {
		return sqrtMod_p_minus_3_div_8;
	}
	if (fieldP % BIGINT_16 === BIGINT_9) {
		return sqrtMod_p_plus_1_div_16(fieldP);
	}
	return tonelliShanks(fieldP);
}
const FIELD_METHODS = [
	"create",
	"isValid",
	"is0",
	"neg",
	"inv",
	"sqrt",
	"sqr",
	"eql",
	"add",
	"sub",
	"mul",
	"pow",
	"div",
	"addN",
	"subN",
	"mulN",
	"sqrN",
];
function validateField(field) {
	const req = {
		ORDER: "bigint",
		MASK: "bigint",
		BYTES: "number",
		BITS: "number",
	};
	const required = FIELD_METHODS.reduce((acc, name) => {
		acc[name] = "function";
		return acc;
	}, req);
	validateObject(field, required);
	return field;
}
function power(field, base, exp) {
	if (exp < BIGINT_0) {
		throw new Error("invalid exponent, negatives unsupported");
	}
	if (exp === BIGINT_0) {
		return field.ONE;
	}
	if (exp === BIGINT_ONE) {
		return base;
	}
	let p = field.ONE;
	let d = base;
	while (exp > BIGINT_0) {
		if (exp & BIGINT_ONE) {
			p = field.mul(p, d);
		}
		d = field.sqr(d);
		exp >>= BIGINT_ONE;
	}
	return p;
}
function invertBatch(field, nums, isNonZero = false) {
	const scratch = new Array(nums.length).fill(
		isNonZero ? field.ZERO : undefined,
	);
	const lastMultiplied = nums.reduce((acc, num, i) => {
		if (field.is0(num)) {
			return acc;
		}
		scratch[i] = acc;
		return field.mul(acc, num);
	}, field.ONE);
	const inverted = field.inv(lastMultiplied);
	nums.reduceRight((acc, num, i) => {
		if (field.is0(num)) {
			return acc;
		}
		scratch[i] = field.mul(acc, scratch[i]);
		return field.mul(acc, num);
	}, inverted);
	return scratch;
}
function legendre(field, n) {
	const p_1_2 = (field.ORDER - BIGINT_ONE) / BIGINT_2;
	const L = field.pow(n, p_1_2);
	const is1 = field.eql(L, field.ONE);
	const is0 = field.eql(L, field.ZERO);
	const is_1 = field.eql(L, field.neg(field.ONE));
	if (!is1 && !is0 && !is_1) {
		throw new Error("invalid Legendre symbol result");
	}
	if (is1) {
		return 1;
	} else if (is0) {
		return 0;
	} else {
		return -1;
	}
}
function getCurveParams(order, bits) {
	if (bits !== undefined) {
		assertNumber(bits);
	}
	const nBitLength = bits !== undefined ? bits : order.toString(2).length;
	const nByteLength = Math.ceil(nBitLength / 8);
	return {
		nBitLength,
		nByteLength,
	};
}
function createField(order, opts, isLE = false, opts2 = {}) {
	if (order <= BIGINT_0) {
		throw new Error(`invalid field: expected ORDER > 0, got ${order}`);
	}
	let bitsOpt;
	let sqrtOpt;
	let modFromBytesOpt = false;
	let allowedLengthsOpt;
	if (typeof opts === "object" && opts != null) {
		if (opts2.sqrt || isLE) {
			throw new Error("cannot specify opts in two arguments");
		}
		const o = opts;
		if (o.BITS) {
			bitsOpt = o.BITS;
		}
		if (o.sqrt) {
			sqrtOpt = o.sqrt;
		}
		if (typeof o.isLE === "boolean") {
			isLE = o.isLE;
		}
		if (typeof o.modFromBytes === "boolean") {
			modFromBytesOpt = o.modFromBytes;
		}
		allowedLengthsOpt = o.allowedLengths;
	} else {
		if (typeof opts === "number") {
			bitsOpt = opts;
		}
		if (opts2.sqrt) {
			sqrtOpt = opts2.sqrt;
		}
	}
	const { nBitLength: BITS, nByteLength: BYTES } = getCurveParams(
		order,
		bitsOpt,
	);
	if (BYTES > 2048) {
		throw new Error("invalid field: expected ORDER of <= 2048 bytes");
	}
	let sqrtS;
	const field = Object.freeze({
		ORDER: order,
		isLE: isLE,
		BITS: BITS,
		BYTES: BYTES,
		MASK: bitMask(BITS),
		ZERO: BIGINT_0,
		ONE: BIGINT_ONE,
		allowedLengths: allowedLengthsOpt,
		create: (n) => mod(n, order),
		isValid: (n) => {
			if (typeof n !== "bigint") {
				throw new Error(
					`invalid field element: expected bigint, got ${typeof n}`,
				);
			}
			return BIGINT_0 <= n && n < order;
		},
		is0: (n) => n === BIGINT_0,
		isValidNot0: (n) => !field.is0(n) && field.isValid(n),
		isOdd: (n) => (n & BIGINT_ONE) === BIGINT_ONE,
		neg: (n) => mod(-n, order),
		eql: (a, b) => a === b,
		sqr: (a) => mod(a * a, order),
		add: (a, b) => mod(a + b, order),
		sub: (a, b) => mod(a - b, order),
		mul: (a, b) => mod(a * b, order),
		pow: (base, exp) => power(field, base, exp),
		div: (a, b) => mod(a * invert(b, order), order),
		sqrN: (a) => a * a,
		addN: (a, b) => a + b,
		subN: (a, b) => a - b,
		mulN: (a, b) => a * b,
		inv: (n) => invert(n, order),
		sqrt:
			sqrtOpt ||
			((n) => {
				if (!sqrtS) {
					sqrtS = getPowSqrt(order);
				}
				return sqrtS(field, n);
			}),
		toBytes: (n) =>
			isLE ? numberToBytesLE(n, BYTES) : numberToBytesBE(n, BYTES),
		fromBytes: (bytes, isSafe = true) => {
			if (allowedLengthsOpt) {
				if (!allowedLengthsOpt.includes(bytes.length) || bytes.length > BYTES) {
					throw new Error(
						`Field.fromBytes: expected ${allowedLengthsOpt} bytes, got ${bytes.length}`,
					);
				}
				const b = new Uint8Array(BYTES);
				b.set(bytes, isLE ? 0 : b.length - bytes.length);
				bytes = b;
			}
			if (bytes.length !== BYTES) {
				throw new Error(
					`Field.fromBytes: expected ${BYTES} bytes, got ${bytes.length}`,
				);
			}
			let n = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
			if (modFromBytesOpt) {
				n = mod(n, order);
			}
			if (!isSafe) {
				if (!field.isValid(n)) {
					throw new Error("invalid field element: outside of range 0..ORDER");
				}
			}
			return n;
		},
		invertBatch: (nums) => invertBatch(field, nums),
		cmov: (a, b, c) => (c ? b : a),
	});
	return Object.freeze(field);
}
function getOrderBytes(order) {
	if (typeof order !== "bigint") {
		throw new Error("field order must be bigint");
	}
	const len = order.toString(2).length;
	return Math.ceil(len / 8);
}
function getMinSeedLength(order) {
	const orderLen = getOrderBytes(order);
	return orderLen + Math.ceil(orderLen / 2);
}
function hashToPrivateBytes(hash, order, isLE = false) {
	const hashLen = hash.length;
	const orderLen = getOrderBytes(order);
	const minLen = getMinSeedLength(order);
	if (hashLen < 16 || hashLen < minLen || hashLen > 1024) {
		throw new Error(`expected ${minLen}-1024 bytes of input, got ${hashLen}`);
	}
	const num = isLE ? bytesToNumberLE(hash) : bytesToNumberBE(hash);
	const reduced = mod(num, order - BIGINT_ONE) + BIGINT_ONE;
	if (isLE) {
		return numberToBytesLE(reduced, orderLen);
	} else {
		return numberToBytesBE(reduced, orderLen);
	}
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const BIGINT_0 = BigInt(0);
const BIGINT_1 = BigInt(1);
function conditionalNegate(condition, point) {
	const neg = point.negate();
	if (condition) {
		return neg;
	} else {
		return point;
	}
}
function normalizeZ(curve, points) {
	const Zs = invertBatch(
		curve.Fp,
		points.map((p) => p.Z),
	);
	return points.map((p, i) => curve.fromAffine(p.toAffine(Zs[i])));
}
function validateWnafWindow(w, precomputedBits) {
	if (!Number.isSafeInteger(w) || w <= 0 || w > precomputedBits) {
		throw new Error(
			`invalid window size, expected [1..${precomputedBits}], got W=${w}`,
		);
	}
}
function getWnafConfig(w, precomputedBits) {
	validateWnafWindow(w, precomputedBits);
	const windows = Math.ceil(precomputedBits / w) + 1;
	const windowSize = 2 ** (w - 1);
	const maxNumber = 2 ** w;
	const mask = bitMask(w);
	const shiftBy = BigInt(w);
	return {
		windows,
		windowSize,
		mask,
		maxNumber,
		shiftBy,
	};
}
function getWnafMultiplicand(scalar, w, config) {
	const { windowSize, mask, maxNumber, shiftBy } = config;
	let n = Number(scalar & mask);
	let nextScalar = scalar >> shiftBy;
	if (n > windowSize) {
		n -= maxNumber;
		nextScalar += BIGINT_1;
	}
	const offset = w * windowSize;
	const p = offset + Math.abs(n) - 1;
	const isZero = n === 0;
	const isNeg = n < 0;
	const isFactorNeg = w % 2 !== 0;
	return {
		nextN: nextScalar,
		offset: p,
		isZero: isZero,
		isNeg: isNeg,
		isNegF: isFactorNeg,
		offsetF: offset,
	};
}
function assertPoints(points, pointClass) {
	if (!Array.isArray(points)) {
		throw new Error("array expected");
	}
	points.forEach((p, i) => {
		if (!(p instanceof pointClass)) {
			throw new Error(`invalid point at index ${i}`);
		}
	});
}
function assertScalars(scalars, scalarField) {
	if (!Array.isArray(scalars)) {
		throw new Error("array of scalars expected");
	}
	scalars.forEach((s, i) => {
		if (!scalarField.isValid(s)) {
			throw new Error(`invalid scalar at index ${i}`);
		}
	});
}
const windowSizeCache = new WeakMap();
function getCacheW(point) {
	return windowSizeCache.get(point) || 1;
}
function assertWnafZero(n) {
	if (n !== BIGINT_0) {
		throw new Error("invalid wNAF");
	}
}
function unsafeLadder(curve, point, k1, k2) {
	let d = point;
	let p1 = curve.ZERO;
	let p2 = curve.ZERO;
	while (k1 > BIGINT_0 || k2 > BIGINT_0) {
		if (k1 & BIGINT_1) {
			p1 = p1.add(d);
		}
		if (k2 & BIGINT_1) {
			p2 = p2.add(d);
		}
		d = d.double();
		k1 >>= BIGINT_1;
		k2 >>= BIGINT_1;
	}
	return {
		p1,
		p2,
	};
}
function pippenger(curve, scalarField, points, scalars) {
	assertPoints(points, curve);
	assertScalars(scalars, scalarField);
	const pointsLen = points.length;
	const scalarsLen = scalars.length;
	if (pointsLen !== scalarsLen) {
		throw new Error("arrays of points and scalars must have equal length");
	}
	const { ZERO: zeroPoint } = curve;
	const c = bitLength(BigInt(pointsLen));
	let w = 1;
	if (c > 12) {
		w = c - 3;
	} else if (c > 4) {
		w = c - 2;
	} else if (c > 0) {
		w = 2;
	}
	const mask = bitMask(w);
	const buckets = new Array(Number(mask) + 1).fill(zeroPoint);
	const hi = Math.floor((scalarField.BITS - 1) / w) * w;
	let p = zeroPoint;
	for (let k = hi; k >= 0; k -= w) {
		buckets.fill(zeroPoint);
		for (let i = 0; i < scalarsLen; i++) {
			const s = scalars[i];
			const buck = Number((s >> BigInt(k)) & mask);
			buckets[buck] = buckets[buck].add(points[i]);
		}
		let ith_bucket = zeroPoint;
		for (let i = buckets.length - 1, running_sum = zeroPoint; i > 0; i--) {
			running_sum = running_sum.add(buckets[i]);
			ith_bucket = ith_bucket.add(running_sum);
		}
		p = p.add(ith_bucket);
		if (k !== 0) {
			for (let i = 0; i < w; i++) {
				p = p.double();
			}
		}
	}
	return p;
}
function ensureField(order, field, isLE) {
	if (field) {
		if (field.ORDER !== order) {
			throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
		}
		validateField(field);
		return field;
	} else {
		return createField(order, {
			isLE: isLE,
		});
	}
}
function validateCurve(
	curveType,
	curve,
	opts = {},
	defaultIsLE = curveType === "edwards",
) {
	if (!curve || typeof curve !== "object") {
		throw new Error(`expected valid ${curveType} CURVE object`);
	}
	for (const key of ["p", "n", "h"]) {
		const val = curve[key];
		if (typeof val !== "bigint" || !(val > BIGINT_0)) {
			throw new Error(`CURVE.${key} must be positive bigint`);
		}
	}
	const Fp = ensureField(curve.p, opts.Fp, defaultIsLE);
	const Fn = ensureField(curve.n, opts.Fn, defaultIsLE);
	const weierstrassParams = [
		"Gx",
		"Gy",
		"a",
		curveType === "weierstrass" ? "b" : "d",
	];
	for (const key of weierstrassParams) {
		if (!Fp.isValid(curve[key])) {
			throw new Error(`CURVE.${key} must be valid field element of CURVE.Fp`);
		}
	}
	curve = Object.freeze(Object.assign({}, curve));
	return {
		CURVE: curve,
		Fp: Fp,
		Fn: Fn,
	};
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const precomputeCache = new WeakMap();
class WNAF {
	constructor(curve, _point, bits) {
		this.BASE = curve.BASE;
		this.ZERO = curve.ZERO;
		this.Fn = curve.Fn;
		this.bits = bits;
	}
	_unsafeLadder(point, scalar, initial = this.ZERO) {
		let d = point;
		while (scalar > BIGINT_0) {
			if (scalar & BIGINT_1) {
				initial = initial.add(d);
			}
			d = d.double();
			scalar >>= BIGINT_1;
		}
		return initial;
	}
	precomputeWindow(point, W) {
		const { windows, windowSize } = getWnafConfig(W, this.bits);
		const points = [];
		let p = point;
		let b = p;
		for (let i = 0; i < windows; i++) {
			b = p;
			points.push(b);
			for (let j = 1; j < windowSize; j++) {
				b = b.add(p);
				points.push(b);
			}
			p = b.double();
		}
		return points;
	}
	wNAF(point, precomputes, scalar) {
		if (!this.Fn.isValid(scalar)) {
			throw new Error("invalid scalar");
		}
		let p = this.ZERO;
		let f = this.BASE;
		const config = getWnafConfig(point, this.bits);
		for (let w = 0; w < config.windows; w++) {
			const {
				nextN: nextScalar,
				offset: p_offset,
				isZero: isPZero,
				isNeg: isPNeg,
				isNegF: isFactorNeg,
				offsetF: f_offset,
			} = getWnafMultiplicand(scalar, w, config);
			scalar = nextScalar;
			if (isPZero) {
				f = f.add(conditionalNegate(isFactorNeg, precomputes[f_offset]));
			} else {
				p = p.add(conditionalNegate(isPNeg, precomputes[p_offset]));
			}
		}
		assertWnafZero(scalar);
		return {
			p,
			f,
		};
	}
	wNAFUnsafe(point, precomputes, scalar, initial = this.ZERO) {
		const config = getWnafConfig(point, this.bits);
		for (let w = 0; w < config.windows; w++) {
			if (scalar === BIGINT_0) {
				break;
			}
			const {
				nextN: nextScalar,
				offset: p_offset,
				isZero: isPZero,
				isNeg: isPNeg,
			} = getWnafMultiplicand(scalar, w, config);
			scalar = nextScalar;
			if (isPZero) {
			} else {
				const p_ = precomputes[p_offset];
				initial = initial.add(isPNeg ? p_.negate() : p_);
			}
		}
		assertWnafZero(scalar);
		return initial;
	}
	getPrecomputes(point, W, transform) {
		let precomputes = precomputeCache.get(point);
		if (!precomputes) {
			precomputes = this.precomputeWindow(point, W);
			if (W !== 1) {
				if (typeof transform === "function") {
					precomputes = transform(precomputes);
				}
				precomputeCache.set(point, precomputes);
			}
		}
		return precomputes;
	}
	cached(point, scalar, transform) {
		const W = getCacheW(point);
		return this.wNAF(W, this.getPrecomputes(point, W, transform), scalar);
	}
	unsafe(point, scalar, transform, initial) {
		const W = getCacheW(point);
		if (W === 1) {
			return this._unsafeLadder(point, scalar, initial);
		}
		return this.wNAFUnsafe(
			W,
			this.getPrecomputes(point, W, transform),
			scalar,
			initial,
		);
	}
	createCache(point, W) {
		validateWnafWindow(W, this.bits);
		windowSizeCache.set(point, W);
		precomputeCache.delete(point);
	}
	hasCache(point) {
		return getCacheW(point) !== 1;
	}
}
function divNearest(a, b) {
	return (a + (a >= 0 ? b : -b) / BIGINT_2) / b;
}
function splitScalarEndo(scalar, endoBasises, curveN) {
	const [[n1, n2], [g1, g2]] = endoBasises;
	const d1 = divNearest(n2 * scalar, curveN);
	const d2 = divNearest(-n1 * scalar, curveN);
	let k1 = scalar - d1 * g1 - d2 * g2;
	let k2 = -d1 * n1 - d2 * n2;
	const k1neg = k1 < BIGINT_0;
	const k2neg = k2 < BIGINT_0;
	if (k1neg) {
		k1 = -k1;
	}
	if (k2neg) {
		k2 = -k2;
	}
	const MASK = bitMask(Math.ceil(bitLength(curveN) / 2)) + BIGINT_1;
	if (k1 < BIGINT_0 || k1 >= MASK || k2 < BIGINT_0 || k2 >= MASK) {
		throw new Error(`splitScalar (endomorphism): failed, k=${scalar}`);
	}
	return {
		k1neg,
		k1,
		k2neg,
		k2,
	};
}
function validateSignatureFormat(format) {
	if (!["compact", "recovered", "der"].includes(format)) {
		throw new Error(
			'Signature format must be "compact", "recovered", or "der"',
		);
	}
	return format;
}
function getOptions(opts, defaults) {
	const res = {};
	for (const key of Object.keys(defaults)) {
		res[key] = opts[key] === undefined ? defaults[key] : opts[key];
	}
	assertBoolean(res.lowS, "lowS");
	assertBoolean(res.prehash, "prehash");
	if (res.format !== undefined) {
		validateSignatureFormat(res.format);
	}
	return res;
}
function normalizePrivateKey(field, key) {
	const { BYTES: len } = field;
	let numKey;
	if (typeof key === "bigint") {
		numKey = key;
	} else {
		const bytesKey = ensureBytes("private key", key);
		try {
			numKey = field.fromBytes(bytesKey);
		} catch (_e) {
			throw new Error(
				`invalid private key: expected ui8a of size ${len}, got ${typeof key}`,
			);
		}
	}
	if (!field.isValidNot0(numKey)) {
		throw new Error("invalid private key: out of range [1..N-1]");
	}
	return numKey;
}
function createCurve(curveConfig, opts) {
	const {
		CURVE: _curve,
		Fp,
		Fn,
	} = validateCurve("weierstrass", curveConfig, opts);
	const curve = _curve;
	const { h: cofactor, n: order } = curve;
	validateObject(
		opts,
		{},
		{
			allowInfinityPoint: "boolean",
			clearCofactor: "function",
			isTorsionFree: "function",
			fromBytes: "function",
			toBytes: "function",
			endo: "object",
			wrapPrivateKey: "boolean",
		},
	);
	const { endo } = opts;
	if (endo) {
		if (
			!Fp.is0(curve.a) ||
			typeof endo.beta !== "bigint" ||
			!Array.isArray(endo.basises)
		) {
			throw new Error(
				'invalid endo: expected "beta": bigint and "basises": array',
			);
		}
	}
	const lengths = getLengths(Fp, Fn);
	function requireIsOdd() {
		if (!Fp.isOdd) {
			throw new Error(
				"compression is not supported: Field does not have .isOdd()",
			);
		}
	}
	function pointToBytes(_curve, point, isCompressed) {
		const { x, y } = point.toAffine();
		const xBytes = Fp.toBytes(x);
		assertBoolean(isCompressed, "isCompressed");
		if (isCompressed) {
			requireIsOdd();
			const isYEven = !Fp.isOdd(y);
			return concatBytes(getPointCompress(isYEven), xBytes);
		} else {
			return concatBytes(Uint8Array.of(4), xBytes, Fp.toBytes(y));
		}
	}
	function bytesToPoint(data) {
		assertBytes(data, undefined, "Point");
		const { publicKey: compressedLen, publicKeyUncompressed: uncompressedLen } =
			lengths;
		const len = data.length;
		const header = data[0];
		const rest = data.subarray(1);
		if (len === compressedLen && (header === 2 || header === 3)) {
			const x = Fp.fromBytes(rest);
			if (!Fp.isValid(x)) {
				throw new Error("bad point: is not on curve, wrong x");
			}
			const y2 = pointY(x);
			let y;
			try {
				y = Fp.sqrt(y2);
			} catch (e) {
				const error = e instanceof Error ? `: ${e.message}` : "";
				throw new Error(`bad point: is not on curve, sqrt error${error}`);
			}
			requireIsOdd();
			const isYOdd = Fp.isOdd(y);
			if (((header & 1) === 1) !== isYOdd) {
				y = Fp.neg(y);
			}
			return {
				x,
				y,
			};
		} else if (len === uncompressedLen && header === 4) {
			const byteLen = Fp.BYTES;
			const x = Fp.fromBytes(rest.subarray(0, byteLen));
			const y = Fp.fromBytes(rest.subarray(byteLen, byteLen * 2));
			if (!isPoint(x, y)) {
				throw new Error("bad point: is not on curve");
			}
			return {
				x,
				y,
			};
		} else {
			throw new Error(
				`bad point: got length ${len}, expected compressed=${compressedLen} or uncompressed=${uncompressedLen}`,
			);
		}
	}
	const toBytesFn = opts.toBytes || pointToBytes;
	const fromBytesFn = opts.fromBytes || bytesToPoint;
	function pointY(x) {
		const x2 = Fp.sqr(x);
		const x3 = Fp.mul(x2, x);
		return Fp.add(Fp.add(x3, Fp.mul(x, curve.a)), curve.b);
	}
	function isPoint(x, y) {
		const y2 = Fp.sqr(y);
		const y2_ = pointY(x);
		return Fp.eql(y2, y2_);
	}
	if (!isPoint(curve.Gx, curve.Gy)) {
		throw new Error("bad curve params: generator point");
	}
	const BIGINT_3 = BigInt(3);
	const BIGINT_4 = BigInt(4);
	const delta_a = Fp.mul(Fp.pow(curve.a, BIGINT_3), BIGINT_4);
	const delta_b = Fp.mul(Fp.sqr(curve.b), BigInt(27));
	if (Fp.is0(Fp.add(delta_a, delta_b))) {
		throw new Error("bad curve params: a or b");
	}
	function assertPointCoordinate(name, val, isY = false) {
		if (!Fp.isValid(val) || (isY && Fp.is0(val))) {
			throw new Error(`bad point coordinate ${name}`);
		}
		return val;
	}
	function assertProjectivePoint(p) {
		if (!(p instanceof ProjectivePoint)) {
			throw new Error("ProjectivePoint expected");
		}
	}
	function splitScalar(k) {
		if (!endo || !endo.basises) {
			throw new Error("no endo");
		}
		return splitScalarEndo(k, endo.basises, Fn.ORDER);
	}
	const pointFromAffine = memoize((x, y) => {
		const { X, Y, Z } = x;
		if (Fp.eql(Z, Fp.ONE)) {
			return {
				x: X,
				y: Y,
			};
		}
		const isZero = x.is0();
		if (y == null) {
			y = isZero ? Fp.ONE : Fp.inv(Z);
		}
		const x_ = Fp.mul(X, y);
		const y_ = Fp.mul(Y, y);
		const z_ = Fp.mul(Z, y);
		if (isZero) {
			return {
				x: Fp.ZERO,
				y: Fp.ZERO,
			};
		}
		if (!Fp.eql(z_, Fp.ONE)) {
			throw new Error("invZ was invalid");
		}
		return {
			x: x_,
			y: y_,
		};
	});
	const pointAssertValidity = memoize((p) => {
		if (p.is0()) {
			if (opts.allowInfinityPoint && !Fp.is0(p.Y)) {
				return;
			}
			throw new Error("bad point: ZERO");
		}
		const { x, y } = p.toAffine();
		if (!Fp.isValid(x) || !Fp.isValid(y)) {
			throw new Error("bad point: x or y not field elements");
		}
		if (!isPoint(x, y)) {
			throw new Error("bad point: equation left != right");
		}
		if (!p.isTorsionFree()) {
			throw new Error("bad point: not in prime-order subgroup");
		}
		return true;
	});
	function addEndo(p1, p2, k1neg, k2neg) {
		p2 = new ProjectivePoint(Fp.mul(p2.X, endo.beta), p2.Y, p2.Z);
		p1 = conditionalNegate(k1neg, p1);
		p2 = conditionalNegate(k2neg, p2);
		return p1.add(p2);
	}
	class ProjectivePoint {
		constructor(X, Y, Z) {
			this.X = assertPointCoordinate("x", X);
			this.Y = assertPointCoordinate("y", Y, true);
			this.Z = assertPointCoordinate("z", Z);
			Object.freeze(this);
		}
		static CURVE() {
			return curve;
		}
		static fromAffine(affine) {
			const { x, y } = affine || {};
			if (!affine || !Fp.isValid(x) || !Fp.isValid(y)) {
				throw new Error("invalid affine point");
			}
			if (affine instanceof ProjectivePoint) {
				throw new Error("projective point not allowed");
			}
			if (Fp.is0(x) && Fp.is0(y)) {
				return ProjectivePoint.ZERO;
			}
			return new ProjectivePoint(x, y, Fp.ONE);
		}
		static fromBytes(bytes) {
			const p = ProjectivePoint.fromAffine(
				fromBytesFn(assertBytes(bytes, undefined, "point")),
			);
			p.assertValidity();
			return p;
		}
		static fromHex(hex) {
			return ProjectivePoint.fromBytes(ensureBytes("pointHex", hex));
		}
		get x() {
			return this.toAffine().x;
		}
		get y() {
			return this.toAffine().y;
		}
		precompute(W = 8, asPoint = true) {
			wnaf.createCache(this, W);
			if (!asPoint) {
				this.multiply(BIGINT_3);
			}
			return this;
		}
		assertValidity() {
			pointAssertValidity(this);
		}
		hasEvenY() {
			const { y } = this.toAffine();
			if (!Fp.isOdd) {
				throw new Error("Field doesn't support isOdd");
			}
			return !Fp.isOdd(y);
		}
		equals(other) {
			assertProjectivePoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			const X1Z2 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
			const Y1Z2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
			return X1Z2 && Y1Z2;
		}
		negate() {
			return new ProjectivePoint(this.X, Fp.neg(this.Y), this.Z);
		}
		double() {
			const { a, b } = curve;
			const b3 = Fp.mul(b, BIGINT_3);
			const { X, Y, Z } = this;
			let { ZERO: t0, ZERO: t1, ZERO: t2 } = Fp;
			let X_ = Fp.mul(X, X);
			const Y_ = Fp.mul(Y, Y);
			let Z_ = Fp.mul(Z, Z);
			let t3 = Fp.mul(X, Y);
			t3 = Fp.add(t3, t3);
			t2 = Fp.mul(X, Z);
			t2 = Fp.add(t2, t2);
			t0 = Fp.mul(a, t2);
			t1 = Fp.mul(b3, Z_);
			t1 = Fp.add(t0, t1);
			t0 = Fp.sub(Y_, t1);
			t1 = Fp.add(Y_, t1);
			t1 = Fp.mul(t0, t1);
			t0 = Fp.mul(t3, t0);
			t2 = Fp.mul(b3, t2);
			Z_ = Fp.mul(a, Z_);
			t3 = Fp.sub(X_, Z_);
			t3 = Fp.mul(a, t3);
			t3 = Fp.add(t3, t2);
			t2 = Fp.add(X_, X_);
			X_ = Fp.add(t2, X_);
			X_ = Fp.add(X_, Z_);
			X_ = Fp.mul(X_, t3);
			t1 = Fp.add(t1, X_);
			Z_ = Fp.mul(Y, Z);
			Z_ = Fp.add(Z_, Z_);
			X_ = Fp.mul(Z_, t3);
			t0 = Fp.sub(t0, X_);
			t2 = Fp.mul(Z_, Y_);
			t2 = Fp.add(t2, t2);
			t2 = Fp.add(t2, t2);
			return new ProjectivePoint(t0, t1, t2);
		}
		add(other) {
			assertProjectivePoint(other);
			const { X: X1, Y: Y1, Z: Z1 } = this;
			const { X: X2, Y: Y2, Z: Z2 } = other;
			let { ZERO: t0, ZERO: t1, ZERO: t2 } = Fp;
			const a = curve.a;
			const b3 = Fp.mul(curve.b, BIGINT_3);
			let x = Fp.mul(X1, X2);
			let y = Fp.mul(Y1, Y2);
			let z = Fp.mul(Z1, Z2);
			let t = Fp.add(X1, Y1);
			let u = Fp.add(X2, Y2);
			t = Fp.mul(t, u);
			u = Fp.add(x, y);
			t = Fp.sub(t, u);
			u = Fp.add(X1, Z1);
			let x_ = Fp.add(X2, Z2);
			u = Fp.mul(u, x_);
			x_ = Fp.add(x, z);
			u = Fp.sub(u, x_);
			x_ = Fp.add(Y1, Z1);
			t0 = Fp.add(Y2, Z2);
			x_ = Fp.mul(x_, t0);
			t0 = Fp.add(y, z);
			x_ = Fp.sub(x_, t0);
			t2 = Fp.mul(a, u);
			t0 = Fp.mul(b3, z);
			t2 = Fp.add(t0, t2);
			t0 = Fp.sub(y, t2);
			t2 = Fp.add(y, t2);
			t1 = Fp.mul(t0, t2);
			y = Fp.add(x, x);
			y = Fp.add(y, x);
			z = Fp.mul(a, z);
			u = Fp.mul(b3, u);
			y = Fp.add(y, z);
			z = Fp.sub(x, z);
			z = Fp.mul(a, z);
			u = Fp.add(u, z);
			x = Fp.mul(y, u);
			t1 = Fp.add(t1, x);
			x = Fp.mul(x_, u);
			t0 = Fp.mul(t, t0);
			t0 = Fp.sub(t0, x);
			x = Fp.mul(t, y);
			t2 = Fp.mul(x_, t2);
			t2 = Fp.add(t2, x);
			return new ProjectivePoint(t0, t1, t2);
		}
		subtract(other) {
			return this.add(other.negate());
		}
		is0() {
			return this.equals(ProjectivePoint.ZERO);
		}
		multiply(scalar) {
			const { endo } = opts;
			if (!Fn.isValidNot0(scalar)) {
				throw new Error("invalid scalar: out of range");
			}
			let point;
			let fake;
			const getPrecomputes = (W) =>
				wnaf.cached(this, W, (c) => normalizeZ(ProjectivePoint, c));
			if (endo) {
				const { k1neg, k1, k2neg, k2 } = splitScalar(scalar);
				const { p: p1, f: f1 } = getPrecomputes(k1);
				const { p: p2, f: f2 } = getPrecomputes(k2);
				fake = f1.add(f2);
				point = addEndo(endo.beta, p1, p2, k1neg, k2neg);
			} else {
				const { p, f } = getPrecomputes(scalar);
				point = p;
				fake = f;
			}
			return normalizeZ(ProjectivePoint, [point, fake])[0];
		}
		multiplyUnsafe(scalar) {
			const { endo } = opts;
			if (!Fn.isValid(scalar)) {
				throw new Error("invalid scalar: out of range");
			}
			if (scalar === BIGINT_0 || this.is0()) {
				return ProjectivePoint.ZERO;
			}
			if (scalar === BIGINT_1) {
				return this;
			}
			if (wnaf.hasCache(this)) {
				return this.multiply(scalar);
			}
			if (endo) {
				const { k1neg, k1, k2neg, k2 } = splitScalar(scalar);
				const { p1: u1, p2: u2 } = unsafeLadder(ProjectivePoint, this, k1, k2);
				return addEndo(endo.beta, u1, u2, k1neg, k2neg);
			} else {
				return wnaf.unsafe(this, scalar);
			}
		}
		multiplyAndAddUnsafe(Q, a, b) {
			const R = this.multiplyUnsafe(a).add(Q.multiplyUnsafe(b));
			if (R.is0()) {
				return undefined;
			} else {
				return R;
			}
		}
		toAffine(invZ) {
			return pointFromAffine(this, invZ);
		}
		isTorsionFree() {
			const { isTorsionFree } = opts;
			if (cofactor === BIGINT_1) {
				return true;
			}
			if (isTorsionFree) {
				return isTorsionFree(ProjectivePoint, this);
			}
			return wnaf.unsafe(this, order).is0();
		}
		clearCofactor() {
			const { clearCofactor } = opts;
			if (cofactor === BIGINT_1) {
				return this;
			}
			if (clearCofactor) {
				return clearCofactor(ProjectivePoint, this);
			}
			return this.multiplyUnsafe(cofactor);
		}
		isSmallOrder() {
			return this.multiplyUnsafe(cofactor).is0();
		}
		toBytes(isCompressed = true) {
			assertBoolean(isCompressed, "isCompressed");
			this.assertValidity();
			return toBytesFn(ProjectivePoint, this, isCompressed);
		}
		toHex(isCompressed = true) {
			return bytesToHex(this.toBytes(isCompressed));
		}
		toString() {
			return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
		}
		get px() {
			return this.X;
		}
		get py() {
			return this.X;
		}
		get pz() {
			return this.Z;
		}
		toRawBytes(isCompressed = true) {
			return this.toBytes(isCompressed);
		}
		_setWindowSize(W) {
			this.precompute(W);
		}
		static normalizeZ(points) {
			return normalizeZ(ProjectivePoint, points);
		}
		static msm(points, scalars) {
			return pippenger(ProjectivePoint, Fn, points, scalars);
		}
		static fromPrivateKey(key) {
			return ProjectivePoint.BASE.multiply(normalizePrivateKey(Fn, key));
		}
	}
	ProjectivePoint.BASE = new ProjectivePoint(curve.Gx, curve.Gy, Fp.ONE);
	ProjectivePoint.ZERO = new ProjectivePoint(Fp.ZERO, Fp.ONE, Fp.ZERO);
	ProjectivePoint.Fp = Fp;
	ProjectivePoint.Fn = Fn;
	const nBits = Fn.BITS;
	const wnaf = new WNAF(
		ProjectivePoint,
		opts.endo ? Math.ceil(nBits / 2) : nBits,
	);
	ProjectivePoint.BASE.precompute(8);
	return ProjectivePoint;
}
function getPointCompress(isEven) {
	return Uint8Array.of(isEven ? 2 : 3);
}
function getLengths(field, scalarField) {
	return {
		secretKey: scalarField.BYTES,
		publicKey: 1 + field.BYTES,
		publicKeyUncompressed: 1 + field.BYTES * 2,
		publicKeyHasPrefix: true,
		signature: scalarField.BYTES * 2,
	};
}
function createCiphers(curve, opts = {}) {
	const { Fn } = curve;
	const randomBytes = opts.randomBytes || randomBytes;
	const lengths = Object.assign(getLengths(curve.Fp, Fn), {
		seed: getMinSeedLength(Fn.ORDER),
	});
	function isValidSecretKey(key) {
		try {
			return !!normalizePrivateKey(Fn, key);
		} catch (_e) {
			return false;
		}
	}
	function isValidPublicKey(key, isCompressed) {
		const { publicKey: compressedLen, publicKeyUncompressed: uncompressedLen } =
			lengths;
		try {
			const len = key.length;
			if (isCompressed === true && len !== compressedLen) {
				return false;
			}
			if (isCompressed === false && len !== uncompressedLen) {
				return false;
			}
			return !!curve.fromBytes(key);
		} catch (_e) {
			return false;
		}
	}
	function randomSecretKey(seed = randomBytes(lengths.seed)) {
		return hashToPrivateBytes(
			assertBytes(seed, lengths.seed, "seed"),
			Fn.ORDER,
		);
	}
	function getPublicKey(key, isCompressed = true) {
		return curve.BASE.multiply(normalizePrivateKey(Fn, key)).toBytes(
			isCompressed,
		);
	}
	function keygen(seed) {
		const secretKey = randomSecretKey(seed);
		return {
			secretKey,
			publicKey: getPublicKey(secretKey),
		};
	}
	function isPublicKey(key) {
		if (typeof key === "bigint") {
			return false;
		}
		if (key instanceof curve) {
			return true;
		}
		const {
			secretKey: privLen,
			publicKey: pubLen,
			publicKeyUncompressed: pubUncLen,
		} = lengths;
		if (Fn.allowedLengths || privLen === pubLen) {
			return;
		}
		const len = ensureBytes("key", key).length;
		return len === pubLen || len === pubUncLen;
	}
	function getSharedSecret(privA, pubB, isCompressed = true) {
		if (isPublicKey(privA) === true) {
			throw new Error("first arg must be private key");
		}
		if (isPublicKey(pubB) === false) {
			throw new Error("second arg must be public key");
		}
		const privKey = normalizePrivateKey(Fn, privA);
		return curve.fromHex(pubB).multiply(privKey).toBytes(isCompressed);
	}
	return Object.freeze({
		getPublicKey,
		getSharedSecret,
		keygen,
		Point: curve,
		utils: {
			isValidSecretKey,
			isValidPublicKey,
			randomSecretKey,
			isValidPrivateKey: isValidSecretKey,
			randomPrivateKey: randomSecretKey,
			normPrivateKeyToScalar: (key) => normalizePrivateKey(Fn, key),
			precompute(W = 8, point = curve.BASE) {
				return point.precompute(W, false);
			},
		},
		lengths,
	});
}
function createEcdsa(curve, hash, opts = {}) {
	assertHash(hash);
	validateObject(
		opts,
		{},
		{
			hmac: "function",
			lowS: "boolean",
			randomBytes: "function",
			bits2int: "function",
			bits2int_modN: "function",
		},
	);
	const randomBytesFn = opts.randomBytes || randomBytes;
	const hmacFn =
		opts.hmac || ((key, ...msgs) => hmac(hash, key, concatBytes(...msgs)));
	const { Fp, Fn } = curve;
	const { ORDER: n, BITS: nBits } = Fn;
	const { keygen, getPublicKey, getSharedSecret, utils, lengths } =
		createCiphers(curve, opts);
	const DEFAULTS = {
		prehash: false,
		lowS: typeof opts.lowS === "boolean" ? opts.lowS : false,
		format: undefined,
		extraEntropy: false,
	};
	const COMPACT_FORMAT = "compact";
	function hasHighS(s) {
		const n_div_2 = n >> BIGINT_1;
		return s > n_div_2;
	}
	function assertValidSignature(part, val) {
		if (!Fn.isValidNot0(val)) {
			throw new Error(
				`invalid signature ${part}: out of range 1..Point.Fn.ORDER`,
			);
		}
		return val;
	}
	function assertSignature(data, format) {
		validateSignatureFormat(format);
		const sigLen = lengths.signature;
		const recLen =
			format === "compact"
				? sigLen
				: format === "recovered"
					? sigLen + 1
					: undefined;
		return assertBytes(data, recLen, `${format} signature`);
	}
	class Signature {
		constructor(r, s, recovery) {
			this.r = assertValidSignature("r", r);
			this.s = assertValidSignature("s", s);
			if (recovery != null) {
				this.recovery = recovery;
			}
			Object.freeze(this);
		}
		static fromBytes(bytes, format = COMPACT_FORMAT) {
			assertSignature(bytes, format);
			let recovery;
			if (format === "der") {
				const { r, s } = DER.toSig(assertBytes(bytes));
				return new Signature(r, s);
			}
			if (format === "recovered") {
				recovery = bytes[0];
				format = "compact";
				bytes = bytes.subarray(1);
			}
			const len = Fn.BYTES;
			const rBytes = bytes.subarray(0, len);
			const sBytes = bytes.subarray(len, len * 2);
			return new Signature(
				Fn.fromBytes(rBytes),
				Fn.fromBytes(sBytes),
				recovery,
			);
		}
		static fromHex(hex, format) {
			return Signature.fromBytes(hexToBytes(hex), format);
		}
		addRecoveryBit(recovery) {
			return new Signature(this.r, this.s, recovery);
		}
		recoverPublicKey(msgHash) {
			const Fp_ORDER = Fp.ORDER;
			const { r, s, recovery } = this;
			if (recovery == null || ![0, 1, 2, 3].includes(recovery)) {
				throw new Error("recovery id invalid");
			}
			if (n * BIGINT_2 < Fp_ORDER && recovery > 1) {
				throw new Error("recovery id is ambiguous for h>1 curve");
			}
			const R_ = recovery === 2 || recovery === 3 ? r + n : r;
			if (!Fp.isValid(R_)) {
				throw new Error("recovery id 2 or 3 invalid");
			}
			const Rbytes = Fp.toBytes(R_);
			const R = curve.fromBytes(
				concatBytes(getPointCompress((recovery & 1) === 0), Rbytes),
			);
			const r_inv = Fn.inv(r);
			const z = bits2int_modN(ensureBytes("msgHash", msgHash));
			const u1 = Fn.create(-z * r_inv);
			const u2 = Fn.create(s * r_inv);
			const Q = curve.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
			if (Q.is0()) {
				throw new Error("point at infinify");
			}
			Q.assertValidity();
			return Q;
		}
		hasHighS() {
			return hasHighS(this.s);
		}
		toBytes(format = COMPACT_FORMAT) {
			validateSignatureFormat(format);
			if (format === "der") {
				return hexToBytes(DER.hexFromSig(this));
			}
			const r = Fn.toBytes(this.r);
			const s = Fn.toBytes(this.s);
			if (format === "recovered") {
				if (this.recovery == null) {
					throw new Error("recovery bit must be present");
				}
				return concatBytes(Uint8Array.of(this.recovery), r, s);
			}
			return concatBytes(r, s);
		}
		toHex(format) {
			return bytesToHex(this.toBytes(format));
		}
		assertValidity() {}
		static fromCompact(sig) {
			return Signature.fromBytes(ensureBytes("sig", sig), "compact");
		}
		static fromDER(sig) {
			return Signature.fromBytes(ensureBytes("sig", sig), "der");
		}
		normalizeS() {
			if (this.hasHighS()) {
				return new Signature(this.r, Fn.neg(this.s), this.recovery);
			} else {
				return this;
			}
		}
		toDERRawBytes() {
			return this.toBytes("der");
		}
		toDERHex() {
			return bytesToHex(this.toBytes("der"));
		}
		toCompactRawBytes() {
			return this.toBytes("compact");
		}
		toCompactHex() {
			return bytesToHex(this.toBytes("compact"));
		}
	}
	const bits2int =
		opts.bits2int ||
		function bits2int(bytes) {
			if (bytes.length > 8192) {
				throw new Error("input is too large");
			}
			const num = bytesToNumberBE(bytes);
			const delta = bytes.length * 8 - nBits;
			if (delta > 0) {
				return num >> BigInt(delta);
			} else {
				return num;
			}
		};
	const bits2int_modN =
		opts.bits2int_modN ||
		function bits2int_modN(bytes) {
			return Fn.create(bits2int(bytes));
		};
	const nMask = bitMask(nBits);
	function numberToBytes(num) {
		assertWithinCurveOrder(`num < 2^${nBits}`, num, BIGINT_0, nMask);
		return Fn.toBytes(num);
	}
	function toPrehashed(message, prehash) {
		assertBytes(message, undefined, "message");
		if (prehash) {
			return assertBytes(hash(message), undefined, "prehashed message");
		} else {
			return message;
		}
	}
	function _sign(msgHash, priv, opts) {
		if (["recovered", "canonical"].some((k) => k in opts)) {
			throw new Error("sign() legacy options not supported");
		}
		const { lowS, prehash, extraEntropy } = getOptions(opts, DEFAULTS);
		msgHash = toPrehashed(msgHash, prehash);
		const h = bits2int_modN(msgHash);
		const d = normalizePrivateKey(Fn, priv);
		const seed = [numberToBytes(d), numberToBytes(h)];
		if (extraEntropy != null && extraEntropy !== false) {
			const entropy =
				extraEntropy === true ? randomBytesFn(lengths.secretKey) : extraEntropy;
			seed.push(ensureBytes("extraEntropy", entropy));
		}
		const seedBytes = concatBytes(...seed);
		const msg = h;
		function k2sig(kBytes) {
			const k = bits2int(kBytes);
			if (!Fn.isValidNot0(k)) {
				return;
			}
			const k_inv = Fn.inv(k);
			const R = curve.BASE.multiply(k).toAffine();
			const r = Fn.create(R.x);
			if (r === BIGINT_0) {
				return;
			}
			const s = Fn.create(k_inv * Fn.create(msg + r * d));
			if (s === BIGINT_0) {
				return;
			}
			let recovery = (R.x === r ? 0 : 2) | Number(R.y & BIGINT_1);
			let s_ = s;
			if (lowS && hasHighS(s)) {
				s_ = Fn.neg(s);
				recovery ^= 1;
			}
			return new Signature(r, s_, recovery);
		}
		return {
			seed: seedBytes,
			k2sig: k2sig,
		};
	}
	function sign(msg, priv, opts = {}) {
		msg = ensureBytes("message", msg);
		const { seed, k2sig } = _sign(msg, priv, opts);
		return createHmacDrbg(hash.outputLen, Fn.BYTES, hmacFn)(seed, k2sig);
	}
	function parseSignature(signature) {
		let sig;
		const isStringOrBytes =
			typeof signature === "string" || isUint8Array(signature);
		const isSigObject =
			!isStringOrBytes &&
			signature !== null &&
			typeof signature === "object" &&
			typeof signature.r === "bigint" &&
			typeof signature.s === "bigint";
		if (!isStringOrBytes && !isSigObject) {
			throw new Error(
				"invalid signature, expected Uint8Array, hex string or Signature instance",
			);
		}
		if (isSigObject) {
			sig = new Signature(signature.r, signature.s);
		} else if (isStringOrBytes) {
			try {
				sig = Signature.fromBytes(ensureBytes("sig", signature), "der");
			} catch (e) {
				if (!(e instanceof DER.Err)) {
					throw e;
				}
			}
			if (!sig) {
				try {
					sig = Signature.fromBytes(ensureBytes("sig", signature), "compact");
				} catch (_e) {
					return false;
				}
			}
		}
		if (!sig) {
			return false;
		}
		return sig;
	}
	function verify(signature, msgHash, pub, opts = {}) {
		const { lowS, prehash, format } = getOptions(opts, DEFAULTS);
		pub = ensureBytes("publicKey", pub);
		msgHash = toPrehashed(ensureBytes("message", msgHash), prehash);
		if ("strict" in opts) {
			throw new Error("options.strict was renamed to lowS");
		}
		const sig =
			format === undefined
				? parseSignature(signature)
				: Signature.fromBytes(ensureBytes("sig", signature), format);
		if (sig === false) {
			return false;
		}
		try {
			const P = curve.fromBytes(pub);
			if (lowS && sig.hasHighS()) {
				return false;
			}
			const { r, s } = sig;
			const h = bits2int_modN(msgHash);
			const s_inv = Fn.inv(s);
			const u1 = Fn.create(h * s_inv);
			const u2 = Fn.create(r * s_inv);
			const R = curve.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
			if (R.is0()) {
				return false;
			}
			return Fn.create(R.x) === r;
		} catch (_error) {
			return false;
		}
	}
	function recoverPublicKey(signature, msgHash, opts = {}) {
		const { prehash } = getOptions(opts, DEFAULTS);
		msgHash = toPrehashed(msgHash, prehash);
		return Signature.fromBytes(signature, "recovered")
			.recoverPublicKey(msgHash)
			.toBytes();
	}
	return Object.freeze({
		keygen,
		getPublicKey,
		getSharedSecret,
		utils,
		lengths,
		Point: curve,
		sign,
		verify,
		recoverPublicKey,
		Signature,
		hash,
	});
}
function getCurveConfig(curve) {
	const curveParams = {
		a: curve.a,
		b: curve.b,
		p: curve.Fp.ORDER,
		n: curve.n,
		h: curve.h,
		Gx: curve.Gx,
		Gy: curve.Gy,
	};
	const Fp = curve.Fp;
	const allowedPrivateKeyLengths = curve.allowedPrivateKeyLengths
		? Array.from(
				new Set(curve.allowedPrivateKeyLengths.map((l) => Math.ceil(l / 2))),
			)
		: undefined;
	const Fn = createField(curveParams.n, {
		BITS: curve.nBitLength,
		allowedLengths: allowedPrivateKeyLengths,
		modFromBytes: curve.wrapPrivateKey,
	});
	const curveOpts = {
		Fp: Fp,
		Fn: Fn,
		allowInfinityPoint: curve.allowInfinityPoint,
		endo: curve.endo,
		isTorsionFree: curve.isTorsionFree,
		clearCofactor: curve.clearCofactor,
		fromBytes: curve.fromBytes,
		toBytes: curve.toBytes,
	};
	return {
		CURVE: curveParams,
		curveOpts: curveOpts,
	};
}
function getEcdsaConfig(curve) {
	const { CURVE, curveOpts } = getCurveConfig(curve);
	const ecdsaOpts = {
		hmac: curve.hmac,
		randomBytes: curve.randomBytes,
		lowS: curve.lowS,
		bits2int: curve.bits2int,
		bits2int_modN: curve.bits2int_modN,
	};
	return {
		CURVE,
		curveOpts,
		hash: curve.hash,
		ecdsaOpts: ecdsaOpts,
	};
}
function wrapEcdsa(curve, ecdsa) {
	const Point = ecdsa.Point;
	return Object.assign({}, ecdsa, {
		ProjectivePoint: Point,
		CURVE: Object.assign(
			{},
			curve,
			getCurveParams(Point.Fn.ORDER, Point.Fn.BITS),
		),
	});
}
function createEcdsaCiphers(curve) {
	const {
		CURVE: curveParams,
		curveOpts,
		hash,
		ecdsaOpts,
	} = getEcdsaConfig(curve);
	const curveInstance = createCurve(curveParams, curveOpts);
	const ecdsaInstance = createEcdsa(curveInstance, hash, ecdsaOpts);
	return wrapEcdsa(curve, ecdsaInstance);
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
class DERError extends Error {
	constructor(msg = "") {
		super(msg);
	}
}
const DER = {
	Err: DERError,
	_tlv: {
		encode: (tag, data) => {
			const { Err } = DER;
			if (tag < 0 || tag > 256) {
				throw new Err("tlv.encode: wrong tag");
			}
			if (data.length & 1) {
				throw new Err("tlv.encode: unpadded data");
			}
			const len = data.length / 2;
			const lenHex = numberToHex(len);
			if ((lenHex.length / 2) & 128) {
				throw new Err("tlv.encode: long form length too big");
			}
			const lenLen = len > 127 ? numberToHex((lenHex.length / 2) | 128) : "";
			return numberToHex(tag) + lenLen + lenHex + data;
		},
		decode(tag, data) {
			const { Err } = DER;
			let pos = 0;
			if (tag < 0 || tag > 256) {
				throw new Err("tlv.encode: wrong tag");
			}
			if (data.length < 2 || data[pos++] !== tag) {
				throw new Err("tlv.decode: wrong tlv");
			}
			const len = data[pos++];
			const isLong = !!(len & 128);
			let valLen = 0;
			if (!isLong) {
				valLen = len;
			} else {
				const lenLen = len & 127;
				if (!lenLen) {
					throw new Err("tlv.decode(long): indefinite length not supported");
				}
				if (lenLen > 4) {
					throw new Err("tlv.decode(long): byte length is too big");
				}
				const lenBytes = data.subarray(pos, pos + lenLen);
				if (lenBytes.length !== lenLen) {
					throw new Err("tlv.decode: length bytes not complete");
				}
				if (lenBytes[0] === 0) {
					throw new Err("tlv.decode(long): zero leftmost byte");
				}
				for (const b of lenBytes) {
					valLen = (valLen << 8) | b;
				}
				pos += lenLen;
				if (valLen < 128) {
					throw new Err("tlv.decode(long): not minimal encoding");
				}
			}
			const val = data.subarray(pos, pos + valLen);
			if (val.length !== valLen) {
				throw new Err("tlv.decode: wrong value length");
			}
			return {
				v: val,
				l: data.subarray(pos + valLen),
			};
		},
	},
	_int: {
		encode(n) {
			const { Err } = DER;
			if (n < BIGINT_0) {
				throw new Err("integer: negative integers are not allowed");
			}
			let hex = numberToHex(n);
			if (Number.parseInt(hex[0], 16) & 8) {
				hex = `00${hex}`;
			}
			if (hex.length & 1) {
				throw new Err("unexpected DER parsing assertion: unpadded hex");
			}
			return hex;
		},
		decode(bytes) {
			const { Err } = DER;
			if (bytes[0] & 128) {
				throw new Err("invalid signature integer: negative");
			}
			if (bytes[0] === 0 && !(bytes[1] & 128)) {
				throw new Err("invalid signature integer: unnecessary leading zero");
			}
			return bytesToNumberBE(bytes);
		},
	},
	toSig(data) {
		const { Err, _int: int, _tlv: tlv } = DER;
		const s = ensureBytes("signature", data);
		const { v: seq, l: seqLeft } = tlv.decode(48, s);
		if (seqLeft.length) {
			throw new Err("invalid signature: left bytes after parsing");
		}
		const { v: rBytes, l: rLeft } = tlv.decode(2, seq);
		const { v: sBytes, l: sLeft } = tlv.decode(2, rLeft);
		if (sLeft.length) {
			throw new Err("invalid signature: left bytes after parsing");
		}
		return {
			r: int.decode(rBytes),
			s: int.decode(sBytes),
		};
	},
	hexFromSig(sig) {
		const { _tlv: tlv, _int: int } = DER;
		const r = tlv.encode(2, int.encode(sig.r));
		const s = tlv.encode(2, int.encode(sig.s));
		const seq = r + s;
		return tlv.encode(48, seq);
	},
};
const _BIGINT_0 = BigInt(0);
const BIGINT_1 = BigInt(1);
const BIGINT_2 = BigInt(2);
const BIGINT_3 = BigInt(3);
const BIGINT_4 = BigInt(4);
function createCurveWithHash(curveConfig, defaultHash) {
	const creator = (hash) =>
		createEcdsaCiphers({
			...curveConfig,
			hash: hash,
		});
	return {
		...creator(defaultHash),
		create: creator,
	};
}
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function sqrtMod_secp256k1(n) {
	const P = SECP256K1_CURVE_PARAMS.p;
	const P_3 = BigInt(3);
	const P_6 = BigInt(6);
	const P_11 = BigInt(11);
	const P_22 = BigInt(22);
	const P_23 = BigInt(23);
	const P_44 = BigInt(44);
	const P_88 = BigInt(88);
	const C1 = (n * n * n) % P;
	const C2 = (C1 * C1 * n) % P;
	const C3 = (power(C2, P_3, P) * C2) % P;
	const C4 = (power(C3, P_3, P) * C2) % P;
	const C5 = (power(C4, BIGINT_2, P) * C1) % P;
	const C6 = (power(C5, P_11, P) * C5) % P;
	const C7 = (power(C6, P_22, P) * C6) % P;
	const C8 = (power(C7, P_44, P) * C7) % P;
	const C9 = (power(C8, P_88, P) * C8) % P;
	const C10 = (power(C9, P_44, P) * C7) % P;
	const C11 = (power(C10, P_3, P) * C2) % P;
	const C12 = (power(C11, P_23, P) * C6) % P;
	const C13 = (power(C12, P_6, P) * C1) % P;
	const root = power(C13, BIGINT_2, P);
	if (!secp256k1Fp.eql(secp256k1Fp.sqr(root), n)) {
		throw new Error("Cannot find square root");
	}
	return root;
}
const taggedHashCache = {};
function taggedHash(tag, ...messages) {
	let tagHash = taggedHashCache[tag];
	if (tagHash === undefined) {
		const tagBytes = sha256(stringToBytes(tag));
		tagHash = concatBytes(tagBytes, tagBytes);
		taggedHashCache[tag] = tagHash;
	}
	return sha256(concatBytes(tagHash, ...messages));
}
function createNonce(seed) {
	const { Fn, BASE } = secp256k1Point;
	const scalar = normalizePrivateKey(Fn, seed);
	const point = BASE.multiply(scalar);
	return {
		scalar: hasEvenY(point.y) ? scalar : Fn.neg(scalar),
		bytes: pointToPublicKey(point),
	};
}
function liftX(x) {
	const Fp = secp256k1Fp;
	if (!Fp.isValidNot0(x)) {
		throw new Error("invalid x: Fail if x ≥ p");
	}
	const y2 = Fp.create(x * x);
	const y = Fp.create(y2 * x + BigInt(7));
	let sqrtY = Fp.sqrt(y);
	if (!hasEvenY(sqrtY)) {
		sqrtY = Fp.neg(sqrtY);
	}
	const point = secp256k1Point.fromAffine({
		x: x,
		y: sqrtY,
	});
	point.assertValidity();
	return point;
}
function challenge(...messages) {
	return secp256k1Point.Fn.create(
		bytesToNumberBE(taggedHash("BIP0340/challenge", ...messages)),
	);
}
function getBip340PublicKey(privateKey) {
	return createNonce(privateKey).bytes;
}
function signBip340(message, privateKey, auxRand = randomBytes(32)) {
	const { Fn } = secp256k1Point;
	const msgBytes = ensureBytes("message", message);
	const { bytes: p, scalar: d } = createNonce(privateKey);
	const aux = ensureBytes("auxRand", auxRand, 32);
	const d_ = Fn.toBytes(d ^ bytesToNumberBE(taggedHash("BIP0340/aux", aux)));
	const rand = taggedHash("BIP0340/nonce", d_, p, msgBytes);
	const { bytes: R, scalar: k } = createNonce(rand);
	const e = challenge(R, p, msgBytes);
	const s = new Uint8Array(64);
	s.set(R, 0);
	s.set(Fn.toBytes(Fn.create(k + e * d)), 32);
	if (!verifyBip340(s, msgBytes, p)) {
		throw new Error("sign: Invalid signature produced");
	}
	return s;
}
function verifyBip340(signature, message, publicKey) {
	const { Fn, BASE } = secp256k1Point;
	const sigBytes = ensureBytes("signature", signature, 64);
	const msgBytes = ensureBytes("message", message);
	const pubBytes = ensureBytes("publicKey", publicKey, 32);
	try {
		const P = liftX(bytesToNumberBE(pubBytes));
		const r = bytesToNumberBE(sigBytes.subarray(0, 32));
		if (!isWithinCurveOrder(r, BIGINT_1, SECP256K1_CURVE_PARAMS.p)) {
			return false;
		}
		const s = bytesToNumberBE(sigBytes.subarray(32, 64));
		if (!isWithinCurveOrder(s, BIGINT_1, SECP256K1_CURVE_PARAMS.n)) {
			return false;
		}
		const e = challenge(Fn.toBytes(r), pointToPublicKey(P), msgBytes);
		const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn.neg(e)));
		const { x, y } = R.toAffine();
		if (R.is0() || !hasEvenY(y) || x !== r) {
			return false;
		}
		return true;
	} catch (_error) {
		return false;
	}
}
const SECP256K1_CURVE_PARAMS = {
	p: BigInt(
		"0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
	),
	n: BigInt(
		"0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
	),
	h: BigInt(1),
	a: BigInt(0),
	b: BigInt(7),
	Gx: BigInt(
		"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
	),
	Gy: BigInt(
		"0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
	),
};
const SECP256K1_ENDO = {
	beta: BigInt(
		"0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",
	),
	basises: [
		[
			BigInt("0x3086d221a7d46bcde86c90e49284eb15"),
			-BigInt("0xe4437ed6010e88286f547fa90abfe4c3"),
		],
		[
			BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"),
			BigInt("0x3086d221a7d46bcde86c90e49284eb15"),
		],
	],
};
const BIGINT_0 = BigInt(0);
const _BIGINT_1 = BigInt(1);
const BIGINT_2 = BigInt(2);
const secp256k1Fp = createField(SECP256K1_CURVE_PARAMS.p, {
	sqrt: sqrtMod_secp256k1,
});
const secp256k1 = createCurveWithHash(
	{
		...SECP256K1_CURVE_PARAMS,
		Fp: secp256k1Fp,
		lowS: true,
		endo: SECP256K1_ENDO,
	},
	sha256,
);
const pointToPublicKey = (point) => point.toBytes(true).slice(1);
const secp256k1Point = (() => secp256k1.Point)();
const hasEvenY = (y) => y % BIGINT_2 === BIGINT_0;
const bytesToNumberBE = bytesToNumberBE;
const schnorr = (() => {
	const randomSecretKey = (seed = randomBytes(48)) => {
		return hashToPrivateBytes(seed, SECP256K1_CURVE_PARAMS.n);
	};
	secp256k1.utils.randomSecretKey;
	function keygen(seed) {
		const secretKey = randomSecretKey(seed);
		return {
			secretKey: secretKey,
			publicKey: getBip340PublicKey(secretKey),
		};
	}
	return {
		keygen,
		getPublicKey: getBip340PublicKey,
		sign: signBip340,
		verify: verifyBip340,
		Point: secp256k1Point,
		utils: {
			randomSecretKey: randomSecretKey,
			randomPrivateKey: randomSecretKey,
			taggedHash: taggedHash,
			lift_x: liftX,
			pointToBytes: pointToPublicKey,
			numberToBytesBE: numberToBytesBE,
			bytesToNumberBE: bytesToNumberBE,
			mod: mod,
		},
		lengths: {
			secretKey: 32,
			publicKey: 32,
			publicKeyHasPrefix: false,
			signature: 64,
			seed: 48,
		},
	};
})();
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const utf8ToBytes = (str) => textEncoder.encode(str);
const bytesToUtf8 = (bytes) => textDecoder.decode(bytes);
const bytesToHex = (arr) =>
	Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
const jsonStringify = JSON.stringify;
const jsonParse = JSON.parse;
const stringToHashNumber = (str, max = Number.MAX_SAFE_INTEGER) =>
	str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % max;
const AES_GCM_ALGORITHM = "AES-GCM";
const sha1Cache = {};
const ENCRYPT_PAYLOAD_SEPARATOR = "$";
const ENCRYPT_IV_SEPARATOR = ",";
const arrayBufferToBase64 = (arrayBuffer) => {
	const bytes = new Uint8Array(arrayBuffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i += 32768) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
	}
	return btoa(binary);
};
const base64ToArrayBuffer = (base64) =>
	Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
const sha1 = (s) =>
	(sha1Cache[s] ??= crypto.subtle
		.digest("SHA-1", utf8ToBytes(s))
		.then((hash) => {
			const bytes = new Uint8Array(hash);
			let result = "";
			for (const b of bytes) {
				result += b.toString(36);
			}
			return result;
		}));
const createAesKey = async (password, appId, roomId) => {
	const keyMaterial = await crypto.subtle.digest(
		"SHA-256",
		utf8ToBytes(`${password}:${appId}:${roomId}`),
	);
	return crypto.subtle.importKey(
		"raw",
		keyMaterial,
		{
			name: AES_GCM_ALGORITHM,
		},
		false,
		["encrypt", "decrypt"],
	);
};
const encrypt = async (keyPromise, plaintext) => {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await keyPromise;
	const ciphertext = await crypto.subtle.encrypt(
		{
			name: AES_GCM_ALGORITHM,
			iv: iv,
		},
		key,
		utf8ToBytes(plaintext),
	);
	return `${iv.join(ENCRYPT_IV_SEPARATOR)}${ENCRYPT_PAYLOAD_SEPARATOR}${arrayBufferToBase64(ciphertext)}`;
};
const decrypt = async (keyPromise, encryptedPayload) => {
	const [ivStr, ciphertextB64] = encryptedPayload.split(
		ENCRYPT_PAYLOAD_SEPARATOR,
	);
	if (!ivStr || !ciphertextB64) {
		throw new Error("Invalid encrypted payload format");
	}
	const iv = Uint8Array.from(ivStr.split(ENCRYPT_IV_SEPARATOR), Number);
	const key = await keyPromise;
	const plaintext = await crypto.subtle.decrypt(
		{
			name: AES_GCM_ALGORITHM,
			iv: iv,
		},
		key,
		base64ToArrayBuffer(ciphertextB64),
	);
	return bytesToUtf8(plaintext);
};
const LIB_NAME = "GenosRTC";
const initArray = (len, cb) =>
	Array.from(
		{
			length: len,
		},
		cb,
	);
const randomId = (len) =>
	initArray(len, null)
		.map(
			() =>
				"0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"[
					crypto.getRandomValues(new Uint8Array(1))[0] %
						"0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz"
							.length
				],
		)
		.join("");
const selfId = randomId(20);
const promiseAll = Promise.all.bind(Promise);
const isBrowser = typeof window !== "undefined";
const {
	entries: objectEntries,
	fromEntries: objectFromEntries,
	keys: objectKeys,
} = Object;
const noop = () => {};
const GenosError = (msg) => new Error(`GenosRTC: ${msg}`);
const makeKey = (...args) => args.join("@");
const shuffle = (array, seed) => {
	const arr = [...array];
	let i = arr.length;
	const random = () => {
		const x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	};
	while (i) {
		const j = Math.floor(random() * i--);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};
const ICE_GATHERING_TIMEOUT = 5000;
const ICE_GATHERING_STATE_CHANGE_EVENT = "icegatheringstatechange";
const OFFER = "offer";
const ANSWER = "answer";
const DEFAULT_STUN_SERVERS = [
	...initArray(3, (_el, i) => `stun:stun${i || ""}.l.google.com:19302`),
	"stun:stun.cloudflare.com:3478",
].map((url) => ({
	urls: url,
}));
const createPeer = (isInitiator, { rtcConfig, rtcPolyfill, turnConfig }) => {
	const pc = new (rtcPolyfill || RTCPeerConnection)({
		iceServers: [...DEFAULT_STUN_SERVERS, ...(turnConfig || [])],
		...rtcConfig,
	});
	const handlers = {};
	let makingOffer = false;
	let ignoringOffer = false;
	let channel;
	const initChannel = (ch) =>
		Object.assign(ch, {
			binaryType: "arraybuffer",
			bufferedAmountLowThreshold: 65535,
			onmessage: (e) => handlers.data?.(e.data),
			onopen: () => handlers.connect?.(),
			onclose: () => handlers.close?.(),
			onerror: (e) =>
				!e?.error?.message?.includes("User-Initiated Abort") &&
				handlers.error?.(e),
		});
	const gatherIce = () =>
		Promise.race([
			new Promise((resolve) => {
				const onIceGatheringStateChange = () => {
					if (pc.iceGatheringState === "complete") {
						pc.removeEventListener(
							ICE_GATHERING_STATE_CHANGE_EVENT,
							onIceGatheringStateChange,
						);
						resolve();
					}
				};
				pc.addEventListener(
					ICE_GATHERING_STATE_CHANGE_EVENT,
					onIceGatheringStateChange,
				);
				onIceGatheringStateChange();
			}),
			new Promise((resolve) => setTimeout(resolve, ICE_GATHERING_TIMEOUT)),
		]).then(() => ({
			type: pc.localDescription.type,
			sdp: pc.localDescription.sdp.replace(/a=ice-options:trickle\s\n/g, ""),
		}));
	if (isInitiator) {
		initChannel((channel = pc.createDataChannel("data")));
	} else {
		pc.ondatachannel = ({ channel: ch }) => initChannel((channel = ch));
	}
	pc.onnegotiationneeded = async () => {
		try {
			makingOffer = true;
			await pc.setLocalDescription();
			handlers.signal?.(await gatherIce());
		} catch (err) {
			handlers.error?.(err);
		} finally {
			makingOffer = false;
		}
	};
	pc.onconnectionstatechange = () => {
		if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
			handlers.close?.();
		}
	};
	pc.ontrack = (e) => {
		handlers.track?.(e.track, e.streams[0]);
		handlers.stream?.(e.streams[0]);
	};
	pc.onremovestream = (e) => handlers.stream?.(e.stream);
	if (isInitiator && !pc.canTrickleIceCandidates) {
		pc.onnegotiationneeded();
	}
	const getSenders = () => pc.getSenders();
	return {
		created: Date.now(),
		connection: pc,
		get channel() {
			return channel;
		},
		get isDead() {
			return pc.connectionState === "closed";
		},
		async signal(desc) {
			if (channel?.readyState === "open" && !desc.sdp?.includes("a=rtpmap")) {
				return;
			}
			try {
				if (desc.type === OFFER) {
					if (
						makingOffer ||
						(pc.signalingState !== "stable" && !ignoringOffer)
					) {
						if (isInitiator) {
							return;
						}
						await promiseAll([
							pc.setLocalDescription({
								type: "rollback",
							}),
							pc.setRemoteDescription(desc),
						]);
					} else {
						await pc.setRemoteDescription(desc);
					}
					await pc.setLocalDescription();
					const localDesc = await gatherIce();
					handlers.signal?.(localDesc);
					return localDesc;
				}
				if (desc.type === ANSWER) {
					ignoringOffer = true;
					try {
						await pc.setRemoteDescription(desc);
					} finally {
						ignoringOffer = false;
					}
				}
			} catch (err) {
				handlers.error?.(err);
			}
		},
		sendData: (data) => channel.send(data),
		destroy: () => {
			channel?.close();
			pc.close();
			makingOffer = ignoringOffer = false;
		},
		setHandlers: (newHandlers) => Object.assign(handlers, newHandlers),
		offerPromise: isInitiator
			? new Promise(
					(resolve) =>
						(handlers.signal = (desc) => desc.type === OFFER && resolve(desc)),
				)
			: Promise.resolve(),
		addStream: (stream) =>
			stream.getTracks().forEach((track) => pc.addTrack(track, stream)),
		removeStream: (stream) =>
			getSenders()
				.filter((sender) => stream.getTracks().includes(sender.track))
				.forEach((sender) => pc.removeTrack(sender)),
		addTrack: (track, stream) => pc.addTrack(track, stream),
		removeTrack: (track) => {
			const sender = getSenders().find((s) => s.track === track);
			if (sender) {
				pc.removeTrack(sender);
			}
		},
		replaceTrack: (oldTrack, newTrack) =>
			getSenders()
				.find((s) => s.track === oldTrack)
				?.replaceTrack(newTrack),
	};
};
const UINT8_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array);
const ACTION_TYPE_MAX_BYTES = 12;
const CHUNK_HEADER_OFFSET_TYPE = 0;
const CHUNK_HEADER_OFFSET_NONCE =
	CHUNK_HEADER_OFFSET_TYPE + ACTION_TYPE_MAX_BYTES;
const CHUNK_HEADER_OFFSET_FLAGS = CHUNK_HEADER_OFFSET_NONCE + 1;
const CHUNK_HEADER_OFFSET_PROGRESS = CHUNK_HEADER_OFFSET_FLAGS + 1;
const CHUNK_HEADER_LENGTH = CHUNK_HEADER_OFFSET_PROGRESS + 1;
const CHUNK_PAYLOAD_MAX_LENGTH = 16384 - CHUNK_HEADER_LENGTH;
const UINT8_MAX = 255;
const BUFFERED_AMOUNT_LOW_EVENT = "bufferedamountlow";
const makeInternalName = (name) => `@_${name}`;
const MAX_CHUNKS = 100;
const SEND_BUFFER_RETRIES = 3;
const SEND_BUFFER_RETRY_DELAY = 200;
const initLib = (onPeer, onPeerLeave, onLibClose) => {
	const peers = new Map();
	const actions = new Map();
	const actionCache = new Map();
	const peerChunkData = {};
	const pingDeferreds = {};
	const peerStreamMetas = {};
	const peerTrackMetas = {};
	const subscribers = new Map();
	const on = (name, cb) => {
		if (!subscribers.has(name)) {
			subscribers.set(name, new Set());
		}
		subscribers.get(name).add(cb);
	};
	const off = (name, cb) => subscribers.get(name)?.delete(cb);
	const emit = (name, ...args) =>
		subscribers.get(name)?.forEach((cb) => cb(...args));
	const broadcast = (peerIds, cb) => {
		const ids = peerIds
			? Array.isArray(peerIds)
				? peerIds
				: [peerIds]
			: peers.keys();
		return Array.from(ids, (id) => {
			const peer = peers.get(id);
			if (!peer) {
				console.warn(`${LIB_NAME}: no peer with id ${id}`);
				return null;
			}
			return cb(id, peer);
		}).filter(Boolean);
	};
	const cleanupPeer = (id) => {
		if (!peers.has(id)) {
			return;
		}
		peers.delete(id);
		delete peerChunkData[id];
		delete pingDeferreds[id];
		delete peerStreamMetas[id];
		delete peerTrackMetas[id];
		emit("peer:leave", id);
		onPeerLeave(id);
	};
	const waitForBufferlow = (channel) =>
		new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				channel.removeEventListener(BUFFERED_AMOUNT_LOW_EVENT, onBufferLow);
				reject(new Error(`${LIB_NAME}: bufferLow timeout`));
			}, 5000);
			function onBufferLow() {
				clearTimeout(timeout);
				channel.removeEventListener(BUFFERED_AMOUNT_LOW_EVENT, onBufferLow);
				resolve();
			}
			channel.addEventListener(BUFFERED_AMOUNT_LOW_EVENT, onBufferLow);
		});
	const channel = (type) => {
		if (actionCache.has(type)) {
			return actionCache.get(type);
		}
		if (!type) {
			throw GenosError("action type is required");
		}
		const typeBytes = utf8ToBytes(type);
		if (typeBytes.byteLength > ACTION_TYPE_MAX_BYTES) {
			throw GenosError(
				`\u274C "${type}" exceeds ${ACTION_TYPE_MAX_BYTES} bytes. Use a shorter name.`,
			);
		}
		const anameBytes = new Uint8Array(ACTION_TYPE_MAX_BYTES).map(
			(_el, i) => typeBytes[i] || 0,
		);
		let nonce = 0;
		const listeners = new Map([
			["message", new Set()],
			["progress", new Set()],
		]);
		const on = (name, cb) => listeners.get(name)?.add(cb);
		const off = (name, cb) => listeners.get(name)?.delete(cb);
		const send = async (data, peerIds, meta, onProgress) => {
			if (meta && typeof meta !== "object") {
				throw GenosError("meta must be object");
			}
			if (data === undefined) {
				throw GenosError("data cannot be undefined");
			}
			const isBlob = data instanceof Blob;
			const isBinary =
				isBlob ||
				data instanceof ArrayBuffer ||
				data instanceof UINT8_ARRAY_PROTOTYPE;
			const isJson = typeof data !== "string";
			if (meta && !isBinary) {
				throw GenosError("meta only allowed with binary");
			}
			const dataBytes = isBinary
				? new Uint8Array(isBlob ? await data.arrayBuffer() : data)
				: utf8ToBytes(isJson ? jsonStringify(data) : data);
			const metaBytes = meta ? utf8ToBytes(jsonStringify(meta)) : null;
			const numChunks =
				Math.ceil(dataBytes.byteLength / CHUNK_PAYLOAD_MAX_LENGTH) +
					(meta ? 1 : 0) || 1;
			if (numChunks > MAX_CHUNKS) {
				throw GenosError(`Message too large, exceeds max chunks ${MAX_CHUNKS}`);
			}
			const chunks = initArray(numChunks, (_el, i) => {
				const isLast = i === numChunks - 1;
				const isMeta = meta && i === 0;
				const payload = isMeta
					? metaBytes
					: dataBytes.subarray(
							meta
								? (i - 1) * CHUNK_PAYLOAD_MAX_LENGTH
								: i * CHUNK_PAYLOAD_MAX_LENGTH,
							meta
								? i * CHUNK_PAYLOAD_MAX_LENGTH
								: (i + 1) * CHUNK_PAYLOAD_MAX_LENGTH,
						);
				const chunk = new Uint8Array(CHUNK_HEADER_LENGTH + payload.byteLength);
				chunk.set(anameBytes);
				chunk.set([nonce], CHUNK_HEADER_OFFSET_NONCE);
				chunk.set(
					[isLast | (isMeta << 1) | (isBinary << 2) | (isJson << 3)],
					CHUNK_HEADER_OFFSET_FLAGS,
				);
				chunk.set(
					[Math.round(((i + 1) / numChunks) * UINT8_MAX)],
					CHUNK_HEADER_OFFSET_PROGRESS,
				);
				chunk.set(payload, CHUNK_HEADER_LENGTH);
				return chunk;
			});
			nonce = (nonce + 1) & UINT8_MAX;
			return promiseAll(
				broadcast(peerIds, async (id, peer) => {
					const { channel } = peer;
					for (let i = 0; i < numChunks; i++) {
						let retries = 0;
						while (
							channel.bufferedAmount > channel.bufferedAmountLowThreshold
						) {
							if (retries++ > SEND_BUFFER_RETRIES) {
								throw GenosError(
									`${LIB_NAME}: send buffer full, max retries reached for peer ${id}`,
								);
							}
							try {
								await waitForBufferlow(channel);
							} catch (err) {
								console.warn(err.message);
								await new Promise((res) =>
									setTimeout(res, SEND_BUFFER_RETRY_DELAY),
								);
							}
						}
						if (!peers.has(id)) {
							break;
						}
						peer.sendData(chunks[i]);
						onProgress?.(
							chunks[i][CHUNK_HEADER_OFFSET_PROGRESS] / UINT8_MAX,
							id,
							meta,
						);
					}
				}),
			);
		};
		actions.set(type, {
			listeners: listeners,
			send: send,
		});
		const anAction = {
			send: send,
			on: on,
			off: off,
		};
		actionCache.set(type, anAction);
		return anAction;
	};
	const handleData = (id, arrayBuffer) => {
		try {
			const bytes = new Uint8Array(arrayBuffer);
			const type = bytesToUtf8(
				bytes.subarray(CHUNK_HEADER_OFFSET_TYPE, CHUNK_HEADER_OFFSET_NONCE),
			).replace(/�/g, "");
			if (!actions.has(type)) {
				return console.warn(`${LIB_NAME}: unregistered type (${type})`);
			}
			const [nonce] = bytes.subarray(
				CHUNK_HEADER_OFFSET_NONCE,
				CHUNK_HEADER_OFFSET_FLAGS,
			);
			const [flags] = bytes.subarray(
				CHUNK_HEADER_OFFSET_FLAGS,
				CHUNK_HEADER_OFFSET_PROGRESS,
			);
			const [progress] = bytes.subarray(
				CHUNK_HEADER_OFFSET_PROGRESS,
				CHUNK_HEADER_LENGTH,
			);
			const payload = bytes.subarray(CHUNK_HEADER_LENGTH);
			const isLast = Boolean(flags & 1);
			const isMeta = Boolean(flags & 2);
			const isBinary = Boolean(flags & 4);
			const isJson = Boolean(flags & 8);
			const action = actions.get(type);
			const ns = (peerChunkData[id] ||= {});
			if (ns[type]?.[nonce]?.chunks?.length > MAX_CHUNKS) {
				console.warn(
					`${LIB_NAME}: peer ${id} sent too many chunks for nonce ${nonce}, ignoring.`,
				);
				return;
			}
			const chunkData = (ns[type] ||= {});
			const pending = (chunkData[nonce] ||= {
				chunks: [],
			});
			if (isMeta) {
				try {
					pending.meta = jsonParse(bytesToUtf8(payload));
				} catch {
					console.warn(
						`${LIB_NAME}: failed to parse meta from peer ${id} for type ${type}`,
					);
					return;
				}
			} else {
				pending.chunks.push(payload);
			}
			action.listeners.get("progress").forEach((cb) => {
				try {
					cb(progress / UINT8_MAX, id, pending.meta);
				} catch (e) {
					console.error(e);
				}
			});
			if (!isLast) {
				return;
			}
			const full = new Uint8Array(
				pending.chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0),
			);
			pending.chunks.reduce((acc, chunk) => {
				full.set(chunk, acc);
				return acc + chunk.byteLength;
			}, 0);
			delete chunkData[nonce];
			let data;
			if (isBinary) {
				data = full;
			} else if (isJson) {
				try {
					data = jsonParse(bytesToUtf8(full));
				} catch {
					console.warn(
						`${LIB_NAME}: failed to parse JSON message data from peer ${id} for type ${type}`,
					);
					return;
				}
			} else {
				data = bytesToUtf8(full);
			}
			action.listeners.get("message").forEach((cb) => {
				try {
					cb(data, id, pending.meta);
				} catch (e) {
					console.error(e);
				}
			});
		} catch (e) {
			console.error(`${LIB_NAME}: error handling data from peer ${id}:`, e);
		}
	};
	const leave = async () => {
		try {
			await sendLeave("");
			await new Promise((res) => setTimeout(res, 99));
		} catch (err) {
			console.warn(`${LIB_NAME}: error sending leave`, err);
		}
		for (const [id, peer] of peers) {
			try {
				peer.destroy();
			} catch {}
			peers.delete(id);
		}
		onLibClose();
	};
	const { send: sendPing, on: onPing } = channel(makeInternalName("ping"));
	const { send: sendPong, on: onPong } = channel(makeInternalName("pong"));
	const { send: sendSignal, on: onSignal } = channel(
		makeInternalName("signal"),
	);
	const { send: sendStreamMeta, on: onStreamMeta } = channel(
		makeInternalName("stream"),
	);
	const { send: sendTrackMeta, on: onTrackMeta } = channel(
		makeInternalName("track"),
	);
	const { send: sendLeave, on: onLeave } = channel(makeInternalName("leave"));
	onPeer((peer, id) => {
		if (peers.has(id)) {
			return;
		}
		peers.set(id, peer);
		peer.setHandlers({
			data: (data) => handleData(id, data),
			stream: (stream) => {
				emit("stream:add", stream, id, peerStreamMetas[id]);
				delete peerStreamMetas[id];
			},
			track: (track, stream) => {
				emit("track:add", track, stream, id, peerTrackMetas[id]);
				delete peerTrackMetas[id];
			},
			signal: (desc) => sendSignal(desc, id),
			close: () => cleanupPeer(id),
			error: (e) => {
				console.error(`${LIB_NAME}: peer error for ${id}`, e);
				cleanupPeer(id);
			},
		});
		emit("peer:join", id);
	});
	onPing("message", (_payload, id) => sendPong("", id));
	onPong("message", (_payload, id) => {
		pingDeferreds[id]?.();
		delete pingDeferreds[id];
	});
	onSignal("message", (payload, id) => peers.get(id)?.signal(payload));
	onStreamMeta("message", (payload, id) => (peerStreamMetas[id] = payload));
	onTrackMeta("message", (payload, id) => (peerTrackMetas[id] = payload));
	onLeave("message", (_payload, id) => cleanupPeer(id));
	if (isBrowser) {
		addEventListener("beforeunload", leave);
	}
	return {
		on: on,
		off: off,
		channel: channel,
		leave: leave,
		ping: async (id) => {
			if (!id) {
				throw GenosError("ping() requires target peer ID");
			}
			const start = Date.now();
			sendPing("", id);
			await new Promise((resolve) => (pingDeferreds[id] = resolve));
			return Date.now() - start;
		},
		getPeers: () =>
			objectFromEntries(
				Array.from(peers, ([id, peer]) => [id, peer.connection]),
			),
		addStream: (stream, peerIds, meta) =>
			broadcast(peerIds, async (id, peer) => {
				if (meta) {
					await sendStreamMeta(meta, id);
				}
				peer.addStream(stream);
			}),
		removeStream: (stream, peerIds) =>
			broadcast(peerIds, (_id, peer) => peer.removeStream(stream)),
		addTrack: (track, stream, peerIds, meta) =>
			broadcast(peerIds, async (id, peer) => {
				if (meta) {
					await sendTrackMeta(meta, id);
				}
				peer.addTrack(track, stream);
			}),
		removeTrack: (track, peerIds) =>
			broadcast(peerIds, (_id, peer) => peer.removeTrack(track)),
		replaceTrack: (oldTrack, newTrack, peerIds, meta) =>
			broadcast(peerIds, async (id, peer) => {
				if (meta) {
					await sendTrackMeta(meta, id);
				}
				peer.replaceTrack(oldTrack, newTrack);
			}),
	};
};
const OFFER_POOL_SIZE = 20;
const ANNOUNCE_INTERVAL = 5333;
const PEER_EXPIRATION = 57333;
const createBroker = ({ init, subscribe, announce }) => {
	const nsCache = {};
	let isInitialized = false;
	let db;
	let offerPool;
	return (config, roomId, onWarning) => {
		const { appId } = config;
		if (nsCache[appId]?.[roomId]) {
			return nsCache[appId][roomId];
		}
		if (!config || !roomId || (!appId && !config.firebaseApp)) {
			throw GenosError(
				!config
					? "config required"
					: !roomId
						? "roomId required"
						: "appId missing",
			);
		}
		let onPeer = noop;
		if (!isInitialized) {
			const dbs = init(config);
			offerPool = initArray(OFFER_POOL_SIZE, () => createPeer(true, config));
			db = Array.isArray(dbs) ? dbs : [dbs];
			const offerCleanupTimer = setInterval(() => {
				offerPool = offerPool.filter((peer) => {
					const isFresh = Date.now() - peer.created < PEER_EXPIRATION;
					if (!isFresh) {
						peer.destroy();
					}
					return isFresh;
				});
			}, PEER_EXPIRATION);
			nsCache.offerCleanupTimer ||= offerCleanupTimer;
			isInitialized = true;
		}
		const offers = {};
		const connectedPeers = {};
		const nsKey = makeKey(LIB_NAME, appId, roomId);
		const selfHash = sha1(nsKey);
		const selfIdHash = sha1(makeKey(nsKey, selfId));
		const key = createAesKey(config.password || "", appId, roomId);
		const sdpen = (fn) => async (payload) => ({
			type: payload.type,
			sdp: await fn(key, payload.sdp),
		});
		const decryptSdp = sdpen(decrypt);
		const encryptSdp = sdpen(encrypt);
		const setConnected = (peer, id) => {
			if (connectedPeers[id] === peer) {
				return;
			}
			connectedPeers[id]?.destroy();
			connectedPeers[id] = peer;
			onPeer(peer, id);
			offers[id]?.forEach((p) => p !== peer && p.destroy());
			delete offers[id];
		};
		const setNotConnected = (peer, id) => {
			if (connectedPeers[id] === peer) {
				delete connectedPeers[id];
			}
		};
		const onMessage = (dbIndex) => async (topicA, payload, talk) => {
			const [hash, id] = await promiseAll([selfHash, selfIdHash]);
			if (topicA !== hash && topicA !== id) {
				return;
			}
			const {
				peerId: otherId,
				offer,
				answer,
			} = typeof payload === "string" ? jsonParse(payload) : payload;
			if (otherId === selfId || connectedPeers[otherId]) {
				return;
			}
			if (offer) {
				if (offers[otherId]?.[dbIndex] && selfId > otherId) {
					return;
				}
				const peer = createPeer(false, config);
				peer.setHandlers({
					connect: () => setConnected(peer, otherId),
					close: () => setNotConnected(peer, otherId),
				});
				try {
					const decryptedOffer = await decryptSdp(offer);
					if (peer.isDead) {
						return;
					}
					const [topicB, encryptedAnswer] = await promiseAll([
						sha1(makeKey(nsKey, otherId)),
						peer.signal(decryptedOffer).then(encryptSdp),
					]);
					talk(
						topicB,
						jsonStringify({
							peerId: selfId,
							answer: encryptedAnswer,
						}),
					);
				} catch {
					onWarning?.({
						error: "decryption failed (offer)",
						appId: appId,
						peerId: otherId,
						roomId: roomId,
					});
				}
			} else if (answer) {
				const peer = offers[otherId]?.[dbIndex];
				if (!peer || peer.isDead) {
					return;
				}
				peer.setHandlers({
					connect: () => setConnected(peer, otherId),
					close: () => setNotConnected(peer, otherId),
				});
				try {
					peer.signal(await decryptSdp(answer));
				} catch {
					onWarning?.({
						error: "decryption failed (answer)",
						appId: appId,
						peerId: otherId,
						roomId: roomId,
					});
				}
			} else {
				if (offers[otherId]?.[dbIndex]) {
					return;
				}
				const peer = offerPool.pop() || createPeer(true, config);
				const [topicB, { offer: encryptedOffer }] = await promiseAll([
					sha1(makeKey(nsKey, otherId)),
					peer.offerPromise.then(encryptSdp).then((offer) => ({
						offer,
					})),
				]);
				offers[otherId] ||= [];
				offers[otherId][dbIndex] = peer;
				peer.setHandlers({
					connect: () => setConnected(peer, otherId),
					close: () => setNotConnected(peer, otherId),
				});
				talk(
					topicB,
					jsonStringify({
						peerId: selfId,
						offer: encryptedOffer,
						peer: peer,
					}),
				);
			}
		};
		const subs = promiseAll(
			db.map(async (d, i) =>
				subscribe(await d, await selfHash, await selfIdHash, onMessage(i)),
			),
		);
		const timers = [];
		subs.then((unsubs) => {
			db.forEach(async (d, i) => {
				const Looper = async () => {
					const timeout = await announce(
						await d,
						await selfHash,
						await selfIdHash,
					);
					timers[i] = setTimeout(
						Looper,
						typeof timeout === "number" ? timeout : ANNOUNCE_INTERVAL,
					);
				};
				Looper();
			});
			nsCache[appId][roomId].onCleanup = () => {
				delete nsCache[appId][roomId];
				timers.forEach(clearTimeout);
				unsubs.forEach((unsub) => unsub());
				if (objectKeys(nsCache).length === 0) {
					clearInterval(nsCache.offerCleanupTimer);
					delete nsCache.offerCleanupTimer;
				}
			};
		});
		nsCache[appId] ||= {};
		const lib = initLib(
			(peer, _id) => (onPeer = peer),
			(id) => delete connectedPeers[id],
			() => lib.onCleanup?.(),
		);
		return (nsCache[appId][roomId] = lib);
	};
};
const RECONNECT_DELAY_BASE = 3333;
const reconnectDelayMap = {};
const socketCache = {};
const createSocket = (url, onMessage) => {
	const socketCtl = {};
	let reconnectTimeout = null;
	const init = () => {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}
		const ws = new WebSocket(url);
		ws.onclose = () => {
			reconnectDelayMap[url] ??= RECONNECT_DELAY_BASE;
			reconnectTimeout = setTimeout(init, reconnectDelayMap[url]);
			reconnectDelayMap[url] *= 2;
		};
		ws.onmessage = (e) => onMessage(e.data);
		socketCtl.socket = ws;
		socketCtl.url = ws.url;
		socketCtl.ready = new Promise((resolve) => {
			ws.onopen = () => {
				reconnectDelayMap[url] = RECONNECT_DELAY_BASE;
				resolve(socketCtl);
			};
		});
		socketCtl.send = (data) => {
			if (ws.readyState === 1) {
				ws.send(data);
			}
		};
	};
	socketCtl.forceReconnect = init;
	init();
	socketCache[url] = socketCtl;
	return socketCtl;
};
if (typeof window !== "undefined") {
	const forceReconnect = () => {
		console.info("⚡ [GenosRTC] Network event detected. Forcing reconnection…");
		Object.values(socketCache).forEach((ctl) => {
			if (
				ctl.socket &&
				ctl.socket.readyState !== WebSocket.OPEN &&
				ctl.socket.readyState !== WebSocket.CONNECTING
			) {
				ctl.forceReconnect();
			}
		});
	};
	window.addEventListener("online", () => {
		console.info("✅ Reconnected to the network.");
		forceReconnect();
	});
	window.addEventListener("offline", async () => {
		console.info("❌ Disconnected from the network.");
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") {
			forceReconnect();
		}
	});
}
const _getRelaySockets = (socketCache) => () =>
	objectFromEntries(
		objectEntries(socketCache).map(([url, ctl]) => [url, ctl.socket]),
	);
const getActiveRelays = (config, relays, defaultRedundancy, canShuffle) =>
	(
		config.relayUrls ??
		(canShuffle ? shuffle(relays, stringToHashNumber(config.appId)) : relays)
	).slice(
		0,
		config.relayUrls?.length ?? config.relayRedundancy ?? defaultRedundancy,
	);
const nostrSocketCache = {};
const NOSTR_RELAY_REDUNDANCY = 5;
const NOSTR_TAG_KEY = "x";
const NOSTR_EVENT_KIND = "EVENT";
const NOSTR_POW_NOTICE_REGEX = /pow:\s*(\d+)\s*bits needed\.?/i;
const nostrPowRelays = new Set();
const nostrPrivateKey = schnorr.utils.randomSecretKey();
const nostrPublicKey = bytesToHex(schnorr.getPublicKey(nostrPrivateKey));
const nostrSubIdToTopic = {};
const nostrSubIdToHandler = {};
const nostrKindCache = {};
const getTimestamp = () => Math.floor(Date.now() / 1000);
const getKind = (topic) =>
	(nostrKindCache[topic] ??= stringToHashNumber(topic, 10000) + 20000);
const cleanUrl = (url) => url.replace(/\/$/, "");
const NOSTR_DEFAULT_RELAYS = [
	"wss://black.nostrcity.club",
	"wss://eu.purplerelay.com",
	"wss://ftp.halifax.rwth-aachen.de/nostr",
	"wss://nostr.cool110.xyz",
	"wss://nostr.data.haus",
	"wss://nostr.mom",
	"wss://nostr.oxtr.dev",
	"wss://nostr.sathoarder.com",
	"wss://nostr.vulpem.com",
	"wss://relay.agorist.space",
	"wss://relay.binaryrobot.com",
	"wss://relay.fountain.fm",
	"wss://relay.mostro.network",
	"wss://relay.nostraddress.com",
	"wss://relay.nostrdice.com",
	"wss://relay.nostromo.social",
	"wss://relay.oldenburg.cool",
	"wss://relay.snort.social",
	"wss://relay.verified-nostr.com",
	"wss://sendit.nosflare.com",
	"wss://yabu.me/v2",
	"wss://relay.damus.io",
];
const handleNostrMessage = (url, data) => {
	const [kind, subId, event, msg] = jsonParse(data);
	if (kind === NOSTR_EVENT_KIND) {
		return nostrSubIdToHandler[subId]?.(
			nostrSubIdToTopic[subId],
			event.content,
		);
	}
	if (kind === "NOTICE" || (kind === "OK" && !event)) {
		if (
			+(
				(kind === "NOTICE" ? subId : msg).match(NOSTR_POW_NOTICE_REGEX)?.[1] ??
				0
			) > 0
		) {
			const u = cleanUrl(url);
			nostrPowRelays.add(u);
			nostrSocketCache[u]?.close?.();
			delete nostrSocketCache[u];
		}
	}
};
const getNostrSocket = (url) => {
	const u = cleanUrl(url);
	if (nostrSocketCache[u]) {
		return nostrSocketCache[u];
	}
	const socket = createSocket(u, (data) => handleNostrMessage(u, data));
	return (nostrSocketCache[u] = socket);
};
const createNostrEvent = async (topic, content) => {
	const event = {
		kind: getKind(topic),
		content: content,
		pubkey: nostrPublicKey,
		created_at: getTimestamp(),
		tags: [[NOSTR_TAG_KEY, topic]],
	};
	const payload = utf8ToBytes(
		jsonStringify([
			0,
			event.pubkey,
			event.created_at,
			event.kind,
			event.tags,
			event.content,
		]),
	);
	const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", payload));
	const sig = schnorr.sign(hash, nostrPrivateKey);
	return jsonStringify([
		NOSTR_EVENT_KIND,
		{
			...event,
			id: bytesToHex(hash),
			sig: bytesToHex(sig),
		},
	]);
};
const createNostrReq = (subId, topic) => {
	nostrSubIdToTopic[subId] = topic;
	return jsonStringify([
		"REQ",
		subId,
		{
			kinds: [getKind(topic)],
			since: getTimestamp(),
			[`#${NOSTR_TAG_KEY}`]: [topic],
		},
	]);
};
const createNostrClose = (subId) => {
	delete nostrSubIdToTopic[subId];
	return jsonStringify(["CLOSE", subId]);
};
const join = createBroker({
	init: (config) => {
		const relays =
			(config?.relayUrls?.length ? config.relayUrls : null) ??
			NOSTR_DEFAULT_RELAYS;
		return getActiveRelays(config, relays, NOSTR_RELAY_REDUNDANCY, true)
			.map(getNostrSocket)
			.map((socket) => socket.ready.then(() => socket).catch(() => null));
	},
	subscribe: (socket, topicA, topicB, onMessage) => {
		const subIdA = randomId(64);
		const subIdB = randomId(64);
		nostrSubIdToHandler[subIdA] = nostrSubIdToHandler[subIdB] = (
			topic,
			content,
		) =>
			onMessage(topic, content, async (destTopic, msg) => {
				if (nostrPowRelays.has(cleanUrl(socket.url))) {
					return;
				}
				socket.send(await createNostrEvent(destTopic, msg));
			});
		socket.send(createNostrReq(subIdA, topicA));
		socket.send(createNostrReq(subIdB, topicB));
		return () => {
			socket.send(createNostrClose(subIdA));
			socket.send(createNostrClose(subIdB));
			delete nostrSubIdToHandler[subIdA];
			delete nostrSubIdToHandler[subIdB];
		};
	},
	announce: async (socket, topic) => {
		if (nostrPowRelays.has(cleanUrl(socket.url))) {
			return;
		}
		socket.send(
			await createNostrEvent(
				topic,
				jsonStringify({
					peerId: selfId,
				}),
			),
		);
	},
});
const getRelaySockets_ = getNostrSocket(nostrSocketCache);
export { selfId, join, getRelaySockets_ as getRelaySockets };
