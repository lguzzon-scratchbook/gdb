# JavaScript Variable Analyzer with Intelligent Renaming

A powerful Bun.js script that analyzes JavaScript variable declarations and references using jscodeshift, with advanced AI-powered intelligent variable renaming capabilities via OpenRoute.ai's LLM API.

## Features

### Core Analysis

- **Variable Declaration Detection**: Identifies `var`, `let`, `const`, `function`, and `class` declarations
- **Reference Tracking**: Maps all variable usages with precise line/column positions
- **Context Extraction**: Provides rich context around declarations and references
- **Usage Pattern Analysis**: Analyzes how variables are used (function calls, property access, assignments, etc.)
- **Type Inference**: Intelligently infers variable types from usage patterns
- **Scope Detection**: Determines variable scope levels (global, function, block)
- **Behavioral Analysis**: Identifies patterns like modification, read-only status, iterator behavior, etc.

### Intelligent Variable Renaming

- **AI-Powered Suggestions**: Leverages OpenRoute.ai's LLM API for semantic naming
- **Context-Aware Analysis**: Sends complete contextual usage patterns to the LLM
- **Multiple Naming Strategies**:
  - `descriptive`: Clear, explanatory names
  - `concise`: Short but meaningful names
  - `domain-specific`: Industry-standard terminology
- **Semantic Preservation**: Validates renames through AST comparison
- **Rollback Mechanisms**: Automatic rollback for failed renames
- **Batch Processing**: Process multiple variables efficiently
- **Configurable Parameters**: Customizable LLM settings

## Installation

```bash
cd _WIP/jsVariableAnalyzer
bun install
```

## Usage

### Basic Analysis

```bash
bun jsVariableAnalyzer.js file1.js [file2.js] ...
```

### Intelligent Variable Renaming

```bash
# Set your OpenRoute.ai API key
export OPENROUTE_API_KEY="your-api-key-here"

# Run with renaming enabled
bun jsVariableAnalyzer.js file.js --rename --strategy=descriptive

# Available strategies: descriptive, concise, domain-specific
bun jsVariableAnalyzer.js file.js --rename --strategy=concise

# Enable batch processing for multiple variables
bun jsVariableAnalyzer.js file.js --rename --batch
```

### Command Line Options

- `--rename`: Enable intelligent variable renaming
- `--strategy=<strategy>`: Naming strategy (descriptive|concise|domain-specific)
- `--batch`: Enable batch processing for multiple variables

## Environment Variables

- `OPENROUTE_API_KEY`: Your OpenRoute.ai API key (required for renaming)
- `CONTEXT_SIZE`: Number of context lines to include (default: 7)

## Output Files

For each input file, the analyzer generates:

1. **Analysis Report** (`<filename>-analysis.md`): Detailed variable analysis
2. **Rename Report** (`<filename>-rename-report.md`): Rename results and reasoning (when using `--rename`)
3. **Renamed File** (`<filename>-renamed.js`): File with applied renames (when successful)

## Analysis Report Features

The enhanced analysis report includes:

### Variable Information

- Declaration type and location
- Inferred type from usage patterns
- Scope level (global/function/block)
- Usage frequency

### Behavioral Patterns

- **Modification Status**: Whether the variable is modified
- **Read-Only Status**: If the variable is only read
- **Function Detection**: Identifies function variables
- **Iterator Patterns**: Detects loop and iteration usage
- **Configuration Detection**: Identifies config-like variables
- **State Detection**: Identifies state-holding variables
- **Common Operations**: Tracks frequent operations (array modification, string manipulation, etc.)

### Usage Context

- Declaration context with syntax highlighting
- All references with usage patterns
- Line-by-line context for each reference

## Intelligent Renaming Process

### 1. Context Analysis

The system analyzes each variable's:

- Declaration context and type
- All usage patterns and contexts
- Behavioral patterns and frequency
- Scope and lifecycle

### 2. LLM Prompt Generation

Creates detailed prompts including:

- Current variable name and type
- Declaration context
- Usage examples with patterns
- Behavioral analysis
- Strategy-specific instructions

### 3. Semantic Validation

- AST comparison before/after rename
- Structural equivalence verification
- Identifier-only difference validation
- Automatic rollback on failures

### 4. Batch Processing

- Sequential processing with dependency tracking
- Updated analysis after each rename
- Rate limiting for API calls
- Comprehensive error handling

## Example

### Input Code

```javascript
const x = [1, 2, 3, 4, 5];
let y = 0;
const z = x.map(item => item * 2);

function a(b, c) {
  const d = b + c;
  let e = d * 2;
  return e > 10 ? e - 5 : e;
}
```

### Analysis Output

The analyzer identifies:

- `x`: Array, iterator, read-only, 3 references
- `y`: Number, modified, accumulator, 2 references  
- `z`: Array, computed, unused, 0 references
- `a`: Function, pure, 1 reference
- `b`, `c`: Parameters, numbers, 1 reference each
- `d`: Number, computed, 1 reference
- `e`: Number, computed, conditional, 3 references

### Potential Renames (Descriptive Strategy)

- `x` → `numbers` or `inputArray`
- `y` → `accumulator` or `sum`
- `a` → `calculateAdjustedSum` or `processNumbers`
- `d` → `sum` or `total`
- `e` → `doubledSum` or `result`

## API Integration

### OpenRoute.ai Configuration

```javascript
const llmConfig = {
  apiKey: process.env.OPENROUTE_API_KEY,
  model: 'anthropic/claude-3-haiku',
  namingStrategy: 'descriptive',
  maxTokens: 1000,
  temperature: 0.3,
  enableBatchProcessing: false
};
```

### Supported Models

- `anthropic/claude-3-haiku` (default)
- `anthropic/claude-3-sonnet`
- `anthropic/claude-3-opus`
- Other OpenRoute.ai compatible models

## Error Handling

The system includes comprehensive error handling for:

- Invalid API keys
- Network failures
- Malformed JavaScript
- Invalid identifier suggestions
- AST structural changes
- Rate limiting

## Performance Considerations

- **API Rate Limiting**: Built-in delays between requests
- **Batch Optimization**: Efficient processing of multiple variables
- **AST Caching**: Reuses parsed ASTs where possible
- **Context Limits**: Configurable context window sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Requirements

- Bun.js runtime (>= 1.0.0)
- OpenRoute.ai API key (for renaming features)
- Node.js fetch package (included)

## Troubleshooting

### Common Issues

1. **API Key Not Found**

   ```
   Error: OpenRoute.ai API key is required. Set OPENROUTE_API_KEY environment variable.
   ```

   Solution: Export your API key: `export OPENROUTE_API_KEY="your-key"`

2. **Parse Errors**

   ```
   Error parsing JavaScript in filename: SyntaxError
   ```

   Solution: Ensure input files contain valid JavaScript

3. **Network Issues**

   ```
   Error: OpenRoute.ai API error: 500 Internal Server Error
   ```

   Solution: Check network connectivity and API status

### Debug Mode

Set `DEBUG=true` environment variable for detailed logging:

```bash
DEBUG=true bun jsVariableAnalyzer.js file.js --rename
