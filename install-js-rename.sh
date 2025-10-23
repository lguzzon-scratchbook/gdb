#!/bin/bash
# JavaScript Variable Renaming Multi-Agent System Installer for Factory Droid CLI

set -e

PROJECT_DIR="${1:-$(pwd)}"
FACTORY_DIR="$PROJECT_DIR/.factory"
DROIDS_DIR="$FACTORY_DIR/droids"
COMMANDS_DIR="$FACTORY_DIR/commands"

echo "🤖 Installing JavaScript Variable Renaming Multi-Agent System for Factory Droid CLI"
echo "📁 Target directory: $PROJECT_DIR"

# Ensure Factory Droid is installed
if ! command -v droid &> /dev/null; then
    echo "❌ Factory Droid CLI not found. Installing..."
    curl -fsSL https://app.factory.ai/cli | sh
fi

# Create necessary directories
mkdir -p "$DROIDS_DIR" "$COMMANDS_DIR"

# Create Code Analysis Agent
cat > "$DROIDS_DIR/code-analyzer.md" << 'EOF'

---
name: code-analyzer
description: Scans JavaScript files to identify all variables, functions, classes, and constants that need renaming
model: inherit
tools: ["Read", "LS", "Grep", "Glob"]

---

You are a JavaScript code analysis specialist. Your role is to:
- Scan all .js, .jsx, .ts, .tsx files in the `src/` directory
- Use AST parsing concepts to identify all identifiers (variables, functions, classes, constants)
- Categorize identifiers by type and current naming convention
- Output structured data for downstream agents

Focus on semantic analysis and identifier extraction. Do not perform renaming.

When analyzing code:
1. Read files systematically starting from entry points
2. Identify naming patterns and conventions
3. Categorize by identifier type (var, function, class, const)
4. Note current naming style (camelCase, snake_case, etc.)
5. Flag inconsistencies or violations of standards
EOF

# Create Documentation Context Agent
cat > "$DROIDS_DIR/docs-researcher.md" << 'EOF'

---
name: docs-researcher
description: Analyzes documentation to understand business context and semantic meaning of code elements
model: inherit
tools: ["Read", "Grep", "Glob"]

---

You are a documentation research specialist. Your role is to:
- Search through the `docs/` directory for context about code elements
- Identify business domain terminology and preferred naming conventions
- Map technical identifiers to their business meanings
- Provide semantic context for renaming decisions

Only reference documentation from the `docs/` directory.

Process:
1. Read all documentation files in docs/
2. Extract domain-specific terminology
3. Identify naming preferences and conventions
4. Map technical concepts to business meanings
5. Provide context for semantic renaming
EOF

# Create Naming Standards Agent
cat > "$DROIDS_DIR/naming-specialist.md" << 'EOF'

---
name: naming-specialist
description: Applies consistent naming conventions and generates improved identifier names
model: inherit
tools: ["Read"]

---

You are a JavaScript naming conventions specialist. Apply these standards:
- Variables: camelCase (userAccountData, isActive)
- Functions: descriptive verbs (calculateTotal, validateInput)
- Classes: PascalCase (UserManager, DataProcessor)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)

Generate semantically meaningful names based on context from other agents.

Process:
1. Review analysis from code-analyzer
2. Consider business context from docs-researcher
3. Apply appropriate naming convention
4. Ensure semantic clarity and consistency
5. Avoid abbreviations and unclear names
EOF

# Create Code Refactoring Agent
cat > "$DROIDS_DIR/code-refactor.md" << 'EOF'

---
name: code-refactor
description: Performs safe variable renaming across files while preserving functionality
model: inherit
tools: ["Read", "Edit", "Grep", "Glob"]

---

You are a code refactoring specialist. Your role is to:
- Apply renaming changes across all files in the project
- Maintain cross-file references and imports
- Preserve all existing functionality
- Use safe refactoring techniques to avoid breaking changes

Ensure consistency across the entire codebase.

Process:
1. Create backup references of current state
2. Apply renames systematically across files
3. Update imports and references
4. Verify syntax correctness
5. Test that functionality is preserved
EOF

# Create Verification Agent
cat > "$DROIDS_DIR/verification-specialist.md" << 'EOF'

---
name: verification-specialist
description: Validates that refactoring maintained functionality and follows conventions
model: inherit
tools: ["Read", "Execute", "Grep"]

---

You are a code quality verification specialist. Your role is to:
- Verify syntax correctness after refactoring
- Check naming convention compliance
- Validate cross-file reference integrity
- Ensure no functionality was broken

Report any issues found during verification.

Process:
1. Run syntax checks on modified files
2. Verify naming conventions are followed
3. Check import/export consistency
4. Validate cross-references work
5. Report verification status
EOF

# Create orchestration command
cat > "$COMMANDS_DIR/js-rename.md" << 'EOF'

---
description: Refactor JavaScript variable names using specialized agents for analysis, context research, naming, refactoring, and verification.
argument-hint: "<src-directory>"

---

## Mission
Execute a comprehensive JavaScript variable renaming project using a team of specialized agents.

## Agent Workflow
1. **Analysis Phase**: Deploy `code-analyzer` to scan and catalog all identifiers
2. **Research Phase**: Deploy `docs-researcher` to gather semantic context  
3. **Planning Phase**: Deploy `naming-specialist` to generate improved names
4. **Execution Phase**: Deploy `code-refactor` to apply changes safely
5. **Verification Phase**: Deploy `verification-specialist` to validate results

## Process
Run the Task tool with each subagent in sequence:
1. `code-analyzer` - "Analyze all JavaScript files in src/ and identify variables, functions, classes needing renaming"
2. `docs-researcher` - "Research docs/ directory for business context and naming preferences"
3. `naming-specialist` - "Generate improved names based on analysis and context"
4. `code-refactor` - "Apply renaming changes across all files"
5. `verification-specialist` - "Verify all changes maintain functionality and follow conventions"

## Output Requirements
- Detailed renaming log (old → new mappings)
- Rationale for each naming decision
- Verification report confirming functionality preservation
- Updated codebase with improved identifier names
EOF

# Create AGENTS.md with project context
cat > "$PROJECT_DIR/AGENTS.md" << 'EOF'
# JavaScript Variable Renaming Project

## Build & Commands
- Install dependencies: `npm install` or `yarn install`
- Start dev server: `npm run dev`
- Run tests: `npm test`
- Build: `npm run build`
- Lint: `npm run lint`

## Development Patterns
**Code Style**:
- Variables: camelCase (userAccountData, isActive)
- Functions: descriptive verbs (calculateTotal, validateInput)
- Classes: PascalCase (UserManager, DataProcessor)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)

**Naming Standards**:
- Use descriptive names that explain intent
- Avoid abbreviations unless widely understood
- Prefer clarity over brevity
- Maintain consistency across the codebase

## Project Structure
- `src/` - Main source code directory
- `docs/` - Documentation for business context
- `.factory/` - Factory Droid configuration

## Security
- Never rename critical system variables
- Preserve API interface naming
- Maintain external library compatibility

## Refactoring Guidelines
- Process files in dependency order
- Update imports and references
- Preserve functionality completely
- Test after each major change batch
EOF

echo "✅ JavaScript Variable Renaming Multi-Agent System installed successfully!"
echo ""
echo "📋 What was installed:"
echo "   • 5 specialized droid agents in .factory/droids/"
echo "   • Custom command in .factory/commands/"
echo "   • AGENTS.md project configuration"
echo ""
echo "🚀 Usage:"
echo "   1. Enable Custom Droids in Factory CLI: /settings → Experimental → Custom Droids"
echo "   2. Run: /js-rename src/"
echo "   3. Or manually use agents with Task tool"
echo ""
echo "💡 The system will:"
echo "   • Analyze your JavaScript codebase"
echo "   • Research documentation for context"
echo "   • Generate improved variable names"
echo "   • Safely apply changes across files"
echo "   • Verify functionality is preserved"
