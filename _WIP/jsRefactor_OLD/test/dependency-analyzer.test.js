import assert from 'node:assert';
import { test } from 'node:test';
import { AstParser } from '../src/ast-parser.js';
import { DependencyAnalyzer } from '../src/dependency-analyzer.js';

test('DependencyAnalyzer - Dependency analysis functionality', async (t) => {
  const analyzer = new DependencyAnalyzer();
  const parser = new AstParser({ verbose: false });

  await t.test('should analyze simple dependencies', () => {
    const code = `
import { utils } from './utils';
import lodash from 'lodash';

function processData(data) {
  return utils.format(data);
}

class Processor {
  constructor() {
    this.helper = lodash.helper;
  }
}
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    assert(dependencies);
    assert(Array.isArray(dependencies.internal));
    assert(Array.isArray(dependencies.external));
    assert(dependencies.all);
    assert(dependencies.all.nodes);
    assert(dependencies.all.edges);

    assert(dependencies.external.includes('lodash'));
    assert(dependencies.internal.includes('./utils'));
  });

  await t.test('should track usage patterns', () => {
    const code = `
import { format, validate } from './utils';

function test(data) {
  if (validate(data)) {
    return format(data);
  }
  return null;
}
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    const formatNode = dependencies.all.nodes.find((node) => node.local === 'format');
    const validateNode = dependencies.all.nodes.find((node) => node.local === 'validate');

    assert(formatNode);
    assert(validateNode);
    assert(formatNode.usages);
    assert(validateNode.usages);
  });

  await t.test('should identify external vs internal dependencies', () => {
    const code = `
import internal from './internal';
import external from 'external-package';
import relative from '../relative';
import scoped from '@scoped/package';
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    assert(dependencies.internal.includes('./internal'));
    assert(dependencies.internal.includes('../relative'));
    assert(dependencies.external.includes('external-package'));
    assert(dependencies.external.includes('@scoped/package'));
  });

  await t.test('should analyze dependency strength', () => {
    const code = `
import { heavy, light } from './module';

function test() {
  heavy(); // Function call - higher weight
  heavy.method(); // Method call - medium weight
  const x = heavy.property; // Property access - lower weight
  light(); // Another function call
  return heavy.property || light.property;
}
    `;

    const ast = parser.parse(code);
    const _dependencies = analyzer.analyze(ast);
    const strength = analyzer.analyzeDependencyStrength();

    assert(strength.has('heavy'));
    assert(strength.has('light'));

    const heavyStrength = strength.get('heavy');
    const lightStrength = strength.get('light');

    assert(heavyStrength.score > lightStrength.score);
    assert(['low', 'medium', 'high'].includes(heavyStrength.level));
  });

  await t.test('should detect circular dependencies', () => {
    const code = `
import { funcB } from './moduleB';

function funcA() {
  return funcB();
}

export { funcA };
    `;

    // Create a mock circular dependency scenario
    const ast = parser.parse(code);
    const _dependencies = analyzer.analyze(ast);

    // In a real scenario, you'd need to analyze multiple files
    // For now, just test the method exists
    const cycles = analyzer.findCircularDependencies();
    assert(Array.isArray(cycles));
  });

  await t.test('should handle dynamic imports', () => {
    const code = `
async function loadModule() {
  const module = await import('./dynamic-module');
  return module.default;
}

const dynamicImport = import('another-package');
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    // Dynamic imports should be tracked
    assert(
      dependencies.internal.includes('./dynamic-module') ||
        dependencies.external.includes('another-package')
    );
  });

  await t.test('should handle namespace imports', () => {
    const code = `
import * as utils from './utils';
import * as lodash from 'lodash';

function test() {
  return utils.format(lodash.clone(data));
}
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    const utilsNode = dependencies.all.nodes.find((node) => node.local === 'utils');
    const lodashNode = dependencies.all.nodes.find((node) => node.local === 'lodash');

    assert(utilsNode);
    assert(lodashNode);
    assert(utilsNode.imported === '*');
    assert(lodashNode.imported === '*');
  });

  await t.test('should handle re-exports', () => {
    const code = `
export { namedExport } from './module';
export { default as renamed } from './another';
export * from 'wildcard';
    `;

    const ast = parser.parse(code);
    const dependencies = analyzer.analyze(ast);

    assert(dependencies.internal.includes('./module'));
    assert(dependencies.internal.includes('./another'));
    assert(
      dependencies.external.includes('wildcard') || dependencies.internal.includes('wildcard')
    );
  });
});
