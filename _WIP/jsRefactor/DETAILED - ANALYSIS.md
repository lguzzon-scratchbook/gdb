# **PLANNING - 01 - Module-by-Module Implementation Plan**

This plan details the purpose and core logic for each module outlined in the project structure. It serves as a blueprint for development.

## **`refactor.js` (Main Orchestrator)**

* **Purpose:** The main entry point. It parses CLI arguments, orchestrates the entire workflow from discovery to reporting, and handles top-level errors.
* **Core Logic:**
    1. Parse CLI arguments using a simple argument parser (or `Bun.argv`).
    2. Load configuration from `.refactorrc.jsonc` using the `config/loader`.
    3. Initialize the structured logger from `utils/logger`.
    4. **Phase 1: Discovery:** Call `discovery/findFiles` to get a list of all target files.
    5. **Phase 2: Analysis:**
        * Initialize the `analysis/CKG`.
        * Create a Bun `Worker` pool.
        * For each file, dispatch a job to a worker. The job sends the file path to `analysis/analysis-worker.js`.
        * Listen for messages from workers (containing AST-derived nodes and edges) and aggregate the results into the master CKG instance on the main thread.
    6. **Phase 3: Suggestion:** Call `suggestions/suggestion-generator` with the completed CKG to get a list of proposed changes.
    7. **Phase 4: Transformation:**
        * If not `--dry-run`, call `transformation/vcs` to create the safety branch.
        * If `-i` (interactive), pass the suggestions to `cli/interactive` for user approval/editing.
        * Pass the approved/filtered suggestions to `transformation/apply-changes` to perform the actual file modifications.
    8. **Phase 5: Reporting:**
        * Generate a report using `cli/formatter` with statistics from all phases.
        * Print metrics (time taken, API costs, etc.) to the console.

---

## **`src/discovery/findFiles.js`**

* **Purpose:** To find all relevant JS/JSX/MJS/CJS files within the target path, respecting exclusions.
* **Input:** `target_path`, `exclusion_patterns` (from config).
* **Output:** `Array<string>` of absolute file paths.
* **Core Logic:**
    1. Read `.gitignore` from the project root and parse its rules using a simple, custom parser.
    2. Use `Bun.glob` with the pattern `{**/*.js,**/*.jsx,**/*.mjs,**/*.cjs}` to get an initial list of all potential files.
    3. Filter this list:
        * Remove any files matching default exclusions (`node_modules`, `dist`, `.git`).
        * Remove any files matching user-configured exclusion patterns.
        * Remove any files matching the parsed `.gitignore` rules.

---

## **`src/analysis/analysis-worker.js`**

* **Purpose:** To perform the CPU-intensive task of parsing a single file and extracting its semantic information, running inside a Bun `Worker` thread.
* **Input (via `worker.postMessage`):** `filepath`.
* **Output (via `parentPort.postMessage`):** `{ filepath: string, nodes: Array<any>, edges: Array<any>, error?: string }`.
* **Core Logic:**
    1. Read the file content using `Bun.file(filepath).text()`.
    2. Use `jscodeshift` (which uses Babel) to parse the content into an AST. Configure the parser to handle JSX and other syntax variants. If parsing fails, return an error.
    3. Traverse the AST using `jscodeshift`'s `.find()` and `.forEach()` methods.
    4. For each relevant declaration (`FunctionDeclaration`, `VariableDeclarator`, `ClassDeclaration`, etc.), create a **Node** object with metadata: `kind`, `name`, `scopeId` (generated via `utils/hashing`), JSDoc comments, and cyclomatic complexity (calculated with a simple helper function).
    5. For each relevant expression or statement (`CallExpression`, `NewExpression`, `MemberExpression` access, `AssignmentExpression`), create an **Edge** object: `{ from: scopeId_of_user, to: scopeId_of_used, type: 'CALLS' | 'READS' | ... }`.
    6. Post the collected `nodes` and `edges` back to the main thread.

---

## **`src/analysis/CKG.js` (Code Knowledge Graph)**

* **Purpose:** A data structure on the main thread to hold the unified graph of the entire codebase.
* **Core Logic:**
  * Exposes methods like `addNode(nodeObject)`, `addEdge(edgeObject)`, `getNodeById(id)`, `findUsages(nodeId)`.
  * Internally uses `Map` objects for efficient lookups: `new Map<scopeId, nodeObject>` and `new Map<scopeId, { incoming: Edge[], outgoing: Edge[] }>`.
  * Provides query methods needed by the `suggestion-generator` and `transformation` modules (e.g., "find all nodes that import from this file").

---

## **`src/llm/api.js`**

* **Purpose:** To handle all communication with the OpenRouter.ai API.
* **Input:** `prompt`, `llm_parameters` (from config).
* **Output:** `Promise<ParsedJsonResponse>`.
* **Core Logic:**
    1. Reads the API key from the `OPENROUTER_API_KEY` environment variable. Throws an error if not present.
    2. Constructs the `fetch` request with the correct headers (`Authorization: Bearer ...`) and body payload.
    3. Implements an exponential backoff with jitter retry mechanism for network errors or API status codes `429`, `500`, `503`.
    4. On a successful `200 OK` response, parses the JSON and returns it.
    5. Calculates token usage and estimated cost based on hardcoded values and response metadata.
    6. Validates the response structure using `llm/response-validator.js`.

---

## **`src/suggestions/suggestion-generator.js`**

* **Purpose:** To generate all rename suggestions from both heuristics and the LLM.
* **Input:** The fully constructed `CKG` instance.
* **Output:** `Array<SuggestionObject>`.
* **Core Logic:**
    1. **Heuristic Pass:** Iterate through all nodes in the CKG. If an identifier's name matches a common anti-pattern (e.g., `data`, `arr`, `mgr`, or single letters not in a tight `for` loop), generate a preliminary suggestion.
    2. **LLM Pass:**
        * For remaining identifiers (or all, depending on config), use `llm/prompt-builder` to create a context-rich payload for each one.
        * Batch these payloads and send them to the `llm/api` module.
        * Process the LLM's JSON response, mapping each suggestion back to its original node in the CKG using the `scopeId`.
    3. Return a consolidated list of all high-quality suggestions.

---

## **`src/transformation/apply-changes.js`**

* **Purpose:** To apply the renames to the files on disk using `jscodeshift`.
* **Input:** `Array<ApprovedSuggestionObject>`.
* **Output:** None (modifies files on disk).
* **Core Logic:**
    1. Group suggestions by file path to minimize file I/O.
    2. For each file with pending changes:
        * Read the file and parse it with `jscodeshift`.
        * Instantiate the `conflict-resolver` to check for pre-transformation conflicts.
        * For each approved suggestion in that file, use `jscodeshift`'s scope-aware `.renameTo()` method on the correct variable declaration. `jscodeshift` handles shadowing automatically.
        * For cross-module renames (identified via the CKG), perform renames on `ImportSpecifier` nodes as well.
        * After staging all renames for the file, use the `conflict-resolver` again to check for post-rename collisions (e.g., `a -> b` and `c -> b`). Handle conflicts as per the defined strategy.
        * If no conflicts, convert the modified AST back to code using `.toSource()` and write it to disk with `Bun.write()`.

---

## **`src/transformation/vcs.js` (Version Control System)**

* **Purpose:** To ensure all operations are safe by using Git.
* **Core Logic:**
  * `createSafetyBranch()`:
        1. Checks if `git` is installed and if the current directory is a clean Git repository (no uncommitted changes). Aborts if not.
        2. Generates a branch name, e.g., `refactor/2025-10-25-082953`.
        3. Executes `git checkout -b <branch-name>` using `Bun.spawn`.

---

## **Other Key Modules**

* **`cli/interactive.js`:** Uses a simple loop and `console.log` with `for await (const line of console)` to read user input (`y/n/e/d/a/s`) for each suggestion. Manages the state of which suggestions are approved, rejected, or edited.
* **`cli/formatter.js`:** Contains functions to generate colored diffs for `--dry-run` (by spawning `git diff --no-index`) and to build the final markdown or HTML report string.
* **`config/loader.js`:** Reads `.refactorrc.jsonc`, parses the JSONC (by stripping comments with a regex before `JSON.parse`), and merges it with a hardcoded default configuration object.
* **`utils/logger.js`:** Provides a `log(level, message, data)` function that appends a JSON object to a log file in `.refactor/logs/` using `Bun.write`.
* **`utils/cache.js`:** Implements `get(key)` and `set(key, value)` methods. It reads/writes a single cache file (`.refactor/cache.json`). The `get` method checks the file's `mtime` against a stored timestamp before returning cached data.

This detailed plan provides a clear path forward for implementation. You can now begin building out each module, starting with the foundational pieces like `discovery`, `config`, and the basic `refactor.js` orchestration logic.
