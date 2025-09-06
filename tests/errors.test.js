
import { gdb } from "../dist/index.js";

test('Handling invalid ID in get', async () => {
  const db = await gdb('test-db');
  const { result } = await db.get('invalid-id');
  expect(result).toBe(null);
});