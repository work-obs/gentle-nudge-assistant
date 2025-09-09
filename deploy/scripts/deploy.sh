#!/bin/bash

# Gentle Nudge Assistant - Deployment Script
# Automates Forge deployment across environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEPLOY_DIR="${PROJECT_ROOT}/deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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
    exit 1
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS] ENVIRONMENT

Deploy the Gentle Nudge Assistant to specified environment.

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment  
    production      Deploy to production environment

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -d, --dry-run          Show what would be deployed without actually deploying
    -f, --force            Force deployment even if validation fails
    -r, --rollback VERSION Rollback to specified version
    --skip-tests           Skip running tests before deployment
    --skip-build           Skip building the application
    --no-install           Skip npm install
    --backup               Create backup before deployment

EXAMPLES:
    $0 development                    # Deploy to development
    $0 --dry-run staging             # Dry run deployment to staging
    $0 --rollback 1.0.0 production   # Rollback production to v1.0.0
    $0 --force --skip-tests staging  # Force deploy to staging without tests

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERBOSE=false
DRY_RUN=false
FORCE=false
ROLLBACK_VERSION=""
SKIP_TESTS=false
SKIP_BUILD=false
NO_INSTALL=false
BACKUP=false

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
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-install)
            NO_INSTALL=true
            shift
            ;;
        --backup)
            BACKUP=true
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

# Set verbose mode
if [[ "$VERBOSE" == "true" ]]; then
    set -x
fi

# Load environment configuration
ENV_CONFIG="${DEPLOY_DIR}/environments/${ENVIRONMENT}.env"
if [[ ! -f "$ENV_CONFIG" ]]; then
    error "Environment configuration not found: $ENV_CONFIG"
fi

log "Loading configuration for environment: $ENVIRONMENT"
source "$ENV_CONFIG"

# Validate required environment variables
required_vars=(
    "FORGE_EMAIL"
    "FORGE_API_TOKEN"
    "APP_ID"
    "ENVIRONMENT_NAME"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        error "Required environment variable not set: $var"
    fi
done

# Functions
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="20.0.0"
    
    if ! npx semver "$node_version" -r ">=$required_version" &> /dev/null; then
        error "Node.js version $required_version or higher is required (found: v$node_version)"
    fi
    
    # Check Forge CLI
    if ! command -v forge &> /dev/null; then
        error "Forge CLI is required. Install with: npm install -g @forge/cli"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is required but not installed"
    fi
    
    success "Prerequisites check passed"
}

install_dependencies() {
    if [[ "$NO_INSTALL" == "true" ]]; then
        warning "Skipping dependency installation"
        return
    fi
    
    log "Installing dependencies..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run npm ci"
        return
    fi
    
    npm ci --production=false
    success "Dependencies installed"
}

run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warning "Skipping tests"
        return
    fi
    
    log "Running tests..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run test suite"
        return
    fi
    
    # Run different test suites based on environment
    case "$ENVIRONMENT" in
        development)
            npm run test -- --coverage
            ;;
        staging)
            npm run test:ci
            ;;
        production)
            npm run test:ci
            npm run test:e2e
            ;;
    esac
    
    success "Tests passed"
}

build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        warning "Skipping build"
        return
    fi
    
    log "Building application..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would build application"
        return
    fi
    
    # Clean previous build
    rm -rf dist/
    
    # Build TypeScript
    npm run build
    
    # Validate build artifacts
    if [[ ! -d "dist" ]]; then
        error "Build failed - no dist directory found"
    fi
    
    success "Application built successfully"
}

validate_forge_manifest() {
    log "Validating Forge manifest..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would validate Forge manifest"
        return
    fi
    
    # Lint manifest
    if ! forge lint; then
        error "Forge manifest validation failed"
    fi
    
    success "Forge manifest is valid"
}

create_backup() {
    if [[ "$BACKUP" != "true" ]] || [[ "$ENVIRONMENT" == "development" ]]; then
        return
    fi
    
    log "Creating deployment backup..."
    
    local backup_dir="${DEPLOY_DIR}/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/${ENVIRONMENT}_backup_${timestamp}.tar.gz"
    
    mkdir -p "$backup_dir"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would create backup at $backup_file"
        return
    fi
    
    # Create backup of current deployment
    cd "$PROJECT_ROOT"
    tar -czf "$backup_file" --exclude=node_modules --exclude=.git .
    
    success "Backup created: $backup_file"
    
    # Clean old backups (keep last 5)
    find "$backup_dir" -name "${ENVIRONMENT}_backup_*.tar.gz" -type f | \
        sort -r | tail -n +6 | xargs -r rm
}

deploy_to_forge() {
    log "Deploying to Forge environment: $ENVIRONMENT"
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would deploy to Forge"
        return
    fi
    
    # Set environment for deployment
    export FORGE_EMAIL="$FORGE_EMAIL"
    export FORGE_API_TOKEN="$FORGE_API_TOKEN"
    
    # Deploy based on environment
    case "$ENVIRONMENT" in
        development)
            forge deploy --environment development
            ;;
        staging)
            forge deploy --environment staging
            ;;
        production)
            # Production requires additional confirmation
            if [[ "$FORCE" != "true" ]]; then
                read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
                if [[ "$confirm" != "yes" ]]; then
                    error "Production deployment cancelled by user"
                fi
            fi
            forge deploy --environment production
            ;;
    esac
    
    success "Deployment to $ENVIRONMENT completed"
}

rollback_deployment() {
    if [[ -z "$ROLLBACK_VERSION" ]]; then
        return
    fi
    
    log "Rolling back to version: $ROLLBACK_VERSION"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would rollback to version $ROLLBACK_VERSION"
        return
    fi
    
    # Production rollback requires confirmation
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "$FORCE" != "true" ]]; then
        read -p "Are you sure you want to rollback PRODUCTION to $ROLLBACK_VERSION? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            error "Production rollback cancelled by user"
        fi
    fi
    
    cd "$PROJECT_ROOT"
    
    # Checkout the specific version
    git fetch --tags
    git checkout "v${ROLLBACK_VERSION}"
    
    # Reinstall dependencies for this version
    npm ci
    
    # Build and deploy
    npm run build
    forge deploy --environment "$ENVIRONMENT"
    
    success "Rollback to version $ROLLBACK_VERSION completed"
    
    # Switch back to main branch
    git checkout main
}

post_deployment_validation() {
    log "Running post-deployment validation..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run post-deployment validation"
        return
    fi
    
    # Wait for deployment to be active
    sleep 30
    
    # Basic health check (this would be expanded with actual health check endpoints)
    log "Validating deployment health..."
    
    # Run post-deployment tests if available
    if [[ -f "$PROJECT_ROOT/scripts/post-deployment-test.sh" ]]; then
        bash "$PROJECT_ROOT/scripts/post-deployment-test.sh" "$ENVIRONMENT"
    fi
    
    success "Post-deployment validation completed"
}

# Main execution
main() {
    log "🚀 Starting deployment of Gentle Nudge Assistant to $ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Execute deployment pipeline
    check_prerequisites
    install_dependencies
    run_tests
    build_application
    validate_forge_manifest
    create_backup
    
    if [[ -n "$ROLLBACK_VERSION" ]]; then
        rollback_deployment
    else
        deploy_to_forge
    fi
    
    post_deployment_validation
    
    success "🎉 Deployment completed successfully!"
    
    # Show deployment info
    echo
    echo "=================================================="
    echo "  Gentle Nudge Assistant Deployment Summary"
    echo "=================================================="
    echo "Environment: $ENVIRONMENT"
    echo "Version: $(cat package.json | grep '"version"' | cut -d'"' -f4)"
    echo "Deployed at: $(date)"
    echo "App ID: $APP_ID"
    echo "=================================================="
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo
        echo "🌟 Production deployment completed!"
        echo "Remember to:"
        echo "- Monitor the application logs"
        echo "- Check marketplace metrics"
        echo "- Update documentation if needed"
        echo "- Notify the team about the release"
    fi
}

# Run main function
main "$@"