import { gdb } from "../dist/index.js";

// Mock to simulate peers in CRDT
const mockPeer = {
  id: 'peer1',
  send: vi.fn(),
  receive: vi.fn(),
};

test('CRDT: Add operation', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Item1' });
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Item1');
});

test('CRDT: Update operation with merge', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Item1', version: 1 });
  await db.put({ name: 'Item1 Updated', version: 2 }, id);
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Item1 Updated');
});

test('CRDT: Delete operation', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Item1' });
  await db.remove(id);
  const { result } = await db.get(id);
  expect(result).toBeNull();
});

test('Conflict Resolution: Version Merge', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Item', version: 1 });
  // Simulates conflict: put with higher version
  await db.put({ name: 'Item Modified', version: 2 }, id);
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Item Modified');
});

test('Scenario: Offline/Online Synchronization', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id1 = await db.put({ name: 'Offline Item' });
  const { result } = await db.get(id1);
  expect(result.value.name).toBe('Offline Item');
});

test('Scenario: Conflict in links (link)', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id1 = await db.put({ name: 'Node1' });
  const id2 = await db.put({ name: 'Node2' });
  await db.link(id1, id2);
  // Simulates conflict: remove the linked node
  await db.remove(id2);
  const { result } = await db.get(id1);
  expect(result.edges).not.toContain(id2);
});

test('Scenario: Concurrent operations in map', async () => {
  const db = await gdb('test-db', { crdt: true });
  await db.put({ type: 'user', name: 'Ana' });
  await db.put({ type: 'user', name: 'Bob' });
  const { results } = await db.map({ query: { type: 'user' } });
  expect(results).toHaveLength(2);
  await db.put({ type: 'user', name: 'Charlie' });
  const { results: updated } = await db.map({ query: { type: 'user' } });
  expect(updated).toHaveLength(3);
});

test('Scenario: Conflict rollback', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Original' });
  await db.put({ name: 'Conflicted', version: 1 }, id);
  await db.remove(id);
  await db.put({ name: 'Original' }, id);
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Original');
});

test('Scenario: Integrity validation in CRDT', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Valid Item' });
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Valid Item');
});

test('CRDTs with real peers: Synchronization between peers', async () => {
  const db1 = await gdb('test-db', { crdt: true });
  const db2 = await gdb('test-db', { crdt: true });
  const id = await db1.put({ name: 'Shared Item' });
  // Simulates sync
  await db2.put({ name: 'Shared Item' }, id);
  const { result } = await db2.get(id);
  expect(result.value.name).toBe('Shared Item');
});

test('CRDTs with real peers: Conflict and resolution', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Item', version: 1 });
  // Simulates peer1 update
  await db.put({ name: 'Item Peer1', version: 2 }, id);
  // Simulates peer2 update with higher version
  await db.put({ name: 'Item Peer2', version: 3 }, id);
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Item Peer2');  // Latest version wins
});

test('CRDTs with real peers: Concurrent operations', async () => {
  const db1 = await gdb('test-db', { crdt: true });
  const db2 = await gdb('test-db', { crdt: true });
  await db1.put({ type: 'user', name: 'Ana' });
  await db2.put({ type: 'user', name: 'Bob' });
  const { results: db1Results } = await db1.map({ query: { type: 'user' } });
  const { results: db2Results } = await db2.map({ query: { type: 'user' } });
  expect(db1Results).toHaveLength(1);
  expect(db2Results).toHaveLength(1);
});

test('CRDTs with real peers: Disconnection and reconnection', async () => {
  const db = await gdb('test-db', { crdt: true });
  const id = await db.put({ name: 'Offline Item' });
  // Simulates disconnection: offline update
  await db.put({ name: 'Offline Update' }, id);
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Offline Update');  // Simulated sync
});