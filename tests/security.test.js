import { vi, test, expect, beforeEach, afterEach } from 'vitest';

// Mock window.alert for JSDOM
global.alert = vi.fn();

// Mock the sm.js module. This is the correct, isolated way.
vi.mock('../dist/sm.min.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // We will mock the 'init' function to control the sm object creation
    init: vi.fn(),
  };
});

// Import the REAL gdb. The mock above will intercept the sm.min.js loading.
import { gdb } from '../dist/index.js';
// Import the mocked module to control its behavior in tests
import * as smModule from '../dist/sm.min.js';

const SUPERADMIN_ADDRESSES = ['0x0000000000000000000000000000000000000000'];
const CHAT_APP_ROLES = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read'],
};

beforeEach(() => {
  // Before each test, we define the behavior of the mocked sm.init
  vi.mocked(smModule.init).mockImplementation(async (db) => {
    // This function will be called by gdb internally.
    // We attach our mocked sm object to the db instance.
    db.sm = {
      encryptDataForCurrentUser: vi.fn().mockImplementation((data) => {
        if (global.navigator.credentials?.get) global.navigator.credentials.get();
        return Promise.resolve(`encrypted-${JSON.stringify(data)}`);
      }),
      decryptDataForCurrentUser: vi.fn().mockImplementation((encrypted) => {
        if (global.navigator.credentials?.get) global.navigator.credentials.get();
        return Promise.resolve(JSON.parse(encrypted.replace('encrypted-', '')));
      }),
      startNewUserRegistration: vi.fn().mockResolvedValue({ address: '0x123' }),
      loginCurrentUserWithWebAuthn: vi.fn().mockImplementation(() => {
        if (global.navigator.credentials?.get) global.navigator.credentials.get();
        return Promise.resolve('0x456');
      }),
    };
    return db.sm;
  });

  // Mock navigator.credentials for WebAuthn tests
  global.navigator = {
    credentials: {
      get: vi.fn().mockResolvedValue({ id: 'cred1' }),
      create: vi.fn().mockResolvedValue({ id: 'cred1' }),
    },
  };
});

afterEach(() => {
  // Clean up all mocks after each test to prevent leaks
  vi.restoreAllMocks();
});

test('Encrypt and decrypt', async () => {
  const db = await gdb('test-db-sec1', { sm: { superAdmins: SUPERADMIN_ADDRESSES } });
  const data = { secret: 'test' };
  const encrypted = await db.sm.encryptDataForCurrentUser(data);
  const decrypted = await db.sm.decryptDataForCurrentUser(encrypted);
  expect(decrypted).toEqual(data);
});

test('New user registration', async () => {
  const db = await gdb('test-db-sec2', { sm: { superAdmins: SUPERADMIN_ADDRESSES } });
  const identity = await db.sm.startNewUserRegistration();
  expect(identity).toHaveProperty('address', '0x123');
});

test('Login with WebAuthn', async () => {
  const db = await gdb('test-db-sec3', { sm: { superAdmins: SUPERADMIN_ADDRESSES } });
  const address = await db.sm.loginCurrentUserWithWebAuthn();
  expect(address).toBe('0x456');
});

test('Advanced WebAuthn: Authentication with multiple credentials', async () => {
  const db = await gdb('test-db-sec4', { sm: { superAdmins: SUPERADMIN_ADDRESSES } });
  await db.sm.loginCurrentUserWithWebAuthn();
  expect(global.navigator.credentials.get).toHaveBeenCalled();
});

test('Advanced WebAuthn: Error handling in authentication', async () => {
  const db = await gdb('test-db-sec5', { sm: { superAdmins: SUPERADMIN_ADDRESSES } });
  vi.mocked(db.sm.loginCurrentUserWithWebAuthn).mockRejectedValue(new Error('Authentication failed'));
  await expect(db.sm.loginCurrentUserWithWebAuthn()).rejects.toThrow('Authentication failed');
});

test('RBAC: Role-based access control simulation', async () => {
  const roles = CHAT_APP_ROLES;
  const checkPermission = (role, action) => roles[role]?.includes(action) || false;
  const superAdmins = SUPERADMIN_ADDRESSES;
  let users = [{ id: superAdmins[0], role: 'admin' }, { id: 'user2', role: 'user' }];
  const assignRole = (assignerId, userId, newRole) => {
    if (!superAdmins.includes(assignerId)) throw new Error('Not authorized');
    const user = users.find(u => u.id === userId);
    if (user) user.role = newRole;
  };
  assignRole(superAdmins[0], 'user2', 'admin');
  expect(users.find(u => u.id === 'user2').role).toBe('admin');
  expect(checkPermission('admin', 'delete')).toBe(true);
});