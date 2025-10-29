# SplitJS Usage Examples

## Basic Example

### Input: `math.js`
```javascript
function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function multiply(a, b) {
  return a * b
}
```

### Command
```bash
splitjs math.js --output ./modules
```

### Output Structure
```
modules/
├── modules/
│   ├── add.js
│   ├── subtract.js
│   └── multiply.js
├── index.js
├── manifest.json
├── dependencies.json
├── report.json
└── package.json
```

### Generated Files

**modules/add.js**
```javascript
export function add(a, b) {
  return a + b
}

export default add
```

**index.js**
```javascript
import add from './add'
import subtract from './subtract'
import multiply from './multiply'

export { add }
export { subtract }
export { multiply }

export const __manifest__ = {
  "version": "1.0.0",
  "generated": "2025-10-26T20:48:48.884Z",
  "modules": [
    { "filename": "add.js", "closures": [] },
    { "filename": "subtract.js", "closures": [] },
    { "filename": "multiply.js", "closures": [] }
  ],
  "dependencyGraph": { /* ... */ }
}
```

## Complex Example with Dependencies

### Input: `cache.js`
```javascript
const CACHE = new Map()

function createKey(id, type) {
  return `${type}:${id}`
}

function getCached(id, type) {
  const key = createKey(id, type)
  return CACHE.get(key)
}

function setCached(id, type, value) {
  const key = createKey(id, type)
  CACHE.set(key, value)
}

function invalidateCache() {
  CACHE.clear()
}
```

### Command
```bash
splitjs cache.js --output ./cache-modules
```

### Generated Dependency Graph
```json
{
  "createKey": {
    "internal": [],
    "external": []
  },
  "getCached": {
    "internal": ["createKey"],
    "external": []
  },
  "setCached": {
    "internal": ["createKey"],
    "external": []
  },
  "invalidateCache": {
    "internal": [],
    "external": []
  }
}
```

## Advanced: Async Functions and Higher-Order Functions

### Input: `handlers.js`
```javascript
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}

async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

async function loadUsers() {
  return withRetry(() => fetchData('/api/users'))
}
```

### Generated Report Statistics
- Total Functions: 3
- Async Functions: 2
- Functions with Dependencies: 1
- Circular Dependencies: 0

## CLI Options

```bash
# Basic usage
splitjs input.js

# Specify output directory
splitjs input.js --output ./extracted

# Generate lazy-loading orchestrator
splitjs input.js --lazy

# Skip validation
splitjs input.js --no-validate

# Show help
splitjs --help

# Show version
splitjs --version
```

## Programmatic API

```javascript
import FunctionExtractor from './src/extractor.js'
import FileWriter from './src/fileWriter.js'

const code = `
  function greet(name) { return 'Hello ' + name }
  function farewell(name) { return 'Goodbye ' + name }
`

const extractor = new FunctionExtractor({
  outputDir: 'extracted',
  includeLazyLoad: false,
  validate: true
})

const result = extractor.extract(code)

console.log(`Extracted ${result.functions.length} functions`)
console.log(`Generated ${result.modules.length} modules`)
console.log(`Warnings: ${result.warnings.length}`)

const fileWriter = new FileWriter('extracted')
fileWriter.ensureOutputDir()

const modules = Array.from(extractor.moduleGenerator.modules.values())
modules.forEach((mod) => {
  fileWriter.writeModules([mod])
})

fileWriter.writeOrchestrator(result.orchestrator.code)
fileWriter.writeManifest(result.manifest)
fileWriter.writeDependencyGraph(result.dependencies)
```

## Output Files Explained

### manifest.json
Contains metadata about extracted modules including:
- Version information
- Generation timestamp
- List of all modules with their filenames
- Closure variables captured by each function
- Complete dependency graph

### dependencies.json
Maps each extracted function to:
- Internal dependencies (other extracted functions)
- External dependencies (external modules/globals)

### report.json
Extraction summary including:
- Timestamp of extraction
- Total functions and modules generated
- List of all functions with signatures
- Module file sizes
- Any errors or warnings

### modules/
Directory containing individual module files:
- One file per extracted function
- Named based on the function name
- Contains default export of the function
- Includes any necessary imports

### index.js
Main orchestrator file that:
- Imports all extracted modules
- Re-exports them for convenient usage
- Includes __manifest__ for runtime inspection

### package.json
Package metadata for the extracted modules:
- Name: "extracted-modules"
- Type: "module" (ES modules)
- Main entry: index.js
