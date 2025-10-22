// Geo Index Module
// Provides geospatial querying capabilities with $near and $bbox operators

/**
 * Geospatial index for location-based queries
 */
export default class GeoIndex {
    constructor(options = {}) {
        this.points = [];
        this.bounds = {
            minLat: 90,
            maxLat: -90,
            minLng: 180,
            maxLng: -180
        };
        this.maxResults = options.maxResults || 100;
        this.precision = options.precision || 6; // Geohash precision
    }
    
    /**
     * Insert a point into the geo index
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {any} value - Associated value
     * @param {string} field - Field name for context
     */
    insert(lat, lng, value, field = 'location') {
        if (!this._validateCoordinates(lat, lng)) {
            return false;
        }
        
        const point = {
            lat,
            lng,
            value,
            field,
            geohash: this._encodeGeohash(lat, lng, this.precision),
            timestamp: Date.now()
        };
        
        this.points.push(point);
        this._updateBounds(lat, lng);
        
        return true;
    }
    
    /**
     * Find points near a location
     * @param {number} lat - Latitude of center point
     * @param {number} lng - Longitude of center point
     * @param {number} radius - Search radius in meters (default: 1000)
     * @param {Object} options - Search options
     * @returns {Array} Points within radius
     */
    near(lat, lng, radius = 1000, options = {}) {
        if (!this._validateCoordinates(lat, lng)) {
            throw new Error('Invalid coordinates');
        }
        
        const results = [];
        const radiusSquared = radius * radius; // Use squared distance for performance
        
        for (const point of this.points) {
            const distance = this._calculateDistanceSquared(lat, lng, point.lat, point.lng);
            
            if (distance <= radiusSquared) {
                results.push({
                    ...point,
                    distance: Math.sqrt(distance)
                });
            }
        }
        
        // Sort by distance
        return results
            .sort((a, b) => a.distance - b.distance)
            .slice(0, this.maxResults);
    }
    
    /**
     * Find points within a bounding box
     * @param {number} minLat - Minimum latitude
     * @param {number} minLng - Minimum longitude
     * @param {number} maxLat - Maximum latitude
     * @param {number} maxLng - Maximum longitude
     * @returns {Array} Points within the bounding box
     */
    withinBox(minLat, minLng, maxLat, maxLng) {
        if (!this._validateBounds(minLat, minLng, maxLat, maxLng)) {
            throw new Error('Invalid bounding box');
        }
        
        // Normalize coordinates
        const bounds = this._normalizeBounds(minLat, minLng, maxLat, maxLng);
        
        const results = [];
        
        for (const point of this.points) {
            if (this._isPointInBounds(point.lat, point.lng, bounds)) {
                results.push(point);
            }
        }
        
        return results.slice(0, this.maxResults);
    }
    
    /**
     * Find nearest points using geohash approximation
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} count - Number of nearest points to return
     * @returns {Array} Nearest points
     */
    nearest(lat, lng, count = 10) {
        if (!this._validateCoordinates(lat, lng)) {
            throw new Error('Invalid coordinates');
        }
        
        const targetGeohash = this._encodeGeohash(lat, lng, this.precision);
        const nearbyGeohashes = this._getNearbyGeohashes(targetGeohash);
        
        const candidates = [];
        
        // Find points with nearby geohashes
        for (const point of this.points) {
            if (nearbyGeohashes.includes(point.geohash)) {
                const distance = this._calculateDistance(lat, lng, point.lat, point.lng);
                candidates.push({
                    ...point,
                    distance
                });
            }
        }
        
        return candidates
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count);
    }
    
    /**
     * Remove a point from the index
     * @param {any} value - Value to remove
     * @returns {boolean} Whether point was found and removed
     */
    remove(value) {
        const index = this.points.findIndex(p => p.value === value);
        if (index !== -1) {
            this.points.splice(index, 1);
            this._recalculateBounds();
            return true;
        }
        return false;
    }
    
    /**
     * Update a point's coordinates
     * @param {any} value - Value to update
     * @param {number} newLat - New latitude
     * @param {number} newLng - New longitude
     * @returns {boolean} Whether point was found and updated
     */
    update(value, newLat, newLng) {
        if (!this._validateCoordinates(newLat, newLng)) {
            return false;
        }
        
        const point = this.points.find(p => p.value === value);
        if (!point) {
            return false;
        }
        
        point.lat = newLat;
        point.lng = newLng;
        point.geohash = this._encodeGeohash(newLat, newLng, this.precision);
        point.timestamp = Date.now();
        
        this._recalculateBounds();
        return true;
    }
    
    /**
     * Get all points
     * @returns {Array} All points
     */
    getAll() {
        return [...this.points];
    }
    
    /**
     * Clear all points
     */
    clear() {
        this.points = [];
        this.bounds = {
            minLat: 90,
            maxLat: -90,
            minLng: 180,
            maxLng: -180
        };
    }
    
    /**
     * Get index statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            pointCount: this.points.length,
            bounds: { ...this.bounds },
            precision: this.precision
        };
    }
    
    /**
     * Validate coordinates
     * @private
     */
    _validateCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
               typeof lat === 'number' && typeof lng === 'number' &&
               !isNaN(lat) && !isNaN(lng);
    }
    
    /**
     * Validate bounding box
     * @private
     */
    _validateBounds(minLat, minLng, maxLat, maxLng) {
        return this._validateCoordinates(minLat, minLng) &&
               this._validateCoordinates(maxLat, maxLng) &&
               minLat <= maxLat && minLng <= maxLng;
    }
    
    /**
     * Calculate distance between two points using Haversine formula
     * @private
     */
    _calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const lat1Rad = this._toRadians(lat1);
        const lat2Rad = this._toRadians(lat2);
        const deltaLatRad = this._toRadians(lat2 - lat1);
        const deltaLngRad = this._toRadians(lng2 - lng1);
        
        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    /**
     * Calculate squared distance for performance optimization
     * @private
     */
    _calculateDistanceSquared(lat1, lng1, lat2, lng2) {
        // Simple approximation for small distances
        const deltaLat = lat2 - lat1;
        const deltaLng = lng2 - lng1;
        
        // Convert to meters (approximate)
        const metersPerDegreeLat = 111320; // meters per degree latitude
        const metersPerDegreeLng = 111320 * Math.cos(this._toRadians((lat1 + lat2) / 2));
        
        const distanceLat = deltaLat * metersPerDegreeLat;
        const distanceLng = deltaLng * metersPerDegreeLng;
        
        return distanceLat * distanceLat + distanceLng * distanceLng;
    }
    
    /**
     * Convert degrees to radians
     * @private
     */
    _toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Encode geohash
     * @private
     */
    _encodeGeohash(lat, lng, precision = 6) {
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        
        // Bounds for geohash encoding
        let latMin = -90, latMax = 90;
        let lngMin = -180, lngMax = 180;
        
        let geohash = '';
        
        for (let i = 0; i < precision * 5; i++) {
            let bit = 0;
            
            // Alternate between longitude and latitude bits
            if (i % 2 === 0) {
                // Longitude bit
                const lngMid = (lngMin + lngMax) / 2;
                if (lng > lngMid) {
                    bit = 1;
                    lngMin = lngMid;
                } else {
                    lngMax = lngMid;
                }
            } else {
                // Latitude bit
                const latMid = (latMin + latMax) / 2;
                if (lat > latMid) {
                    bit = 1;
                    latMin = latMid;
                } else {
                    latMax = latMid;
                }
            }
            
            // Add bit to current character
            const charIndex = Math.floor(i / 5);
            if (charIndex >= geohash.length) {
                geohash += '0';
            }
            
            const charPos = i % 5;
            geohash = geohash.substring(0, charIndex) + 
                      (parseInt(geohash[charIndex]) | (bit << (4 - charPos))) +
                      geohash.substring(charIndex + 1);
        }
        
        // Convert to base32
        let result = '';
        for (let i = 0; i < geohash.length; i++) {
            result += base32[parseInt(geohash[i])];
        }
        
        return result;
    }
    
    /**
     * Get nearby geohashes for spatial indexing
     * @private
     */
    _getNearbyGeohashes(targetGeohash) {
        // Simple implementation - just use same geohash
        // In production, you'd want to get neighboring geohashes at different precisions
        const nearby = new Set([targetGeohash]);
        
        // Add geohashes at different precisions
        for (let p = 1; p < this.precision; p++) {
            nearby.add(targetGeohash.substring(0, p));
        }
        
        // Add some neighbors (simplified)
        const prefix = targetGeohash.substring(0, this.precision - 1);
        const lastChar = targetGeohash[this.precision - 1];
        const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
        const index = base32.indexOf(lastChar);
        
        // Add adjacent geohashes
        for (let offset of -1, 1) {
            const newIndex = index + offset;
            if (newIndex >= 0 && newIndex < base32.length) {
                nearby.add(prefix + base32[newIndex]);
            }
        }
        
        return Array.from(nearby);
    }
    
    /**
     * Update bounds when adding point
     * @private
     */
    _updateBounds(lat, lng) {
        this.bounds.minLat = Math.min(this.bounds.minLat, lat);
        this.bounds.maxLat = Math.max(this.bounds.maxLat, lat);
        this.bounds.minLng = Math.min(this.bounds.minLng, lng);
        this.bounds.maxLng = Math.max(this.bounds.maxLng, lng);
    }
    
    /**
     * Recalculate bounds from all points
     * @private
     */
    _recalculateBounds() {
        if (this.points.length === 0) {
            this.bounds = {
                minLat: 90,
                maxLat: -90,
                minLng: 180,
                maxLng: -180
            };
            return;
        }
        
        this.bounds = {
            minLat: 90,
            maxLat: -90,
            minLng: 180,
            maxLng: -180
        };
        
        for (const point of this.points) {
            this._updateBounds(point.lat, point.lng);
        }
    }
    
    /**
     * Normalize bounding box coordinates
     * @private
     */
    _normalizeBounds(minLat, minLng, maxLat, maxLng) {
        return {
            minLat: Math.min(minLat, maxLat),
            maxLat: Math.max(minLat, maxLat),
            minLng: Math.min(minLng, maxLng),
            maxLng: Math.max(minLng, maxLng)
        };
    }
    
    /**
     * Check if point is within bounds
     * @private
     */
    _isPointInBounds(lat, lng, bounds) {
        return lat >= bounds.minLat && lat <= bounds.maxLat &&
               lng >= bounds.minLng && lng <= bounds.maxLng;
    }
}
