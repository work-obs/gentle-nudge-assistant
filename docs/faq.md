# Frequently Asked Questions - Gentle Nudge Assistant

Get quick answers to the most common questions about using Gentle Nudge Assistant effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Notification Issues](#notification-issues)
3. [Configuration Questions](#configuration-questions)
4. [Privacy and Security](#privacy-and-security)
5. [Performance and Technical](#performance-and-technical)
6. [Team and Collaboration](#team-and-collaboration)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Q: How do I install Gentle Nudge Assistant?

**A:** Installation is simple and takes just a few minutes:

1. Go to the [Atlassian Marketplace](https://marketplace.atlassian.com/apps/gentle-nudge-assistant)
2. Click "Get it now" 
3. Select your Jira site from the dropdown
4. Click "Install app" and authorize the installation
5. The app will appear in your "Apps" menu within a few minutes

The installation requires standard user permissions and doesn't need administrator approval in most organizations.

### Q: Do I need to be a Jira administrator to use this app?

**A:** No! Regular Jira users can install and use Gentle Nudge Assistant without administrator privileges. However, some advanced team features are only available to project administrators.

**Regular users can:**
- Install the app for personal use
- Configure all personal settings
- Receive and interact with gentle nudges
- Access their personal dashboard

**Project admins additionally can:**
- Configure team-level defaults
- Set up project-specific policies
- Access team dashboard and analytics
- Manage escalation rules

### Q: How long does it take to start receiving notifications?

**A:** You'll typically receive your first gentle nudge within 24 hours of installation, but this depends on your ticket activity:

- **Immediate setup**: Configuration and welcome tour (5 minutes)
- **First analysis**: System analyzes your tickets (2-4 hours) 
- **First notification**: Based on your settings and ticket status (within 24 hours)
- **Optimization period**: System learns your preferences (1-2 weeks)

If you have stale tickets that meet your threshold, you might receive notifications sooner!

### Q: Can I try the app before committing to it?

**A:** Absolutely! Gentle Nudge Assistant offers:

- **Free trial period**: 30 days to explore all features
- **Easy uninstall**: Remove the app anytime with no data lock-in
- **Export settings**: Take your configuration with you if needed
- **No long-term contracts**: Flexible pricing options

During the trial, you have access to all premium features to fully evaluate the app's value for your workflow.

## Notification Issues

### Q: Why am I not receiving any notifications?

**A:** Several factors might prevent notifications. Here's a systematic check:

**1. Settings Check:**
- Go to Settings > Notification Frequency
- Ensure it's not set to "Disabled" or "Minimal"
- Check that stale threshold is reasonable (5-7 days recommended)

**2. Quiet Hours Check:**
- Review your quiet hours settings
- Make sure you're checking during active hours
- Consider if weekend settings are too restrictive

**3. Project Filters:**
- Verify your project filters include projects where you have assigned tickets
- Check if you've accidentally excluded all your active projects
- Review issue type filters

**4. Ticket Status:**
- Confirm you have tickets that meet the stale criteria
- Check that tickets aren't resolved or in excluded states
- Verify you're actually assigned to the tickets

**Quick Fix**: Try the "Test Notification" feature in Settings to verify the system is working.

### Q: I'm getting too many notifications. How do I reduce them?

**A:** Here are effective strategies to reduce notification frequency:

**Immediate Solutions:**
- Switch to "Gentle" or "Minimal" notification frequency
- Increase your stale ticket threshold (from 5 to 7-10 days)
- Enable workload sensitivity to prevent overwhelming periods
- Set stricter quiet hours

**Fine-Tuning Options:**
- Filter out low-priority issues
- Exclude specific projects during busy periods
- Reduce deadline warning frequency
- Set daily notification limits (recommended: 3-5 max)

**Advanced Filtering:**
```yaml
Quick Reduction Settings:
- Notification Frequency: "Gentle"
- Stale Threshold: 7 days
- Max Daily: 3 notifications  
- Quiet Hours: 6 PM - 8 AM
- Weekend Quiet: Enabled
```

### Q: Can I pause notifications temporarily?

**A:** Yes! Several options for temporary pause:

**Quick Pause (24-48 hours):**
- Use "Snooze All" in notification settings
- Extend quiet hours temporarily
- Switch to "Minimal" frequency

**Extended Pause (vacation, crunch time):**
- Enable "Vacation Mode" in settings
- Set custom date ranges for extended quiet periods
- Configure "Do Not Disturb" with return date

**Project-Specific Pause:**
- Temporarily exclude specific projects
- Pause only certain notification types
- Keep critical deadline reminders active

The app remembers your original settings and makes it easy to resume normal operations.

### Q: Why don't I get notifications about certain tickets?

**A:** Notifications are filtered based on several intelligent criteria:

**Automatic Exclusions:**
- Tickets in "Done," "Closed," or "Resolved" status
- Issues with "on-hold" or "blocked" labels
- Tickets where you're not the assignee (unless configured otherwise)
- Issues updated recently by other team members
- Sub-tasks when parent ticket is active

**Your Filter Settings:**
- Project inclusion/exclusion rules
- Issue type filters
- Priority level thresholds
- Custom label rules

**Workload Intelligence:**
- System detects when you're overloaded and reduces non-critical notifications
- Recently active tickets get grace periods
- High-priority work takes precedence

**Check your filters** in Settings > Filtering to see exactly what's included or excluded.

## Configuration Questions

### Q: What's the difference between notification frequency levels?

**A:** Here's a detailed breakdown:

| Feature | Minimal | Gentle | Moderate | Custom |
|---------|---------|---------|----------|---------|
| **Stale Reminders** | Weekly | Every 3 days | Daily | Your choice |
| **Deadline Warnings** | 1 day before | 3, 1 days before | 7, 3, 1 days before | Configurable |
| **Max Daily Notifications** | 1 | 3 | 5 | Up to 10 |
| **Progress Updates** | Monthly | Weekly | Bi-weekly | Custom schedule |
| **Workload Sensitivity** | High | High | Moderate | Configurable |
| **Best For** | Very busy periods | Most users | Active collaborators | Power users |

**Recommendation**: Start with "Gentle" for 1-2 weeks, then adjust based on your experience.

### Q: How do I create custom message templates?

**A:** Custom messaging is available in the Advanced Settings:

**1. Access Template Editor:**
- Go to Settings > Communication > Custom Templates
- Choose template type (stale reminder, deadline, progress)

**2. Template Variables Available:**
```
{issueKey} - Issue identifier (e.g., DEV-123)
{issueSummary} - Issue title
{daysSinceUpdate} - Number of days since last update
{priority} - Issue priority level
{assignee} - Assigned person's name
{dueDate} - Formatted due date
{project} - Project name
```

**3. Example Custom Template:**
```
"Hi {assignee}! 👋 
Your ticket {issueKey} - '{issueSummary}' 
hasn't been updated in {daysSinceUpdate} days. 
When you have a moment, it would appreciate some attention! ✨"
```

**4. Tone Guidelines:**
- Keep it positive and encouraging
- Avoid pressure or blame language
- Include actionable suggestions when possible
- Test with colleagues before broad deployment

### Q: Can I set different settings for different projects?

**A:** Yes! Project-specific configuration is a key feature:

**Personal Project Settings:**
- Set different stale thresholds per project
- Customize notification frequency by project importance
- Apply different tones for different project types
- Configure project-specific quiet hours

**Example Configuration:**
```yaml
Project Settings:
  PROD (Production):
    - Stale threshold: 2 days
    - Frequency: High
    - Tone: Professional
    - Override quiet hours: For critical issues
  
  DEV (Development):  
    - Stale threshold: 7 days
    - Frequency: Gentle
    - Tone: Encouraging
    - Weekend notifications: Disabled
```

**Team Project Settings (Admins):**
- Set team-wide defaults per project
- Configure escalation rules
- Manage project-level notification policies

## Privacy and Security

### Q: What data does Gentle Nudge Assistant collect?

**A:** We follow a strict minimal data collection policy:

**Data We Collect:**
- Your notification preferences and settings
- Timestamps of when notifications were sent/dismissed
- Issue metadata (keys, titles, status, dates) from Jira
- Usage analytics (anonymous, aggregated performance data)

**Data We DON'T Collect:**
- Issue descriptions or comments
- Sensitive project information
- Personal information beyond Jira username
- Data about non-assigned issues
- Information about other users without their consent

**Data Storage:**
- All data stored in Atlassian's secure Forge platform
- No data transmitted outside Atlassian's infrastructure
- Automatic encryption at rest and in transit
- Regular automated backups with secure deletion schedules

### Q: Is my data shared with third parties?

**A:** Absolutely not. Your data privacy is paramount:

- **No third-party sharing**: Your data never leaves Atlassian's secure environment
- **No advertising**: We don't use your data for advertising purposes
- **No selling data**: We will never sell user data to anyone
- **No external analytics**: Only internal, anonymized usage statistics

**Transparency:**
- Full privacy policy available in the app
- Regular security audits and compliance reports
- GDPR compliant with data protection officer
- Open to privacy questions and concerns

### Q: How do I delete my data?

**A:** You have complete control over your data:

**Immediate Options:**
- Reset all settings to defaults (keeps app, clears preferences)
- Delete notification history (keeps settings)
- Export data before deletion (backup for migration)

**Complete Removal:**
- Uninstall the app from Jira Apps management
- All personal data automatically deleted within 30 days
- Receive confirmation email when deletion is complete

**Partial Deletion:**
- Delete specific notification histories
- Clear learning data while keeping preferences
- Remove integration data while keeping core settings

**GDPR Rights:**
- Request data export in machine-readable format
- Demand immediate data deletion
- Correct inaccurate stored information
- Restrict processing of your data

## Performance and Technical

### Q: Does the app slow down Jira?

**A:** Gentle Nudge Assistant is designed for minimal performance impact:

**Performance Optimization:**
- **Background processing**: All analysis happens in background, not during your active Jira use
- **Efficient API usage**: Smart caching and batched requests prevent API overload
- **Lightweight UI**: Minimal interface elements that don't interfere with Jira's performance
- **Serverless architecture**: Uses Atlassian's scalable Forge platform

**Typical Impact:**
- Page load time increase: <50ms (imperceptible)
- Memory usage: <5MB additional
- Network requests: <1 additional request per page
- Background CPU usage: Minimal during off-peak hours

**Monitoring:**
- Built-in performance monitoring
- Automatic scaling based on usage
- Regular performance optimization updates

### Q: What happens if I have thousands of tickets?

**A:** The app is designed to handle large-scale Jira installations efficiently:

**Scalability Features:**
- **Smart sampling**: Analyzes most relevant tickets first
- **Intelligent batching**: Processes tickets in optimized groups
- **Priority-based processing**: High-priority tickets get immediate attention
- **Caching strategies**: Reduces repeated API calls

**Large Dataset Handling:**
- Automatically focuses on recently active tickets
- Uses statistical sampling for historical analysis
- Implements progressive loading for dashboard views
- Provides filtering options to reduce dataset size

**Performance Thresholds:**
- Up to 1,000 assigned tickets: Full real-time analysis
- 1,000-10,000 tickets: Intelligent sampling with full coverage
- 10,000+ tickets: Priority-based analysis with optional deep-dive modes

**Optimization Tips for Power Users:**
- Use project filters to focus on active work
- Set reasonable stale thresholds (don't go below 1 day)
- Enable workload sensitivity to prevent information overload

### Q: Which browsers are supported?

**A:** Gentle Nudge Assistant supports all modern browsers:

**Fully Supported:**
- Chrome 90+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 90+

**Mobile Support:**
- Responsive design works on mobile browsers
- Touch-friendly interface elements
- Optimized for tablet viewing

**Legacy Browser Support:**
- Internet Explorer: Not supported
- Chrome <85: Limited functionality
- Firefox <80: Basic features only

**Browser-Specific Features:**
- Chrome: Full notification API support
- Firefox: Complete feature set
- Safari: iOS/macOS optimizations
- Edge: Windows integration features

## Team and Collaboration

### Q: How do team settings work?

**A:** Team settings enable consistent experiences across your project teams:

**Team Administrator Features:**
- **Default Preferences**: Set recommended settings for all team members
- **Project Policies**: Configure team-wide notification rules
- **Escalation Management**: Define when and how to escalate stale tickets
- **Team Dashboard**: Overview of team notification effectiveness

**Team Member Experience:**
- Individual settings can override team defaults
- Gentle suggestions for team-aligned configurations
- Shared templates and best practices
- Collaborative goal setting and tracking

**Implementation Strategy:**
1. **Admin Setup**: Project admin configures team defaults
2. **Member Onboarding**: New members get team-recommended settings
3. **Gradual Customization**: Members adjust settings based on personal preferences
4. **Continuous Improvement**: Team reviews and updates policies quarterly

### Q: Can I set up notifications for my team members?

**A:** Direct cross-user notifications aren't available for privacy reasons, but there are collaborative features:

**What You CAN Do:**
- **Team Dashboard**: Admins can see team-wide stale ticket summaries
- **Escalation Rules**: Configure automatic escalation for overdue team tickets
- **Shared Templates**: Create team-wide message templates and settings
- **Peer Recommendations**: Suggest optimal settings to team members

**What You CAN'T Do:**
- Send notifications directly to other users
- Access other users' personal notification histories
- Override individual user's quiet hours or preferences
- View other users' detailed analytics

**Alternative Approaches:**
- Use Jira's built-in @mentions for direct communication
- Configure project-level escalation policies
- Implement team dashboard for visibility
- Encourage voluntary team settings alignment

### Q: How do escalation rules work?

**A:** Escalation rules help teams manage tickets that remain stale despite gentle nudges:

**Escalation Triggers:**
- Ticket stale for specified time period (e.g., 10+ days)
- Multiple dismissed notifications without action
- Approaching or missed critical deadlines
- High-priority tickets with extended inactivity

**Escalation Actions:**
```yaml
Example Escalation Rules:
  Level 1 (5 days stale):
    - Increase notification frequency
    - Switch to more direct tone
    
  Level 2 (10 days stale):
    - Notify project lead
    - Create follow-up task
    - Suggest reassignment options
    
  Level 3 (15+ days stale):
    - Create team discussion ticket
    - Schedule team review meeting
    - Consider ticket archiving or closure
```

**Escalation Best Practices:**
- Start with gentle internal escalation
- Focus on helping rather than pressuring
- Provide context and suggested solutions
- Maintain positive, supportive tone throughout

## Troubleshooting

### Q: Notifications stopped working suddenly. What should I check?

**A:** Follow this systematic troubleshooting approach:

**1. Quick Checks (2 minutes):**
- Verify app is still installed (Apps menu)
- Check if you're in quiet hours period
- Look for recent Jira updates or changes
- Test notification with "Send Test" button

**2. Settings Verification (5 minutes):**
- Confirm notification frequency isn't "Disabled"
- Check project filters haven't excluded everything
- Verify stale threshold is reasonable
- Review any recent setting changes

**3. Permission Check:**
- Ensure app still has necessary Jira permissions
- Check if organization policies changed
- Verify your Jira license is active
- Test with different projects/issue types

**4. Advanced Diagnostics:**
- Enable debug mode temporarily
- Export and review configuration
- Check browser console for errors
- Contact support with diagnostic information

**Quick Reset Option**: Use "Restore Default Settings" to eliminate configuration issues.

### Q: The app is showing error messages. How do I fix this?

**A:** Error messages usually indicate specific issues that can be resolved:

**Common Error Messages:**

**"Permission Denied":**
- **Cause**: App lacks necessary Jira permissions
- **Solution**: Reinstall app or contact Jira admin to review permissions

**"Rate Limit Exceeded":**
- **Cause**: Too many API requests (rare, usually temporary)
- **Solution**: Wait 15 minutes, then try again. Consider reducing notification frequency.

**"Configuration Invalid":**
- **Cause**: Settings conflict or invalid values
- **Solution**: Use configuration validation tool or reset to defaults

**"Project Not Found":**
- **Cause**: Referenced project was deleted or made private
- **Solution**: Update project filters to remove invalid projects

**General Troubleshooting Steps:**
1. Note exact error message and context
2. Try refreshing the page/app
3. Check Jira system status
4. Review recent changes to settings
5. Contact support with error details if persistent

### Q: How do I report bugs or request features?

**A:** We welcome feedback and actively work on improvements:

**Bug Reports:**
- **In-App**: Use "Report Issue" in Settings menu
- **Email**: [support@gentle-nudge-assistant.com](mailto:support@gentle-nudge-assistant.com)
- **Community Forum**: [community.gentle-nudge-assistant.com](https://community.gentle-nudge-assistant.com)

**Effective Bug Reports Include:**
- Specific steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots or screen recordings
- Browser and Jira version information
- Export of your configuration (if relevant)

**Feature Requests:**
- **Feature Portal**: Vote on existing requests or submit new ones
- **Community Discussions**: Discuss ideas with other users
- **Direct Feedback**: Use in-app feedback system

**Response Times:**
- Critical bugs: 24-48 hours
- General issues: 3-5 business days  
- Feature requests: Reviewed monthly, implemented quarterly

**Contributing:**
- Beta testing program for early access to features
- Community documentation improvements
- Translation and localization help
- Integration suggestions and testing

## Still Have Questions?

If you can't find the answer you're looking for:

1. **Check the Documentation:**
   - [User Guide](user-guide.md) - Comprehensive feature walkthrough
   - [Configuration Guide](configuration-guide.md) - Detailed settings help
   - [Best Practices](best-practices.md) - Tips for optimal usage

2. **Community Resources:**
   - **User Forum**: Connect with other users and share tips
   - **Knowledge Base**: Searchable database of solutions
   - **Video Tutorials**: Step-by-step visual guides

3. **Contact Support:**
   - **Help Center**: [help.gentle-nudge-assistant.com](https://help.gentle-nudge-assistant.com)
   - **Direct Support**: Available to paid users
   - **Community Support**: Free support through forums

4. **Stay Updated:**
   - **Release Notes**: Keep track of new features and fixes
   - **Newsletter**: Monthly tips and updates
   - **Social Media**: Follow for quick tips and community highlights

Remember: Every question helps us improve the app for everyone. Don't hesitate to reach out! 🌟

*Next: [Best Practices →](best-practices.md)*