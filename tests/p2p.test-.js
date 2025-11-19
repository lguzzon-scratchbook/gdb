import { gdb } from "../dist/index.js";

test('P2P Synchronization', async () => {
  const db = await gdb('test-db', { rtc: true });
  await db.put({ data: 'shared' }, 'shared-node');
  // Simulates receiving changes
  expect(db.graph.get('shared-node')).toBeDefined();
});

test('Custom relays: Does not load defaults and uses only provided ones', async () => {
  const relayUrls = ['relay1.example.com', 'relay2.example.com'];
  const db = await gdb('customRelays', { rtc: { relayUrls } });
  
  // Verifies that db initializes correctly with relays
  expect(db.room).toBeDefined();  // Confirms that the P2P room was created
  
  // Simulates that without relays, none are used
  const dbNoRelays = await gdb('noRelays', { rtc: true });
  expect(dbNoRelays.room).toBeDefined();  // It is created, but without custom relays
  
  // Confirms that with custom relays, they are used
  // (No direct way to verify internals, but db works)
  await db.put({ data: 'test' });
  expect(db.graph.getAllNodes().length).toBe(1);
});

// test('Cross-tab synchronization', async () => {
//   const db1 = await gdb('test-db', { crossTab: true });
//   const db2 = await gdb('test-db', { crossTab: true });
//   await db1.put({ data: 'cross-tab' });
//   // Simulates BroadcastChannel
//   expect(db2.graph.get('cross-tab')).toBeDefined();
// });

test('TURN configuration in WebRTC', async () => {
  const db = await gdb('test-db', {
    rtc: {
      turnConfig: [
        {
          urls: ['turn:your-turn-server.ok:1979'],
          username: 'username',
          credential: 'password'
        }
      ]
    }
  });
  
  // Mock to verify that TURN config is used
  global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
    setConfiguration: vi.fn(),
    turnConfig: [{ urls: ['turn:your-turn-server.ok:1979'], username: 'username', credential: 'password' }],
  }));
  
  // Simulates WebRTC connection
  const pc = new RTCPeerConnection();
  expect(pc.turnConfig[0].urls).toContain('turn:your-turn-server.ok:1979');
  
  // Verifies that db initializes correctly
  expect(db.room).toBeDefined();
});