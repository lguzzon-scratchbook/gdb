import { gdb } from "../dist/index.js";

test('Remove', async () => {
  const db = await gdb('test-db');
  const id = await db.put({ name: 'Test' });
  await db.remove(id);
  const { result } = await db.get(id);
  expect(result).toBeNull();
});

test('Map (query)', async () => {
  const db = await gdb('test-db');
  await db.put({ type: 'user', name: 'Ana' });
  const { results } = await db.map({ query: { type: 'user' } });
  expect(results).toHaveLength(1);
});

test('Link', async () => {
  const db = await gdb('test-db');
  const id1 = await db.put({ name: 'Node1' });
  const id2 = await db.put({ name: 'Node2' });
  await db.link(id1, id2);
  const { result } = await db.get(id1);
  expect(result.edges).toContain(id2);
});

test('Performance in bulk operations', async () => {
  const db = await gdb('test-db');
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    await db.put({ data: `item${i}` });
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(5000);  // Maximum 5 seconds
});