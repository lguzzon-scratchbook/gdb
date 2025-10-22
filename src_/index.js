// GenosDB (GDB) - Main entry point
// Decentralized P2P Graph Database

// Core modules
export { default as GDB } from './gdb.js';
export { default as GenosRTC } from './genosrtc.js';
export { default as SecurityManager } from './security-manager.js';

// Supporting modules
export { default as RadixIndex } from './radix-index.js';
export { default as GeoIndex } from './geo-index.js';
export { default as NLQModule } from './nlq-module.js';
export { default as AuditModule } from './audit-module.js';
export { default as ACLModule } from './acl-module.js';
export { default as GovModule } from './gov-module.js';
export { default as IIModule } from './ii-module.js';
export { default as AIModule } from './ai-module.js';
export { default as MultiRTC } from './multirtc.js';
export { default as InvertedIndex } from './inverted-index.js';

// Main factory function
export async function gdb(config = {}) {
    const { rtc = false, ...options } = config;
    
    // Initialize core database
    const db = new GDB(options);
    
    // Initialize P2P if requested
    if (rtc) {
        const genosrtc = new GenosRTC({
            database: db,
            ...options
        });
        db.rtc = genosrtc;
    }
    
    return db;
}

// Default export
export default gdb;
