#!/bin/bash

# =============================================================================
# Database Audit Runner Script for Sesimiz Ol
# =============================================================================
# This script runs comprehensive database audits and generates reports
# for production readiness assessment.
#
# Usage:
#   ./scripts/database/run-audit.sh [options]
#
# Options:
#   --integrity-only    Run only integrity audit
#   --performance-only  Run only performance analysis
#   --health-only      Run only health check
#   --cleanup          Run cleanup procedures
#   --maintenance      Install maintenance procedures
#   --output-dir DIR   Specify output directory (default: ./audit-reports)
#   --verbose          Enable verbose output
#   --help             Show this help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/audit-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage
print_usage() {
    cat << EOF
Database Audit Runner for Sesimiz Ol

USAGE:
    $(basename "$0") [OPTIONS]

OPTIONS:
    --integrity-only     Run only integrity audit
    --performance-only   Run only performance analysis
    --health-only       Run only health check
    --cleanup           Run cleanup procedures
    --maintenance       Install maintenance procedures
    --output-dir DIR    Output directory (default: ./audit-reports)
    --verbose           Enable verbose output
    --help              Show this help

EXAMPLES:
    $(basename "$0")                          # Run full audit
    $(basename "$0") --health-only            # Quick health check
    $(basename "$0") --cleanup --verbose      # Run cleanup with verbose output
    $(basename "$0") --output-dir /tmp/audit  # Custom output directory

ENVIRONMENT:
    DATABASE_URL        PostgreSQL connection string (required)
    PGPASSWORD         PostgreSQL password (optional)

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status $BLUE "Checking prerequisites..."

    # Check if DATABASE_URL is set
    if [[ -z "${DATABASE_URL:-}" ]]; then
        print_status $RED "ERROR: DATABASE_URL environment variable is not set"
        echo "Please set DATABASE_URL to your PostgreSQL connection string"
        exit 1
    fi

    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_status $RED "ERROR: psql command not found"
        echo "Please install PostgreSQL client tools"
        exit 1
    fi

    # Check if node is available (for health check)
    if ! command -v node &> /dev/null; then
        print_status $RED "ERROR: node command not found"
        echo "Please install Node.js for health check functionality"
        exit 1
    fi

    # Test database connection
    print_status $BLUE "Testing database connection..."
    if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        print_status $RED "ERROR: Cannot connect to database"
        echo "Please check your DATABASE_URL and database server status"
        exit 1
    fi

    print_status $GREEN "Prerequisites check passed ✓"
}

# Function to create output directory
setup_output_dir() {
    if [[ ! -d "$OUTPUT_DIR" ]]; then
        print_status $BLUE "Creating output directory: $OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
    fi
}

# Function to run SQL script and capture output
run_sql_audit() {
    local script_name=$1
    local output_file=$2
    local description=$3

    print_status $BLUE "Running $description..."

    local script_path="${SCRIPT_DIR}/${script_name}"

    if [[ ! -f "$script_path" ]]; then
        print_status $RED "ERROR: Script not found: $script_path"
        return 1
    fi

    # Run the SQL script and capture output
    local temp_output="${output_file}.tmp"

    if psql "$DATABASE_URL" -f "$script_path" > "$temp_output" 2>&1; then
        mv "$temp_output" "$output_file"
        print_status $GREEN "$description completed ✓"

        if [[ "$VERBOSE" == "true" ]]; then
            echo "Output saved to: $output_file"
            echo "Preview (last 10 lines):"
            tail -10 "$output_file"
            echo
        fi

        return 0
    else
        print_status $RED "$description failed ✗"
        echo "Error output:"
        cat "$temp_output"
        rm -f "$temp_output"
        return 1
    fi
}

# Function to run Node.js health check
run_health_check() {
    local output_file="${OUTPUT_DIR}/health-check_${TIMESTAMP}.json"
    local text_output="${OUTPUT_DIR}/health-check_${TIMESTAMP}.txt"

    print_status $BLUE "Running database health check..."

    cd "$PROJECT_ROOT/backend"

    # Run health check with JSON output
    if node "${SCRIPT_DIR}/health-check.js" --format=json > "$output_file" 2>&1; then
        print_status $GREEN "Health check completed ✓"
    else
        print_status $YELLOW "Health check completed with warnings/errors ⚠"
    fi

    # Run health check with text output for console display
    if node "${SCRIPT_DIR}/health-check.js" > "$text_output" 2>&1; then
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Health check results:"
            cat "$text_output"
            echo
        fi
    fi

    echo "Health check results saved to:"
    echo "  JSON: $output_file"
    echo "  Text: $text_output"
}

# Function to run cleanup procedures
run_cleanup() {
    local output_file="${OUTPUT_DIR}/cleanup_${TIMESTAMP}.log"

    print_status $BLUE "Running database cleanup procedures..."

    if run_sql_audit "cleanup-procedures.sql" "$output_file" "Database cleanup"; then
        print_status $GREEN "Cleanup procedures completed ✓"
        echo "Cleanup log saved to: $output_file"
    else
        print_status $RED "Cleanup procedures failed ✗"
        return 1
    fi
}

# Function to install maintenance procedures
install_maintenance() {
    local output_file="${OUTPUT_DIR}/maintenance-install_${TIMESTAMP}.log"

    print_status $BLUE "Installing maintenance procedures..."

    if run_sql_audit "maintenance-procedures.sql" "$output_file" "Maintenance procedures installation"; then
        print_status $GREEN "Maintenance procedures installed ✓"
        echo "Installation log saved to: $output_file"
    else
        print_status $RED "Maintenance procedures installation failed ✗"
        return 1
    fi
}

# Function to generate summary report
generate_summary() {
    local summary_file="${OUTPUT_DIR}/audit-summary_${TIMESTAMP}.md"

    print_status $BLUE "Generating audit summary..."

    cat > "$summary_file" << EOF
# Database Audit Summary

**Audit Date:** $(date)
**Database:** Sesimiz Ol PostgreSQL Database
**Audit ID:** ${TIMESTAMP}

## Files Generated

EOF

    # List all generated files
    for file in "${OUTPUT_DIR}"/*_${TIMESTAMP}.*; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file")
            local filesize=$(du -h "$file" | cut -f1)
            echo "- \`${filename}\` (${filesize})" >> "$summary_file"
        fi
    done

    cat >> "$summary_file" << EOF

## Audit Components

### Integrity Audit
- Foreign key constraint verification
- Orphaned record detection
- Data consistency checks
- Unique constraint validation

### Performance Analysis
- Index usage statistics
- Query performance metrics
- Cache hit ratio analysis
- Storage optimization recommendations

### Constraint Validation
- Primary key integrity
- Foreign key relationships
- Business logic constraints
- Temporal data validation

### Health Check
- Real-time database metrics
- Connection analysis
- Application-level checks
- Automated recommendations

## Next Steps

1. Review individual audit reports for detailed findings
2. Implement high-priority recommendations
3. Schedule regular maintenance based on audit results
4. Monitor database performance metrics

## Maintenance Schedule

### Daily
- Run health check script
- Clean expired tokens and sessions
- Update denormalized counters

### Weekly
- Run full integrity audit
- Perform vacuum maintenance
- Review performance metrics

### Monthly
- Complete performance analysis
- Index optimization review
- Capacity planning assessment

EOF

    print_status $GREEN "Audit summary generated: $summary_file"
}

# Main execution function
main() {
    local run_integrity=false
    local run_performance=false
    local run_health=false
    local run_cleanup_only=false
    local install_maintenance_only=false
    local run_all=true

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --integrity-only)
                run_integrity=true
                run_all=false
                shift
                ;;
            --performance-only)
                run_performance=true
                run_all=false
                shift
                ;;
            --health-only)
                run_health=true
                run_all=false
                shift
                ;;
            --cleanup)
                run_cleanup_only=true
                run_all=false
                shift
                ;;
            --maintenance)
                install_maintenance_only=true
                run_all=false
                shift
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                print_status $RED "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Print header
    print_status $BLUE "=========================================="
    print_status $BLUE "Database Audit Runner for Sesimiz Ol"
    print_status $BLUE "=========================================="
    echo

    # Check prerequisites
    check_prerequisites
    echo

    # Setup output directory
    setup_output_dir
    echo

    # Execute requested audits
    local audit_failed=false

    if [[ "$run_cleanup_only" == "true" ]]; then
        run_cleanup || audit_failed=true
    elif [[ "$install_maintenance_only" == "true" ]]; then
        install_maintenance || audit_failed=true
    elif [[ "$run_all" == "true" ]]; then
        # Run complete audit suite
        print_status $BLUE "Running complete database audit suite..."
        echo

        # 1. Health Check
        run_health_check || audit_failed=true
        echo

        # 2. Integrity Audit
        run_sql_audit "integrity-audit.sql" "${OUTPUT_DIR}/integrity-audit_${TIMESTAMP}.log" "Integrity audit" || audit_failed=true
        echo

        # 3. Constraint Validation
        run_sql_audit "constraint-validation.sql" "${OUTPUT_DIR}/constraint-validation_${TIMESTAMP}.log" "Constraint validation" || audit_failed=true
        echo

        # 4. Performance Analysis
        run_sql_audit "performance-analysis.sql" "${OUTPUT_DIR}/performance-analysis_${TIMESTAMP}.log" "Performance analysis" || audit_failed=true
        echo

        # 5. Generate Summary
        generate_summary
    else
        # Run specific audits
        [[ "$run_health" == "true" ]] && { run_health_check || audit_failed=true; echo; }
        [[ "$run_integrity" == "true" ]] && { run_sql_audit "integrity-audit.sql" "${OUTPUT_DIR}/integrity-audit_${TIMESTAMP}.log" "Integrity audit" || audit_failed=true; echo; }
        [[ "$run_performance" == "true" ]] && { run_sql_audit "performance-analysis.sql" "${OUTPUT_DIR}/performance-analysis_${TIMESTAMP}.log" "Performance analysis" || audit_failed=true; echo; }
    fi

    # Final status
    print_status $BLUE "=========================================="
    if [[ "$audit_failed" == "true" ]]; then
        print_status $YELLOW "Database audit completed with some failures ⚠"
        echo "Please review the error messages above and check individual audit reports."
        exit 1
    else
        print_status $GREEN "Database audit completed successfully ✓"
        echo "All audit reports saved to: $OUTPUT_DIR"
    fi
    print_status $BLUE "=========================================="
}

# Run main function with all arguments
main "$@"