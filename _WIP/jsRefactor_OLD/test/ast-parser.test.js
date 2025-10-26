import assert from 'node:assert';
import { test } from 'node:test';
import { AstParser } from '../src/ast-parser.js';

test('AstParser - JavaScript parsing functionality', async (t) => {
  const parser = new AstParser({ verbose: false });

  await t.test('should parse simple JavaScript code', () => {
    const code = `
function hello(name) {
  return \`Hello, \${name}!\`;
}

class Greeter {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return hello(this.name);
  }
}
    `;

    const ast = parser.parse(code);
    assert(ast);
    assert(ast.type === 'File');
  });

  await t.test('should extract functions correctly', () => {
    const code = `
function func1() {}
const func2 = function() {};
const func3 = () => {};
class Test {
  method() {}
  static staticMethod() {}
}
    `;

    const ast = parser.parse(code);
    const functions = parser.extractFunctions(ast);

    assert.strictEqual(functions.length, 5);

    const functionNames = functions.map((f) => f.name);
    assert(functionNames.includes('func1'));
    assert(functionNames.includes('func2'));
    assert(functionNames.includes('func3'));
    assert(functionNames.includes('method'));
    assert(functionNames.includes('staticMethod'));
  });

  await t.test('should extract classes correctly', () => {
    const code = `
class TestClass {
  constructor() {}
  method() {}
}

const TestExpr = class {
  constructor() {}
};
    `;

    const ast = parser.parse(code);
    const classes = parser.extractClasses(ast);

    assert.strictEqual(classes.length, 2);

    const classNames = classes.map((c) => c.name);
    assert(classNames.includes('TestClass'));
    assert(classNames.includes('TestExpr'));
  });

  await t.test('should extract variables correctly', () => {
    const code = `
const constVar = 'value';
let letVar = 'another';
var varVar = 'old style';
    `;

    const ast = parser.parse(code);
    const variables = parser.extractVariables(ast);

    assert.strictEqual(variables.length, 3);

    const variableNames = variables.map((v) => v.name);
    assert(variableNames.includes('constVar'));
    assert(variableNames.includes('letVar'));
    assert(variableNames.includes('varVar'));
  });

  await t.test('should extract imports correctly', () => {
    const code = `
import defaultExport from 'module';
import { named1, named2 } from 'module';
import * as namespace from 'module';
import defaultExport, { named } from 'module';
    `;

    const ast = parser.parse(code);
    const imports = parser.extractImports(ast);

    assert.strictEqual(imports.length, 4);

    imports.forEach((imp) => {
      assert(imp.source);
      assert(Array.isArray(imp.specifiers));
      assert(imp.specifiers.length > 0);
    });
  });

  await t.test('should extract exports correctly', () => {
    const code = `
export const namedExport = 'value';
export function functionExport() {}
export class ClassExport {}
export default defaultExport;
export { reExport } from './module';
export * from 'wildcard';
    `;

    const ast = parser.parse(code);
    const exports = parser.extractExports(ast);

    assert.strictEqual(exports.length, 6);

    const exportTypes = exports.map((exp) => exp.type);
    assert(exportTypes.includes('named'));
    assert(exportTypes.includes('default'));
    assert(exportTypes.includes('all'));
  });

  await t.test('should calculate complexity metrics', () => {
    const code = `
function complexFunction(x, y) {
  if (x > 0) {
    for (let i = 0; i < x; i++) {
      if (y > 0) {
        while (y > 0) {
          y--;
        }
      }
    }
  }
  
  return x || y ? x : y;
}
    `;

    const ast = parser.parse(code);
    const complexity = parser.calculateComplexity(ast);

    assert(complexity);
    assert(typeof complexity.cognitive === 'number');
    assert(typeof complexity.cyclomatic === 'number');
    assert(complexity.cyclomatic > 1);
  });

  await t.test('should handle TypeScript syntax', () => {
    const code = `
interface TestInterface {
  name: string;
}

class TestClass implements TestInterface {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
}
    `;

    const ast = parser.parse(code);
    assert(ast);
  });

  await t.test('should handle JSX syntax', () => {
    const code = `
function ReactComponent(props) {
  return <div className="test">{props.children}</div>;
}
    `;

    const ast = parser.parse(code);
    assert(ast);
  });
});
