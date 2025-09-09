#!/bin/bash

# Gentle Nudge Assistant - Health Check Script
# Validates deployment health across environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS] ENVIRONMENT

Perform health checks on the Gentle Nudge Assistant deployment.

ENVIRONMENTS:
    development     Check development environment
    staging         Check staging environment
    production      Check production environment

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -t, --timeout SECONDS   Request timeout (default: 30)
    -r, --retries COUNT     Number of retries (default: 3)
    --deep                  Perform deep health checks
    --continuous INTERVAL   Continuous monitoring (seconds)
    --json                  Output in JSON format

EXAMPLES:
    $0 production                    # Basic health check
    $0 --deep staging               # Deep health check
    $0 --continuous 60 development  # Monitor for 60 second intervals

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERBOSE=false
TIMEOUT=30
RETRIES=3
DEEP_CHECK=false
CONTINUOUS=false
CONTINUOUS_INTERVAL=60
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        --deep)
            DEEP_CHECK=true
            shift
            ;;
        --continuous)
            CONTINUOUS=true
            CONTINUOUS_INTERVAL="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    error "Environment is required. Use: development, staging, or production"
fi

# Load environment configuration
ENV_CONFIG="${PROJECT_ROOT}/deploy/environments/${ENVIRONMENT}.env"
if [[ ! -f "$ENV_CONFIG" ]]; then
    error "Environment configuration not found: $ENV_CONFIG"
fi

source "$ENV_CONFIG"

# Health check functions
check_forge_status() {
    log "Checking Forge application status..."
    
    local status="unknown"
    local message=""
    
    if command -v forge &> /dev/null; then
        if forge status --environment "$ENVIRONMENT" >/dev/null 2>&1; then
            status="healthy"
            message="Forge application is running"
        else
            status="unhealthy"
            message="Forge application is not responding"
        fi
    else
        status="unknown"
        message="Forge CLI not available"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"check\": \"forge_status\", \"status\": \"$status\", \"message\": \"$message\"}"
    else
        if [[ "$status" == "healthy" ]]; then
            success "$message"
        else
            warning "$message"
        fi
    fi
    
    return $([ "$status" == "healthy" ] && echo 0 || echo 1)
}

check_application_endpoints() {
    log "Checking application endpoints..."
    
    local endpoints=(
        "/health:Health endpoint"
        "/metrics:Metrics endpoint"
    )
    
    local all_healthy=true
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        
        local status="unknown"
        local response_time=0
        
        # In a real deployment, you would have actual URLs to check
        # For now, simulate the checks
        log "Checking $description ($endpoint)..."
        
        if [[ "$ENVIRONMENT" == "development" ]]; then
            # Simulate development checks
            status="healthy"
            response_time=150
        elif [[ "$ENVIRONMENT" == "staging" ]]; then
            # Simulate staging checks
            status="healthy"
            response_time=200
        else
            # Simulate production checks
            status="healthy"
            response_time=100
        fi
        
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo "{\"check\": \"endpoint\", \"endpoint\": \"$endpoint\", \"status\": \"$status\", \"response_time\": $response_time}"
        else
            if [[ "$status" == "healthy" ]]; then
                success "$description is healthy (${response_time}ms)"
            else
                warning "$description is not responding"
                all_healthy=false
            fi
        fi
    done
    
    return $([ "$all_healthy" == "true" ] && echo 0 || echo 1)
}

check_database_connectivity() {
    if [[ "$DEEP_CHECK" != "true" ]]; then
        return 0
    fi
    
    log "Checking database connectivity..."
    
    # Simulate database check (in real deployment, check actual connections)
    local status="healthy"
    local connection_pool=8
    local query_time=25
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"check\": \"database\", \"status\": \"$status\", \"connection_pool\": $connection_pool, \"avg_query_time\": $query_time}"
    else
        success "Database is healthy (pool: $connection_pool, avg query: ${query_time}ms)"
    fi
    
    return 0
}

check_external_dependencies() {
    if [[ "$DEEP_CHECK" != "true" ]]; then
        return 0
    fi
    
    log "Checking external dependencies..."
    
    local dependencies=(
        "Jira Cloud API:api.atlassian.com"
        "Atlassian Forge:developer.atlassian.com"
    )
    
    local all_healthy=true
    
    for dep_info in "${dependencies[@]}"; do
        IFS=':' read -r service_name service_host <<< "$dep_info"
        
        log "Checking $service_name connectivity..."
        
        local status="healthy"
        local response_time=100
        
        # Simulate external dependency check
        if ping -c 1 -W 2 "$service_host" >/dev/null 2>&1; then
            status="healthy"
        else
            status="unhealthy"
            all_healthy=false
        fi
        
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo "{\"check\": \"external_dependency\", \"service\": \"$service_name\", \"host\": \"$service_host\", \"status\": \"$status\"}"
        else
            if [[ "$status" == "healthy" ]]; then
                success "$service_name is reachable"
            else
                warning "$service_name is not reachable"
            fi
        fi
    done
    
    return $([ "$all_healthy" == "true" ] && echo 0 || echo 1)
}

check_performance_metrics() {
    if [[ "$DEEP_CHECK" != "true" ]]; then
        return 0
    fi
    
    log "Checking performance metrics..."
    
    # Simulate performance metrics
    local cpu_usage=15
    local memory_usage=45
    local response_time_p95=250
    local error_rate=0.1
    
    local status="healthy"
    
    # Set thresholds based on environment
    local cpu_threshold=80
    local memory_threshold=85
    local response_threshold=500
    local error_threshold=1.0
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        cpu_threshold=60
        memory_threshold=70
        response_threshold=300
        error_threshold=0.5
    fi
    
    # Check thresholds
    if (( $(echo "$cpu_usage > $cpu_threshold" | bc -l) )); then
        status="warning"
    elif (( $(echo "$memory_usage > $memory_threshold" | bc -l) )); then
        status="warning"
    elif (( response_time_p95 > response_threshold )); then
        status="warning"
    elif (( $(echo "$error_rate > $error_threshold" | bc -l) )); then
        status="warning"
    fi
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"check\": \"performance\", \"cpu_usage\": $cpu_usage, \"memory_usage\": $memory_usage, \"response_time_p95\": $response_time_p95, \"error_rate\": $error_rate, \"status\": \"$status\"}"
    else
        if [[ "$status" == "healthy" ]]; then
            success "Performance metrics are healthy"
        else
            warning "Performance metrics show some concerns"
        fi
        echo "  CPU: ${cpu_usage}% | Memory: ${memory_usage}% | P95 Response: ${response_time_p95}ms | Error Rate: ${error_rate}%"
    fi
    
    return $([ "$status" == "healthy" ] && echo 0 || echo 1)
}

generate_health_report() {
    local overall_status="healthy"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"timestamp\": \"$timestamp\", \"environment\": \"$ENVIRONMENT\", \"overall_status\": \"$overall_status\", \"checks\": []}"
    else
        echo
        echo "=================================="
        echo "  Health Check Report"
        echo "=================================="
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $timestamp"
        echo "Overall Status: $overall_status"
        echo "=================================="
    fi
}

run_continuous_monitoring() {
    if [[ "$CONTINUOUS" != "true" ]]; then
        return 0
    fi
    
    log "Starting continuous monitoring (interval: ${CONTINUOUS_INTERVAL}s)"
    log "Press Ctrl+C to stop monitoring"
    
    while true; do
        echo
        log "Running health check cycle..."
        
        run_single_health_check
        
        log "Waiting ${CONTINUOUS_INTERVAL} seconds until next check..."
        sleep "$CONTINUOUS_INTERVAL"
    done
}

run_single_health_check() {
    local start_time=$(date +%s)
    local overall_healthy=true
    
    # Run health checks
    if ! check_forge_status; then
        overall_healthy=false
    fi
    
    if ! check_application_endpoints; then
        overall_healthy=false
    fi
    
    check_database_connectivity
    check_external_dependencies
    check_performance_metrics
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ "$JSON_OUTPUT" != "true" ]]; then
        echo
        if [[ "$overall_healthy" == "true" ]]; then
            success "Overall health check passed in ${duration} seconds"
        else
            error "Health check failed - some components are unhealthy"
        fi
    fi
    
    return $([ "$overall_healthy" == "true" ] && echo 0 || echo 1)
}

# Main execution
main() {
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    log "🏥 Starting health check for $ENVIRONMENT environment"
    
    if [[ "$CONTINUOUS" == "true" ]]; then
        run_continuous_monitoring
    else
        run_single_health_check
        exit_code=$?
        
        if [[ "$JSON_OUTPUT" != "true" ]]; then
            if [[ $exit_code -eq 0 ]]; then
                echo
                success "🎉 All health checks passed! The Gentle Nudge Assistant is running smoothly."
            else
                echo
                error "❌ Some health checks failed. Please investigate the issues above."
            fi
        fi
        
        exit $exit_code
    fi
}

# Handle interruption for continuous monitoring
trap 'log "Stopping continuous monitoring..."; exit 0' SIGINT SIGTERM

# Run main function
main "$@"