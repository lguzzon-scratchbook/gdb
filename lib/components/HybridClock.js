// HybridClock.js
export class HybridClock {
    constructor() {
      this.physical = Date.now();
      this.logical = 0;
    }
  
    now() {
      const currentPhysical = Date.now();
      this.physical = Math.max(this.physical, currentPhysical);
      this.logical++;
      return { physical: this.physical, logical: this.logical };
    }
  
    update(remoteTimestamp) {
      this.physical = Math.max(this.physical, remoteTimestamp.physical);
      this.logical = Math.max(this.logical, remoteTimestamp.logical) + 1;
    }
  
    compare(ts1, ts2) {
      if (ts1.logical > ts2.logical) {
        return 1; // ts1 es más reciente
      } else if (ts1.logical < ts2.logical) {
        return -1; // ts2 es más reciente
      } else {
        // Si los contadores lógicos son iguales, comparar los timestamps físicos
        return ts1.physical - ts2.physical;
      }
    }
  }