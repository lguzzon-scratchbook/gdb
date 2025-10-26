import { generate } from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { LLMApiClient } from './llm/api.js';

const traverseFn = traverse.default;

export class RenamingEngine {
  constructor(llmClient, options = {}) {
    this.llmClient = llmClient;
    this.options = {
      enableLLM: true,
      confidenceThreshold: 0.7,
      maxBatchSize: 10,
      ...options
    };
    this.renameMap = new Map();
  }

  async analyzeFile(ast, filePath) {
    const functions = this._extractFunctions(ast);
    const classes = this._extractClasses(ast);
    const variables = this._extractVariables(ast);
    
    const renameCandidates = [
      ...functions.map(f => ({ ...f, type: 'function' })),
      ...classes.map(c => ({ ...c, type: 'class' })),
      ...variables.map(v => ({ ...v, type: 'variable' }))
    ];

    const contexts = renameCandidates.map(candidate => 
      this._buildContext(candidate, ast, filePath)
    );

    return contexts;
  }

  async suggestRenames(contexts) {
    if (!this.options.enableLLM) {
      return contexts.map(ctx => ({
        ...ctx,
        suggestedName: ctx.name,
        confidence: 1.0,
        reasoning: 'LLM disabled'
      }));
    }

    const results = [];
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < contexts.length; i += this.options.maxBatchSize) {
      const batch = contexts.slice(i, i + this.options.maxBatchSize);
      const batchResults = await this.llmClient.batchRenameRequests(batch);
      results.push(...batchResults);
    }

    return results.filter(result => 
      result.success && 
      result.confidence >= this.options.confidenceThreshold
    );
  }

  async applyRenames(ast, renameSuggestions) {
    const renameMap = new Map();
    
    // Build rename map from suggestions
    renameSuggestions.forEach(suggestion => {
      if (suggestion.suggestedName && suggestion.suggestedName !== suggestion.originalName) {
        renameMap.set(suggestion.originalName, suggestion.suggestedName);
      }
    });

    // Apply renames to AST
    const renamedAst = this._renameInAST(ast, renameMap);
    
    return {
      ast: renamedAst,
      renameMap: Object.fromEntries(renameMap),
      appliedRenames: renameSuggestions.filter(s => 
        renameMap.has(s.originalName)
      )
    };
  }

  _buildContext(candidate, ast, filePath) {
    const context = {
      currentName: candidate.name,
      nameType: candidate.type,
      filePath
    };

    // Extract function body if available
    if (candidate.body) {
      context.functionBody = generate(candidate.body).code;
    }

    // Extract class body if available
    if (candidate.body && candidate.type === 'class') {
      context.classBody = generate(candidate.body).code;
    }

    // Get surrounding code context
    if (candidate.loc) {
      context.surroundingCode = this._getSurroundingCode(ast, candidate.loc);
    }

    // Extract variables used in the scope
    context.variables = this._extractScopeVariables(candidate, ast);

    // Extract dependencies
    context.dependencies = this._extractDependencies(candidate, ast);

    // Analyze usage pattern
    context.usagePattern = this._analyzeUsagePattern(candidate, ast);

    return context;
  }

  _extractFunctions(ast) {
    const functions = [];
    const self = this;

    traverseFn(ast, {
      FunctionDeclaration(path) {
        const node = path.node;
        if (node.id) {
          functions.push({
            name: node.id.name,
            type: 'function',
            params: node.params ? node.params.map(p => self._getParameterName(p)) : [],
            async: node.async,
            generator: node.generator,
            loc: node.loc,
            body: node.body
          });
        }
      },

      FunctionExpression(path) {
        const node = path.node;
        const parent = path.parent;
        
        if (t.isVariableDeclarator(parent) && parent.id) {
          functions.push({
            name: parent.id.name,
            type: 'function-expression',
            params: node.params ? node.params.map(p => self._getParameterName(p)) : [],
            async: node.async,
            generator: node.generator,
            loc: node.loc,
            body: node.body
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
            params: node.params ? node.params.map(p => self._getParameterName(p)) : [],
            async: node.async,
            loc: node.loc,
            body: node.body
          });
        }
      },

      ClassMethod(path) {
        const node = path.node;
        functions.push({
          name: node.key.name,
          type: 'class-method',
          kind: node.kind,
          params: node.params ? node.params.map(p => self._getParameterName(p)) : [],
          async: node.async,
          generator: node.generator,
          static: node.static,
          loc: node.loc,
          body: node.body
        });
      }
    });

    return functions;
  }

  _extractClasses(ast) {
    const classes = [];
    const self = this;

    traverseFn(ast, {
      ClassDeclaration(path) {
        const node = path.node;
        classes.push({
          name: node.id ? node.id.name : 'anonymous',
          type: 'class',
          superClass: node.superClass ? self._getClassName(node.superClass) : null,
          loc: node.loc,
          body: node.body
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
            loc: node.loc,
            body: node.body
          });
        }
      }
    });

    return classes;
  }

  _extractVariables(ast) {
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
            init: node.init
          });
        }
      }
    });

    return variables;
  }

  _renameInAST(ast, renameMap) {
    // Create a visitor to rename identifiers
    const visitor = {
      Identifier(path) {
        const name = path.node.name;
        if (renameMap.has(name)) {
          // Check if this identifier is the one being declared (not just used)
          if (!path.isBindingIdentifier() && !path.isDeclaration()) {
            path.node.name = renameMap.get(name);
          }
        }
      },

      // Handle function declarations
      FunctionDeclaration(path) {
        if (path.node.id && renameMap.has(path.node.id.name)) {
          path.node.id.name = renameMap.get(path.node.id.name);
        }
      },

      // Handle class declarations
      ClassDeclaration(path) {
        if (path.node.id && renameMap.has(path.node.id.name)) {
          path.node.id.name = renameMap.get(path.node.id.name);
        }
      },

      // Handle variable declarators
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id) && renameMap.has(path.node.id.name)) {
          path.node.id.name = renameMap.get(path.node.id.name);
        }
      },

      // Handle object property keys
      ObjectProperty(path) {
        if (t.isIdentifier(path.node.key) && renameMap.has(path.node.key.name)) {
          path.node.key.name = renameMap.get(path.node.key.name);
        }
      },

      // Handle class method keys
      ClassMethod(path) {
        if (t.isIdentifier(path.node.key) && renameMap.has(path.node.key.name)) {
          path.node.key.name = renameMap.get(path.node.key.name);
        }
      }
    };

    // Apply the visitor
    traverseFn(ast, visitor);
    
    return ast;
  }

  _getSurroundingCode(ast, loc) {
    // Extract a few lines before and after the target location
    const lines = ast.program.body.map(node => generate(node).code);
    const targetLine = loc.start.line;
    const start = Math.max(0, targetLine - 3);
    const end = Math.min(lines.length, targetLine + 3);
    
    return lines.slice(start, end).join('\n');
  }

  _extractScopeVariables(candidate, ast) {
    // Extract variables in the same scope
    const variables = new Set();
    
    traverseFn(ast, {
      VariableDeclarator(path) {
        if (path.node.loc && 
            path.node.loc.start.line === candidate.loc.start.line) {
          if (t.isIdentifier(path.node.id)) {
            variables.add(path.node.id.name);
          }
        }
      }
    });

    return Array.from(variables);
  }

  _extractDependencies(candidate, ast) {
    // Extract function calls and imports used by the candidate
    const dependencies = new Set();
    
    if (candidate.body) {
      traverseFn(candidate.body, {
        CallExpression(path) {
          if (t.isIdentifier(path.node.callee)) {
            dependencies.add(path.node.callee.name);
          }
        },
        
        Identifier(path) {
          // Track variable references
          if (!path.isDeclaration() && !path.isBindingIdentifier()) {
            dependencies.add(path.node.name);
          }
        }
      });
    }

    return Array.from(dependencies);
  }

  _analyzeUsagePattern(candidate, ast) {
    // Analyze how the candidate is used
    const usages = [];
    
    traverseFn(ast, {
      Identifier(path) {
        if (path.node.name === candidate.name && 
            path.node.loc !== candidate.loc) {
          usages.push({
            type: this._getUsageType(path),
            line: path.node.loc.start.line
          });
        }
      }
    });

    if (usages.length === 0) {
      return 'unused';
    } else if (usages.every(u => u.type === 'call')) {
      return 'function-calls';
    } else if (usages.every(u => u.type === 'property')) {
      return 'property-access';
    } else {
      return 'mixed-usage';
    }
  }

  _getUsageType(path) {
    if (path.parentPath.isCallExpression({ callee: path.node })) {
      return 'call';
    } else if (path.parentPath.isMemberExpression({ object: path.node })) {
      return 'property';
    } else if (path.parentPath.isAssignmentExpression({ right: path.node })) {
      return 'assignment';
    } else {
      return 'reference';
    }
  }

  _getParameterName(param) {
    if (t.isIdentifier(param)) {
      return param.name;
    } else if (t.isRestElement(param)) {
      return `...${this._getParameterName(param.argument)}`;
    } else if (t.isObjectPattern(param)) {
      return `{${param.properties.map(p => p.key.name).join(', ')}}`;
    } else if (t.isArrayPattern(param)) {
      return `[${param.elements.map(e => e ? this._getParameterName(e) : '').join(', ')}]`;
    }
    return 'unknown';
  }

  _getClassName(node) {
    if (t.isIdentifier(node)) {
      return node.name;
    } else if (t.isMemberExpression(node)) {
      return `${this._getClassName(node.object)}.${node.property.name}`;
    }
    return 'unknown';
  }
}
