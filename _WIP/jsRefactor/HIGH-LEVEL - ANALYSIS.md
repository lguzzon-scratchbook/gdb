# **1. High-Level Analysis**

This is a request to build a sophisticated, multi-stage static analysis and automated refactoring tool. It operates like a specialized linter-on-steroids, combined with a "codemod" engine, and super-powered by an LLM for semantic understanding.

The core flow is as follows:

1. **Discover:** Find all target JavaScript files in a project.
2. **Analyze:** Parse every file into an AST in parallel, and from these ASTs, build a single, unified Code Knowledge Graph (CKG) that understands the entire codebase's structure and relationships.
3. **Suggest:**
    * Use simple heuristics to find obvious low-quality names.
    * For more complex names, query a specialized LLM (OpenRouter.ai's `z-ai/glm-4.6:exacto`) with rich contextual data extracted from the AST and CKG to get high-quality renaming suggestions.
4. **Transform:** Before applying changes, ensure safety via Git. Then, using the suggestions and the CKG, perform scope-aware renames across the entire project. This stage includes a conflict-resolution mechanism that can re-query the LLM if a suggested rename creates a new collision.
5. **Control & Report:** The entire process is wrapped in a powerful CLI with features for dry runs, interactive approval, configuration, and detailed reporting.

The architecture emphasizes performance (Bun.js, workers), safety (Git integration, atomic changes, conflict resolution), and intelligence (CKG, LLM integration).

## **2. Dependencies & Key APIs**

* **Runtime:** Bun.js (v1.x or later).
* **Core Logic:**
  * `jscodeshift`: The engine for AST parsing and transformation. It's the backbone of the analysis and transformation stages.
  * `@babel/parser`: `jscodeshift` uses this under the hood, but we may need to configure its parsing options for different JS dialects (JSX, etc.).
* **CLI & UX:**
  * (Implied) A library for interactive prompts, like `inquirer`, will be needed for the `-i` flag.
  * (Implied) A library for coloring console output, like `chalk`, will be essential for the colored diffs in `--dry-run`.
* **Configuration:**
  * (Implied) A library like `jsonc-parser` to handle comments in the `.refactorrc.jsonc` configuration file.
* **Built-in Bun APIs:**
  * `Bun.glob`: For efficient file discovery.
  * `Bun.file()`: For fast file I/O.
  * `Worker`: For managing the concurrent analysis pool.
  * `fetch`: For making HTTP requests to the OpenRouter.ai API.
  * `Bun.write()`: For writing updated files and reports.
* **External Tooling:**
  * `git`: The tool will execute `git` commands (e.g., `git branch`, `git stash`, `git diff`) and requires it to be installed and available in the system's `PATH`.

## **3. Proposed Project Structure**

```
.
├── refactor.js               # Main entry point, CLI parsing, and orchestrator
├── package.json
├── .refactorrc.jsonc         # Example configuration file
│
└── src/
    ├── analysis/
    │   ├── CKG.js                  # Code Knowledge Graph class/module
    │   ├── parser.js             # Jscodeshift wrapper for AST generation
    │   └── analysis-worker.js    # Logic to be run in parallel by Bun workers
    │
    ├── cli/
    │   ├── interactive.js        # Handles the -i interactive mode prompts
    │   ├── formatter.js          # Handles output formatting (diffs, reports)
    │   └── options.js            # Defines and parses CLI options
    │
    ├── config/
    │   └── loader.js             # Loads and merges .refactorrc.jsonc with defaults
    │
    ├── discovery/
    │   └── findFiles.js          # Traverses paths, respects .gitignore and exclusions
    │
    ├── llm/
    │   ├── prompt-builder.js     # Constructs the detailed prompt for the LLM
    │   ├── api.js                # Handles fetch calls, retries, and error handling
    │   └── response-validator.js # Validates the structure of the LLM JSON response
    │
    ├── suggestions/
    │   ├── heuristic-pass.js     # Identifies common anti-patterns locally
    │   └── suggestion-generator.js # Orchestrates heuristic and LLM passes
    │
    ├── transformation/
    │   ├── apply-changes.js      # Uses jscodeshift to perform the renames
    │   ├── conflict-resolver.js  # Detects and handles post-rename collisions
    │   └── vcs.js                # Git branch/stash safety operations
    │
    └── utils/
        ├── logger.js             # Structured JSONL logging
        ├── cache.js              # Caching logic for analysis results
        └── hashing.js            # Utilities for creating stable hashes (e.g., for scopeId)
```

## **4. Edge Cases & Constraints**

* **Parsing Errors:** Source files with syntax errors cannot be parsed into an AST. The tool must gracefully handle this by skipping the file and logging a clear error.
* **Dynamic Code:** Static analysis of dynamic JavaScript (`eval()`, dynamic `import()`, computed property access like `obj[dynamicKey]`) is extremely difficult. The tool will likely have to ignore these constructs, which could lead to incomplete renames. This is a reasonable limitation.
* **Performance:** For "large-scale" codebases (e.g., 100k+ LOC), the CKG could become very large. Memory management will be critical. Passing the entire CKG to workers might be inefficient; a better approach is for workers to return structured data that is then assembled into the CKG on the main thread.
* **API Failures:** The OpenRouter.ai API could be down, return rate-limit errors, or respond with malformed JSON. The retry mechanism is specified, but a final failure must be handled elegantly.
* **Constraint Checklist:**
  * Runtime: Bun.js -> Check.
  * Language: JS + JSDoc only -> Check.
  * Refactor Engine: `jscodeshift` -> Check.
  * LLM Target: OpenRouter.ai -> Check.
  * Safety: Git integration -> Check.
