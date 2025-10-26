# SplitJS - Advanced JavaScript Function Extractor

A sophisticated Bun.js CLI tool that intelligently decomposes monolithic JavaScript files into clean, modular architectures by extracting individual functions into separate, self-contained ES modules.

## Features

- **Comprehensive Function Detection**: Detects function declarations, expressions, arrow functions, async functions, generator functions, class methods, object methods, and IIFE patterns
- **Intelligent Dependency Resolution**: Analyzes cross-references and automatically builds dependency graphs
- **Scope Preservation**: Maintains lexical scope integrity and handles closure variables
- **Smart Import/Export Generation**: Creates proper ES module boundaries with circular dependency detection
- **Advanced AST Analysis**: Uses jscodeshift for deep semantic understanding of code
- **Validation Framework**: Validates output with Biome formatter and Bun compiler
- **Dependency Graphs**: Generates comprehensive manifests and dependency graphs
- **Flexible Extraction**: Supports lazy-loading orchestrator for efficient module loading

## Installation

```bash
bun install
```

## Usage

### Basic Extraction

```bash
bunx splitjs input.js
```

### With Custom Output Directory

```bash
bunx splitjs input.js --output ./modules
```

### With Lazy Loading

```bash
bunx splitjs input.js --lazy
```

### Skip Validation

```bash
bunx splitjs input.js --no-validate
```

## Output Structure

```
extracted/
├── modules/
│   ├── add.js
│   ├── subtract.js
│   └── multiply.js
├── index.js              # Main orchestrator
├── manifest.json         # Module metadata
├── dependencies.json     # Dependency graph
├── report.json          # Extraction report
└── package.json         # Module package metadata
```

## API Usage

```javascript
import FunctionExtractor from './src/extractor.js'
import FileWriter from './src/fileWriter.js'

const sourceCode = `
  function add(a, b) { return a + b }
  function subtract(a, b) { return a - b }
`

const extractor = new FunctionExtractor({
  outputDir: 'extracted',
  includeLazyLoad: false,
  validate: true
})

const result = extractor.extract(sourceCode)
console.log(`Extracted ${result.functions.length} functions`)

const fileWriter = new FileWriter('extracted')
fileWriter.writeModules(Array.from(extractor.moduleGenerator.modules.values()))
fileWriter.writeOrchestrator(result.orchestrator.code)
```

## Core Modules

### ASTParser
Parses JavaScript code using jscodeshift and provides AST utilities.

### DependencyAnalyzer
Analyzes function dependencies and builds dependency graphs.

### ScopeAnalyzer
Analyzes variable scope, closures, and shared variables.

### ModuleGenerator
Generates individual module files with proper imports/exports.

### Orchestrator
Creates master orchestrator file and dependency manifests.

### Validator
Validates generated code with Biome and Bun compiler.

### FileWriter
Writes generated modules and metadata to disk.

## Testing

```bash
bun test tests/**/*.test.js
```

## Linting

```bash
bun run lint
```

## Examples

### Simple Functions

Input:
```javascript
function add(a, b) { return a + b }
function multiply(a, b) { return a * b }
```

Output: Two separate module files with proper ES module exports.

### Dependent Functions

Input:
```javascript
function helper() { return 42 }
function main() { return helper() }
```

Output: main.js imports helper from helper.js automatically.

### With Shared Variables

Input:
```javascript
const CACHE = new Map()
function get(key) { return CACHE.get(key) }
function set(key, val) { CACHE.set(key, val) }
```

Output: Both modules properly reference the CACHE variable.

## Advanced Features

### Circular Dependency Detection
Automatically detects and reports circular dependencies between extracted functions.

### Async/Generator Functions
Preserves async and generator function patterns during extraction.

### Lazy Loading
Optional lazy-loading orchestrator that dynamically imports modules on first use.

### Custom Naming
Context-aware file naming using function names and patterns.

### Metadata Generation
Comprehensive extraction reports with statistics and dependency information.

## Validation

Generated modules are validated to ensure:
- Compliance with Biome formatter standards
- Successful Bun compilation
- Semantic equivalence with source

## Contributing

Contributions are welcome. Please ensure all tests pass and code follows Biome formatting standards.

## License

MIT
