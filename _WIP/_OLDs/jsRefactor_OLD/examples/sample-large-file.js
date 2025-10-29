import { EventEmitter } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import lodash from 'lodash';

// Configuration constants
const DEFAULT_CONFIG = {
  timeout: 5000,
  retries: 3,
  batchSize: 100,
  logLevel: 'info',
};

const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
};

// Utility functions
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function deepMerge(target, source) {
  return lodash.merge({}, target, source);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Data processing classes
export class DataProcessor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isProcessing = false;
    this.stats = {
      processed: 0,
      errors: 0,
      startTime: null,
    };
  }

  async processBatch(data) {
    if (this.isProcessing) {
      throw new Error('Processor is already running');
    }

    this.isProcessing = true;
    this.stats.startTime = Date.now();
    this.emit('start');

    try {
      const batches = this._createBatches(data, this.config.batchSize);

      for (const batch of batches) {
        await this._processBatchItem(batch);
        this.stats.processed += batch.length;
        this.emit('progress', this.stats);
      }

      this.emit('complete', this.stats);
      return this.stats;
    } catch (error) {
      this.stats.errors++;
      this.emit('error', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  _createBatches(data, batchSize) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  async _processBatchItem(batch) {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Validate each item in the batch
    for (const item of batch) {
      if (!this._validateItem(item)) {
        throw new Error(`Invalid item: ${JSON.stringify(item)}`);
      }
    }

    return batch;
  }

  _validateItem(item) {
    return item && typeof item === 'object' && item.id;
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.stats = {
      processed: 0,
      errors: 0,
      startTime: null,
    };
    this.emit('reset');
  }
}

export class FileManager {
  constructor(basePath) {
    this.basePath = basePath;
    this.cache = new Map();
  }

  async readFile(filePath) {
    const fullPath = join(this.basePath, filePath);

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath);
    }

    try {
      const content = readFileSync(fullPath, 'utf-8');
      this.cache.set(fullPath, content);
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async writeFile(filePath, content) {
    const fullPath = join(this.basePath, filePath);

    try {
      writeFileSync(fullPath, content, 'utf-8');
      this.cache.set(fullPath, content);
      return true;
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

// API client class
export class ApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.options = {
      timeout: DEFAULT_CONFIG.timeout,
      retries: DEFAULT_CONFIG.retries,
      ...options,
    };
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'jsrefactor-client/1.0.0',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.headers,
      ...options,
    };

    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        const response = await this._makeRequest(url, config);
        return response;
      } catch (error) {
        if (attempt === this.options.retries) {
          throw new Error(
            `Request failed after ${this.options.retries} attempts: ${error.message}`
          );
        }
        await this._delay(1000 * attempt);
      }
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: 'GET',
    });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async _makeRequest(_url, _config) {
    // This would use fetch or axios in a real implementation
    // For demo purposes, we'll simulate a request
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (Math.random() < 0.1) {
      // 10% chance of failure
      throw new Error('Network error');
    }

    return {
      ok: true,
      status: 200,
      data: { message: 'Success', timestamp: Date.now() },
    };
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  removeHeader(name) {
    delete this.headers[name];
  }
}

// Validation utilities
export class Validator {
  constructor(rules = {}) {
    this.rules = rules;
  }

  validate(data) {
    const errors = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      const fieldErrors = this._validateField(value, rule, field);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  _validateField(value, rule, fieldName) {
    const errors = [];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
    }

    if (rule.type && value !== undefined && value !== null) {
      if (rule.type === 'email' && !validateEmail(value)) {
        errors.push(`${fieldName} must be a valid email`);
      } else if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
      } else if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`${fieldName} must be a number`);
      } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean`);
      }
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`);
    }

    if (rule.min && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`);
    }

    if (rule.max && value > rule.max) {
      errors.push(`${fieldName} must not exceed ${rule.max}`);
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }

    return errors;
  }

  addRule(field, rule) {
    this.rules[field] = rule;
  }

  removeRule(field) {
    delete this.rules[field];
  }
}

// Logger utility
export class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  error(message, data = null) {
    this._log('error', message, data);
  }

  warn(message, data = null) {
    this._log('warn', message, data);
  }

  info(message, data = null) {
    this._log('info', message, data);
  }

  debug(message, data = null) {
    this._log('debug', message, data);
  }

  _log(level, message, data) {
    if (this.levels[level] <= this.levels[this.level]) {
      const timestamp = new Date().toISOString();
      const _logEntry = {
        timestamp,
        level,
        message,
        data,
      };

      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
      if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    } else {
      throw new Error(`Invalid log level: ${level}`);
    }
  }
}

// Export constants and create default instances
export { DEFAULT_CONFIG, ERROR_CODES };

export const defaultLogger = new Logger(DEFAULT_CONFIG.logLevel);
export const defaultValidator = new Validator();
