import traverse from '@babel/traverse';
const traverseFn = traverse.default;
import * as t from '@babel/types';

export class DependencyAnalyzer {
  constructor() {
    this.dependencies = new Map();
    this.internalDependencies = new Set();
    this.externalDependencies = new Set();
  }

  analyze(ast) {
    this.dependencies.clear();
    this.internalDependencies.clear();
    this.externalDependencies.clear();

    traverseFn(ast, {
      ImportDeclaration: (path) => {
        this._handleImportDeclaration(path);
      },

      CallExpression: (path) => {
        this._handleCallExpression(path);
      },

      MemberExpression: (path) => {
        this._handleMemberExpression(path);
      },

      Identifier: (path) => {
        this._handleIdentifier(path);
      },
    });

    return {
      internal: Array.from(this.internalDependencies),
      external: Array.from(this.externalDependencies),
      all: this._buildDependencyGraph(),
    };
  }

  _handleImportDeclaration(path) {
    const source = path.node.source.value;
    const specifiers = path.node.specifiers;

    if (this._isExternalDependency(source)) {
      this.externalDependencies.add(source);
    } else {
      this.internalDependencies.add(source);
    }

    specifiers.forEach((spec) => {
      const localName = spec.local.name;
      const importedName = this._getImportedName(spec);

      this.dependencies.set(localName, {
        source,
        imported: importedName,
        type: this._isExternalDependency(source) ? 'external' : 'internal',
        specifiers: specifiers.length,
      });
    });
  }

  _handleCallExpression(path) {
    const callee = path.node.callee;

    if (t.isIdentifier(callee)) {
      const dep = this.dependencies.get(callee.name);
      if (dep) {
        this._trackUsage(callee.name, 'function-call', null, path.node.loc);
      }
    } else if (t.isMemberExpression(callee)) {
      const object = callee.object;
      const property = callee.property;

      if (t.isIdentifier(object)) {
        const dep = this.dependencies.get(object.name);
        if (dep) {
          this._trackUsage(object.name, 'method-call', property.name, path.node.loc);
        }
      }
    }
  }

  _handleMemberExpression(path) {
    const object = path.node.object;
    const property = path.node.property;

    if (t.isIdentifier(object)) {
      const dep = this.dependencies.get(object.name);
      if (dep) {
        this._trackUsage(object.name, 'property-access', property.name, path.node.loc);
      }
    }
  }

  _handleIdentifier(path) {
    const name = path.node.name;
    const dep = this.dependencies.get(name);

    if (dep && !path.parentPath.isCallExpression({ callee: path.node })) {
      this._trackUsage(name, 'variable-reference', null, path.node.loc);
    }
  }

  _trackUsage(dependencyName, usageType, detail = null, location = null) {
    const dep = this.dependencies.get(dependencyName);
    if (dep) {
      if (!dep.usages) {
        dep.usages = [];
      }
      dep.usages.push({
        type: usageType,
        detail,
        loc: location,
      });
    }
  }

  _isExternalDependency(source) {
    return !source.startsWith('.') && !source.startsWith('/');
  }

  _getImportedName(spec) {
    if (t.isImportDefaultSpecifier(spec)) {
      return 'default';
    }
    if (t.isImportNamespaceSpecifier(spec)) {
      return '*';
    }
    if (t.isImportSpecifier(spec)) {
      return spec.imported.name;
    }
    return null;
  }

  _buildDependencyGraph() {
    const graph = {
      nodes: [],
      edges: [],
    };

    this.dependencies.forEach((dep, name) => {
      graph.nodes.push({
        id: name,
        source: dep.source,
        type: dep.type,
        imported: dep.imported,
        usages: dep.usages || [],
      });

      if (dep.usages) {
        dep.usages.forEach((usage) => {
          graph.edges.push({
            from: name,
            to: usage.detail || name,
            type: usage.type,
            usage: usage,
          });
        });
      }
    });

    return graph;
  }

  findCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, path) => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this._getDirectDependencies(node);
      dependencies.forEach((dep) => {
        dfs(dep, [...path, dep]);
      });

      recursionStack.delete(node);
    };

    this.dependencies.forEach((_, node) => {
      if (!visited.has(node)) {
        dfs(node, [node]);
      }
    });

    return cycles;
  }

  _getDirectDependencies(nodeName) {
    const dep = this.dependencies.get(nodeName);
    if (!dep || !dep.usages) {
      return [];
    }

    return dep.usages
      .filter((usage) => usage.type === 'property-access' || usage.type === 'method-call')
      .map((usage) => usage.detail)
      .filter((detail) => detail && this.dependencies.has(detail));
  }

  analyzeDependencyStrength() {
    const strength = new Map();

    this.dependencies.forEach((dep, name) => {
      let score = 0;

      if (dep.usages) {
        dep.usages.forEach((usage) => {
          switch (usage.type) {
            case 'function-call':
              score += 3;
              break;
            case 'method-call':
              score += 2;
              break;
            case 'property-access':
              score += 1;
              break;
            case 'variable-reference':
              score += 1;
              break;
          }
        });
      }

      strength.set(name, {
        score,
        level: this._getStrengthLevel(score),
        usages: dep.usages ? dep.usages.length : 0,
      });
    });

    return strength;
  }

  _getStrengthLevel(score) {
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }
}
