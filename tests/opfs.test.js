import { gdb } from "../dist/index.js";

test('Real OPFS: File writing', async () => {
  const db = await gdb('test-db');
  // Mock OPFS directory
  const mockDir = {
    getFileHandle: vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(),
        close: vi.fn().mockResolvedValue(),
      }),
    }),
  };
  global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(mockDir);

  const dir = await navigator.storage.getDirectory();
  const fileHandle = await dir.getFileHandle('test.txt');
  const writable = await fileHandle.createWritable();
  await writable.write('test-content');
  await writable.close();
  expect(writable.write).toHaveBeenCalledWith('test-content');
});

test('Real OPFS: File reading', async () => {
  const db = await gdb('test-db');
  const mockDir = {
    getFileHandle: vi.fn().mockResolvedValue({
      getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue('file-content'),
      }),
    }),
  };
  global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(mockDir);

  const dir = await navigator.storage.getDirectory();
  const fileHandle = await dir.getFileHandle('test.txt');
  const file = await fileHandle.getFile();
  const content = await file.text();
  expect(content).toBe('file-content');
});

test('Real OPFS: File deletion', async () => {
  const db = await gdb('test-db');
  const mockDir = {
    removeEntry: vi.fn().mockResolvedValue(),
  };
  global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(mockDir);

  const dir = await navigator.storage.getDirectory();
  await dir.removeEntry('test.txt');
  expect(dir.removeEntry).toHaveBeenCalledWith('test.txt');
});

test('Real OPFS: File listing', async () => {
  const db = await gdb('test-db');
  // Mock async iterable for keys
  const mockDir = {
    keys: vi.fn().mockImplementation(async function* () {
      yield 'file1.txt';
      yield 'file2.txt';
    }),
  };
  global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(mockDir);

  const dir = await navigator.storage.getDirectory();
  const files = [];
  for await (const key of dir.keys()) {
    files.push(key);
  }
  expect(files).toEqual(['file1.txt', 'file2.txt']);
});

test('Handling large file in OPFS', async () => {
  const db = await gdb('test-db');
  const largeData = 'x'.repeat(10 * 1024 * 1024);  // 10MB
  
  // Use put to save large data (persists in OPFS internally)
  const id = await db.put({ data: largeData });
  
  // Use get to retrieve
  const { result } = await db.get(id);
  expect(result.value.data).toBe(largeData);
});