// Example file with poor naming for LLM renaming demonstration

import { utils } from './utils';
import data from './data';

function proc(d) {
  if (d && d.length > 0) {
    return d.map(x => x * 2);
  }
  return [];
}

class DataManager {
  constructor(d) {
    this.d = d;
    this.f = false;
  }
  
  async getData() {
    if (!this.f) {
      this.d = await utils.fetchData();
      this.f = true;
    }
    return this.d;
  }
  
  setData(d) {
    this.d = d;
    this.f = false;
  }
}

const DEFAULT_CONFIG = {
  t: 5000,
  r: 3,
  s: 100
};

export function validateInput(inp) {
  if (!inp || typeof inp !== 'object') {
    throw new Error('Invalid input');
  }
  return true;
}

export class Calculator {
  constructor() {
    this.res = 0;
  }
  
  add(v) {
    this.res += v;
    return this;
  }
  
  mult(v) {
    this.res *= v;
    return this;
  }
  
  get() {
    return this.res;
  }
}

export const helper = {
  format: (str) => str.trim().toLowerCase(),
  parse: (json) => JSON.parse(json),
  stringify: (obj) => JSON.stringify(obj, null, 2)
};

export default {
  proc,
  DataManager,
  Calculator,
  helper,
  DEFAULT_CONFIG
};
