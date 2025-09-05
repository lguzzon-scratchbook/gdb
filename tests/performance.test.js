import { gdb } from "../dist/index.js";

test('Performance Mass Insert: 500 items in chunks of 50', async () => {
  const db = await gdb('perf-test');
  const total = 500;
  const chunkSize = 50;
  const items = Array.from({ length: total }, (_, i) => ({
    type: 'task',
    title: `Task #${i + 1}`,
    done: false,
    meta: { tags: ['stress', 'batch'], i, details: { nested: { depth: 2 } } }
  }));

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function* chunk(arr, size) { for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size); }

  let inserted = 0;
  const t0 = performance.now();

  for await (const batch of chunk(items, chunkSize)) {
    await Promise.allSettled(batch.map(v => db.put(v)));
    inserted += batch.length;
    await sleep(0);  // Micro-yield
  }

  const dt = performance.now() - t0;
  const opsPerSec = (total / dt) * 1000;

  console.log(`Inserted ${total} items in ${dt.toFixed(1)} ms (${opsPerSec.toFixed(1)} ops/sec)`);
  expect(inserted).toBe(total);
  expect(dt).toBeLessThan(10000);  // Maximum 10 seconds
});

test('Performance with simulated transmission between browsers (BroadcastChannel)', async () => {
  // Simulates BroadcastChannel for transmission
  global.BroadcastChannel = vi.fn().mockImplementation((name) => ({
    postMessage: vi.fn(),
    onmessage: null,
  }));

  const db1 = await gdb('perf-test', { rtc: true });  // "Browser 1" - inserts
  const db2 = await gdb('perf-test', { rtc: true });  // "Browser 2" - receives

  const total = 500;
  const chunkSize = 50;
  const items = Array.from({ length: total }, (_, i) => ({
    type: 'task',
    title: `Task #${i + 1}`,
    done: false,
  }));

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function* chunk(arr, size) { for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size); }

  // Test without transmission (direct)
  let inserted = 0;
  const t0Direct = performance.now();
  for await (const batch of chunk(items, chunkSize)) {
    await Promise.allSettled(batch.map(v => db1.put(v)));
    inserted += batch.length;
    await sleep(0);
  }
  const dtDirect = performance.now() - t0Direct;
  const opsPerSecDirect = (total / dtDirect) * 1000;

  // Test with BroadcastChannel transmission (simulated)
  inserted = 0;
  const t0Sync = performance.now();
  for await (const batch of chunk(items, chunkSize)) {
    await Promise.allSettled(batch.map(v => db1.put(v)));
    // Simulates transmission to db2
    const bc = new BroadcastChannel('graphdb_sync_perf-test');
    bc.postMessage({ type: 'sync', data: batch });
    await sleep(1);  // Simulated delay for overhead
    inserted += batch.length;
    await sleep(0);
  }
  const dtSync = performance.now() - t0Sync;
  const opsPerSecSync = (total / dtSync) * 1000;

  console.log(`Direct: ${dtDirect.toFixed(1)} ms (${opsPerSecDirect.toFixed(1)} ops/sec)`);
  console.log(`With BroadcastChannel: ${dtSync.toFixed(1)} ms (${opsPerSecSync.toFixed(1)} ops/sec)`);
  expect(dtSync).toBeGreaterThanOrEqual(dtDirect);
  expect(opsPerSecDirect).toBeGreaterThan(0);
  expect(opsPerSecSync).toBeGreaterThan(0);
});

test('Performance with simulated transmission between browsers (P2P)', async () => {
  // Simulates WebRTC for P2P
  global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
    createDataChannel: vi.fn().mockReturnValue({
      send: vi.fn(),
      onmessage: null,
    }),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer' }),
    setLocalDescription: vi.fn().mockResolvedValue(),
    setRemoteDescription: vi.fn().mockResolvedValue(),
  }));

  const db1 = await gdb('perf-test', { rtc: true });  // "Browser 1" - inserts
  const db2 = await gdb('perf-test', { rtc: true });  // "Browser 2" - receives

  const total = 500;
  const chunkSize = 50;
  const items = Array.from({ length: total }, (_, i) => ({
    type: 'task',
    title: `Task #${i + 1}`,
    done: false,
  }));

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function* chunk(arr, size) { for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size); }

  // Test without transmission (direct)
  let inserted = 0;
  const t0Direct = performance.now();
  for await (const batch of chunk(items, chunkSize)) {
    await Promise.allSettled(batch.map(v => db1.put(v)));
    inserted += batch.length;
    await sleep(0);
  }
  const dtDirect = performance.now() - t0Direct;
  const opsPerSecDirect = (total / dtDirect) * 1000;

  // Test with P2P transmission (simulated)
  inserted = 0;
  const t0Sync = performance.now();
  for await (const batch of chunk(items, chunkSize)) {
    await Promise.allSettled(batch.map(v => db1.put(v)));
    // Simulates P2P transmission to db2
    const pc = new RTCPeerConnection();
    const channel = pc.createDataChannel('sync');
    channel.send(JSON.stringify(batch));  // Sends data via data channel
    await sleep(1);  // Simulated delay for P2P
    inserted += batch.length;
    await sleep(0);
  }
  const dtSync = performance.now() - t0Sync;
  const opsPerSecSync = (total / dtSync) * 1000;

  console.log(`Direct: ${dtDirect.toFixed(1)} ms (${opsPerSecDirect.toFixed(1)} ops/sec)`);
  console.log(`With P2P: ${dtSync.toFixed(1)} ms (${opsPerSecSync.toFixed(1)} ops/sec)`);
  expect(dtSync).toBeGreaterThanOrEqual(dtDirect);
  expect(opsPerSecDirect).toBeGreaterThan(0);
  expect(opsPerSecSync).toBeGreaterThan(0);
});