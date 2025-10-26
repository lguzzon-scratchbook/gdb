import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { JsRefactorEngine } from '../src/engine.js';

test('JsRefactorEngine - Basic functionality', async (t) => {
  const tempDir = '/tmp/jsrefactor-test';

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  await t.test('should analyze a simple JavaScript file', async () => {
    const testFile = join(tempDir, 'simple.js');
    const testContent = `
import { utils } from './utils';
import lodash from 'lodash';

export function calculateSum(a, b) {
  return a + b;
}

export class Calculator {
  constructor() {
    this.result = 0;
  }
  
  add(value) {
    this.result += value;
    return this;
  }
  
  getTotal() {
    return this.result;
  }
}

const PI = 3.14159;
export default PI;
    `;

    await writeFile(testFile, testContent);

    const engine = new JsRefactorEngine({ verbose: false });
    const analysis = await engine.analyzeFile(testFile);

    assert.strictEqual(analysis.functions.length, 1);
    assert.strictEqual(analysis.classes.length, 1);
    assert.strictEqual(analysis.variables.length, 1);
    assert.strictEqual(analysis.imports.length, 2);
    assert.strictEqual(analysis.exports.length, 3);

    assert.strictEqual(analysis.functions[0].name, 'calculateSum');
    assert.strictEqual(analysis.classes[0].name, 'Calculator');
    assert.strictEqual(analysis.variables[0].name, 'PI');
  });

  await t.test('should split a file using hybrid strategy', async () => {
    const testFile = join(tempDir, 'split-test.js');
    const testContent = `
import { helper } from './helper';

export function processData(data) {
  return helper.format(data);
}

export class DataProcessor {
  constructor(config) {
    this.config = config;
  }
  
  process(input) {
    return processData(input);
  }
}

const DEFAULT_CONFIG = { timeout: 5000 };
export { DEFAULT_CONFIG };
    `;

    await writeFile(testFile, testContent);

    const outputDir = join(tempDir, 'output');
    const engine = new JsRefactorEngine({
      verbose: false,
      strategy: 'hybrid',
      outputDir,
      force: true,
    });

    const result = await engine.splitFile(testFile);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.filesCreated > 0, true);
    assert.strictEqual(result.outputDir, outputDir);
  });

  await t.test('should handle dry run mode', async () => {
    const testFile = join(tempDir, 'dryrun-test.js');
    const testContent = `
export function test() {
  return 'dry run';
}
    `;

    await writeFile(testFile, testContent);

    const engine = new JsRefactorEngine({
      verbose: false,
      dryRun: true,
    });

    const result = await engine.splitFile(testFile);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.filesCreated > 0, true);
  });

  await t.test('should handle file not found error', async () => {
    const engine = new JsRefactorEngine({ verbose: false });

    try {
      await engine.analyzeFile('/nonexistent/file.js');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert(error.message.includes('Analysis failed'));
    }
  });
});
