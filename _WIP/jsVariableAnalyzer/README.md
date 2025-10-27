# JavaScript Variable Analyzer with Intelligent Renaming

A powerful Bun.js script that analyzes JavaScript variable declarations and references using jscodeshift, with advanced AI-powered intelligent variable renaming capabilities via Openrouter.ai's LLM API. Includes sophisticated export aliasing analysis for safe code minification.

## Features

### Core Analysis

- **Variable Declaration Detection**: Identifies `var`, `let`, `const`, `function`, and `class` declarations
- **Reference Tracking**: Maps all variable usages with precise line/column positions and deduplicated references
- **Context Extraction**: Provides rich code context around declarations and references (configurable window)
- **Usage Pattern Analysis**: Analyzes 15+ usage patterns:
  - `function_call`, `call_argument`
  - `property_access`, `member_object`
  - `assignment_target`, `assignment_source`
  - `binary_operand`, `unary_operand`
  - `return_value`, `thrown_value`
  - `constructor_call`, `initializer`
  - `property_value`, `property_key`
  - `array_element`, `object_property`
  - `condition`, `loop_condition`
- **Type Inference**: Intelligently infers variable types from usage patterns (function, object, array, string, number, class, unknown)
- **Scope Detection**: Determines variable scope levels (global, function, block)
- **Behavioral Analysis**: Identifies comprehensive patterns:
  - Modification status (isModified, isReadOnly)
  - Function detection
  - Iterator patterns (forEach, map, for, while)
  - Configuration detection
  - State detection
  - Common operations tracking (array_modification, string_manipulation, functional_operations)

### Export-Aware Analysis

- **Direct Export Detection**: Identifies direct exports that form the public API contract
- **Aliased Export Analysis**: Maps internal identifiers to their exported aliases
- **Export Classification**: Clearly labels variables as:
  - Direct exports (public API - protected from renaming)
  - Aliased exports (internal identifiers - safe for minification/renaming)
  - Non-exported internal variables (safely renamable)
- **Smart Export Protection**: Prevents accidental breaking of public API while enabling aggressive minification of internal code

### Intelligent Variable Renaming

- **AI-Powered Suggestions**: Leverages Openrouter.ai's LLM API for semantic naming
- **Strategy-Specific Prompts**: Context-aware prompts including:
  - Variable declaration and usage context
  - Behavioral patterns and frequency
  - Usage examples with patterns
  - Strategy-specific naming guidelines
- **Multiple Naming Strategies**:
  - `descriptive`: Clear, explanatory names (default)
  - `concise`: Short but meaningful names
  - `domain-specific`: Industry-standard terminology
- **Smart Export Protection**: Respects public API boundaries while renaming internal identifiers
- **Cyclic Reference Handling**: Robust JSON serialization with cycle detection for complex AST structures
- **Length-Based Filtering**: Optional filtering to rename only short variable names (< 4 characters)
- **Batch Processing**: Sequential processing with updated analysis after each rename
- **Configurable Parameters**: Customizable LLM settings (model, tokens, temperature)

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
# Set your Openrouter.ai API key
export OPENROUTER_API_KEY="your-api-key-here"

# Run with renaming enabled
bun jsVariableAnalyzer.js file.js --rename --strategy=descriptive

# Available strategies: descriptive, concise, domain-specific
bun jsVariableAnalyzer.js file.js --rename --strategy=concise

# Enable batch processing for multiple variables
bun jsVariableAnalyzer.js file.js --rename --batch
```

### Command Line Options

- `--rename`: Enable intelligent variable renaming (disabled by default)
- `--all`: Rename all variables (by default, only variables with name length < 4 characters are renamed)
- `--strategy=<strategy>`: Naming strategy (default: `descriptive`)
  - `descriptive`: Clear, explanatory names following camelCase/PascalCase conventions
  - `concise`: Short, abbreviated but meaningful names
  - `domain-specific`: Industry or domain-specific terminology
- `--batch`: Enable batch processing for multiple variables (sequential processing with delays)

## Environment Variables

- `OPENROUTER_API_KEY`: Your Openrouter.ai API key (required for renaming features)
- `OPENROUTE_MODEL`: LLM model to use (default: `openai/gpt-4o-mini`)
- `CONTEXT_SIZE`: Number of context lines to include before and after target line (default: 7)

## Output Files

For each input file, the analyzer generates:

1. **Analysis Report** (`<filename>-analysis.md`): Detailed variable analysis with export classification
2. **Rename Report** (`<filename>-rename-report.md`): Rename results with reasoning (when using `--rename`)
3. **Renamed File** (`<filename>-renamed.js`): File with successfully applied renames (when `--rename` is used and renames succeed)

## Type Definitions

### VariableReference

```typescript
{
  name: string              // The variable name
  line: number              // Line number (1-based)
  column: number            // Column number (0-based)
  context: string           // Code context around the reference
  type: string              // Type: 'declaration' or 'usage'
  usagePattern: string      // Pattern of usage (15+ patterns supported)
}
```

### VariableInfo

```typescript
{
  name: string                          // The variable name
  declarationType: string               // 'var' | 'let' | 'const' | 'function' | 'class'
  declarationLine: number               // Line where variable is declared (1-based)
  declarationContext: string            // Code context around the declaration
  references: VariableReference[]       // All references to this variable
  inferredType: string                  // Inferred type from patterns
  scope: string                         // 'global' | 'function' | 'block'
  behavioralPatterns: {
    isModified: boolean
    isReadOnly: boolean
    isFunction: boolean
    isIterator: boolean
    isConfiguration: boolean
    isState: boolean
    isUtility: boolean
    usageFrequency: number
    commonOperations: string[]          // e.g. ['array_modification', 'string_manipulation']
  }
  isExported: boolean                   // Whether this variable is exported
}
```

### ExportInfo

```typescript
{
  exportedNames: Set<string>                    // All exported names (public API)
  aliasedExports: Map<string, string>           // Maps local name → export name
  directExports: Set<string>                    // Direct exports (public API)
  exportPatterns: Map<string, {
    type: string                                // 'named_export' | 'variable_declaration' | etc.
    localName?: string
    exportedName?: string
    isAliased: boolean
  }>
}
```

### RenameResult

```typescript
{
  success: boolean          // Whether the rename was successful
  originalName: string      // Original variable name
  newName: string           // New variable name
  reason: string            // Reason for the rename suggestion or failure
  warnings: string[]        // Any warnings during the process
  astComparison: {
    isStructurallyEquivalent: boolean
    differences: any[]
    normalizedOriginal: string
    normalizedModified: string
  }
}
```

### LLMConfig

```typescript
{
  apiKey: string            // Openrouter.ai API key
  model: string             // Model name (e.g. 'openai/gpt-4o-mini')
  namingStrategy: string    // 'descriptive' | 'concise' | 'domain-specific'
  maxTokens: number         // Maximum tokens for response (default: 4000)
  temperature: number       // Temperature for creativity (default: 0.1)
  enableBatchProcessing: boolean  // Enable batch mode (default: false)
}
```

## Analysis Report Features

The enhanced analysis report includes:

### Export Classification Summary

- Count and list of direct exports (public API - protected)
- Count and list of aliased exports (internal IDs - renamable)
- Detailed mapping of internal names to their exported aliases

### Variable Information

For each variable:
- **Declaration Type**: `var`, `let`, `const`, `function`, `class`
- **Declaration Location**: Line number and code context
- **Inferred Type**: Automatically detected from usage patterns
- **Scope Level**: Global, function, or block scope
- **Export Status**: Direct export, aliased export, or non-exported
- **Usage Frequency**: Total number of references

### Behavioral Patterns

- **Modification Status**: Whether the variable is modified after declaration
- **Read-Only Status**: If the variable is only read from
- **Function Detection**: Whether it's used as a function
- **Iterator Patterns**: Detected if used in loops/iteration
- **Configuration Detection**: Identified if used as configuration object
- **State Detection**: Identified if holds mutable state
- **Common Operations**: Array modification, string manipulation, functional operations

### Usage Context

- Declaration context with full code block
- All references with precise line/column positions
- Usage pattern classification for each reference
- Line-by-line context around each reference

## Exported Functions

The module exports the following functions for programmatic use:

### Core Analysis Functions

**`analyzeVariableReferences(sourceCode, filename, exportedNames?)`**
- Analyzes JavaScript source code for variable declarations and references
- Returns array of `VariableInfo` objects
- Optionally filters by provided exported names

**`extractDetailedExportInfo(sourceCode)`**
- Extracts comprehensive export information including aliasing patterns
- Returns `ExportInfo` object with export classification
- Handles named exports, variable declarations, function/class exports

**`extractExportedNames(sourceCode)`**
- Legacy wrapper that extracts only the set of exported names
- Returns `Set<string>` of exported variable/function names

### Report Generation

**`generateMarkdownReport(variables, filename, exportInfo?)`**
- Generates detailed Markdown analysis report
- Includes export classification when `exportInfo` provided
- Returns formatted Markdown string

**`generateRenameReport(results, filename)`**
- Generates Markdown report of rename operations
- Separates successful and failed renames with reasoning
- Returns formatted Markdown string

### Renaming Functions

**`performIntelligentRename(sourceCode, variableInfo, config, exportInfo)`**
- Performs complete rename workflow for a single variable
- Calls LLM API, validates identifier, compares ASTs
- Returns `RenameResult` object (Promise)

**`processBatchRenames(sourceCode, variables, config, exportInfo)`**
- Processes multiple variables with sequential renaming
- Updates analysis after each successful rename
- Includes rate limiting between API calls
- Returns array of `RenameResult` objects (Promise)

**`renameVariableInASTWithExportInfo(sourceCode, oldName, newName, exportInfo)`**
- Low-level function to apply rename in AST
- Respects export protection rules
- Handles cyclic references in complex ASTs
- Returns modified source code string

**`renameVariableInAST(sourceCode, oldName, newName, exportedNames?)`**
- Backward compatible wrapper for renaming
- Converts exported names set to export info
- Returns modified source code string

### Utility Functions

**`getLLMNameSuggestion(variableInfo, config)`**
- Calls Openrouter.ai API for name suggestions
- Includes comprehensive variable context
- Returns suggested name string (Promise)

**`generateNamingPrompt(variableInfo, config)`**
- Generates strategy-specific LLM prompt
- Includes declaration context, usage patterns, behavioral analysis
- Returns prompt string

**`isValidIdentifier(name)`**
- Validates JavaScript identifier syntax
- Checks for reserved words
- Returns boolean

**`filterVariablesByLength(variables, renameAll?)`**
- Filters variables by name length
- Returns only variables with name < 4 chars unless `renameAll=true`
- Returns filtered array

**`isRenamableIdentifier(name, exportInfo)`**
- Determines if identifier can be safely renamed
- Respects public API boundaries
- Returns boolean

### Internal Helper Functions

**`extractContext(sourceLines, targetLine, contextSize?)`**
- Extracts surrounding code context
- Returns formatted code block with line numbers

**`analyzeUsagePattern(path, node)`**
- Analyzes AST path to determine usage pattern
- Returns one of 15+ usage pattern strings

**`inferVariableType(variableInfo)`**
- Infers variable type from usage patterns
- Returns type string

**`analyzeBehavioralPatterns(variableInfo)`**
- Analyzes variable behavioral patterns
- Returns patterns object with boolean flags

**`determineScopeLevel(declarationNode, sourceCode)`**
- Determines variable scope level
- Returns 'global' | 'function' | 'block'

**`compareASTs(originalAST, modifiedAST)`**
- Compares ASTs for semantic equivalence
- Handles cyclic references properly
- Returns comparison result object

## Intelligent Renaming Process

### 1. Export Classification

The system identifies and classifies all variables:

- **Direct Exports**: Protected from renaming (part of public API contract)
- **Aliased Exports**: Internal identifiers exported with different name (safe for renaming)
- **Non-Exported Variables**: Internal implementation details (safe for renaming)

Only renamable variables (aliased exports + non-exported) are processed.

### 2. Variable Filtering

Optionally filter by variable name length:

- Default: Only rename variables with name length < 4 characters
- With `--all` flag: Rename all renamable variables
- Respects export protection regardless of name length

### 3. LLM Prompt Generation

Creates detailed strategy-specific prompts including:

- Variable name, declaration type, inferred type
- Scope level and usage frequency
- Declaration context with code block
- Up to 3 usage examples with patterns
- Complete behavioral pattern analysis
- Strategy-specific naming guidelines

### 4. LLM API Call

- Calls Openrouter.ai API with configuration
- Sends context-rich prompt to chosen LLM model
- Default model: `openai/gpt-4o-mini`
- Configurable temperature (default: 0.1 for consistency)
- Configurable max tokens (default: 4000)

### 5. Identifier Validation

Validates the LLM suggestion:

- Checks for valid JavaScript identifier syntax
- Verifies not a JavaScript reserved word
- Matches pattern: `^[a-zA-Z_$][a-zA-Z0-9_$]*$`
- Verifies not the same as original name

### 6. AST Transformation

Applies the rename in the AST:

- Finds all identifier nodes matching old name
- Skips property names in object literals
- Skips property access in member expressions
- Skips import/export specifiers
- Skips function parameter declarations
- Renames only actual variable references

### 7. Cyclic Reference Handling

Robust handling of complex AST structures:

- WeakSet-based cycle detection in JSON serialization
- Safe handling of circular references
- Comparison of normalized ASTs (identifiers only)

### 8. Batch Processing (Optional)

When `--batch` flag is used:

- Sequential processing of multiple variables
- Re-analyzes variable info after each rename
- Tracks cumulative changes in source
- 1-second delay between API calls for rate limiting
- Continues on individual rename failures

### 9. Report Generation

Generates comprehensive Markdown reports:

- Lists all successful renames with reasoning
- Lists all failed renames with error details
- Includes warnings and validation messages
- Categorizes failures (API errors, validation failures, etc.)

### 10. File Generation

Creates output files:

- `<filename>-analysis.md`: Detailed analysis with export classification
- `<filename>-rename-report.md`: Results and reasoning for each rename
- `<filename>-renamed.js`: Source file with applied renames (if any successful)

## Real-World Example

### Input Code

```javascript
const N0 = { id: 'self', value: 1 };
const MJ = (a, b) => a + b;
const DJ = () => ({ relays: [] });

export { N0 as selfId, MJ as join, DJ as getRelaySockets };

export const user = { name: 'Alice', role: 'admin' };
export const version = '1.0.0';
export function processData(data) {
  return data.map(item => item * 2);
}

const x = 10;
const y = 20;
const sum = x + y;

console.log(N0.id);
console.log(MJ(5, 3));
console.log(DJ());
console.log(sum);
```

### Analysis Output

The analyzer identifies:

**Direct Exports (Protected):**
- `user`: Object, direct export, public API
- `version`: String, direct export, public API
- `processData`: Function, direct export, public API

**Aliased Exports (Renamable):**
- `N0` → `selfId` (internal identifier, safe for renaming)
- `MJ` → `join` (internal identifier, safe for renaming)
- `DJ` → `getRelaySockets` (internal identifier, safe for renaming)

**Internal Variables (Renamable):**
- `x`: Number, global, read-only, 1 reference
- `y`: Number, global, read-only, 1 reference
- `sum`: Number, computed, read-only, 1 reference

### Rename Operation with `--rename --all`

```bash
export OPENROUTER_API_KEY="your-api-key"
bun jsVariableAnalyzer.js input.js --rename --all --strategy=descriptive
```

**Results:**

✅ Successful renames:
- `N0` → `selfIdentifier` (aliased export, internal ID, safe to rename)
- `MJ` → `sumTwoNumbers` (aliased export, internal ID, safe to rename)
- `DJ` → `getRelayConfiguration` (aliased export, internal ID, safe to rename)
- `x` → `constantValueTen` (non-exported, safe to rename)
- `y` → `constantValueY` (non-exported, safe to rename)
- `sum` → `totalSumOfXAndY` (non-exported, safe to rename)

❌ Failed renames (protected):
- `user`: Part of public API - cannot rename
- `version`: Part of public API - cannot rename
- `processData`: Part of public API - cannot rename

### Generated Output

**analysis.md** includes export classification showing public API vs internal details.

**rename-report.md** shows:
- 6 successful renames with LLM reasoning
- 3 protected exports that cannot be renamed
- Clear distinction between public and internal identifiers

**renamed.js** contains updated code with all safe renames applied while preserving public API.

## API Integration

### Openrouter.ai Configuration

```javascript
const llmConfig = {
  apiKey: process.env.OPENROUTER_API_KEY,
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
- Other Openrouter.ai compatible models

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
- Openrouter.ai API key (for renaming features)
- Node.js fetch package (included)

## Troubleshooting

### Common Issues

1. **API Key Not Found**

   ```
   Error: Openrouter.ai API key is required. Set OPENROUTER_API_KEY environment variable.
   ```

   Solution: Export your API key: `export OPENROUTER_API_KEY="your-key"`

2. **Parse Errors**

   ```
   Error parsing JavaScript in filename: SyntaxError
   ```

   Solution: Ensure input files contain valid JavaScript

3. **Network Issues**

   ```
   Error: Openrouter.ai API error: 500 Internal Server Error
   ```

   Solution: Check network connectivity and API status

### Debug Mode

Set `DEBUG=true` environment variable for detailed logging:

```bash
DEBUG=true bun jsVariableAnalyzer.js file.js --rename
