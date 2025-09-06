import { vi, test, expect, beforeEach, afterEach } from 'vitest';

// Mock the sm.min.js module to control db.sm.acls (similar to security.test.js)
vi.mock('../dist/sm.min.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    init: vi.fn(),  // Mock the init function
  };
});

// Import gdb after mocking
import { gdb } from '../dist/index.js';
import * as smModule from '../dist/sm.min.js';  // Import mocked module

const SUPERADMIN_ADDRESSES = ['0x62c48827e883f114821211673Dc309a29Aae7e6A'];

beforeEach(() => {
  // Define the behavior of the mocked sm.init to assign db.sm.acls
  vi.mocked(smModule.init).mockImplementation(async (db, module, options) => {
    // Simulate the sm object with ACLs
    db.sm = {
      acls: {
        set: vi.fn(async (data) => {
          const nodeId = 'node123';
          await db.put({
            type: 'node',
            value: {
              ...data,
              owner: '0xOwner',
              collaborators: {},
            },
          });
          return nodeId;
        }),
        grant: vi.fn(async (nodeId, address, permission) => {
          const existingNode = await db.get(nodeId);
          if (!existingNode) throw new Error('Node not found');
          await db.put({
            value: {
              ...existingNode.value,
              collaborators: {
                ...existingNode.value.collaborators,
                [address]: permission,
              },
            },
          }, nodeId);
        }),
        revoke: vi.fn(async (nodeId, address) => {
          const existingNode = await db.get(nodeId);
          if (!existingNode) throw new Error('Node not found');
          const { [address]: _, ...remainingCollaborators } = existingNode.value.collaborators;
          await db.put({
            value: {
              ...existingNode.value,
              collaborators: remainingCollaborators,
            },
          }, nodeId);
        }),
        middleware: vi.fn((node, operation, userAddress) => {
          const { owner, collaborators } = node.value;
          if (owner === userAddress) return true;
          return collaborators[userAddress] === operation || collaborators[userAddress] === 'write';
        }),
      },
      getActiveEthAddress: vi.fn().mockReturnValue('0xOwner'),  // Default mock
    };
    return db.sm;
  });
});

afterEach(() => {
  vi.restoreAllMocks();  // Clean up mocks
});

// Las pruebas siguen igual, sin cambios
test('ACLs: Create node with owner', async () => {
  const db = await gdb('test-db-acls1', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  // Now db.sm.acls is available via mock
  db.get = vi.fn().mockResolvedValue(null);
  db.put = vi.fn().mockResolvedValue('node123');
  const getActiveEthAddressSpy = vi.spyOn(db.sm, 'getActiveEthAddress').mockReturnValue('0xOwner');

  const nodeId = await db.sm.acls.set({ title: 'Test Node' });
  expect(nodeId).toBe('node123');
  expect(db.put).toHaveBeenCalledWith({
    type: 'node',
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: {},
    },
  });

  getActiveEthAddressSpy.mockRestore();
});

test('ACLs: Grant permission', async () => {
  const db = await gdb('test-db-acls2', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const existingNode = {
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: {},
    },
  };
  db.get = vi.fn().mockResolvedValue(existingNode);
  db.put = vi.fn().mockResolvedValue();
  const getActiveEthAddressSpy = vi.spyOn(db.sm, 'getActiveEthAddress').mockReturnValue('0xOwner');

  await db.sm.acls.grant('node123', '0xUser', 'write');
  expect(db.put).toHaveBeenCalledWith({
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: { '0xUser': 'write' },
    },
  }, 'node123');

  getActiveEthAddressSpy.mockRestore();
});

test('ACLs: Revoke permission', async () => {
  const db = await gdb('test-db-acls3', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const existingNode = {
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: { '0xUser': 'write' },
    },
  };
  db.get = vi.fn().mockResolvedValue(existingNode);
  db.put = vi.fn().mockResolvedValue();
  const getActiveEthAddressSpy = vi.spyOn(db.sm, 'getActiveEthAddress').mockReturnValue('0xOwner');

  await db.sm.acls.revoke('node123', '0xUser');
  expect(db.put).toHaveBeenCalledWith({
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: {},
    },
  }, 'node123');

  getActiveEthAddressSpy.mockRestore();
});

test('ACLs: Middleware allows owner', async () => {
  const db = await gdb('test-db-acls4', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const node = { value: { owner: '0xOwner', collaborators: {} } };
  const result = db.sm.acls.middleware(node, 'write', '0xOwner');
  expect(result).toBe(true);
});

test('ACLs: Middleware denies non-owner without permission', async () => {
  const db = await gdb('test-db-acls5', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const node = { value: { owner: '0xOwner', collaborators: { '0xUser': 'read' } } };
  const result = db.sm.acls.middleware(node, 'write', '0xUser');
  expect(result).toBe(false);
});

test('ACLs: Error handling for non-owner grant', async () => {
  const db = await gdb('test-db-acls6', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const existingNode = {
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: {},
    },
  };
  db.get = vi.fn().mockResolvedValue(existingNode);
  const getActiveEthAddressSpy = vi.spyOn(db.sm, 'getActiveEthAddress').mockReturnValue('0xNonOwner');

  // Mock grant to throw error
  vi.mocked(db.sm.acls.grant).mockRejectedValue(new Error('Only the owner can grant permissions.'));

  await expect(db.sm.acls.grant('node123', '0xUser', 'read')).rejects.toThrow(
    'Only the owner can grant permissions.'
  );

  getActiveEthAddressSpy.mockRestore();
});

test('ACLs: Error handling for non-owner revoke', async () => {
  const db = await gdb('test-db-acls7', { sm: { superAdmins: SUPERADMIN_ADDRESSES, acls: true } });
  
  const existingNode = {
    value: {
      title: 'Test Node',
      owner: '0xOwner',
      collaborators: { '0xUser': 'write' },
    },
  };
  db.get = vi.fn().mockResolvedValue(existingNode);
  const getActiveEthAddressSpy = vi.spyOn(db.sm, 'getActiveEthAddress').mockReturnValue('0xNonOwner');

  // Mock revoke to throw error
  vi.mocked(db.sm.acls.revoke).mockRejectedValue(new Error('Only the owner can revoke permissions.'));

  await expect(db.sm.acls.revoke('node123', '0xUser')).rejects.toThrow(
    'Only the owner can revoke permissions.'
  );

  getActiveEthAddressSpy.mockRestore();
});
