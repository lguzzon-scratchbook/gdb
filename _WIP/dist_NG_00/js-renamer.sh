#!/bin/bash

# JavaScript Symbol Renamer using jscodeshift via bunx
# Usage: ./js-rename.sh <file_path> <original_symbol> <new_symbol> [options]

set -euo pipefail

# Default values
DRY_RUN=false
CREATE_BACKUP=false
VERBOSE=false
PARSER="babylon"
TEMP_DIR=""
TRANSFORM_FILE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage information
usage() {
    cat << EOF
Usage: $0 <file_path> <original_symbol> <new_symbol> [options]

Arguments:
    file_path       Path to the JavaScript file to process
    original_symbol Original symbol name to rename
    new_symbol      New symbol name

Options:
    -d, --dry-run   Perform a dry run without making changes
    -b, --backup    Create a backup of the original file
    -v, --verbose   Enable verbose output
    -p, --parser    Specify parser (babylon, flow, tsx, ts) [default: babylon]
    -h, --help      Show this help message

Examples:
    $0 src/app.js oldFunction newFunction
    $0 src/app.js oldVar newVar --dry-run --backup
    $0 src/component.tsx MyComponent NewComponent --parser tsx

Note: This script uses 'bunx jscodeshift' which will automatically install
      jscodeshift if not available in the current project.
EOF
    exit 1
}

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Function to log messages
log() {
    if [[ "$VERBOSE" == true ]]; then
        print_color "$BLUE" "[INFO] $*"
    fi
}

# Function to print error messages
error() {
    print_color "$RED" "[ERROR] $*" >&2
}

# Function to print warning messages
warn() {
    print_color "$YELLOW" "[WARNING] $*"
}

# Function to print success messages
success() {
    print_color "$GREEN" "[SUCCESS] $*"
}

# Function to clean up temporary files
cleanup() {
    if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
        log "Cleaning up temporary directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
    fi
}

# Set up trap for cleanup
trap cleanup EXIT

# Function to check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check if bun is installed
    if ! command -v bun &> /dev/null; then
        error "Bun is not installed. Please install Bun first: https://bun.sh/docs/installation"
        exit 1
    fi
    
    # Check bun version to ensure bunx is available
    local bun_version
    if bun_version=$(bun --version 2>/dev/null); then
        log "Bun version: $bun_version"
    else
        error "Unable to determine Bun version"
        exit 1
    fi
    
    success "Bun is available - jscodeshift will be run via bunx"
}

# Function to validate file path
validate_file() {
    local file_path=$1
    
    if [[ ! -f "$file_path" ]]; then
        error "File does not exist: $file_path"
        exit 1
    fi
    
    # Check if file is a JavaScript/TypeScript file
    if [[ ! "$file_path" =~ \.(js|jsx|ts|tsx|mjs|cjs)$ ]]; then
        warn "File extension may not be supported: $file_path"
    fi
    
    log "File validation passed: $file_path"
}

# Function to validate symbol names
validate_symbols() {
    local original_symbol=$1
    local new_symbol=$2
    
    # Check if symbols are valid JavaScript identifiers
    local identifier_regex='^[a-zA-Z_$][a-zA-Z0-9_$]*$'
    
    if [[ ! "$original_symbol" =~ $identifier_regex ]]; then
        error "Invalid original symbol name: $original_symbol"
        exit 1
    fi
    
    if [[ ! "$new_symbol" =~ $identifier_regex ]]; then
        error "Invalid new symbol name: $new_symbol"
        exit 1
    fi
    
    if [[ "$original_symbol" == "$new_symbol" ]]; then
        error "Original and new symbol names are the same"
        exit 1
    fi
    
    log "Symbol validation passed"
}

# Function to check if original symbol exists in file
check_symbol_exists() {
    local file_path=$1
    local original_symbol=$2
    
    log "Checking if symbol '$original_symbol' exists in file..."
    
    # Use grep to check for symbol existence (basic check)
    if ! grep -q "\b$original_symbol\b" "$file_path"; then
        warn "Symbol '$original_symbol' may not exist in file: $file_path"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        success "Symbol '$original_symbol' found in file"
    fi
}

# Function to create backup
create_backup() {
    local file_path=$1
    local backup_path="${file_path}.backup.$(date +%Y%m%d_%H%M%S)"
    
    log "Creating backup: $backup_path"
    cp "$file_path" "$backup_path"
    success "Backup created: $backup_path"
}

# Function to create jscodeshift transform
create_transform() {
    local original_symbol=$1
    local new_symbol=$2
    
    log "Creating jscodeshift transform..."
    
    cat > "$TRANSFORM_FILE" << 'EOF'
const { execSync } = require('child_process');

module.exports = function transformer(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  const originalSymbol = options.originalSymbol;
  const newSymbol = options.newSymbol;
  
  let hasChanges = false;
  
  // Helper function to check if a node should be renamed
  const shouldRename = (name) => name === originalSymbol;
  
  // 1. Variable declarations (var, let, const)
  root.find(j.VariableDeclarator, {
    id: { name: originalSymbol }
  }).forEach(path => {
    path.value.id.name = newSymbol;
    hasChanges = true;
  });
  
  // 2. Function declarations
  root.find(j.FunctionDeclaration, {
    id: { name: originalSymbol }
  }).forEach(path => {
    path.value.id.name = newSymbol;
    hasChanges = true;
  });
  
  // 3. Function expressions with names
  root.find(j.FunctionExpression)
    .filter(path => path.value.id && path.value.id.name === originalSymbol)
    .forEach(path => {
      path.value.id.name = newSymbol;
      hasChanges = true;
    });
  
  // 4. Arrow function assignments
  root.find(j.VariableDeclarator)
    .filter(path => 
      path.value.id.name === originalSymbol && 
      j.ArrowFunctionExpression.check(path.value.init)
    )
    .forEach(path => {
      path.value.id.name = newSymbol;
      hasChanges = true;
    });
  
  // 5. Class declarations
  root.find(j.ClassDeclaration, {
    id: { name: originalSymbol }
  }).forEach(path => {
    path.value.id.name = newSymbol;
    hasChanges = true;
  });
  
  // 6. Method definitions
  root.find(j.MethodDefinition, {
    key: { name: originalSymbol }
  }).forEach(path => {
    if (path.value.key.type === 'Identifier') {
      path.value.key.name = newSymbol;
      hasChanges = true;
    }
  });
  
  // 7. Object properties (shorthand and regular)
  root.find(j.Property)
    .filter(path => 
      path.value.key.type === 'Identifier' && 
      path.value.key.name === originalSymbol
    )
    .forEach(path => {
      path.value.key.name = newSymbol;
      // Handle shorthand properties
      if (path.value.shorthand && path.value.value.type === 'Identifier') {
        path.value.value.name = newSymbol;
      }
      hasChanges = true;
    });
  
  // 8. Identifier references (variables, function calls, etc.)
  root.find(j.Identifier, { name: originalSymbol })
    .filter(path => {
      // Don't rename if it's already been handled above or if it's a property key
      const parent = path.parent.value;
      
      // Skip if it's a property key in member expressions (obj.prop)
      if (j.MemberExpression.check(parent) && parent.property === path.value && !parent.computed) {
        return false;
      }
      
      // Skip if it's a property key in object patterns
      if (j.Property.check(parent) && parent.key === path.value && !parent.computed) {
        return false;
      }
      
      // Skip if it's a method name
      if (j.MethodDefinition.check(parent) && parent.key === path.value) {
        return false;
      }
      
      return true;
    })
    .forEach(path => {
      path.value.name = newSymbol;
      hasChanges = true;
    });
  
  // 9. Import specifiers
  root.find(j.ImportSpecifier)
    .filter(path => path.value.imported.name === originalSymbol)
    .forEach(path => {
      path.value.imported.name = newSymbol;
      // If there's no local name or local name matches imported, update local too
      if (!path.value.local || path.value.local.name === originalSymbol) {
        path.value.local = j.identifier(newSymbol);
      }
      hasChanges = true;
    });
  
  // 10. Import default specifiers
  root.find(j.ImportDefaultSpecifier)
    .filter(path => path.value.local.name === originalSymbol)
    .forEach(path => {
      path.value.local.name = newSymbol;
      hasChanges = true;
    });
  
  // 11. Export specifiers
  root.find(j.ExportSpecifier)
    .filter(path => path.value.local.name === originalSymbol)
    .forEach(path => {
      path.value.local.name = newSymbol;
      // If exported name matches local, update exported too
      if (path.value.exported.name === originalSymbol) {
        path.value.exported.name = newSymbol;
      }
      hasChanges = true;
    });
  
  // 12. Export default declarations
  root.find(j.ExportDefaultDeclaration)
    .filter(path => 
      j.Identifier.check(path.value.declaration) && 
      path.value.declaration.name === originalSymbol
    )
    .forEach(path => {
      path.value.declaration.name = newSymbol;
      hasChanges = true;
    });
  
  // 13. JSX component names (if applicable)
  root.find(j.JSXIdentifier, { name: originalSymbol })
    .forEach(path => {
      path.value.name = newSymbol;
      hasChanges = true;
    });
  
  return hasChanges ? root.toSource({
    quote: 'single',
    trailingComma: true,
    tabWidth: 2,
    reuseParsers: true
  }) : null;
};
EOF
    
    success "Transform created successfully"
}

# Function to run jscodeshift via bunx
run_jscodeshift() {
    local file_path=$1
    local original_symbol=$2
    local new_symbol=$3
    
    log "Running jscodeshift transformation via bunx..."
    
    local cmd_args=(
        --transform="$TRANSFORM_FILE"
        --parser="$PARSER"
        --originalSymbol="$original_symbol"
        --newSymbol="$new_symbol"
    )
    
    if [[ "$DRY_RUN" == true ]]; then
        cmd_args+=(--dry)
        log "Running in dry-run mode"
    fi
    
    if [[ "$VERBOSE" == true ]]; then
        cmd_args+=(--verbose=2)
    fi
    
    cmd_args+=("$file_path")
    
    log "Executing: bunx jscodeshift ${cmd_args[*]}"
    
    local output
    if output=$(bunx jscodeshift "${cmd_args[@]}" 2>&1); then
        echo "$output"
        
        # Parse output for summary
        if echo "$output" | grep -q "0 ok"; then
            warn "No changes were made. The symbol might not exist or already has the target name."
        elif echo "$output" | grep -q "1 ok"; then
            success "Transformation completed successfully"
        else
            success "Transformation completed"
        fi
    else
        error "jscodeshift transformation failed"
        echo "$output"
        exit 1
    fi
}

# Function to display summary
display_summary() {
    local file_path=$1
    local original_symbol=$2
    local new_symbol=$3
    
    echo
    print_color "$BLUE" "=== TRANSFORMATION SUMMARY ==="
    echo "File: $file_path"
    echo "Original symbol: $original_symbol"
    echo "New symbol: $new_symbol"
    echo "Parser: $PARSER"
    echo "Runtime: bunx jscodeshift"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Mode: Dry run (no changes made)"
    else
        echo "Mode: Applied changes"
    fi
    
    if [[ "$CREATE_BACKUP" == true && "$DRY_RUN" == false ]]; then
        echo "Backup: Created"
    fi
    
    echo "================================"
}

# Parse command line arguments
parse_arguments() {
    if [[ $# -lt 3 ]]; then
        usage
    fi
    
    FILE_PATH=$1
    ORIGINAL_SYMBOL=$2
    NEW_SYMBOL=$3
    shift 3
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -b|--backup)
                CREATE_BACKUP=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -p|--parser)
                PARSER="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown option: $1"
                usage
                ;;
        esac
    done
}

# Main function
main() {
    print_color "$GREEN" "JavaScript Symbol Renamer v1.0 (powered by bunx)"
    echo
    
    # Parse arguments
    parse_arguments "$@"
    
    # Check dependencies
    check_dependencies
    
    # Validate inputs
    validate_file "$FILE_PATH"
    validate_symbols "$ORIGINAL_SYMBOL" "$NEW_SYMBOL"
    
    # Check if symbol exists
    # check_symbol_exists "$FILE_PATH" "$ORIGINAL_SYMBOL"
    
    # Create backup if requested and not in dry-run mode
    if [[ "$CREATE_BACKUP" == true && "$DRY_RUN" == false ]]; then
        create_backup "$FILE_PATH"
    fi
    
    # Create temporary directory and transform file
    TEMP_DIR=$(mktemp -d)
    TRANSFORM_FILE="$TEMP_DIR/rename-transform.js"
    
    # Create transform
    create_transform "$ORIGINAL_SYMBOL" "$NEW_SYMBOL"
    
    # Run transformation
    run_jscodeshift "$FILE_PATH" "$ORIGINAL_SYMBOL" "$NEW_SYMBOL"
    
    # Display summary
    display_summary "$FILE_PATH" "$ORIGINAL_SYMBOL" "$NEW_SYMBOL"
    
    success "Script completed successfully"
}

# Run main function with all arguments
main "$@"
