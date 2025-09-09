#!/bin/bash

# Gentle Nudge Assistant - Monitoring Setup Script
# Sets up comprehensive monitoring, logging, and alerting

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MONITORING_DIR="${PROJECT_ROOT}/monitoring"

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
Usage: $0 [OPTIONS] ENVIRONMENT

Set up monitoring infrastructure for the Gentle Nudge Assistant.

ENVIRONMENTS:
    development     Setup development monitoring
    staging         Setup staging monitoring  
    production      Setup production monitoring

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    --skip-sentry          Skip Sentry error tracking setup
    --skip-grafana         Skip Grafana dashboard setup
    --skip-prometheus      Skip Prometheus metrics setup
    --skip-alerts          Skip alerting configuration
    --dry-run              Show what would be configured

EXAMPLES:
    $0 production                    # Full production monitoring setup
    $0 --skip-sentry staging        # Staging setup without Sentry
    $0 --dry-run development        # Preview development setup

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERBOSE=false
SKIP_SENTRY=false
SKIP_GRAFANA=false
SKIP_PROMETHEUS=false
SKIP_ALERTS=false
DRY_RUN=false

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
        --skip-sentry)
            SKIP_SENTRY=true
            shift
            ;;
        --skip-grafana)
            SKIP_GRAFANA=true
            shift
            ;;
        --skip-prometheus)
            SKIP_PROMETHEUS=true
            shift
            ;;
        --skip-alerts)
            SKIP_ALERTS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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
ENV_CONFIG="${PROJECT_ROOT}/deploy/environments/${ENVIRONMENT}.env"
if [[ ! -f "$ENV_CONFIG" ]]; then
    error "Environment configuration not found: $ENV_CONFIG"
fi

source "$ENV_CONFIG"

# Monitoring setup functions
setup_health_checks() {
    log "Setting up health check endpoints..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up health check configuration"
        return
    fi
    
    # Create health check configuration
    cat > "${MONITORING_DIR}/config/health-checks.json" << EOF
{
  "environment": "$ENVIRONMENT",
  "checks": [
    {
      "name": "forge_connectivity",
      "url": "https://api.atlassian.com/health",
      "timeout": 10,
      "interval": 30,
      "retries": 3
    },
    {
      "name": "application_health",
      "internal": true,
      "component": "notification_engine",
      "interval": 60
    },
    {
      "name": "storage_health", 
      "internal": true,
      "component": "forge_storage",
      "interval": 120
    }
  ],
  "alerting": {
    "enabled": $([ "$ENVIRONMENT" != "development" ] && echo "true" || echo "false"),
    "threshold": 3,
    "notification_channels": ["email", "slack"]
  }
}
EOF
    
    success "Health checks configured for $ENVIRONMENT"
}

setup_metrics_collection() {
    if [[ "$SKIP_PROMETHEUS" == "true" ]]; then
        warning "Skipping Prometheus metrics setup"
        return
    fi
    
    log "Setting up metrics collection..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up Prometheus metrics collection"
        return
    fi
    
    # Create Prometheus configuration
    cat > "${MONITORING_DIR}/config/prometheus.yml" << EOF
global:
  scrape_interval: 30s
  evaluation_interval: 30s
  external_labels:
    environment: '$ENVIRONMENT'
    application: 'gentle-nudge-assistant'

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'gentle-nudge-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/internal/metrics'
    scrape_interval: 30s
    
  - job_name: 'gentle-nudge-business'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/internal/business-metrics'
    scrape_interval: 300s # 5 minutes for business metrics

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

EOF

    # Create alert rules
    cat > "${MONITORING_DIR}/config/alert_rules.yml" << EOF
groups:
  - name: gentle_nudge_alerts
    rules:
      - alert: ApplicationDown
        expr: up{job="gentle-nudge-app"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Gentle Nudge Assistant is down"
          description: "Application has been down for more than 5 minutes"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }}"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High response times detected"
          description: "95th percentile response time is {{ \$value }}s"
          
      - alert: LowUserEngagement
        expr: user_engagement_score < 50
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "User engagement dropping"
          description: "User engagement score is {{ \$value }}"

EOF
    
    success "Metrics collection configured"
}

setup_error_tracking() {
    if [[ "$SKIP_SENTRY" == "true" ]]; then
        warning "Skipping Sentry error tracking setup"
        return
    fi
    
    log "Setting up error tracking with Sentry..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up Sentry error tracking"
        return
    fi
    
    # Create Sentry configuration
    cat > "${MONITORING_DIR}/config/sentry.json" << EOF
{
  "dsn": "\${SENTRY_DSN}",
  "environment": "$ENVIRONMENT",
  "release": "\${npm_package_version}",
  "sampleRate": $([ "$ENVIRONMENT" == "production" ] && echo "1.0" || echo "1.0"),
  "debug": $([ "$ENVIRONMENT" == "development" ] && echo "true" || echo "false"),
  
  "beforeSend": {
    "filterErrors": [
      "Network Error",
      "AbortError", 
      "Non-Error promise rejection"
    ],
    "filterUrls": [
      "/health",
      "/metrics",
      "chrome-extension://"
    ]
  },
  
  "performance": {
    "enabled": true,
    "sampleRate": $([ "$ENVIRONMENT" == "production" ] && echo "0.1" || echo "0.5")
  },
  
  "integrations": {
    "attachStacktrace": true,
    "captureConsole": $([ "$ENVIRONMENT" == "development" ] && echo "true" || echo "false"),
    "captureUnhandledRejections": true
  }
}
EOF
    
    success "Error tracking configured"
}

setup_logging() {
    log "Setting up structured logging..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up logging configuration"
        return
    fi
    
    # Create logging configuration
    cat > "${MONITORING_DIR}/config/logging.json" << EOF
{
  "level": "$LOG_LEVEL",
  "format": "json",
  "timestamp": true,
  "prettyPrint": $([ "$ENVIRONMENT" == "development" ] && echo "true" || echo "false"),
  
  "transports": [
    {
      "type": "console",
      "level": "$LOG_LEVEL"
    }
  ],
  
  "sampling": {
    "enabled": $([ "$ENVIRONMENT" == "production" ] && echo "true" || echo "false"),
    "rate": $([ "$ENVIRONMENT" == "production" ] && echo "0.1" || echo "1.0")
  },
  
  "categories": {
    "application": { "level": "info", "enabled": true },
    "security": { "level": "warn", "enabled": true },
    "performance": { "level": "info", "enabled": true },
    "business": { "level": "info", "enabled": true },
    "notifications": { "level": "info", "enabled": true }
  },
  
  "privacy": {
    "excludeUserData": true,
    "excludePersonalInfo": true,
    "maskSensitiveFields": true
  }
}
EOF
    
    success "Logging configured"
}

setup_dashboards() {
    if [[ "$SKIP_GRAFANA" == "true" ]]; then
        warning "Skipping Grafana dashboard setup"
        return
    fi
    
    log "Setting up monitoring dashboards..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up Grafana dashboards"
        return
    fi
    
    # Create system health dashboard
    cat > "${MONITORING_DIR}/dashboards/system-health.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Gentle Nudge Assistant - System Health",
    "description": "System health and performance monitoring",
    "editable": true,
    "graphTooltip": 0,
    "hideControls": false,
    "links": [],
    "refresh": "30s",
    "schemaVersion": 16,
    "style": "dark",
    "tags": ["gentle-nudge", "system-health"],
    "templating": {
      "list": []
    },
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "timepicker": {
      "refresh_intervals": ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h"],
      "time_options": ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d"]
    },
    "timezone": "",
    "version": 1,
    "panels": [
      {
        "id": 1,
        "title": "Application Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"gentle-nudge-app\"}",
            "legendFormat": "Application Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {"options": {"0": {"text": "DOWN", "color": "red"}}, "type": "value"},
              {"options": {"1": {"text": "UP", "color": "green"}}, "type": "value"}
            ]
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p99"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          },
          {
            "expr": "rate(http_requests_total{status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      }
    ]
  }
}
EOF

    # Create business metrics dashboard
    cat > "${MONITORING_DIR}/dashboards/business-metrics.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Gentle Nudge Assistant - Business Metrics",
    "description": "Key business metrics and user engagement",
    "editable": true,
    "refresh": "5m",
    "tags": ["gentle-nudge", "business-metrics"],
    "panels": [
      {
        "id": 1,
        "title": "User Adoption Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "user_adoption_rate",
            "legendFormat": "Adoption Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "green", "value": 85}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Notifications Sent",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(notifications_sent_total[5m])",
            "legendFormat": "Notifications per second"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "User Satisfaction",
        "type": "gauge",
        "targets": [
          {
            "expr": "user_satisfaction_score",
            "legendFormat": "Satisfaction Score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 1,
            "max": 5,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 1},
                {"color": "yellow", "value": 3.5},
                {"color": "green", "value": 4.5}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      }
    ]
  }
}
EOF
    
    success "Monitoring dashboards created"
}

setup_alerting() {
    if [[ "$SKIP_ALERTS" == "true" ]]; then
        warning "Skipping alerting setup"
        return
    fi
    
    log "Setting up alerting configuration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up alerting configuration"
        return
    fi
    
    # Create alertmanager configuration
    cat > "${MONITORING_DIR}/config/alertmanager.yml" << EOF
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@gentlenudge.app'
  
  slack_api_url: '${SLACK_WEBHOOK_URL:-}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'gentle-nudge-alerts'
  
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      
    - match:
        severity: warning  
      receiver: 'warning-alerts'

receivers:
  - name: 'gentle-nudge-alerts'
    email_configs:
      - to: 'team@gentlenudge.app'
        subject: '🔔 Gentle Nudge Alert - {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Environment: $ENVIRONMENT
          {{ end }}
        
  - name: 'critical-alerts'
    email_configs:
      - to: 'alerts@gentlenudge.app'
        subject: '🚨 CRITICAL - Gentle Nudge Alert'
    slack_configs:
      - channel: '#alerts'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          🚨 {{ .Annotations.summary }}
          Environment: $ENVIRONMENT
          {{ .Annotations.description }}
          {{ end }}
        
  - name: 'warning-alerts'
    slack_configs:
      - channel: '#monitoring'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: |
          {{ range .Alerts }}
          ⚠️ {{ .Annotations.summary }}
          Environment: $ENVIRONMENT
          {{ end }}

EOF
    
    success "Alerting configured"
}

setup_security_monitoring() {
    log "Setting up security monitoring..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would set up security monitoring"
        return
    fi
    
    # Create security monitoring configuration
    cat > "${MONITORING_DIR}/config/security-monitoring.json" << EOF
{
  "environment": "$ENVIRONMENT",
  "audit_logging": {
    "enabled": true,
    "events": [
      "user_login",
      "admin_action", 
      "configuration_change",
      "data_export",
      "privacy_request"
    ],
    "retention_days": $([ "$ENVIRONMENT" == "production" ] && echo "365" || echo "90")
  },
  
  "rate_limiting": {
    "monitoring": true,
    "alert_threshold": 90,
    "rules": [
      {
        "path": "/api/*",
        "limit": 1000,
        "window": "1h"
      },
      {
        "path": "/internal/*", 
        "limit": 100,
        "window": "1h"
      }
    ]
  },
  
  "security_alerts": [
    {
      "name": "suspicious_login_attempts",
      "condition": "failed_login_attempts > 10 in 5m",
      "severity": "warning"
    },
    {
      "name": "rate_limit_violations",
      "condition": "rate_limit_exceeded > 5 in 5m", 
      "severity": "warning"
    },
    {
      "name": "unusual_data_access",
      "condition": "bulk_data_access without admin_role",
      "severity": "critical"
    }
  ]
}
EOF
    
    success "Security monitoring configured"
}

validate_configuration() {
    log "Validating monitoring configuration..."
    
    local config_files=(
        "${MONITORING_DIR}/config/monitoring.yml"
        "${MONITORING_DIR}/config/health-checks.json"
        "${MONITORING_DIR}/config/logging.json"
    )
    
    for config_file in "${config_files[@]}"; do
        if [[ ! -f "$config_file" ]]; then
            error "Missing configuration file: $config_file"
        fi
    done
    
    # Validate YAML syntax
    if command -v yamllint &> /dev/null; then
        yamllint "${MONITORING_DIR}/config/monitoring.yml" || warning "YAML validation failed"
    fi
    
    # Validate JSON syntax
    for json_file in "${MONITORING_DIR}"/config/*.json; do
        if [[ -f "$json_file" ]]; then
            python3 -m json.tool "$json_file" > /dev/null || warning "JSON validation failed for $json_file"
        fi
    done
    
    success "Configuration validation completed"
}

# Main execution
main() {
    log "🔧 Setting up monitoring infrastructure for $ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Create monitoring directories
    mkdir -p "${MONITORING_DIR}"/{config,scripts,dashboards,logs}
    
    # Setup monitoring components
    setup_health_checks
    setup_metrics_collection
    setup_error_tracking
    setup_logging
    setup_dashboards
    setup_alerting
    setup_security_monitoring
    
    # Validate configuration
    validate_configuration
    
    success "🎉 Monitoring infrastructure setup completed!"
    
    # Show summary
    echo
    echo "=================================================="
    echo "  Monitoring Setup Summary"
    echo "=================================================="
    echo "Environment: $ENVIRONMENT"
    echo "Health Checks: ✅ Configured"
    echo "Metrics: $([ "$SKIP_PROMETHEUS" == "true" ] && echo "⏭️  Skipped" || echo "✅ Configured")"
    echo "Error Tracking: $([ "$SKIP_SENTRY" == "true" ] && echo "⏭️  Skipped" || echo "✅ Configured")"
    echo "Dashboards: $([ "$SKIP_GRAFANA" == "true" ] && echo "⏭️  Skipped" || echo "✅ Configured")"
    echo "Alerting: $([ "$SKIP_ALERTS" == "true" ] && echo "⏭️  Skipped" || echo "✅ Configured")"
    echo "Security: ✅ Configured"
    echo "=================================================="
    echo
    echo "Next steps:"
    echo "1. Set environment variables for external services"
    echo "2. Deploy monitoring configuration to $ENVIRONMENT"
    echo "3. Test alerting channels and dashboards"
    echo "4. Review and adjust thresholds as needed"
}

# Run main function
main "$@"