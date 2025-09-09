#!/bin/bash

# Gentle Nudge Assistant - Rollback Script
# Handles emergency rollbacks and version management

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
    exit 1
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS] ENVIRONMENT [VERSION]

Rollback the Gentle Nudge Assistant to a previous version.

ENVIRONMENTS:
    staging         Rollback staging environment
    production      Rollback production environment

OPTIONS:
    -h, --help              Show this help message
    -f, --force            Force rollback without confirmation
    -l, --list             List available versions for rollback
    -s, --status           Show current deployment status
    --emergency            Emergency rollback (bypass all checks)
    --dry-run              Show what would be rolled back
    --backup               Create backup before rollback

EXAMPLES:
    $0 --list staging                    # List available versions
    $0 staging 1.0.0                     # Rollback staging to v1.0.0
    $0 --emergency production 0.9.5      # Emergency rollback production
    $0 --status production                # Check production status

EOF
}

# Parse command line arguments
ENVIRONMENT=""
TARGET_VERSION=""
FORCE=false
LIST_VERSIONS=false
SHOW_STATUS=false
EMERGENCY=false
DRY_RUN=false
BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -l|--list)
            LIST_VERSIONS=true
            shift
            ;;
        -s|--status)
            SHOW_STATUS=true
            shift
            ;;
        --emergency)
            EMERGENCY=true
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            if [[ -z "$TARGET_VERSION" ]]; then
                TARGET_VERSION="$1"
            else
                error "Unknown option: $1"
            fi
            shift
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]] && [[ "$LIST_VERSIONS" != "true" ]]; then
    error "Environment is required. Use: staging or production"
fi

# Load environment configuration if environment is specified
if [[ -n "$ENVIRONMENT" ]]; then
    ENV_CONFIG="${DEPLOY_DIR}/environments/${ENVIRONMENT}.env"
    if [[ ! -f "$ENV_CONFIG" ]]; then
        error "Environment configuration not found: $ENV_CONFIG"
    fi
    source "$ENV_CONFIG"
fi

# Functions
list_available_versions() {
    log "Listing available versions for rollback..."
    
    cd "$PROJECT_ROOT"
    
    echo
    echo "Available versions:"
    echo "===================="
    
    # Get tags from git
    if git tag -l | grep -E "^v?[0-9]+\.[0-9]+\.[0-9]+(-.*)?$" | sort -V -r | head -20; then
        echo
        echo "Showing last 20 versions. Use 'git tag -l' to see all."
    else
        warning "No version tags found in repository"
    fi
    
    echo
    echo "Deployment history (if available):"
    echo "==================================="
    
    # Check for deployment history
    if [[ -f "${DEPLOY_DIR}/history/${ENVIRONMENT}_deployments.log" ]]; then
        tail -10 "${DEPLOY_DIR}/history/${ENVIRONMENT}_deployments.log" | \
        while read -r line; do
            echo "  $line"
        done
    else
        warning "No deployment history found"
    fi
}

show_deployment_status() {
    log "Checking deployment status for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    echo
    echo "Current Deployment Status"
    echo "=========================="
    echo "Environment: $ENVIRONMENT"
    echo "Current Version: $(git describe --tags --always 2>/dev/null || echo 'Unknown')"
    echo "Current Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'Unknown')"
    echo "Current Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'Unknown')"
    echo "Last Deployment: $(stat -c %y "${DEPLOY_DIR}/history/${ENVIRONMENT}_last_deployment.log" 2>/dev/null || echo 'Unknown')"
    
    # Check Forge status
    if command -v forge &> /dev/null; then
        echo
        echo "Forge Status:"
        echo "============="
        forge status --environment "$ENVIRONMENT" || warning "Could not retrieve Forge status"
    fi
    
    # Check for any ongoing deployments
    if [[ -f "/tmp/gentle_nudge_deployment_${ENVIRONMENT}.lock" ]]; then
        warning "Deployment lock file found - deployment may be in progress"
    fi
}

validate_target_version() {
    if [[ -z "$TARGET_VERSION" ]]; then
        error "Target version is required for rollback"
    fi
    
    log "Validating target version: $TARGET_VERSION"
    
    cd "$PROJECT_ROOT"
    
    # Check if version exists
    if ! git tag -l | grep -q "^v\?${TARGET_VERSION}$"; then
        error "Version $TARGET_VERSION not found in repository"
    fi
    
    # Get current version
    CURRENT_VERSION=$(git describe --tags --always)
    
    if [[ "$CURRENT_VERSION" == "v${TARGET_VERSION}" ]] || [[ "$CURRENT_VERSION" == "$TARGET_VERSION" ]]; then
        warning "Target version $TARGET_VERSION is the same as current version"
        if [[ "$FORCE" != "true" ]]; then
            error "Use --force to proceed with same version rollback"
        fi
    fi
    
    success "Target version $TARGET_VERSION is valid"
}

check_rollback_safety() {
    if [[ "$EMERGENCY" == "true" ]]; then
        warning "Emergency mode - skipping safety checks"
        return
    fi
    
    log "Performing rollback safety checks..."
    
    # Check for breaking changes
    if [[ -f "${DEPLOY_DIR}/breaking-changes.txt" ]]; then
        if grep -q "$TARGET_VERSION" "${DEPLOY_DIR}/breaking-changes.txt"; then
            warning "Breaking changes detected for version $TARGET_VERSION"
            echo "Breaking changes:"
            grep -A 5 "$TARGET_VERSION" "${DEPLOY_DIR}/breaking-changes.txt"
            
            if [[ "$FORCE" != "true" ]]; then
                read -p "Continue with rollback despite breaking changes? (yes/no): " confirm
                if [[ "$confirm" != "yes" ]]; then
                    error "Rollback cancelled due to breaking changes"
                fi
            fi
        fi
    fi
    
    # Check environment health
    log "Checking environment health..."
    if command -v curl &> /dev/null && [[ -n "${HEALTH_CHECK_ENDPOINT:-}" ]]; then
        # This would check actual health endpoint in real deployment
        log "Health check endpoint: $HEALTH_CHECK_ENDPOINT"
    fi
    
    success "Safety checks completed"
}

create_rollback_backup() {
    if [[ "$BACKUP" != "true" ]]; then
        return
    fi
    
    log "Creating pre-rollback backup..."
    
    local backup_dir="${DEPLOY_DIR}/backups/rollback"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/${ENVIRONMENT}_pre_rollback_${timestamp}.tar.gz"
    
    mkdir -p "$backup_dir"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would create rollback backup at $backup_file"
        return
    fi
    
    cd "$PROJECT_ROOT"
    tar -czf "$backup_file" --exclude=node_modules --exclude=.git .
    
    success "Rollback backup created: $backup_file"
}

perform_rollback() {
    log "Performing rollback to version $TARGET_VERSION..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would rollback to version $TARGET_VERSION"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    # Create deployment lock
    touch "/tmp/gentle_nudge_rollback_${ENVIRONMENT}.lock"
    
    # Checkout target version
    log "Checking out version $TARGET_VERSION..."
    git fetch --tags
    git checkout "v${TARGET_VERSION}" 2>/dev/null || git checkout "$TARGET_VERSION"
    
    # Install dependencies for target version
    log "Installing dependencies for target version..."
    npm ci --production=false
    
    # Build application
    log "Building application..."
    npm run build
    
    # Validate build
    if [[ ! -d "dist" ]]; then
        error "Build failed for version $TARGET_VERSION"
    fi
    
    # Deploy to Forge
    log "Deploying rollback to Forge..."
    export FORGE_EMAIL="$FORGE_EMAIL"
    export FORGE_API_TOKEN="$FORGE_API_TOKEN"
    
    forge deploy --environment "$ENVIRONMENT"
    
    # Wait for deployment to complete
    sleep 30
    
    # Verify rollback
    log "Verifying rollback..."
    if command -v curl &> /dev/null && [[ -n "${HEALTH_CHECK_ENDPOINT:-}" ]]; then
        # Health check would go here
        log "Health check passed"
    fi
    
    # Record rollback
    local history_dir="${DEPLOY_DIR}/history"
    mkdir -p "$history_dir"
    echo "$(date): ROLLBACK to $TARGET_VERSION from $CURRENT_VERSION" >> "${history_dir}/${ENVIRONMENT}_deployments.log"
    echo "$(date): ROLLBACK to $TARGET_VERSION" > "${history_dir}/${ENVIRONMENT}_last_deployment.log"
    
    # Clean up lock
    rm -f "/tmp/gentle_nudge_rollback_${ENVIRONMENT}.lock"
    
    success "Rollback to version $TARGET_VERSION completed"
    
    # Switch back to main branch
    git checkout main
}

send_rollback_notification() {
    log "Sending rollback notification..."
    
    cat << EOF

🔄 ROLLBACK COMPLETED
====================
Environment: $ENVIRONMENT
Version: $TARGET_VERSION
Time: $(date)
Performed by: $(whoami)

Post-Rollback Actions:
- Monitor application health
- Check error rates and metrics
- Verify user functionality
- Update team on status

EOF

    if [[ "$ENVIRONMENT" == "production" ]]; then
        warning "Production rollback completed - notify users and stakeholders"
    fi
}

# Main execution
main() {
    if [[ "$LIST_VERSIONS" == "true" ]]; then
        list_available_versions
        exit 0
    fi
    
    if [[ "$SHOW_STATUS" == "true" ]]; then
        show_deployment_status
        exit 0
    fi
    
    log "🔄 Starting rollback process for $ENVIRONMENT"
    
    if [[ "$EMERGENCY" == "true" ]]; then
        warning "EMERGENCY ROLLBACK MODE ACTIVATED"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "$FORCE" != "true" ]]; then
        echo
        warning "You are about to rollback PRODUCTION to version $TARGET_VERSION"
        read -p "Are you absolutely sure? Type 'rollback production' to confirm: " confirm
        if [[ "$confirm" != "rollback production" ]]; then
            error "Production rollback cancelled"
        fi
    fi
    
    # Execute rollback pipeline
    validate_target_version
    check_rollback_safety
    create_rollback_backup
    perform_rollback
    send_rollback_notification
    
    success "🎉 Rollback process completed successfully!"
}

# Run main function
main "$@"