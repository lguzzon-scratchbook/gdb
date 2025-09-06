import { gdb } from "../dist/index.js";

test('Basic Put and Get', async () => {
  const db = await gdb('test-db');
  const id = await db.put({ name: 'Test' });
  const { result } = await db.get(id);
  expect(result.value.name).toBe('Test');
});
