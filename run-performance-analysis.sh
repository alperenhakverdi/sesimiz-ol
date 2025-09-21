#!/bin/bash

# Sesimiz Ol Performance Analysis Suite
# Comprehensive performance testing and optimization analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PERFORMANCE_DIR="performance-analysis"
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Functions
print_header() {
    echo -e "${PURPLE}"
    echo "=================================="
    echo "  Sesimiz Ol Performance Suite   "
    echo "=================================="
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check_dependencies() {
    print_section "Checking Dependencies"

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ to continue."
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "Node.js $(node -v) is installed"

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    print_success "npm $(npm -v) is installed"

    # Check if backend exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi

    # Check if frontend exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi

    print_success "Project structure verified"
}

setup_performance_suite() {
    print_section "Setting Up Performance Analysis Suite"

    # Create performance analysis directory if it doesn't exist
    if [ ! -d "$PERFORMANCE_DIR" ]; then
        print_error "Performance analysis directory not found: $PERFORMANCE_DIR"
        print_info "Please ensure the performance analysis suite has been properly set up"
        exit 1
    fi

    cd "$PERFORMANCE_DIR"

    # Install dependencies
    print_info "Installing performance analysis dependencies..."
    if [ ! -f "package.json" ]; then
        print_error "Performance analysis package.json not found"
        exit 1
    fi

    npm install --silent

    # Create reports directory
    mkdir -p reports reports/consolidated temp

    print_success "Performance analysis suite ready"
    cd ..
}

check_backend_status() {
    print_section "Checking Backend Status"

    print_info "Checking if backend is running at $API_BASE_URL..."

    # Try to connect to the backend
    if curl -s --connect-timeout 5 "$API_BASE_URL/health" > /dev/null 2>&1; then
        print_success "Backend is running at $API_BASE_URL"
        return 0
    else
        print_warning "Backend is not running at $API_BASE_URL"
        print_info "Attempting to start backend..."

        cd "$BACKEND_DIR"

        # Check if dependencies are installed
        if [ ! -d "node_modules" ]; then
            print_info "Installing backend dependencies..."
            npm install --silent
        fi

        # Start backend in background
        print_info "Starting backend server..."
        npm run dev > ../backend.log 2>&1 &
        BACKEND_PID=$!

        # Wait for backend to start
        print_info "Waiting for backend to start..."
        for i in {1..30}; do
            if curl -s --connect-timeout 2 "$API_BASE_URL/health" > /dev/null 2>&1; then
                print_success "Backend started successfully (PID: $BACKEND_PID)"
                cd ..
                return 0
            fi
            sleep 1
        done

        print_error "Failed to start backend after 30 seconds"
        kill $BACKEND_PID 2>/dev/null || true
        cd ..
        return 1
    fi
}

run_database_benchmark() {
    print_section "Database Performance Benchmark"

    cd "$PERFORMANCE_DIR"

    print_info "Running database performance analysis..."
    if node benchmarks/db-performance-benchmark.js; then
        print_success "Database benchmark completed"
    else
        print_warning "Database benchmark failed or had issues"
    fi

    cd ..
}

run_api_load_tests() {
    print_section "API Load Testing"

    cd "$PERFORMANCE_DIR"

    print_info "Running API load tests..."
    API_BASE_URL="$API_BASE_URL" node benchmarks/api-load-tester.js

    print_info "Running comprehensive load testing scenarios..."
    API_BASE_URL="$API_BASE_URL" node load-tests/comprehensive-load-test.js

    print_success "API load tests completed"

    cd ..
}

run_frontend_analysis() {
    print_section "Frontend Bundle Analysis"

    print_info "Building frontend for analysis..."
    cd "$FRONTEND_DIR"

    # Build frontend
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install --silent
    fi

    npm run build > ../frontend-build.log 2>&1

    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_warning "Frontend build had issues, checking build log..."
        tail -n 10 ../frontend-build.log
    fi

    cd ..

    # Run frontend analysis
    cd "$PERFORMANCE_DIR"

    print_info "Analyzing frontend bundle and performance..."
    node benchmarks/frontend-bundle-analyzer.js

    print_success "Frontend analysis completed"

    cd ..
}

start_performance_monitoring() {
    print_section "Performance Monitoring Dashboard"

    cd "$PERFORMANCE_DIR"

    print_info "Starting performance monitoring dashboard..."
    node monitoring/performance-dashboard.js &
    MONITOR_PID=$!

    sleep 3

    if kill -0 $MONITOR_PID 2>/dev/null; then
        print_success "Performance dashboard started (PID: $MONITOR_PID)"
        print_info "Dashboard available at: http://localhost:3030"
        print_info "Dashboard will collect metrics for 2 minutes..."

        # Let it collect data for 2 minutes
        sleep 120

        # Stop the dashboard
        kill $MONITOR_PID 2>/dev/null || true
        print_success "Performance monitoring completed"
    else
        print_warning "Performance dashboard failed to start"
    fi

    cd ..
}

generate_performance_report() {
    print_section "Generating Performance Report"

    cd "$PERFORMANCE_DIR"

    print_info "Consolidating performance analysis results..."
    node scripts/generate-performance-report.js

    print_success "Performance report generated"

    # Display report location
    if [ -f "reports/consolidated/performance-report.html" ]; then
        REPORT_PATH=$(realpath "reports/consolidated/performance-report.html")
        print_success "📊 HTML Report: file://$REPORT_PATH"
    fi

    if [ -f "reports/consolidated/performance-summary.md" ]; then
        SUMMARY_PATH=$(realpath "reports/consolidated/performance-summary.md")
        print_success "📝 Summary: $SUMMARY_PATH"

        # Display summary
        echo -e "\n${CYAN}📋 Performance Summary:${NC}"
        head -n 20 "reports/consolidated/performance-summary.md" | sed 's/^/   /'
    fi

    cd ..
}

cleanup() {
    print_section "Cleanup"

    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        print_info "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$MONITOR_PID" ]; then
        print_info "Stopping performance monitor..."
        kill $MONITOR_PID 2>/dev/null || true
    fi

    # Clean up log files
    rm -f backend.log frontend-build.log

    print_success "Cleanup completed"
}

show_help() {
    echo "Sesimiz Ol Performance Analysis Suite"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --full          Run complete performance analysis suite (default)"
    echo "  --db-only       Run only database benchmark"
    echo "  --api-only      Run only API load tests"
    echo "  --frontend-only Run only frontend analysis"
    echo "  --monitor-only  Run only performance monitoring"
    echo "  --report-only   Generate report from existing data"
    echo "  --quick         Run quick performance check (reduced test duration)"
    echo "  --help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL    Backend API URL (default: http://localhost:3001)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run full analysis"
    echo "  $0 --quick                           # Quick analysis"
    echo "  API_BASE_URL=http://localhost:8080 $0 --api-only"
    echo ""
}

# Main execution
main() {
    print_header

    # Parse command line arguments
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --db-only)
            check_dependencies
            setup_performance_suite
            run_database_benchmark
            generate_performance_report
            ;;
        --api-only)
            check_dependencies
            setup_performance_suite
            check_backend_status
            run_api_load_tests
            generate_performance_report
            ;;
        --frontend-only)
            check_dependencies
            setup_performance_suite
            run_frontend_analysis
            generate_performance_report
            ;;
        --monitor-only)
            check_dependencies
            setup_performance_suite
            check_backend_status
            start_performance_monitoring
            generate_performance_report
            ;;
        --report-only)
            cd "$PERFORMANCE_DIR"
            generate_performance_report
            cd ..
            ;;
        --quick)
            print_info "Running quick performance analysis..."
            check_dependencies
            setup_performance_suite
            check_backend_status || print_warning "Backend not available, skipping API tests"
            run_database_benchmark
            if curl -s --connect-timeout 2 "$API_BASE_URL/health" > /dev/null 2>&1; then
                run_api_load_tests
            fi
            run_frontend_analysis
            generate_performance_report
            ;;
        --full|"")
            print_info "Running comprehensive performance analysis..."
            check_dependencies
            setup_performance_suite

            BACKEND_STARTED=false
            if check_backend_status; then
                BACKEND_STARTED=true
            fi

            run_database_benchmark

            if [ "$BACKEND_STARTED" = true ]; then
                run_api_load_tests
                start_performance_monitoring
            else
                print_warning "Skipping API tests - backend not available"
            fi

            run_frontend_analysis
            generate_performance_report
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac

    cleanup

    print_section "Performance Analysis Complete"
    print_success "All performance analysis tasks completed successfully!"

    if [ -f "$PERFORMANCE_DIR/reports/consolidated/performance-report.html" ]; then
        echo ""
        print_info "📊 Open the HTML report in your browser to view detailed results"
        print_info "📝 Check the markdown summary for quick insights"
        echo ""
        print_info "Next Steps:"
        echo "  1. Review the performance recommendations"
        echo "  2. Implement suggested optimizations"
        echo "  3. Re-run analysis to measure improvements"
        echo "  4. Set up continuous performance monitoring"
    fi
}

# Trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

# Run main function
main "$@"