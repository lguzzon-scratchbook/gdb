import { dirname, extname, relative } from 'node:path';
import { generate } from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
const traverseFn = traverse.default;
import * as t from '@babel/types';

export class ImportRebaser {
  constructor() {
    this.moduleMap = new Map();
    this.importMap = new Map();
  }

  rebaseImports(splitPlan, originalFilePath) {
    this._buildModuleMap(splitPlan);
    this._buildImportMap(splitPlan);

    const rebasedModules = splitPlan.modules.map((module) => {
      const rebasedContent = this._rebaseModuleImports(module, originalFilePath);

      return {
        ...module,
        content: rebasedContent,
        imports: this._extractRebasedImports(rebasedContent),
        dependencies: this._calculateModuleDependencies(module),
      };
    });

    return rebasedModules;
  }

  _buildModuleMap(splitPlan) {
    this.moduleMap.clear();

    splitPlan.modules.forEach((module, index) => {
      this.moduleMap.set(module.name, {
        index,
        fileName: this._generateModuleFileName(module),
        exports: module.exports.map((exp) => exp.name || exp.local),
        imports: module.imports.map((imp) => imp.source),
      });
    });
  }

  _buildImportMap(splitPlan) {
    this.importMap.clear();

    splitPlan.functions.forEach((func) => {
      const targetModule = this._findTargetModule(func.name, 'function');
      if (targetModule) {
        this.importMap.set(func.name, targetModule);
      }
    });

    splitPlan.classes.forEach((cls) => {
      const targetModule = this._findTargetModule(cls.name, 'class');
      if (targetModule) {
        this.importMap.set(cls.name, targetModule);
      }
    });

    splitPlan.variables.forEach((variable) => {
      const targetModule = this._findTargetModule(variable.name, 'variable');
      if (targetModule) {
        this.importMap.set(variable.name, targetModule);
      }
    });
  }

  _findTargetModule(itemName, _itemType) {
    for (const [moduleName, moduleInfo] of this.moduleMap) {
      const hasExport = moduleInfo.exports.includes(itemName);
      if (hasExport) {
        return {
          moduleName,
          fileName: moduleInfo.fileName,
          exportName: itemName,
        };
      }
    }
    return null;
  }

  _rebaseModuleImports(module, originalFilePath) {
    try {
      const ast = parse(module.content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
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

      this._transformImports(ast, module, originalFilePath);
      this._transformExports(ast, module);

      const result = generate(ast, {
        retainLines: false,
        compact: false,
      });

      return result.code;
    } catch (error) {
      console.warn(`Failed to rebase imports for module ${module.name}:`, error.message);
      return module.content;
    }
  }

  _transformImports(ast, module, originalFilePath) {
    traverseFn(ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        const rebasedSource = this._rebaseImportSource(source, module, originalFilePath);

        if (rebasedSource !== source) {
          path.node.source.value = rebasedSource;
        }

        this._transformImportSpecifiers(path, module);
      },

      CallExpression: (path) => {
        if (path.node.callee.type === 'Import') {
          const sourceArg = path.node.arguments[0];
          if (t.isStringLiteral(sourceArg)) {
            const rebasedSource = this._rebaseImportSource(
              sourceArg.value,
              module,
              originalFilePath
            );
            if (rebasedSource !== sourceArg.value) {
              sourceArg.value = rebasedSource;
            }
          }
        }
      },
    });
  }

  _transformExports(ast, module) {
    traverseFn(ast, {
      ExportNamedDeclaration: (path) => {
        if (path.node.source) {
          const source = path.node.source.value;
          const rebasedSource = this._rebaseImportSource(source, module);

          if (rebasedSource !== source) {
            path.node.source.value = rebasedSource;
          }
        }
      },

      ExportAllDeclaration: (path) => {
        const source = path.node.source.value;
        const rebasedSource = this._rebaseImportSource(source, module);

        if (rebasedSource !== source) {
          path.node.source.value = rebasedSource;
        }
      },
    });
  }

  _transformImportSpecifiers(path, module) {
    const specifiers = path.node.specifiers;

    specifiers.forEach((spec) => {
      if (t.isImportSpecifier(spec)) {
        const importedName = spec.imported.name;
        const _localName = spec.local.name;

        const targetModule = this.importMap.get(importedName);
        if (targetModule && targetModule.moduleName !== module.name) {
          // This import needs to be updated to point to the new module
          const newSource = this._getRelativePath(module, targetModule);
          if (newSource) {
            path.node.source.value = newSource;
          }
        }
      }
    });
  }

  _rebaseImportSource(source, module, originalFilePath = null) {
    // Check if this is an internal dependency that needs rebasing
    if (this._isInternalDependency(source)) {
      const targetModule = this._findModuleBySource(source);
      if (targetModule && targetModule.moduleName !== module.name) {
        return this._getRelativePath(module, targetModule);
      }
    }

    // Handle relative path rebasing if original file path is provided
    if (originalFilePath && this._isRelativePath(source)) {
      return this._rebaseRelativePath(source, originalFilePath, module);
    }

    return source;
  }

  _isInternalDependency(source) {
    return source.startsWith('./') || source.startsWith('../') || source.startsWith('/');
  }

  _isRelativePath(source) {
    return source.startsWith('./') || source.startsWith('../');
  }

  _findModuleBySource(source) {
    for (const [moduleName, moduleInfo] of this.moduleMap) {
      if (moduleInfo.imports.includes(source)) {
        return {
          moduleName,
          fileName: moduleInfo.fileName,
          exports: moduleInfo.exports,
        };
      }
    }
    return null;
  }

  _getRelativePath(fromModule, toModule) {
    const _fromPath = `./${fromModule.name}`;
    const _toPath = `./${toModule.fileName}`;

    // Simple relative path calculation
    if (fromModule.name === toModule.moduleName) {
      return null; // Same module, no import needed
    }

    return `./${toModule.fileName}`;
  }

  _rebaseRelativePath(source, _originalFilePath, _module) {
    // This would calculate the new relative path based on the module's new location
    // For now, returning the original source as placeholder
    return source;
  }

  _generateModuleFileName(module) {
    const baseName = module.name.replace(/[^a-zA-Z0-9]/g, '-');
    return `${baseName}.js`;
  }

  _extractRebasedImports(content) {
    try {
      const ast = parse(content, { sourceType: 'module' });
      const imports = [];

      traverseFn(ast, {
        ImportDeclaration: (path) => {
          imports.push({
            source: path.node.source.value,
            specifiers: path.node.specifiers.map((spec) => ({
              local: spec.local.name,
              imported: t.isImportSpecifier(spec)
                ? spec.imported.name
                : t.isImportDefaultSpecifier(spec)
                  ? 'default'
                  : '*',
            })),
          });
        },
      });

      return imports;
    } catch (_error) {
      return [];
    }
  }

  _calculateModuleDependencies(module) {
    const dependencies = new Set();

    module.imports.forEach((imp) => {
      if (this._isInternalDependency(imp.source)) {
        dependencies.add(imp.source);
      }
    });

    return Array.from(dependencies);
  }

  createIndexModule(splitPlan) {
    const indexExports = [];

    splitPlan.modules.forEach((module) => {
      module.exports.forEach((exp) => {
        const exportName = exp.name || exp.local;
        const modulePath = `./${this._generateModuleFileName(module)}`;

        indexExports.push({
          type: 'named',
          name: exportName,
          from: modulePath,
        });
      });
    });

    const indexContent = this._generateIndexContent(indexExports);

    return {
      name: 'index',
      type: 'index',
      content: indexContent,
      fileName: 'index.js',
      imports: [],
      exports: indexExports,
      functions: [],
      classes: [],
      variables: [],
      size: indexContent.length,
    };
  }

  _generateIndexContent(exports) {
    const lines = [];

    // Group exports by source module
    const exportsBySource = new Map();

    exports.forEach((exp) => {
      if (!exportsBySource.has(exp.from)) {
        exportsBySource.set(exp.from, []);
      }
      exportsBySource.get(exp.from).push(exp);
    });

    // Generate import statements
    exportsBySource.forEach((moduleExports, source) => {
      const specifiers = moduleExports.map((exp) => {
        if (exp.type === 'default') {
          return exp.name;
        }
        if (exp.type === 'all') {
          return `* as ${exp.name}`;
        }
        return exp.name;
      });

      lines.push(`import { ${specifiers.join(', ')} } from '${source}';`);
    });

    lines.push(''); // Empty line

    // Generate export statements
    exportsBySource.forEach((moduleExports) => {
      moduleExports.forEach((exp) => {
        if (exp.type === 'default') {
          lines.push(`export default ${exp.name};`);
        } else if (exp.type === 'all') {
          lines.push(`export * from '${exp.from}';`);
        } else {
          lines.push(`export { ${exp.name} };`);
        }
      });
    });

    return lines.join('\n');
  }
}
