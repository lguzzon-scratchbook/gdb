# JSRefactor Examples

This directory contains example files and usage patterns for the JSRefactor tool.

## Files

### `sample-large-file.js`
A comprehensive example JavaScript file that demonstrates various code patterns that JSRefactor can handle:

- **Utility functions**: `formatFileSize`, `validateEmail`, `generateId`, `deepMerge`, `debounce`
- **Classes**: `DataProcessor`, `FileManager`, `ApiClient`, `Validator`, `Logger`
- **Constants**: `DEFAULT_CONFIG`, `ERROR_CODES`
- **Imports**: External dependencies (`lodash`, `events`, `fs`, `path`)
- **Exports**: Named exports, default exports, and re-exports

### `bad-names.js`
An example file with intentionally poor naming to demonstrate LLM-powered renaming capabilities:

- **Poor function names**: `proc`, `validateInput`
- **Poor class names**: `DataManager`, `Calculator`
- **Poor variable names**: `d`, `f`, `res`, `v`, `inp`
- **Poor property names**: `t`, `r`, `s` in config object
- **Abbreviated names**: `str`, `json`, `obj`

## Usage Examples

### Basic Analysis
```bash
# Analyze the sample file
node bin/cli.js analyze examples/sample-large-file.js

# Get detailed analysis in JSON format
node bin/cli.js analyze examples/sample-large-file.js --json --verbose
```

### Split by Strategy
```bash
# Split using hybrid strategy (default)
node bin/cli.js split examples/sample-large-file.js -o ./output

# Split by functions
node bin/cli.js split examples/sample-large-file.js -o ./output -s functions

# Split by classes
node bin/cli.js split examples/sample-large-file.js -o ./output -s classes

# Split by features (dependency-based)
node bin/cli.js split examples/sample-large-file.js -o ./output -s features
```

### Advanced Options
```bash
# Dry run to see what would be split
node bin/cli.js split examples/sample-large-file.js --dry-run -v

# Custom max file size (100KB)
node bin/cli.js split examples/sample-large-file.js -o ./output -m 100

# Force overwrite existing output
node bin/cli.js split examples/sample-large-file.js -o ./output --force
```

### LLM-Powered Renaming
```bash
# Get AI renaming suggestions (requires OpenRouter API key)
export OPENROUTER_API_KEY=your-api-key-here
node bin/cli.js suggest examples/bad-names.js

# Get suggestions in JSON format
node bin/cli.js suggest examples/bad-names.js --json

# Apply AI renames with dry run
node bin/cli.js rename examples/bad-names.js --dry-run

# Apply AI renames and write to new file
node bin/cli.js rename examples/bad-names.js -o examples/improved-names.js

# Custom confidence threshold and model
node bin/cli.js suggest examples/bad-names.js -c 0.8 -m z-ai/glm-4.6:exacto

# Batch processing with custom settings
node bin/cli.js rename examples/bad-names.js -b 5 -c 0.75 -v
```

## Expected Output Structure

When you run the split command, JSRefactor will create a modular structure like:

```
output/
├── data-processor.js      # DataProcessor class and related utilities
├── file-manager.js        # FileManager class
├── api-client.js          # ApiClient class
├── validator.js           # Validator class
├── logger.js              # Logger class
├── utilities.js           # Utility functions
├── constants.js           # Configuration constants
├── index.js               # Main entry point with re-exports
├── package.json           # Generated package configuration
├── MODULE_MAP.json        # Module mapping metadata
└── SPLIT_SUMMARY.md       # Detailed split summary
```

## Testing the Tool

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Test with the example**:
   ```bash
   # First analyze the file
   npm start analyze examples/sample-large-file.js
   
   # Then split it
   npm start split examples/sample-large-file.js -o ./test-output --force
   ```

4. **Check the results**:
   ```bash
   ls -la ./test-output/
   cat ./test-output/SPLIT_SUMMARY.md
   ```

## Custom Examples

You can create your own test files to see how JSRefactor handles different scenarios:

### Simple Function File
```javascript
// simple-functions.js
export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export default { add, multiply };
```

### Class-Based File
```javascript
// class-example.js
import { EventEmitter } from 'events';

export class Service extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  
  start() {
    this.emit('start', this.name);
  }
  
  stop() {
    this.emit('stop', this.name);
  }
}

export class Manager {
  constructor() {
    this.services = new Map();
  }
  
  addService(service) {
    this.services.set(service.name, service);
  }
}
```

Try splitting these files with different strategies to see how JSRefactor adapts its approach!
