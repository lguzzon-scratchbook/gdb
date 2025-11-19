import { vi } from 'vitest';

// 1. Mock de Console (opcional, para reducir ruido)
global.console = {
  ...console,
  // log: vi.fn(), // Descomenta si quieres silenciar logs
  warn: vi.fn(),
  error: vi.fn(),
};

// 2. Mock de Entorno del Navegador (OPFS, URL, etc.)
if (!global.navigator) global.navigator = {};
global.navigator.storage = {
  getDirectory: vi.fn().mockResolvedValue({}),
};

if (!global.URL) global.URL = {};
global.URL.createObjectURL = vi.fn(() => 'mocked-url');

// 3. Mock de Seguridad (GenosDB específico)
global.ssmInstance = {
  encryptDataForCurrentUser: vi.fn().mockResolvedValue('encrypted-data'),
  decryptDataForCurrentUser: vi.fn().mockResolvedValue({ secret: 'test' }),
};
global.isSecurityActive = vi.fn().mockReturnValue(true);

// 4. Mock de WebRTC (CRÍTICO: Debe ser una CLASE, no una función flecha)
// Esto soluciona el error "is not a constructor"
global.RTCPeerConnection = class RTCPeerConnection {
  constructor(configuration) {
    this.configuration = configuration || {};
    this.onicecandidate = null;
    this.onmessage = null;
    this.ondatachannel = null;
    this.ontrack = null;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';
  }

  createDataChannel(label, options) {
    return {
      label,
      id: 0,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      readyState: 'open'
    };
  }

  createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'mock-offer-sdp' });
  }

  createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'mock-answer-sdp' });
  }

  setLocalDescription(description) {
    return Promise.resolve();
  }

  setRemoteDescription(description) {
    return Promise.resolve();
  }

  addIceCandidate(candidate) {
    return Promise.resolve();
  }

  close() {
    this.connectionState = 'closed';
  }
  
  getSenders() { return []; }
  getReceivers() { return []; }
};

global.RTCSessionDescription = class RTCSessionDescription {
  constructor(init) {
    this.type = init?.type || 'offer';
    this.sdp = init?.sdp || 'mock-sdp';
  }
};

global.RTCIceCandidate = class RTCIceCandidate {
  constructor(init) {
    this.candidate = init?.candidate || '';
    this.sdpMid = init?.sdpMid || '';
    this.sdpMLineIndex = init?.sdpMLineIndex || 0;
  }
};