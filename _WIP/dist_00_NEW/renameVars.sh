#!/bin/bash

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Script configuration
readonly SCRIPT_NAME="$(basename "$0")"
readonly MAX_PARALLEL="${MAX_PARALLEL:-2}"
readonly DROID_MODEL="${DROID_MODEL:-glm-4.6}"
readonly SEARCH_DIR="${1:-.}"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Global counters and tracking
declare -i TOTAL_FILES=0
declare -i PROCESSED_FILES=0
declare -i FAILED_FILES=0
declare -a BACKGROUND_PIDS=()

# Flag to track if we're shutting down
SHUTTING_DOWN=false

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $SCRIPT_NAME [DIRECTORY]

Process JavaScript files with droid analysis and biome formatting.

Arguments:
    DIRECTORY    Directory to search for .js files (default: current directory)

Environment Variables:
    MAX_PARALLEL    Maximum number of parallel processes (default: 2)

Examples:
    $SCRIPT_NAME                    # Process .js files in current directory
    $SCRIPT_NAME /path/to/project   # Process .js files in specific directory
    MAX_PARALLEL=4 $SCRIPT_NAME     # Use 4 parallel processes

EOF
}

# Validate dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v droid >/dev/null 2>&1; then
        missing_deps+=("droid")
    fi
    
    if ! command -v bunx >/dev/null 2>&1; then
        missing_deps+=("bunx")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install the missing tools before running this script."
        return 1
    fi
}

# Validate script arguments and environment
validate_environment() {
    # Check if MAX_PARALLEL is a positive integer
    if ! [[ "$MAX_PARALLEL" =~ ^[1-9][0-9]*$ ]]; then
        log_error "MAX_PARALLEL must be a positive integer, got: $MAX_PARALLEL"
        return 1
    fi
    
    # Check if search directory exists and is readable
    if [ ! -d "$SEARCH_DIR" ]; then
        log_error "Directory does not exist: $SEARCH_DIR"
        return 1
    fi
    
    if [ ! -r "$SEARCH_DIR" ]; then
        log_error "Directory is not readable: $SEARCH_DIR"
        return 1
    fi
}

# Extract filename without extension (until first dot)
get_base_filename() {
    local file="$1"
    local filename
    filename="$(basename "$file")"
    echo "${filename%%.*}"
}

# Process a single JavaScript file
process_js_file() {
    local file="$1"
    local base_filename
    local summary_file
    local exit_code=0
    
    # Check if we're shutting down before starting
    if [ "$SHUTTING_DOWN" = true ]; then
        return 1
    fi
    
    base_filename="$(get_base_filename "$file")"
    summary_file="${base_filename}_RENAMING_SUMMARY.md"
    
    log_info "Processing: $file (base filename: $base_filename)"
    
    # Execute droid command with error handling
    if ! droid exec --skip-permissions-unsafe --model "$DROID_MODEL" \
        "Analyze @{$file} and @${summary_file} to systematically refactor the codebase by creating a comprehensive task list of all functions, then methodically process each function to rename variables with meaningful, descriptive names that improve code readability and maintainability. For each function processed, document the variable renamings in ${summary_file} with before/after mappings, rationale for naming choices, and function context. Continue this iterative process until all functions have been refactored with meaningful variable names, ensuring consistency across the codebase and maintaining a complete audit trail of all changes made during the refactoring process. EDIT and READ ONLY $file and ${summary_file} NO OTHER FILES."; then
        
        # Only log error if we're not shutting down
        if [ "$SHUTTING_DOWN" = false ]; then
            log_error "Droid analysis failed for: $file"
        fi
        exit_code=1
    fi
    
    # Run biome check with error handling (only if droid succeeded and we're not shutting down)
    if [ $exit_code -eq 0 ] && [ "$SHUTTING_DOWN" = false ]; then
        if ! bunx @biomejs/biome check --write --unsafe "$file"; then
            log_warning "Biome formatting failed for: $file"
            # Don't fail the entire process for biome errors
        fi
    fi
    
    if [ $exit_code -eq 0 ] && [ "$SHUTTING_DOWN" = false ]; then
        log_success "Completed processing: $file"
    elif [ "$SHUTTING_DOWN" = false ]; then
        log_error "Failed to process: $file"
    fi
    
    return $exit_code
}

# Count active background jobs
count_active_jobs() {
    local count=0
    local pid
    
    # Clean up the BACKGROUND_PIDS array by removing finished processes
    local active_pids=()
    for pid in "${BACKGROUND_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            active_pids+=("$pid")
            ((count++))
        fi
    done
    BACKGROUND_PIDS=("${active_pids[@]}")
    
    echo $count
}

# Wait for available processing slot
wait_for_available_slot() {
    local active_count
    
    while true; do
        active_count=$(count_active_jobs)
        
        if [ "$SHUTTING_DOWN" = true ]; then
            break
        fi
        
        if [ "$active_count" -lt "$MAX_PARALLEL" ]; then
            break
        fi
        
        log_info "Waiting for available slot (active: $active_count/$MAX_PARALLEL)..."
        sleep 1
    done
}

# Start a background job and track its PID
start_background_job() {
    local file="$1"
    local pid
    
    # Process file in background
    {
        if process_js_file "$file"; then
            ((PROCESSED_FILES++))
        else
            ((FAILED_FILES++))
        fi
    } &
    
    pid=$!
    BACKGROUND_PIDS+=("$pid")
    
    log_info "Started processing $file in background (PID: $pid, active jobs: $(count_active_jobs)/$MAX_PARALLEL)"
}

# Find and process all JavaScript files
process_all_js_files() {
    log_info "Starting JavaScript file processing in: $SEARCH_DIR"
    log_info "Maximum parallel processes: $MAX_PARALLEL"
    
    # Find all JS files and store in array
    local js_files=()
    while IFS= read -r -d '' file; do
        js_files+=("$file")
    done < <(find "$SEARCH_DIR" -maxdepth 1 -name "*.js" -type f -print0)
    
    # Check if any files were found
    if [ ${#js_files[@]} -eq 0 ]; then
        log_warning "No JavaScript files found in: $SEARCH_DIR"
        return 0
    fi
    
    TOTAL_FILES=${#js_files[@]}
    log_info "Found $TOTAL_FILES JavaScript files to process"
    
    # Process each file
    for file in "${js_files[@]}"; do
        # Check if we should stop processing
        if [ "$SHUTTING_DOWN" = true ]; then
            log_info "Stopping file processing due to shutdown signal"
            break
        fi
        
        # Wait for available slot
        wait_for_available_slot
        
        # Check again after waiting
        if [ "$SHUTTING_DOWN" = true ]; then
            log_info "Stopping file processing due to shutdown signal"
            break
        fi
        
        # Start background job
        start_background_job "$file"
    done
    
    # Wait for all background processes to complete
    if [ "$SHUTTING_DOWN" = false ]; then
        log_info "Waiting for all processes to complete..."
        
        # Wait for all tracked PIDs
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                wait "$pid" 2>/dev/null || true
            fi
        done
        
        # Report results
        log_success "Processing completed!"
        log_info "Files found: $TOTAL_FILES"
        log_info "Successfully processed: $PROCESSED_FILES"
        
        if [ $FAILED_FILES -gt 0 ]; then
            log_warning "Failed to process: $FAILED_FILES files"
            return 1
        fi
    else
        log_info "Waiting for current processes to finish..."
        
        # Wait for tracked PIDs during shutdown
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                wait "$pid" 2>/dev/null || true
            fi
        done
    fi
    
    return 0
}

# Handle interrupt signal (Ctrl+C)
handle_interrupt() {
    if [ "$SHUTTING_DOWN" = false ]; then
        SHUTTING_DOWN=true
        echo "" # New line after ^C
        log_warning "Interrupt signal received (Ctrl+C). Shutting down gracefully..."
        log_info "Waiting for current processes to complete. Press Ctrl+C again to force exit."
        
        # Set up a second interrupt handler for force exit
        trap 'force_exit' INT
    fi
}

# Force exit on second Ctrl+C
force_exit() {
    echo "" # New line after ^C
    log_error "Force exit requested. Terminating all processes immediately."
    cleanup_force
    exit 130
}

# Cleanup function for graceful shutdown
cleanup() {
    local exit_code=$?
    
    # Don't run cleanup multiple times
    if [ "$SHUTTING_DOWN" = true ] && [ ${#BACKGROUND_PIDS[@]} -eq 0 ]; then
        return
    fi
    
    SHUTTING_DOWN=true
    
    # Handle different exit scenarios
    case $exit_code in
        0)
            # Normal exit, no message needed
            ;;
        130)
            # Ctrl+C interrupt
            log_info "Script interrupted by user"
            ;;
        *)
            # Other errors
            log_error "Script failed with exit code: $exit_code"
            ;;
    esac
    
    # Kill any remaining background jobs gracefully
    if [ ${#BACKGROUND_PIDS[@]} -gt 0 ]; then
        log_info "Terminating remaining background processes..."
        
        # First try graceful termination
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid" 2>/dev/null || true
            fi
        done
        
        # Give processes time to cleanup
        sleep 2
        
        # Force kill any remaining processes
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
        
        # Wait for all processes to finish
        for pid in "${BACKGROUND_PIDS[@]}"; do
            wait "$pid" 2>/dev/null || true
        done
        
        BACKGROUND_PIDS=()
    fi
}

# Force cleanup for immediate exit
cleanup_force() {
    SHUTTING_DOWN=true
    
    # Kill all background jobs immediately
    if [ ${#BACKGROUND_PIDS[@]} -gt 0 ]; then
        for pid in "${BACKGROUND_PIDS[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
        BACKGROUND_PIDS=()
    fi
}

# Main function
main() {
    # Handle help flag
    if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
        show_usage
        exit 0
    fi
    
    # Set up signal handlers
    trap cleanup EXIT TERM
    trap handle_interrupt INT
    
    # Validate environment and dependencies
    check_dependencies || exit 1
    validate_environment || exit 1
    
    # Process all JavaScript files
    if ! process_all_js_files; then
        if [ "$SHUTTING_DOWN" = false ]; then
            log_error "Some files failed to process"
            exit 1
        else
            log_info "Processing interrupted"
            exit 130
        fi
    fi
    
    if [ "$SHUTTING_DOWN" = false ]; then
        log_success "All files processed successfully!"
    fi
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
