# SplitJS Architecture

## Overview

SplitJS is a sophisticated Bun.js-based tool that performs deep AST analysis to intelligently decompose monolithic JavaScript files into modular architectures. The tool uses `jscodeshift` for comprehensive code transformation and analysis.

## Core Components

### 1. ASTParser (`src/astParser.js`)
**Responsibility**: AST parsing and code analysis

**Key Features**:
- Parses JavaScript code using jscodeshift
- Detects all function patterns: declarations, expressions, arrows, async, generators
- Extracts global variables and imports/exports
- Provides utility methods for AST traversal

**Key Methods**:
- `parse(sourceCode)`: Parse and cache AST
- `findAllFunctions()`: Detect all functions in source
- `findGlobalVariables()`: Extract top-level variables
- `findImports()`: Extract import declarations
- `findExports()`: Extract export declarations
- `getSourceForNode(node)`: Generate source code from AST node

### 2. DependencyAnalyzer (`src/dependencyAnalyzer.js`)
**Responsibility**: Function dependency resolution and relationship mapping

**Key Features**:
- Analyzes function-to-function dependencies
- Detects external dependencies and built-in globals
- Builds complete dependency graphs
- Identifies circular dependency chains
- Distinguishes between internal and external references

**Key Methods**:
- `analyzeFunctionDependencies(node, name)`: Analyze single function
- `resolveDependencyGraph(functions)`: Build complete graph
- `detectCircularDependencies(graph)`: Find circular references

### 3. ScopeAnalyzer (`src/scopeAnalyzer.js`)
**Responsibility**: Variable scope and closure analysis

**Key Features**:
- Analyzes closure variables captured by functions
- Identifies free variables vs local variables
- Extracts shared variables used across functions
- Preserves lexical scope integrity
- Handles destructuring patterns

**Key Methods**:
- `analyzeClosures(functionNode)`: Identify captured variables
- `extractSharedVariables(functions)`: Find variables shared across functions
- `preserveLexicalScope(functionNode, deps)`: Extract scope information

### 4. ModuleGenerator (`src/moduleGenerator.js`)
**Responsibility**: Individual module file generation

**Key Features**:
- Generates properly formatted ES module files
- Creates correct import/export statements
- Handles all function types (regular, async, arrow, methods)
- Generates unique filenames from function names
- Includes closure variable imports

**Key Methods**:
- `generateModule(func, graph, imports)`: Generate single module
- `generateAllModules(functions, graph, imports)`: Generate all modules
- `_generateImports()`: Create import statements
- `_generateFunctionCode()`: Format function for export
- `_generateExports()`: Create export statements

### 5. Orchestrator (`src/orchestrator.js`)
**Responsibility**: Master orchestrator file and metadata generation

**Key Features**:
- Creates main entry point that coordinates all modules
- Generates dependency graph JSON
- Creates module manifests with metadata
- Supports lazy-loading mode for dynamic imports
- Exports all modules for convenient re-export

**Key Methods**:
- `generateOrchestratorFile(modules, functions)`: Create main file
- `generateDependencyGraph()`: Export dependency mapping
- `generateModuleManifest(modules)`: Create metadata
- `generateLazyLoadOrchestrator()`: Create dynamic loading version

### 6. Validator (`src/validator.js`)
**Responsibility**: Generated code validation

**Key Features**:
- Validates generated modules syntax
- Checks import/export correctness
- Runs biome formatter checks
- Attempts bun compilation
- Reports validation issues

**Key Methods**:
- `validateGenerated(filePath)`: Full file validation
- `validateModule(code, filename)`: Single module validation
- `validateDependencyGraph(graph)`: Verify graph correctness

### 7. FileWriter (`src/fileWriter.js`)
**Responsibility**: Output generation and file writing

**Key Features**:
- Writes module files to disk
- Creates output directory structure
- Generates manifests and dependency graphs
- Creates extraction reports
- Generates package.json for modules

**Key Methods**:
- `writeModules(modules)`: Write all module files
- `writeOrchestrator(code)`: Write main entry point
- `writeManifest(manifest)`: Write module metadata
- `writeDependencyGraph(graph)`: Write dependency map
- `writeExtractionReport(result)`: Write statistics report

### 8. FunctionExtractor (`src/extractor.js`)
**Responsibility**: Orchestration and coordination of extraction

**Key Features**:
- Coordinates all components
- Manages extraction pipeline
- Handles error management
- Provides unified extraction interface
- Configurable extraction options

**Key Methods**:
- `extract(sourceCode)`: Main extraction method
- `validate()`: Validate extraction results
- `getResult()`: Access extraction results

### 9. CLI Interface (`bin/cli.js`)
**Responsibility**: Command-line user interface

**Features**:
- User-friendly command interface
- File input validation
- Progress reporting with visual feedback
- Option parsing (output dir, lazy loading, validation)
- Detailed error messages
- Help and version information

## Data Flow

```
JavaScript Source Code
    ↓
ASTParser.parse()
    ↓
Find All Functions
    ↓
DependencyAnalyzer.resolveDependencyGraph()
    ↓ (for each function)
    ├─ ScopeAnalyzer.analyzeClosures()
    ├─ Dependency Resolution
    └─ Closure Detection
    ↓
ModuleGenerator.generateAllModules()
    ↓ (creates individual modules)
Orchestrator.generateOrchestratorFile()
    ↓
Validator.validateGenerated()
    ↓
FileWriter (writes all files)
    ↓
Output Directory with:
  - modules/
  - index.js
  - manifest.json
  - dependencies.json
  - report.json
  - package.json
```

## Key Design Patterns

### 1. Modular Architecture
Each component has a single responsibility and clear interfaces. Components are loosely coupled and can be used independently.

### 2. Dependency Injection
Components receive required dependencies through constructors, making them testable and flexible.

### 3. Map-based Graph Representation
Dependency graphs use Maps for efficient lookups and circular dependency detection.

### 4. AST-first Design
All code analysis and transformation goes through the AST, ensuring semantic correctness.

### 5. Configuration Options
FunctionExtractor accepts options to customize behavior (output directory, lazy loading, validation).

## Function Pattern Detection

SplitJS detects and handles:

1. **Function Declarations**
   ```javascript
   function myFunc() {}
   ```

2. **Function Expressions**
   ```javascript
   const myFunc = function() {}
   ```

3. **Arrow Functions**
   ```javascript
   const myFunc = () => {}
   ```

4. **Async Functions**
   ```javascript
   async function myFunc() {}
   ```

5. **Generator Functions**
   ```javascript
   function* myFunc() {}
   ```

6. **Object Methods**
   ```javascript
   const obj = { myFunc() {} }
   ```

7. **Class Methods**
   ```javascript
   class MyClass { myFunc() {} }
   ```

8. **Higher-Order Functions**
   ```javascript
   function wrapper(fn) { return fn() }
   ```

## Scope Handling

The tool properly handles:

- **Closure Variables**: Variables from outer scopes captured by functions
- **Parameter Shadowing**: Parameters that shadow outer scope variables
- **Destructuring**: Both object and array destructuring patterns
- **Rest Parameters**: Spread operator in function parameters
- **Shared Globals**: Constants and variables used across functions

## Circular Dependency Detection

The tool detects cycles using depth-first search (DFS) algorithm:

1. Maintains a recursion stack during DFS
2. Identifies back edges (edges to nodes in current recursion stack)
3. Reports complete cycle paths
4. Issues warnings without blocking extraction

## Module Manifest Structure

Each generated module manifest includes:

```json
{
  "version": "1.0.0",
  "generated": "2025-10-26T20:48:48.884Z",
  "modules": [
    {
      "filename": "add.js",
      "dependencies": { "internal": [], "external": [] },
      "closures": []
    }
  ],
  "dependencyGraph": {
    "add": { "internal": [], "external": [] }
  }
}
```

## Validation Strategy

Generated code is validated through:

1. **Syntax Validation**: Check JavaScript syntax validity
2. **Import/Export Validation**: Verify import/export correctness
3. **Biome Formatting**: Run biome formatter check
4. **Bun Compilation**: Attempt compilation with bun build
5. **Dependency Validation**: Verify all dependencies are resolved

## Error Handling

The tool provides:

- Clear error messages for parsing failures
- Warnings for circular dependencies
- Detailed validation reports
- Graceful degradation (continues despite warnings)
- Debug mode for detailed logging

## Performance Considerations

- **Single Pass AST Analysis**: Traverses AST once for all analysis
- **Caching**: Caches parsed AST and analysis results
- **Efficient Lookup**: Uses Maps for O(1) lookup of functions and variables
- **Lazy Module Generation**: Can generate lazy-loading orchestrator
- **Streaming Output**: Files written as they are generated

## Testing Coverage

The project includes 32 comprehensive tests covering:

- AST parsing of all function types
- Dependency resolution and circular detection
- Scope and closure analysis
- Module generation with various patterns
- Integration tests for full extraction workflow
- Extraction report generation
- Complex multi-function scenarios

## Extension Points

The architecture supports extensions through:

1. **Custom Validators**: Implement additional validation logic
2. **Custom Generators**: Override module generation behavior
3. **Custom Orchestrators**: Implement alternative coordination strategies
4. **Custom Output Writers**: Extend file writing capabilities
5. **Configuration Options**: Customize extraction behavior
