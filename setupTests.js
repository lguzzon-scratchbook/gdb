import { beforeAll, vi } from 'vitest';

// Mock console globalmente antes de imports
global.console = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

// Mock OPFS
global.navigator = global.navigator || {};
global.navigator.storage = {
  getDirectory: vi.fn().mockResolvedValue({}),
};

// Mock URL.createObjectURL
global.URL = global.URL || {};
global.URL.createObjectURL = vi.fn(() => 'mocked-url');

// Mock SecurityManager
global.ssmInstance = {
  encryptDataForCurrentUser: vi.fn().mockResolvedValue('encrypted-data'),
  decryptDataForCurrentUser: vi.fn().mockResolvedValue({ secret: 'test' }),
};

// Mock función de verificación de seguridad
global.isSecurityActive = vi.fn().mockReturnValue(true);

// Mock WebRTC
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  setLocalDescription: vi.fn().mockResolvedValue(),
  setRemoteDescription: vi.fn().mockResolvedValue(),
  addIceCandidate: vi.fn().mockResolvedValue(),
  onicecandidate: null,
  ontrack: null,
  ondatachannel: null,
  createDataChannel: vi.fn().mockReturnValue({
    send: vi.fn(),
    onmessage: null,
    onopen: null,
    onclose: null,
  }),
}));

global.RTCIceCandidate = vi.fn();
global.RTCSessionDescription = vi.fn();