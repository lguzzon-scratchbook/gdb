import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
const traverseFn = traverse.default;
import * as t from '@babel/types';
import chalk from 'chalk';

export class AstParser {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      ...options,
    };
  }

  parse(code, filename = 'unknown') {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining',
        ],
      });

      if (this.options.verbose) {
        console.log(chalk.cyan(`✅ Successfully parsed ${filename}`));
      }

      return ast;
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  extractFunctions(ast) {
    const functions = [];
    const self = this;

    traverseFn(ast, {
      FunctionDeclaration(path) {
        const node = path.node;
        functions.push({
          name: node.id ? node.id.name : 'anonymous',
          type: 'function',
          params: node.params ? node.params.map((p) => self._getParameterName(p)) : [],
          async: node.async,
          generator: node.generator,
          loc: node.loc,
          body: path.get('body').node,
        });
      },

      FunctionExpression(path) {
        const node = path.node;
        const parent = path.parent;

        if (t.isVariableDeclarator(parent) && parent.id) {
          functions.push({
            name: parent.id.name,
            type: 'function-expression',
            params: node.params ? node.params.map((p) => self._getParameterName(p)) : [],
            async: node.async,
            generator: node.generator,
            loc: node.loc,
            body: path.get('body').node,
          });
        }
      },

      ArrowFunctionExpression(path) {
        const node = path.node;
        const parent = path.parent;

        if (t.isVariableDeclarator(parent) && parent.id) {
          functions.push({
            name: parent.id.name,
            type: 'arrow-function',
            params: node.params ? node.params.map((p) => self._getParameterName(p)) : [],
            async: node.async,
            loc: node.loc,
            body: path.get('body').node,
          });
        }
      },

      ClassMethod(path) {
        const node = path.node;
        functions.push({
          name: node.key.name,
          type: 'class-method',
          kind: node.kind,
          params: node.params ? node.params.map((p) => self._getParameterName(p)) : [],
          async: node.async,
          generator: node.generator,
          static: node.static,
          loc: node.loc,
          body: path.get('body').node,
        });
      },
    });

    return functions;
  }

  extractClasses(ast) {
    const classes = [];
    const self = this;

    traverseFn(ast, {
      ClassDeclaration(path) {
        const node = path.node;
        classes.push({
          name: node.id ? node.id.name : 'anonymous',
          type: 'class',
          superClass: node.superClass ? self._getClassName(node.superClass) : null,
          methods: self._extractClassMethods(node),
          properties: self._extractClassProperties(node),
          loc: node.loc,
          body: node.body,
        });
      },

      ClassExpression(path) {
        const node = path.node;
        const parent = path.parent;

        if (t.isVariableDeclarator(parent) && parent.id) {
          classes.push({
            name: parent.id.name,
            type: 'class-expression',
            superClass: node.superClass ? self._getClassName(node.superClass) : null,
            methods: self._extractClassMethods(node),
            properties: self._extractClassProperties(node),
            loc: node.loc,
            body: node.body,
          });
        }
      },
    });

    return classes;
  }

  extractVariables(ast) {
    const variables = [];

    traverseFn(ast, {
      VariableDeclarator(path) {
        const node = path.node;
        if (t.isIdentifier(node.id)) {
          variables.push({
            name: node.id.name,
            type: 'variable',
            kind: path.parent.kind,
            loc: node.loc,
            init: node.init,
          });
        }
      },
    });

    return variables;
  }

  extractImports(ast) {
    const imports = [];

    traverseFn(ast, {
      ImportDeclaration(path) {
        const node = path.node;
        imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map((spec) => ({
            name: t.isImportDefaultSpecifier(spec)
              ? 'default'
              : t.isImportNamespaceSpecifier(spec)
                ? '*'
                : spec.imported.name,
            local: spec.local.name,
            type: t.isImportDefaultSpecifier(spec)
              ? 'default'
              : t.isImportNamespaceSpecifier(spec)
                ? 'namespace'
                : 'named',
          })),
          loc: node.loc,
        });
      },
    });

    return imports;
  }

  extractExports(ast) {
    const exports = [];

    traverseFn(ast, {
      ExportNamedDeclaration(path) {
        const node = path.node;
        if (node.specifiers) {
          node.specifiers.forEach((spec) => {
            exports.push({
              name: spec.exported.name,
              local: spec.local.name,
              type: 'named',
              source: node.source ? node.source.value : null,
              loc: node.loc,
            });
          });
        }
      },

      ExportDefaultDeclaration(path) {
        const node = path.node;
        let name = 'default';

        if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
          name = node.declaration.id.name;
        } else if (t.isClassDeclaration(node.declaration) && node.declaration.id) {
          name = node.declaration.id.name;
        } else if (t.isIdentifier(node.declaration)) {
          name = node.declaration.name;
        }

        exports.push({
          name,
          type: 'default',
          loc: node.loc,
        });
      },

      ExportAllDeclaration(path) {
        const node = path.node;
        exports.push({
          source: node.source.value,
          type: 'all',
          exported: node.exported ? node.exported.name : null,
          loc: node.loc,
        });
      },
    });

    return exports;
  }

  calculateComplexity(ast) {
    let cognitiveComplexity = 0;
    let cyclomaticComplexity = 1;

    traverseFn(ast, {
      IfStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      ConditionalExpression() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      LogicalExpression(path) {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          cognitiveComplexity += 1;
        }
      },

      SwitchCase() {
        cyclomaticComplexity += 1;
      },

      ForStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      ForInStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      ForOfStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      WhileStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      DoWhileStatement() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },

      CatchClause() {
        cognitiveComplexity += 1;
        cyclomaticComplexity += 1;
      },
    });

    return {
      cognitive: cognitiveComplexity,
      cyclomatic: cyclomaticComplexity,
    };
  }

  _getParameterName(param) {
    if (t.isIdentifier(param)) {
      return param.name;
    }
    if (t.isRestElement(param)) {
      return `...${this._getParameterName(param.argument)}`;
    }
    if (t.isObjectPattern(param)) {
      return `{${param.properties.map((p) => p.key.name).join(', ')}}`;
    }
    if (t.isArrayPattern(param)) {
      return `[${param.elements.map((e) => (e ? this._getParameterName(e) : '')).join(', ')}]`;
    }
    return 'unknown';
  }

  _getClassName(node) {
    if (t.isIdentifier(node)) {
      return node.name;
    }
    if (t.isMemberExpression(node)) {
      return `${this._getClassName(node.object)}.${node.property.name}`;
    }
    return 'unknown';
  }

  _extractClassMethods(classNode) {
    return classNode.body.body
      .filter((member) => t.isClassMethod(member) || t.isMethodDefinition(member))
      .map((method) => ({
        name: method.key.name,
        kind: method.kind,
        static: method.static,
        params: method.value && method.value.params ? method.value.params.map((p) => this._getParameterName(p)) : [],
        async: method.value ? method.value.async : false,
        generator: method.value ? method.value.generator : false,
      }));
  }

  _extractClassProperties(classNode) {
    return classNode.body.body
      .filter((member) => t.isClassProperty(member))
      .map((prop) => ({
        name: prop.key.name,
        static: prop.static,
        typeAnnotation: prop.typeAnnotation ? prop.typeAnnotation.typeAnnotation : null,
      }));
  }
}
