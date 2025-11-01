# NEEDs

You are an expert Bun developer with deep expertise in code transformation, AST (Abstract Syntax Tree) manipulation, and building sophisticated, high-performance command-line tools.

Your task is to create a complete, standalone Bun CLI tool named `jsDeclarationAnalyzer`. This tool will perform a deep analysis of a JavaScript/TypeScript codebase. It must identify all declarations (including nested ones, anonymous functions, and function parameters), find every reference to those declarations within their scope, and generate an exhaustive Markdown report that includes contextual code snippets for both the declaration and each reference.

The tool must use `jscodeshift` for its powerful AST parsing and scope analysis capabilities, and `yargs` (or `commander`) for professional command-line argument handling.

Here are the detailed requirements:

## 1. CLI Functionality & Behavior

The command-line interface must be structured as follows:

- **Usage:** `bun jsDeclarationAnalyzer.js <pattern> [options]`
- **Required Argument:**
  - `<pattern>`: A glob pattern for the files to analyze (e.g., `"src/**/*.js"`).
- **Options:**
  - `--output, -o`: The path for the output Markdown file. Defaults to standard output.
  - `--exclude, -e`: A glob pattern for files/directories to exclude.
  - `--context, -c`: An integer specifying the number of lines of code to show above and below the target line in snippets. Defaults to `7`.
- **Automatic Exclusions:** Automatically ignore `node_modules`, `dist`, `build`, and `.git`.

## 2. Core Analysis Logic (Full Traversal & Scope Analysis)

- The tool must perform a **full, recursive traversal of the AST**. It is no longer limited to top-level declarations.
- For each file, the analysis process is:
    1. Parse the file into an AST using `jscodeshift`.
    2. Find all relevant declaration nodes.
    3. For each declaration, use `jscodeshift`'s built-in **scope analysis** to find all its corresponding references within the file.
- **Declarations to Identify:**
  - **Named Declarations**: `VariableDeclaration` (`const`, `let`, `var`), `FunctionDeclaration`, `ClassDeclaration`.
  - **Function Parameters**: The arguments defined in the signature of any `FunctionDeclaration`, `FunctionExpression`, or `ArrowFunctionExpression`.
  - **Anonymous Functions**: `FunctionExpression` or `ArrowFunctionExpression` that are not part of a named declaration (e.g., passed as a callback). These should be identified by their location.
  - **Imports & Exports**: `ImportDeclaration`, `ExportNamedDeclaration`, `ExportDefaultDeclaration`.

## 3. Code Snippet Generation

- The tool must include a helper function that can extract a contextual code snippet from the source file.
- **Input**: Source code (as a string or array of lines), a target line number, and the context size (from the `--context` option).
- **Output**: The function should return a formatted string for the Markdown report. The target line must be clearly marked, for example, by prepending it with `>`.

## 4. Markdown Report Generation

The output must be a single, well-formatted Markdown file with the following structure:

### A. Global Summary Section

A high-level summary at the top of the report.

```markdown
# Declaration Analysis Report

- **Total Files Scanned:** 25
- **Total Declarations Found:** 350
- **Total References Found:** 1240
```

### B. Per-File Sections

Create a section for each file analyzed, starting with a level 2 heading: `## File: src/services/api.js`. The rest of the report is structured under these file sections.

### C. Declaration Block Structure (New Format)

Within each file section, create a block for every single declaration found. Do not group by type; list them as they are discovered. Each declaration block must be structured as follows:

1. **Heading:** A level 3 heading that identifies the declaration.
    - For variables: `### Variable: apiClient [const]`
    - For functions: `### Function: fetchData`
    - For parameters: `### Parameter: url (in function fetchData)`
    - For anonymous functions: `### Anonymous Function at L45`
2. **Declaration Context:** A sub-heading `#### Declared at line 25` followed by a Markdown code block containing the +/- 7 line snippet.
3. **References Section:** A sub-heading like `#### Found 3 References`. If no references are found, it should state `#### No References Found`.
    - For each reference, provide a sub-list item with its location and the contextual code snippet.

### Example Declaration Block

```markdown
    ### Function: fetchData

    #### Declared at line 82

    ```javascript
    80 | 
    81 | // Fetches data from the specified API endpoint.
    > 82 | async function fetchData(url, options = {}) {
    83 |   const { method = 'GET', body = null } = options;
    84 |   const response = await fetch(url, { method, body });
    85 |   if (!response.ok) {
    86 |     throw new Error(`HTTP error! status: ${response.status}`);
    87 |   }
    88 |   return response.json();
    89 | }
    90 | 
    ```

    #### Found 2 References

    - **Reference at line 115**

        ```javascript
        113 | 
        114 | export async function getUserProfile(userId) {
        > 115 |   const userData = await fetchData(`/api/users/${userId}`);
        116 |   return processUserData(userData);
        117 | }
        118 | 
        ```

    - **Reference at line 128**

        ```javascript
        126 | export async function getPost(postId) {
        127 |   try {
        > 128 |     return await fetchData(`/api/posts/${postId}`);
        129 |   } catch (error) {
        130 |     logError(error);
        131 |     return null;
        132 |   }
        133 | }
        ```

```

## Final Deliverables

1. **`jsDeclarationAnalyzer.js`**: The complete, commented source code for the Bun script, implementing all the logic above.
2. **`package.json`**: A `package.json` file listing all necessary dependencies (e.g., `jscodeshift`, `yargs`, `glob`, `@babel/preset-typescript`).
3. **Usage Instructions**: A brief `README.md`-style explanation of how to install dependencies (using `bun install`) and run the tool, including a clear example command covering the various options.

Present all code in a single, copyable block.
