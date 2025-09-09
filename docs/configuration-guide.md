# Configuration Guide - Gentle Nudge Assistant

This comprehensive guide covers all configuration options available in Gentle Nudge Assistant, helping you create the perfect setup for your workflow and preferences.

## Table of Contents

1. [Getting to Your Settings](#getting-to-your-settings)
2. [Personal Configuration](#personal-configuration)
3. [Team and Project Settings](#team-and-project-settings)
4. [Advanced Configuration](#advanced-configuration)
5. [Import/Export Settings](#importexport-settings)
6. [Troubleshooting Configuration](#troubleshooting-configuration)

## Getting to Your Settings

### Personal Settings Access

There are multiple ways to access your personal configuration:

**Method 1: Through Jira Settings**
1. Click your profile picture (top right)
2. Select "Jira settings"
3. Navigate to "Apps" in the left sidebar
4. Find "Gentle Nudge Assistant"
5. Click "Configure"

**Method 2: Through App Menu**
1. Click "Apps" in the top navigation
2. Select "Gentle Nudge Assistant"
3. Click "My Settings" in the dropdown

**Method 3: From Notifications**
1. Click on any gentle nudge notification
2. Select "Settings" from the action menu
3. This takes you directly to relevant settings

**Screenshot Placeholder**: [Multiple pathways to settings highlighted in Jira interface]

### Project Settings Access (Admins Only)

Project administrators can access team-level settings:

1. Go to your project
2. Click "Project settings" (left sidebar)
3. Under "Apps", find "Gentle Nudge Assistant"
4. Access "Team Configuration"

## Personal Configuration

### Notification Frequency Settings

Configure how often you receive different types of gentle nudges.

#### Stale Ticket Reminders

**Basic Settings**:
- **Threshold**: Days before a ticket is considered stale (1-30 days)
  - Default: 5 days
  - Recommendation: Start with 7 days, adjust based on your workflow
- **Frequency**: How often to remind about stale tickets
  - Options: Daily, Every 2 days, Every 3 days, Weekly
  - Default: Every 3 days

**Advanced Settings**:
```yaml
Stale Ticket Configuration:
  threshold_days: 5
  reminder_frequency: "every_3_days"
  priority_weighting:
    critical: 1    # Remind immediately when stale
    high: 2        # Remind after 2 days
    medium: 5      # Use standard threshold
    low: 10        # Wait 10 days before reminding
  
  workload_sensitivity: true
  max_stale_reminders_per_day: 3
  
  filters:
    exclude_labels: ["on-hold", "waiting-for-approval"]
    include_only_assigned: true
    exclude_resolved_parent: true
```

**Screenshot Placeholder**: [Stale ticket settings interface with sliders and dropdowns]

#### Deadline Notifications

**Timeline Configuration**:
- **Advance Warning Period**: How early to start deadline reminders
  - Options: 1-30 days before due date
  - Default: 7 days
- **Reminder Schedule**: When to send deadline reminders
  - Early: 7, 5, 3, 1 days before + day of
  - Standard: 7, 3, 1 days before + day of
  - Minimal: 3, 1 days before + day of
  - Custom: Define your own schedule

**Deadline Types**:
```yaml
Deadline Configuration:
  due_date_monitoring: true
  sla_deadline_monitoring: true
  sprint_deadline_monitoring: true
  custom_field_monitoring:
    - field_id: "customfield_10050"
      field_name: "Client Deadline"
      enabled: true
  
  reminder_schedule:
    - days_before: 7
      message_tone: "early_heads_up"
    - days_before: 3  
      message_tone: "friendly_reminder"
    - days_before: 1
      message_tone: "supportive_urgency"
    - days_before: 0
      message_tone: "encouraging_final"
```

**Screenshot Placeholder**: [Deadline configuration with timeline visualization]

#### Progress Updates

**Frequency Options**:
- **Weekly Summary**: Every Monday morning overview
- **Bi-weekly Progress**: Every other week comprehensive update
- **Monthly Achievement**: Monthly celebration of accomplishments
- **Custom Schedule**: Define your own progress update timing

**Content Configuration**:
```yaml
Progress Updates:
  frequency: "weekly"
  day_of_week: "monday"
  time_of_day: "09:00"
  
  include_sections:
    - achievements: true
    - stale_ticket_summary: true
    - upcoming_deadlines: true
    - team_collaboration: true
    - personal_goals: true
  
  celebration_threshold:
    completed_tickets: 5      # Celebrate when completing 5+ tickets
    consistent_updates: 7     # Celebrate 7+ days of consistent activity
    early_completions: 3      # Celebrate 3+ tickets completed early
```

### Communication Preferences

#### Tone Selection

**Available Tones**:

**Encouraging (Default)**:
- Language: Positive, uplifting, supportive
- Emojis: Frequent use of encouraging emojis ⭐ 💪 🌟
- Style: Focuses on empowerment and motivation
- Best For: Most users, especially those who respond well to positive reinforcement

*Example Configuration*:
```yaml
tone_settings:
  primary_tone: "encouraging"
  emoji_frequency: "high"
  motivation_level: "high"
  celebration_intensity: "enthusiastic"
```

**Professional**:
- Language: Formal, business-appropriate, direct
- Emojis: Minimal or none
- Style: Clear, concise, respectful
- Best For: Corporate environments, formal teams

*Example Configuration*:
```yaml
tone_settings:
  primary_tone: "professional"
  emoji_frequency: "none"
  formality_level: "high"
  directness: "moderate"
```

**Casual**:
- Language: Friendly, relaxed, conversational
- Emojis: Moderate use of friendly emojis 😊 👍 🙂
- Style: Like a helpful colleague or friend
- Best For: Close-knit teams, informal environments

*Example Configuration*:
```yaml
tone_settings:
  primary_tone: "casual"
  emoji_frequency: "moderate"
  friendliness_level: "high"
  informality: "moderate"
```

**Custom**:
- Mix and match elements from different tones
- Create your own message templates
- Define specific emoji preferences
- Tailor language formality to your preference

**Screenshot Placeholder**: [Tone selection interface with message previews]

#### Language and Localization

```yaml
Localization Settings:
  language: "en-US"                    # Primary language
  date_format: "MM/DD/YYYY"           # US format
  time_format: "12-hour"              # 12-hour vs 24-hour
  timezone: "America/New_York"        # User's timezone
  
  cultural_adaptation:
    work_week: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    holidays_calendar: "us_federal"
    business_hours: "09:00-17:00"
```

### Quiet Hours Configuration

#### Basic Quiet Hours

**Default Settings**:
- **Weekday Evenings**: 6:00 PM - 8:00 AM
- **Weekends**: Full Saturday and Sunday (optional)
- **Lunch Break**: 12:00 PM - 1:00 PM (optional)

**Custom Quiet Hours**:
```yaml
quiet_hours:
  enabled: true
  
  weekday_schedule:
    monday:    { quiet_start: "18:00", quiet_end: "08:00" }
    tuesday:   { quiet_start: "18:00", quiet_end: "08:00" }
    wednesday: { quiet_start: "18:00", quiet_end: "08:00" }
    thursday:  { quiet_start: "18:00", quiet_end: "08:00" }
    friday:    { quiet_start: "17:00", quiet_end: "08:00" }  # Earlier on Friday
  
  weekend_schedule:
    saturday: { fully_quiet: true }
    sunday:   { fully_quiet: true }
  
  lunch_break:
    enabled: true
    start_time: "12:00"
    end_time: "13:00"
```

#### Advanced Quiet Hours

**Holiday Integration**:
```yaml
holiday_settings:
  auto_detect_holidays: true
  holiday_calendars: ["us_federal", "company_specific"]
  quiet_during_holidays: true
  holiday_override_critical: false    # Don't override even for critical issues
  
  custom_quiet_dates:
    - date: "2024-12-24"
      reason: "Christmas Eve"
    - date: "2024-07-05"  
      reason: "Extended July 4th Weekend"
```

**Emergency Override Settings**:
```yaml
emergency_override:
  enabled: true
  
  override_conditions:
    - severity: "critical"
      age_hours: 24        # Override quiet hours for critical issues older than 24h
    - priority: "highest"
      project: "PROD"      # Always override for highest priority production issues
    - label: "emergency"
      any_time: true       # Emergency labeled issues always override
  
  override_notification:
    prefix: "[URGENT] "
    tone: "respectful_urgency"
    explain_override: true  # Explain why quiet hours were overridden
```

**Screenshot Placeholder**: [Quiet hours configuration with calendar interface]

### Filtering and Project Management

#### Project Filtering

**Inclusion/Exclusion Rules**:
```yaml
project_filters:
  mode: "include_selected"    # Options: "include_selected", "exclude_selected", "all"
  
  included_projects:
    - key: "PROD"
      priority_weight: 1.5   # 50% more important than default
    - key: "DEV"
      priority_weight: 1.0   # Standard weight
    - key: "TEST"
      priority_weight: 0.7   # Lower priority
  
  excluded_projects:
    - key: "ARCHIVE"
      reason: "archived_project"
    - key: "SANDBOX"
      reason: "testing_only"
  
  dynamic_inclusion:
    active_sprints_only: true
    my_roles: ["assignee", "reporter", "watcher"]
    exclude_resolved_parent: true
```

#### Issue Type Filtering

```yaml
issue_type_filters:
  enabled_types:
    - name: "Bug"
      stale_threshold: 3     # Bugs get attention sooner
      deadline_weight: 1.3   # More urgent deadline reminders
    
    - name: "Story"
      stale_threshold: 7     # Stories can wait longer
      deadline_weight: 1.0   # Standard deadline urgency
    
    - name: "Epic"
      stale_threshold: 14    # Epics are long-term
      deadline_weight: 0.8   # Less urgent deadline reminders
    
    - name: "Task"
      stale_threshold: 5     # Standard threshold
      deadline_weight: 1.0   # Standard urgency
  
  excluded_types:
    - "Sub-task"             # Don't notify about subtasks directly
```

#### Label-Based Rules

```yaml
label_filtering:
  exclude_labels:
    - "on-hold"              # Don't remind about held tickets
    - "waiting-for-client"   # Client-dependent tickets
    - "blocked"              # Blocked tickets
    - "scheduled"            # Pre-scheduled work
  
  include_priority_labels:
    - "urgent"               # Always include urgent labeled items
    - "customer-critical"    # Customer-facing critical issues
    - "security"             # Security-related issues
  
  custom_label_rules:
    - label: "needs-review"
      stale_threshold: 1     # Review requests get quick attention
      tone: "collaborative"  # Use collaborative tone
    
    - label: "documentation"  
      stale_threshold: 10    # Documentation can wait longer
      tone: "encouraging"    # Keep it positive for docs
```

**Screenshot Placeholder**: [Filter configuration interface with drag-and-drop rules]

## Team and Project Settings

*Note: These settings are only available to project administrators.*

### Team-Level Configuration

#### Default User Preferences

Set recommended defaults for new team members:

```yaml
team_defaults:
  notification_frequency: "gentle"
  communication_tone: "encouraging"
  stale_threshold_days: 5
  
  quiet_hours:
    start: "18:00"
    end: "08:00"
    weekends: true
  
  deadline_warnings: [7, 3, 1]
  max_daily_notifications: 3
  
  onboarding:
    show_welcome_tour: true
    suggest_customization: true
    provide_best_practices: true
```

#### Project-Specific Policies

```yaml
project_policies:
  PROD:  # Production project
    urgency_multiplier: 1.5
    stale_threshold: 2        # More aggressive for production
    quiet_hour_overrides:
      critical_issues: true
    escalation_rules:
      - after_days: 1
        notify: "project_lead"
      - after_days: 3  
        notify: "team_lead"
  
  DEV:   # Development project
    urgency_multiplier: 1.0
    stale_threshold: 7
    experimental_features: true
    
  QA:    # Quality Assurance
    urgency_multiplier: 1.2
    deadline_buffer_days: 2   # Extra buffer for QA work
```

### Team Dashboard Configuration

```yaml
team_dashboard:
  enabled: true
  update_frequency: "hourly"
  
  widgets:
    - type: "stale_ticket_overview"
      show_individual_counts: true
      show_team_trend: true
    
    - type: "deadline_calendar"
      days_ahead: 14
      show_all_team_members: true
    
    - type: "team_achievements"
      celebration_threshold: 10  # Celebrate when team completes 10+ tickets
      show_individual_highlights: true
    
    - type: "workload_distribution"
      show_balance_recommendations: true
      highlight_overloaded_members: true
  
  permissions:
    view: "all_project_members"
    configure: "project_admins"
    export_data: "team_leads"
```

### Escalation Rules

```yaml
escalation_settings:
  enabled: true
  
  rules:
    - trigger: "stale_ticket"
      condition: "days > 10"
      action: "notify_team_lead"
      message_tone: "collaborative_concern"
    
    - trigger: "missed_deadline"  
      condition: "days_overdue > 2"
      action: "create_followup_task"
      assign_to: "project_manager"
    
    - trigger: "repeated_dismissals"
      condition: "dismissals > 5 AND response_rate < 0.3"
      action: "suggest_setting_adjustment"
      escalate_to: "user_preference_review"
  
  notifications:
    to_escalated_user:
      tone: "supportive_check_in"
      include_resources: true
      
    to_escalation_recipient:
      tone: "professional_heads_up"
      include_context: true
      suggest_actions: true
```

**Screenshot Placeholder**: [Team settings dashboard with member overview]

## Advanced Configuration

### Algorithm Tuning

For power users who want to fine-tune the intelligent features:

```yaml
algorithm_settings:
  workload_analysis:
    enabled: true
    factors:
      assigned_ticket_count: 0.4
      recent_activity_level: 0.3
      issue_complexity_estimation: 0.2
      historical_completion_rate: 0.1
    
    workload_thresholds:
      light: 0.3    # 30% capacity
      moderate: 0.7  # 70% capacity  
      heavy: 0.9     # 90% capacity
      overloaded: 1.0
  
  context_awareness:
    priority_weighting:
      critical: 3.0
      high: 2.0
      medium: 1.0
      low: 0.5
    
    project_importance:
      auto_detect: true
      manual_overrides:
        PROD: 2.0
        CLIENT: 1.8
        INTERNAL: 0.8
  
  learning_system:
    enabled: true
    adaptation_rate: "moderate"  # How quickly to learn from user behavior
    confidence_threshold: 0.8    # Minimum confidence before applying learned patterns
    reset_learning: false        # Option to reset learned patterns
```

### Integration Settings

```yaml
integrations:
  jira_cloud_api:
    rate_limiting: "respectful"    # Options: "conservative", "respectful", "aggressive"
    batch_size: 50                 # Number of issues to process per batch
    cache_duration: 300            # Cache API responses for 5 minutes
  
  external_notifications:
    email:
      enabled: false               # Disabled by default (use Jira's built-in email)
      digest_frequency: "weekly"
    
    slack:
      enabled: false
      webhook_url: ""              # Configured per user
      channel_overrides: {}
    
    microsoft_teams:
      enabled: false
      webhook_url: ""
  
  calendar_integration:
    google_calendar: false
    outlook_calendar: false
    ical_export: true              # Allow exporting deadlines to calendar apps
```

### Performance and Storage

```yaml
performance_settings:
  processing:
    max_concurrent_users: 100
    analysis_frequency: "every_30_minutes"
    background_processing: true
  
  storage_optimization:
    data_retention:
      notification_history: 90     # Keep notification history for 90 days
      user_preferences: 365        # Keep user preferences for 1 year
      analytics_data: 180          # Keep analytics for 6 months
    
    cleanup_frequency: "weekly"
    compression: true
  
  caching:
    user_preferences: 3600         # Cache for 1 hour
    project_settings: 1800         # Cache for 30 minutes
    issue_data: 300                # Cache for 5 minutes
```

**Screenshot Placeholder**: [Advanced settings with expandable sections]

## Import/Export Settings

### Exporting Your Configuration

```yaml
# Export formats available
export_options:
  formats: ["json", "yaml", "csv"]
  
  export_sections:
    - personal_preferences: true
    - notification_history: false  # Usually not needed
    - analytics_data: false        # Privacy considerations
    - custom_templates: true
  
  privacy_options:
    anonymize_personal_data: true
    exclude_sensitive_info: true
```

**Export Process**:
1. Go to Settings > Advanced > Export/Import
2. Choose sections to export
3. Select format (JSON recommended for complete backup)
4. Download configuration file
5. Store securely for backup or migration

### Importing Configuration

**Import Sources**:
- Previous export files
- Team template configurations
- Recommended settings from community
- Migration from other notification systems

```yaml
import_options:
  validation: "strict"           # Validate all settings before import
  conflict_resolution: "merge"   # How to handle conflicts with existing settings
  
  safety_features:
    backup_current_config: true  # Always backup before import
    preview_changes: true        # Show what will change
    rollback_capability: true    # Allow reverting import
  
  selective_import:
    allow_partial: true          # Import only selected sections
    override_protection: false   # Protect certain critical settings
```

**Import Process**:
1. Create backup of current settings (automatic)
2. Upload configuration file
3. Review and approve changes
4. Apply configuration
5. Test with sample notifications

**Screenshot Placeholder**: [Import/export interface with file upload and preview]

## Troubleshooting Configuration

### Common Configuration Issues

#### Problem: Not Receiving Notifications

**Diagnostic Steps**:
1. Check notification frequency settings
2. Verify project filters include your assigned projects
3. Ensure you're not in an extended quiet hours period
4. Check if workload analysis is preventing notifications
5. Verify Jira permissions allow app access

**Solution Matrix**:
```yaml
troubleshooting:
  no_notifications:
    checks:
      - setting: "notification_frequency"
        expected: "not set to 'disabled'"
      - setting: "quiet_hours"
        check: "current time outside quiet period"
      - setting: "project_filters"
        check: "includes user's assigned projects"
      - permission: "jira_work_read"
        required: true
    
    quick_fixes:
      - "Reset to default settings"
      - "Run notification test"
      - "Check Jira permissions"
```

#### Problem: Too Many Notifications

**Adjustment Strategy**:
1. Reduce notification frequency to "gentle" or "minimal"
2. Increase stale ticket threshold
3. Enable workload sensitivity
4. Add project or issue type filters
5. Extend quiet hours

**Screenshot Placeholder**: [Troubleshooting checklist interface]

#### Problem: Wrong Tone/Language

**Customization Options**:
1. Switch communication tone setting
2. Adjust emoji frequency
3. Create custom message templates
4. Check localization settings

### Configuration Validation

The app includes built-in validation to prevent configuration issues:

```yaml
validation_rules:
  stale_threshold:
    min: 1
    max: 30
    warning_if: "> 14"           # Warn if threshold seems too high
  
  notification_limits:
    max_daily: 10                # Hard limit to prevent spam
    recommend_max: 5             # Recommended maximum
  
  quiet_hours:
    minimum_duration: 4          # At least 4 hours of quiet time
    maximum_duration: 20         # At most 20 hours (prevent all-day quiet)
  
  consistency_checks:
    - "deadline_warnings must be in descending order"
    - "excluded_projects cannot include all assigned projects"
    - "quiet_hours cannot cover entire work day"
```

### Getting Configuration Help

#### Self-Service Resources
- **Configuration Wizard**: Step-by-step setup guide
- **Settings Validation**: Real-time validation with helpful suggestions
- **Best Practice Recommendations**: Contextual advice based on your usage patterns
- **Community Templates**: Shared configurations from other users

#### Support Channels
- **In-App Help**: Contextual help for each setting
- **Documentation**: This comprehensive guide
- **Community Forum**: Ask questions and share configurations
- **Direct Support**: Contact support for complex configuration issues

### Advanced Debugging

For persistent configuration issues:

```yaml
debug_mode:
  enabled: false                 # Enable only when troubleshooting
  
  logging_level: "info"          # Options: debug, info, warn, error
  
  trace_notifications:
    decision_logging: true       # Log why notifications were/weren't sent
    timing_analysis: true        # Track notification timing
    user_interaction_tracking: true
  
  export_debug_info:
    include_logs: true
    anonymize_personal_data: true
    time_range: "last_7_days"
```

**Screenshot Placeholder**: [Debug mode interface with logs and diagnostics]

---

## Configuration Best Practices Summary

1. **Start Simple**: Use default settings initially, then customize gradually
2. **Regular Reviews**: Check your settings monthly and adjust as needed
3. **Team Alignment**: Coordinate team settings for consistent experience
4. **Backup Settings**: Export your configuration regularly
5. **Stay Updated**: Review new configuration options with app updates

Remember, the goal is to create a configuration that helps you stay productive while feeling supported. Don't hesitate to experiment and adjust until you find your perfect balance! 

*Next: [FAQ →](faq.md)*