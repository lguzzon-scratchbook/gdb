import { generate } from '@babel/generator';
import traverse from '@babel/traverse';
const traverseFn = traverse.default;
import * as t from '@babel/types';

export class FileSplitter {
  constructor(options = {}) {
    this.options = {
      strategy: options.strategy || 'hybrid',
      maxFileSize: options.maxFileSize || 50 * 1024,
      ...options,
    };
  }

  createSplitPlan(data) {
    const { functions, classes, variables, imports, exports, dependencies } = data;

    let modules = [];

    switch (this.options.strategy) {
      case 'functions':
        modules = this._splitByFunctions(functions, classes, variables, imports, exports);
        break;
      case 'classes':
        modules = this._splitByClasses(classes, functions, variables, imports, exports);
        break;
      case 'features':
        modules = this._splitByFeatures(
          functions,
          classes,
          variables,
          imports,
          exports,
          dependencies
        );
        break;
      default:
        modules = this._splitHybrid(functions, classes, variables, imports, exports, dependencies);
        break;
    }

    return {
      modules,
      functions,
      classes,
      variables,
      imports,
      exports,
      dependencies,
    };
  }

  _splitByFunctions(functions, classes, variables, imports, exports) {
    const modules = [];

    functions.forEach((func) => {
      const moduleImports = this._findRelatedImports(func, imports);
      const moduleVariables = this._findRelatedVariables(func, variables);
      const moduleExports = this._findRelatedExports(func, exports);

      const module = {
        name: this._sanitizeFileName(func.name),
        type: 'function',
        content: this._generateModuleCode({
          imports: moduleImports,
          variables: moduleVariables,
          functions: [func],
          classes: [],
          exports: moduleExports,
        }),
        imports: moduleImports,
        exports: moduleExports,
        functions: [func],
        classes: [],
        variables: moduleVariables,
        size: 0,
      };

      module.size = module.content.length;
      modules.push(module);
    });

    if (classes.length > 0 || variables.length > 0) {
      const remainingModule = {
        name: 'misc',
        type: 'misc',
        content: this._generateModuleCode({
          imports: imports.filter((imp) => !modules.some((m) => m.imports.includes(imp))),
          variables: variables.filter((v) => !modules.some((m) => m.variables.includes(v))),
          functions: [],
          classes: classes,
          exports: exports.filter((exp) => !modules.some((m) => m.exports.includes(exp))),
        }),
        imports: imports,
        exports: exports,
        functions: [],
        classes: classes,
        variables: variables,
        size: 0,
      };

      remainingModule.size = remainingModule.content.length;
      modules.push(remainingModule);
    }

    return this._balanceModules(modules);
  }

  _splitByClasses(classes, functions, variables, imports, exports) {
    const modules = [];

    classes.forEach((cls) => {
      const moduleImports = this._findRelatedImports(cls, imports);
      const moduleVariables = this._findRelatedVariables(cls, variables);
      const moduleExports = this._findRelatedExports(cls, exports);
      const relatedFunctions = this._findRelatedFunctions(cls, functions);

      const module = {
        name: this._sanitizeFileName(cls.name),
        type: 'class',
        content: this._generateModuleCode({
          imports: moduleImports,
          variables: moduleVariables,
          functions: relatedFunctions,
          classes: [cls],
          exports: moduleExports,
        }),
        imports: moduleImports,
        exports: moduleExports,
        functions: relatedFunctions,
        classes: [cls],
        variables: moduleVariables,
        size: 0,
      };

      module.size = module.content.length;
      modules.push(module);
    });

    const remainingFunctions = functions.filter(
      (f) => !modules.some((m) => m.functions.includes(f))
    );
    const remainingVariables = variables.filter(
      (v) => !modules.some((m) => m.variables.includes(v))
    );

    if (remainingFunctions.length > 0 || remainingVariables.length > 0) {
      const remainingModule = {
        name: 'functions',
        type: 'functions',
        content: this._generateModuleCode({
          imports: imports.filter((imp) => !modules.some((m) => m.imports.includes(imp))),
          variables: remainingVariables,
          functions: remainingFunctions,
          classes: [],
          exports: exports.filter((exp) => !modules.some((m) => m.exports.includes(exp))),
        }),
        imports: imports,
        exports: exports,
        functions: remainingFunctions,
        classes: [],
        variables: remainingVariables,
        size: 0,
      };

      remainingModule.size = remainingModule.content.length;
      modules.push(remainingModule);
    }

    return this._balanceModules(modules);
  }

  _splitByFeatures(functions, classes, variables, imports, exports, dependencies) {
    const features = this._identifyFeatures(functions, classes, dependencies);
    const modules = [];

    features.forEach((feature) => {
      const featureFunctions = functions.filter((f) => feature.functions.includes(f.name));
      const featureClasses = classes.filter((c) => feature.classes.includes(c.name));
      const featureVariables = variables.filter((v) => feature.variables.includes(v.name));
      const featureImports = this._findFeatureImports(feature, imports);
      const featureExports = this._findFeatureExports(feature, exports);

      const module = {
        name: this._sanitizeFileName(feature.name),
        type: 'feature',
        content: this._generateModuleCode({
          imports: featureImports,
          variables: featureVariables,
          functions: featureFunctions,
          classes: featureClasses,
          exports: featureExports,
        }),
        imports: featureImports,
        exports: featureExports,
        functions: featureFunctions,
        classes: featureClasses,
        variables: featureVariables,
        size: 0,
      };

      module.size = module.content.length;
      modules.push(module);
    });

    return this._balanceModules(modules);
  }

  _splitHybrid(functions, classes, variables, imports, exports, _dependencies) {
    const modules = [];

    if (classes.length > 0) {
      const classModules = this._splitByClasses(classes, functions, variables, imports, exports);
      modules.push(...classModules);
    } else if (functions.length > 0) {
      const functionModules = this._splitByFunctions(
        functions,
        classes,
        variables,
        imports,
        exports
      );
      modules.push(...functionModules);
    }

    return this._balanceModules(modules);
  }

  _identifyFeatures(functions, classes, dependencies) {
    const features = [];
    const dependencyGraph = dependencies.all;

    const functionGroups = this._groupFunctionsByDependencies(functions, dependencyGraph);
    const classGroups = this._groupClassesByDependencies(classes, dependencyGraph);

    functionGroups.forEach((group, index) => {
      features.push({
        name: `feature-${index + 1}`,
        functions: group.map((f) => f.name),
        classes: [],
        variables: [],
      });
    });

    classGroups.forEach((group, _index) => {
      const existingFeature = features.find((f) =>
        group.some((cls) => f.functions.includes(cls.name))
      );

      if (existingFeature) {
        existingFeature.classes.push(...group.map((c) => c.name));
      } else {
        features.push({
          name: `feature-${features.length + 1}`,
          functions: [],
          classes: group.map((c) => c.name),
          variables: [],
        });
      }
    });

    return features.length > 0
      ? features
      : [
          {
            name: 'main',
            functions: functions.map((f) => f.name),
            classes: classes.map((c) => c.name),
            variables: [],
          },
        ];
  }

  _groupFunctionsByDependencies(functions, dependencyGraph) {
    const groups = [];
    const processed = new Set();

    functions.forEach((func) => {
      if (processed.has(func.name)) return;

      const group = [func];
      processed.add(func.name);

      const relatedDeps = dependencyGraph.edges
        .filter((edge) => edge.from === func.name || edge.to === func.name)
        .map((edge) => (edge.from === func.name ? edge.to : edge.from));

      relatedDeps.forEach((depName) => {
        const relatedFunc = functions.find((f) => f.name === depName);
        if (relatedFunc && !processed.has(depName)) {
          group.push(relatedFunc);
          processed.add(depName);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  _groupClassesByDependencies(classes, dependencyGraph) {
    const groups = [];
    const processed = new Set();

    classes.forEach((cls) => {
      if (processed.has(cls.name)) return;

      const group = [cls];
      processed.add(cls.name);

      const relatedDeps = dependencyGraph.edges
        .filter((edge) => edge.from === cls.name || edge.to === cls.name)
        .map((edge) => (edge.from === cls.name ? edge.to : edge.from));

      relatedDeps.forEach((depName) => {
        const relatedClass = classes.find((c) => c.name === depName);
        if (relatedClass && !processed.has(depName)) {
          group.push(relatedClass);
          processed.add(depName);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  _balanceModules(modules) {
    const balanced = [];
    let currentModule = null;

    modules.forEach((module) => {
      if (!currentModule) {
        currentModule = { ...module, content: module.content, size: module.size };
      } else if (currentModule.size + module.size > this.options.maxFileSize) {
        balanced.push(currentModule);
        currentModule = { ...module, content: module.content, size: module.size };
      } else {
        currentModule.content += `\n\n${module.content}`;
        currentModule.size += module.size + 2;
        currentModule.functions.push(...module.functions);
        currentModule.classes.push(...module.classes);
        currentModule.variables.push(...module.variables);
        currentModule.imports.push(...module.imports);
        currentModule.exports.push(...module.exports);
      }
    });

    if (currentModule) {
      balanced.push(currentModule);
    }

    return balanced;
  }

  _generateModuleCode({ imports, variables, functions, classes, exports }) {
    const parts = [];

    if (imports.length > 0) {
      parts.push(...imports.map((imp) => this._generateImportCode(imp)));
    }

    if (variables.length > 0) {
      parts.push(...variables.map((v) => this._generateVariableCode(v)));
    }

    if (functions.length > 0) {
      parts.push(...functions.map((f) => this._generateFunctionCode(f)));
    }

    if (classes.length > 0) {
      parts.push(...classes.map((c) => this._generateClassCode(c)));
    }

    if (exports.length > 0) {
      parts.push(...exports.map((exp) => this._generateExportCode(exp)));
    }

    return parts.join('\n\n');
  }

  _generateImportCode(importDecl) {
    try {
      return generate(importDecl).code;
    } catch (error) {
      console.warn('Failed to generate import code:', error.message);
      return '// Import generation failed';
    }
  }

  _generateVariableCode(variable) {
    try {
      return generate(variable).code;
    } catch (error) {
      console.warn('Failed to generate variable code:', error.message);
      return '// Variable generation failed';
    }
  }

  _generateFunctionCode(func) {
    try {
      return generate(func).code;
    } catch (error) {
      console.warn('Failed to generate function code:', error.message);
      return '// Function generation failed';
    }
  }

  _generateClassCode(cls) {
    try {
      return generate(cls).code;
    } catch (error) {
      console.warn('Failed to generate class code:', error.message);
      return '// Class generation failed';
    }
  }

  _generateExportCode(exportDecl) {
    try {
      return generate(exportDecl).code;
    } catch (error) {
      console.warn('Failed to generate export code:', error.message);
      return '// Export generation failed';
    }
  }

  _sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  _findRelatedImports(item, imports) {
    return imports.filter((imp) => {
      return (
        item.loc &&
        imp.loc &&
        item.loc.start.line >= imp.loc.start.line &&
        item.loc.end.line <= imp.loc.end.line
      );
    });
  }

  _findRelatedVariables(item, variables) {
    return variables.filter((v) => {
      return (
        item.loc &&
        v.loc &&
        item.loc.start.line >= v.loc.start.line &&
        item.loc.end.line <= v.loc.end.line
      );
    });
  }

  _findRelatedExports(item, exports) {
    return exports.filter((exp) => {
      return (
        item.loc &&
        exp.loc &&
        item.loc.start.line >= exp.loc.start.line &&
        item.loc.end.line <= exp.loc.end.line
      );
    });
  }

  _findRelatedFunctions(item, functions) {
    return functions.filter((f) => {
      return (
        item.loc &&
        f.loc &&
        item.loc.start.line >= f.loc.start.line &&
        item.loc.end.line <= f.loc.end.line
      );
    });
  }

  _findFeatureImports(feature, imports) {
    return imports.filter((imp) => {
      return (
        feature.variables.some((v) => imp.specifiers.some((s) => s.local.name === v.name)) ||
        feature.functions.some((f) => imp.specifiers.some((s) => s.local.name === f.name)) ||
        feature.classes.some((c) => imp.specifiers.some((s) => s.local.name === c.name))
      );
    });
  }

  _findFeatureExports(feature, exports) {
    return exports.filter((exp) => {
      return (
        feature.variables.some((v) => exp.local === v.name) ||
        feature.functions.some((f) => exp.local === f.name) ||
        feature.classes.some((c) => exp.local === c.name)
      );
    });
  }

  _extractFunctions(ast) {
    const functions = [];

    traverseFn(ast, {
      FunctionDeclaration: (path) => {
        functions.push(path.node);
      },
      FunctionExpression: (path) => {
        const parent = path.parent;
        if (t.isVariableDeclarator(parent) && parent.id) {
          functions.push(path.node);
        }
      },
      ArrowFunctionExpression: (path) => {
        const parent = path.parent;
        if (t.isVariableDeclarator(parent) && parent.id) {
          functions.push(path.node);
        }
      },
      MethodDefinition: (path) => {
        functions.push(path.node);
      },
      ClassMethod: (path) => {
        functions.push(path.node);
      },
    });

    return functions;
  }

  _extractClasses(ast) {
    const classes = [];

    traverseFn(ast, {
      ClassDeclaration: (path) => {
        classes.push(path.node);
      },
      ClassExpression: (path) => {
        const parent = path.parent;
        if (t.isVariableDeclarator(parent) && parent.id) {
          classes.push(path.node);
        }
      },
    });

    return classes;
  }

  _extractVariables(ast) {
    const variables = [];

    traverseFn(ast, {
      VariableDeclarator: (path) => {
        const node = path.node;
        if (t.isIdentifier(node.id)) {
          variables.push(path.parent);
        }
      },
    });

    return variables;
  }

  _extractImports(ast) {
    const imports = [];

    traverseFn(ast, {
      ImportDeclaration: (path) => {
        imports.push(path.node);
      },
    });

    return imports;
  }

  _extractExports(ast) {
    const exports = [];

    traverseFn(ast, {
      ExportNamedDeclaration: (path) => {
        exports.push(path.node);
      },
      ExportDefaultDeclaration: (path) => {
        exports.push(path.node);
      },
      ExportAllDeclaration: (path) => {
        exports.push(path.node);
      },
    });

    return exports;
  }
}
