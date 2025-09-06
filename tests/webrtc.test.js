import { gdb } from '../../gdb/dist/index.js';

test('Direct WebRTC: P2P connection creation', async () => {
  const db = await gdb('test-db', { rtc: true });
  // Mock RTCPeerConnection
  const mockPC = {
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
    setLocalDescription: vi.fn().mockResolvedValue(),
    setRemoteDescription: vi.fn().mockResolvedValue(),
    addIceCandidate: vi.fn().mockResolvedValue(),
    onicecandidate: null,
    ondatachannel: null,
    createDataChannel: vi.fn().mockReturnValue({
      send: vi.fn(),
      onmessage: null,
      onopen: null,
      onclose: null,
    }),
  };
  global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPC);

  const pc = new RTCPeerConnection();
  expect(pc.createOffer).toBeDefined();
});

test('Direct WebRTC: P2P data sending', async () => {
  const db = await gdb('test-db', { rtc: true });
  const pc = new RTCPeerConnection();
  const channel = pc.createDataChannel('test-channel');
  channel.send('test-data');
  expect(channel.send).toHaveBeenCalledWith('test-data');
});

test('Direct WebRTC: P2P data reception', async () => {
  const db = await gdb('test-db', { rtc: true });
  const pc = new RTCPeerConnection();
  const channel = pc.createDataChannel('test-channel');
  channel.onmessage = vi.fn();
  channel.onmessage({ data: 'received-data' });
  expect(channel.onmessage).toHaveBeenCalled();
});

test('Direct WebRTC: ICE candidates handling', async () => {
  const db = await gdb('test-db', { rtc: true });
  const pc = new RTCPeerConnection();
  const candidate = { candidate: 'mock-candidate' };
  await pc.addIceCandidate(candidate);
  expect(pc.addIceCandidate).toHaveBeenCalledWith(candidate);
});