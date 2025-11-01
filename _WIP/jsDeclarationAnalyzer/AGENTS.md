# AI Agent Instructions: jsDeclarationAnalyzer

This document provides instructions for AI agents interacting with the `jsDeclarationAnalyzer` codebase. Adhere to these rules to ensure consistency and correctness.

## 1. Project Overview

- **Purpose:** The `jsDeclarationAnalyzer` is a command-line tool that uses `jscodeshift` to analyze a JavaScript codebase. It generates a Markdown report detailing all declarations (variables, functions, classes, etc.).
- **Core Technologies:**
  - **Runtime & Package Manager:** `bun`
  - **AST Transformer:** `jscodeshift`
  - **Testing Framework:** `bun:test`
  - **Linter & Formatter:** `@biomejs/biome`
  - **JSON Formatter:** `json-sort-cli`

## 2. Project Structure

- `src/`: **MUST** contain all source code (`.js`), unit tests (`.test.js`), and prompt description files.
- `*.test.js`: Test files **MUST** follow this naming convention and be located alongside the source file they are testing within the `src/` directory.

## 3. Core Commands

All commands **MUST** be run from the project's root directory.

### 3.1. Installation

- **Install all dependencies:**

    ```bash
    bun install
    ```

### 3.2. Testing

- **Run all tests:**

    ```bash
    bun test
    ```

- **Run a single test file:**

    ```bash
    bun test <path/to/file.test.js>
    ```

### 3.3. Linting & Formatting

The project uses `@biomejs/biome` for JS/TS files and `json-sort-cli` for JSON files.

- **Check for all issues (no changes):**

    ```bash
    bunx @biomejs/biome check .
    ```

- **Auto-fix all files:**

    ```bash
    bunx @biomejs/biome check --write --unsafe . && bunx json-sort-cli .
    ```

- **Auto-fix a single JavaScript/TypeScript file:**

    ```bash
    bunx @biomejs/biome check --write --unsafe <path/to/file.js>
    ```

- **Auto-fix a single JSON file:**

    ```bash
    bunx json-sort-cli <path/to/file.json>
    ```

## 4. Development Rules & Constraints

### 4.1. General Workflow

- **Test-Driven Development (TDD):** When fixing a logic bug, you **MUST** first write a failing test that reproduces the bug, then write the code to make the test pass.
- **Pre-Commit Hygiene:** Before committing code, you **MUST** run the linter/formatter and execute all tests to ensure they pass.
- **Information Gathering:** When you need information about a specific technology or concept, you **MUST** use `context7 mcp server calls` to acquire it.

### 4.2. Coding Style

- **Type Checking:** All JavaScript files **MUST** start with `// @ts-check` to enable JSDoc-based type checking.
- **Public APIs:** **MUST** use `interface` in JSDoc for defining public APIs.
- **Type Errors:** You **MUST NOT** use `@ts-ignore` or any equivalent to suppress type errors. All type errors must be fixed.
- **Formatting:**
  - Line length limit: 100 characters.
  - Indentation: 2 spaces.
- **Code Quality:** All warnings and errors from Biome **MUST** be fixed.

### 4.3. Debugging

- **Debugging ASTs:** Use `console.log()` statements within `jscodeshift` transformers to inspect the AST.
- **Cleanup:** All `console.log()` statements and other debugging code **MUST** be removed from the final code before committing.

## 5. Git & Commit Workflow

- **Pre-Commit Checks:**
  - **ALWAYS** run `bun test` to ensure all tests pass.
  - **ALWAYS** remove temporary files, commented-out code, and debugging statements (`console.log`).
- **Commit Messages:**
  - All commit messages **MUST** follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
  - GitHub Pull Request titles **MUST** also follow the Conventional Commits style.
- **Branch Management:**
  - **NEVER** use `git push --force` on the `main` branch.
  - Use `git push --force-with-lease` on feature branches if a rebase is necessary.
