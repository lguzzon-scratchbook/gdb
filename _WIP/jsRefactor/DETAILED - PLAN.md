# Module-by-Module Implementation Plan

**Overall Progress:** `0%`

## Tasks

- [ ] 🟥 **Step 1: Implement Foundational Utilities & Configuration**
  - [ ] 🟥 Create a config loader for `.refactorrc.jsonc` that merges with defaults.
  - [ ] 🟥 Implement a structured JSON logger that writes to a log file.
  - [ ] 🟥 Set up Version Control System (VCS) safety checks and a function to create a new Git branch.
  - [ ] 🟥 Build a basic file caching utility.

- [ ] 🟥 **Step 2: Build the Main Orchestrator (`refactor.js`)**
  - [ ] 🟥 Parse Command-Line Interface (CLI) arguments.
  - [ ] 🟥 Load configuration and initialize the logger.
  - [ ] 🟥 Orchestrate the main phases: Discovery, Analysis, Suggestion, Transformation, and Reporting.

- [ ] 🟥 **Step 3: Implement File Discovery Module (`discovery/findFiles.js`)**
  - [ ] 🟥 Use `Bun.glob` to find all relevant JavaScript/TypeScript files.
  - [ ] 🟥 Parse `.gitignore` rules to incorporate into the exclusion logic.
  - [ ] 🟥 Filter the file list based on default, user-configured, and `.gitignore` exclusions.

- [ ] 🟥 **Step 4: Implement Code Analysis Engine**
  - [ ] 🟥 Create the Code Knowledge Graph (CKG) data structure with methods like `addNode` and `addEdge` (`analysis/CKG.js`).
  - [ ] 🟥 Develop the analysis worker (`analysis/analysis-worker.js`) to parse a single file using `jscodeshift` into an AST.
  - [ ] 🟥 In the worker, extract `Nodes` (declarations) and `Edges` (expressions) from the AST.
  - [ ] 🟥 Implement a Bun `Worker` pool in the main orchestrator to process files in parallel.
  - [ ] 🟥 Aggregate results from all workers into the single CKG instance on the main thread.

- [ ] 🟥 **Step 5: Implement Suggestion Generation**
  - [ ] 🟥 Build the LLM API client (`llm/api.js`) for OpenRouter.ai, including exponential backoff retry logic.
  - [ ] 🟥 Implement a heuristic pass in the `suggestion-generator.js` to find simple anti-patterns (e.g., `data`, `arr`).
  - [ ] 🟥 Implement an LLM pass to generate context-aware rename suggestions based on the CKG.
  - [ ] 🟥 Consolidate and return a final list of high-quality suggestions.

- [ ] 🟥 **Step 6: Implement Code Transformation Module**
  - [ ] 🟥 Group approved suggestions by file path to minimize I/O (`transformation/apply-changes.js`).
  - [ ] 🟥 Use `jscodeshift`'s scope-aware `.renameTo()` method for robust renaming.
  - [ ] 🟥 Handle cross-module renames by updating `ImportSpecifier` nodes identified via the CKG.
  - [ ] 🟥 Implement a conflict resolver to check for post-rename collisions (e.g., two variables renamed to the same identifier).
  - [ ] 🟥 Write the modified AST back to the file system using `Bun.write()`.

- [ ] 🟥 **Step 7: Develop CLI and Reporting Features**
  - [ ] 🟥 Create an interactive mode (`cli/interactive.js`) to allow user approval/rejection of suggestions.
  - [ ] 🟥 Implement a report formatter (`cli/formatter.js`) to generate `--dry-run` diffs and a final summary report.
  - [ ] 🟥 Print final metrics, such as time taken and API costs, to the console during the reporting phase.
