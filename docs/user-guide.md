# Gentle Nudge Assistant - User Guide

Welcome to the Gentle Nudge Assistant User Guide! This comprehensive guide will help you make the most of your encouraging Jira experience.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Notification Types](#notification-types)
4. [Personal Settings](#personal-settings)
5. [Team Features](#team-features)
6. [Understanding Your Dashboard](#understanding-your-dashboard)
7. [Managing Notifications](#managing-notifications)
8. [Tips for Success](#tips-for-success)

## Getting Started

### First Time Setup

After installing Gentle Nudge Assistant from the Atlassian Marketplace, you'll be guided through a friendly onboarding process:

1. **Welcome Tour**: A 2-minute interactive tour introduces you to key features
2. **Initial Preferences**: Set up your basic notification preferences
3. **Permission Confirmation**: Review and confirm the app's permissions
4. **Ready to Go**: Start receiving gentle nudges within 24 hours

**Screenshot Placeholder**: [Onboarding welcome screen with friendly mascot]

### Accessing the App

You can access Gentle Nudge Assistant from several places in Jira:

- **Apps Menu**: Look for "Gentle Nudge" in your Jira apps dropdown
- **Project Settings**: Access project-level settings (for project admins)
- **User Settings**: Personal preferences under Jira Settings > Apps
- **Dashboard Widget**: Optional widget for project overviews

**Screenshot Placeholder**: [Jira interface showing app access points]

## Core Features

### Smart Stale Ticket Detection

The heart of Gentle Nudge Assistant is its intelligent detection of tickets that might need attention.

#### How It Works

The system analyzes multiple factors to identify stale tickets:

- **Time Since Last Update**: Configurable thresholds (default: 5 days)
- **Issue Priority**: High-priority tickets get earlier reminders
- **Issue Type**: Bugs may get more frequent nudges than stories
- **Project Context**: Critical projects receive more attention
- **Your Workload**: Won't overwhelm you when you're already busy
- **Historical Patterns**: Learns from your typical update frequency

#### What Makes a Ticket "Stale"?

A ticket is considered stale when:
- No updates for your configured threshold period
- No comments or status changes
- No recent activity from assignees or watchers
- Approaching or past due dates

**Screenshot Placeholder**: [Analytics view showing stale ticket detection logic]

### Deadline Awareness

Never miss another deadline with our gentle reminder system.

#### Deadline Tracking

The app monitors:
- **Due dates** set on individual issues
- **SLA deadlines** from your organization's SLA policies
- **Sprint end dates** for issues in active sprints
- **Release dates** for version-targeted issues
- **Custom deadline fields** configured in your projects

#### Smart Timing

Reminders are sent at optimal times:
- **7 days before**: Initial friendly heads-up
- **3 days before**: More specific reminder with actionable suggestions
- **1 day before**: Final encouragement with urgency (but still positive!)
- **On deadline day**: Supportive message acknowledging the deadline

**Screenshot Placeholder**: [Calendar view showing deadline tracking]

### Contextual Intelligence

What makes Gentle Nudge Assistant special is its understanding of context.

#### Workload Analysis

The system considers:
- **Number of assigned issues**: Won't overwhelm busy users
- **Recent activity level**: Recognizes when you're actively working
- **Issue complexity**: Estimates effort required based on issue size
- **Team capacity**: Understands team-wide workload distribution

#### Priority Weighting

Different issues receive different attention levels:
- **Critical/Blocker**: More frequent, urgent (but still encouraging) reminders
- **High Priority**: Regular gentle nudges
- **Medium Priority**: Moderate reminder frequency
- **Low Priority**: Minimal, patient reminders

**Screenshot Placeholder**: [Workload dashboard showing context analysis]

## Notification Types

### Gentle Stale Reminders

These are the core notifications that help you stay on top of inactive tickets.

#### Example Messages

**Standard Reminder**:
> "Hey there! [DEV-123] has been waiting patiently for an update. When you have a moment, it would appreciate some attention! ✨"

**Priority-Aware**:
> "Quick heads-up: High-priority ticket [BUG-456] could use your expertise when you're ready. No rush, but it's feeling a bit neglected! 🌟"

**Workload-Sensitive**:
> "We know you're busy crushing it on other tasks! When you have a breather, [STORY-789] would love a quick check-in."

#### Customization Options

- **Frequency**: Choose how often you want these reminders (daily, weekly, bi-weekly)
- **Threshold**: Set how many days before a ticket is considered stale (1-30 days)
- **Priority Filter**: Get reminders only for certain priority levels
- **Project Filter**: Focus on specific projects or exclude certain ones

**Screenshot Placeholder**: [Settings panel for stale reminder configuration]

### Friendly Deadline Notifications

These help you stay ahead of important due dates without the stress.

#### Timeline Approach

**Week Before**:
> "Just a friendly FYI: [DEV-123] is due next Tuesday. You have plenty of time to work your magic! 🚀"

**Few Days Before**:
> "Gentle reminder: [DEV-456] is due in 3 days. We know you'll handle it brilliantly - you always do! 💪"

**Day Before**:
> "Tomorrow's the day for [DEV-789]! You've got this, and we believe in you completely! ⭐"

**Day Of**:
> "Today's deadline for [DEV-123] - but no pressure! Do your best work, and remember that progress is what matters! 🌟"

#### Advanced Features

- **Buffer Time**: Add personal buffer days before official deadlines
- **Weekend Awareness**: Adjusts reminders for weekends and holidays
- **Time Zone Intelligence**: Considers your local time zone for timing
- **Escalation Prevention**: Suggests proactive communication when deadlines are at risk

**Screenshot Placeholder**: [Deadline notification examples with timeline]

### Motivational Progress Updates

These celebrate your achievements while gently highlighting remaining work.

#### Achievement Recognition

**Consistent Progress**:
> "Amazing work this week! You've updated 8 tickets consistently. Just [DEV-123] and [DEV-456] are feeling a bit left out. Keep up the fantastic momentum! 🎉"

**Milestone Celebrations**:
> "Congratulations! You've completed 90% of your sprint goals. These final tickets are ready for your expertise: [list]. You're so close to another successful sprint! 🎯"

#### Team Encouragement

**Team Progress**:
> "The team is doing incredible work! Here are a few tickets that could benefit from a quick review when you have time: [list]. Every contribution makes a difference! 🤝"

**Collaborative Reminders**:
> "Great collaboration happening on [PROJECT-X]! A few tickets could use your unique insights: [list]. Your teammates will appreciate the support! ✨"

**Screenshot Placeholder**: [Progress celebration notification with team metrics]

## Personal Settings

### Accessing Your Settings

Navigate to your personal settings through:
1. **Jira Settings** > **Apps** > **Gentle Nudge Assistant**
2. **Apps Menu** > **Gentle Nudge** > **My Settings**
3. **User Profile** > **App Preferences** (if available)

**Screenshot Placeholder**: [Settings navigation path]

### Notification Frequency

Choose the level of engagement that works best for you:

#### Gentle (Recommended for New Users)
- **Stale Reminders**: Every 3 days for tickets over 5 days old
- **Deadline Warnings**: 7, 3, and 1 day before due dates
- **Progress Updates**: Weekly summary of achievements
- **Maximum per Day**: 3 notifications

#### Moderate (For Active Users)
- **Stale Reminders**: Daily for tickets over 3 days old
- **Deadline Warnings**: 7, 5, 3, and 1 day before due dates
- **Progress Updates**: Bi-weekly summary
- **Maximum per Day**: 5 notifications

#### Minimal (For Busy Periods)
- **Stale Reminders**: Weekly for tickets over 7 days old
- **Deadline Warnings**: 3 and 1 day before due dates only
- **Progress Updates**: Monthly summary
- **Maximum per Day**: 1 notification

#### Custom Configuration
Create your own perfect balance with:
- **Custom thresholds** for stale ticket detection
- **Flexible deadline warning schedules**
- **Personalized notification limits**
- **Project-specific settings**

**Screenshot Placeholder**: [Frequency settings with visual sliders]

### Quiet Hours

Respect your work-life balance with quiet hours:

#### Default Quiet Hours
- **Evenings**: 6:00 PM - 8:00 AM local time
- **Weekends**: Saturday and Sunday (optional)
- **Holidays**: Automatic detection of major holidays

#### Custom Quiet Hours
- **Flexible Timing**: Set any start and end times
- **Day-Specific**: Different hours for different days
- **Multiple Periods**: Create several quiet periods per day
- **Exception Handling**: Override quiet hours for critical issues

#### Emergency Override
Critical issues can still reach you:
- **Severity Thresholds**: Define what constitutes "critical"
- **Project Exceptions**: Specify projects that can override quiet hours
- **Escalation Rules**: Gradual escalation for truly urgent matters

**Screenshot Placeholder**: [Quiet hours configuration with clock interface]

### Communication Tone

Personalize how the app speaks to you:

#### Encouraging (Default)
- Uses positive, uplifting language
- Focuses on empowerment and support
- Includes motivational elements
- Perfect for maintaining morale

*Example*: "You're doing fantastic! [DEV-123] would love some of your expertise when you're ready! ⭐"

#### Casual
- Friendly, relaxed communication style
- Uses informal language and humor
- Feels like a helpful colleague
- Great for close-knit teams

*Example*: "Hey! [DEV-123] has been hanging out waiting for an update. Mind giving it some love when you can? 😊"

#### Professional
- Formal, business-appropriate language
- Clear, direct communication
- Maintains professionalism
- Ideal for corporate environments

*Example*: "Please note that issue [DEV-123] requires attention. An update would be appreciated when convenient."

#### Custom Messages
- **Template Customization**: Modify message templates
- **Keyword Replacement**: Use placeholders for dynamic content
- **Tone Mixing**: Combine elements from different styles
- **A/B Testing**: Try different approaches to see what works

**Screenshot Placeholder**: [Tone selection with preview messages]

### Project Filters

Focus your attention where it matters most:

#### Project Selection
- **Include Specific Projects**: Get notifications only from chosen projects
- **Exclude Projects**: Remove notifications from specific projects
- **Priority-Based Filtering**: Different settings for different project priorities
- **Dynamic Lists**: Automatically include/exclude based on project criteria

#### Advanced Filtering
- **Issue Type Filters**: Choose which issue types to monitor
- **Component Filtering**: Focus on specific project components
- **Label-Based Rules**: Include/exclude issues with specific labels
- **Custom JQL**: Use Jira Query Language for complex filtering

**Screenshot Placeholder**: [Project filter interface with checkboxes and search]

## Team Features

### Team Dashboard

Project administrators can access team-wide features for coordinating gentle nudges.

#### Team Overview
- **Collective Progress**: Visual representation of team ticket status
- **Stale Ticket Distribution**: See who has the most stale tickets
- **Deadline Awareness**: Team calendar view of upcoming deadlines
- **Encouragement Metrics**: Track positive engagement and morale

#### Team Settings
- **Default Preferences**: Set recommended settings for team members
- **Project-Level Policies**: Configure nudge policies for specific projects
- **Escalation Rules**: Define when and how to escalate stale tickets
- **Team Goals**: Set and track collective productivity goals

**Screenshot Placeholder**: [Team dashboard with metrics and charts]

### Collaborative Features

#### Peer Encouragement
- **Team Celebrations**: Recognize collective achievements
- **Peer Nominations**: Highlight team members' great work
- **Collaborative Reminders**: Gentle nudges about team-dependent tickets
- **Support Offers**: Connect team members who can help each other

#### Project Health
- **Health Scores**: Visual indicators of project ticket health
- **Trend Analysis**: Track improvements in ticket management
- **Team Capacity**: Understand and respect team workload limits
- **Success Stories**: Share wins and learning experiences

**Screenshot Placeholder**: [Collaborative features interface]

## Understanding Your Dashboard

### Personal Dashboard Widget

Add the Gentle Nudge widget to your Jira dashboard for quick insights:

#### Widget Components
- **Stale Ticket Counter**: Number of tickets needing attention
- **Upcoming Deadlines**: Next 3 deadlines with friendly countdown
- **Weekly Progress**: Visual representation of your ticket activity
- **Encouragement Message**: Daily dose of motivation

#### Customization Options
- **Widget Size**: Choose from small, medium, or large layouts
- **Information Density**: Select what information to display
- **Color Themes**: Match your personal preferences or team branding
- **Refresh Frequency**: Control how often data updates

**Screenshot Placeholder**: [Dashboard widget in different sizes and configurations]

### Analytics and Insights

#### Personal Analytics
- **Response Patterns**: Understand your notification interaction habits
- **Productivity Trends**: Track improvements in ticket management
- **Effectiveness Scores**: See how well gentle nudges work for you
- **Time Management**: Analyze your most productive periods

#### Goal Tracking
- **Personal Goals**: Set and track individual improvement targets
- **Progress Milestones**: Celebrate achievements along the way
- **Habit Formation**: Build consistent ticket management habits
- **Success Metrics**: Define what success looks like for you

**Screenshot Placeholder**: [Analytics dashboard with graphs and metrics]

## Managing Notifications

### Notification Center

All your gentle nudges are organized in a central location:

#### Notification History
- **Chronological View**: See all notifications over time
- **Filter and Search**: Find specific notifications quickly
- **Action History**: Track what actions you took on each notification
- **Effectiveness Feedback**: Rate how helpful each notification was

#### Quick Actions
- **Bulk Operations**: Dismiss or acknowledge multiple notifications
- **Smart Batching**: Group related notifications for efficiency
- **Priority Sorting**: Focus on the most important items first
- **Snooze Options**: Temporarily pause specific notifications

**Screenshot Placeholder**: [Notification center interface]

### Responding to Notifications

#### Action Options

**Acknowledge**: 
- Confirms you've seen the notification
- Delays similar notifications for this issue
- Helps the system learn your preferences
- Provides positive feedback to the algorithm

**Dismiss**: 
- Removes the notification without action
- Doesn't affect future notifications for this issue
- Quick way to clear irrelevant reminders
- Option to provide dismissal reason for improvement

**Take Action**: 
- Direct link to the ticket for immediate action
- Smart suggestions for what action to take
- Quick update options for common scenarios
- Integration with Jira's editing capabilities

**Snooze**: 
- Temporarily hide notifications for this issue
- Choose from preset durations (1 hour to 1 week)
- Custom snooze periods for specific needs
- Automatic reappearance based on your schedule

#### Smart Learning

The system learns from your actions:
- **Pattern Recognition**: Identifies your preferred notification types
- **Timing Optimization**: Learns when you're most responsive
- **Content Adaptation**: Adjusts message style based on your reactions
- **Frequency Tuning**: Optimizes notification frequency automatically

**Screenshot Placeholder**: [Notification action buttons and feedback interface]

## Tips for Success

### Maximizing Effectiveness

#### Start Gentle
- Begin with the "Gentle" frequency setting
- Allow the system to learn your patterns for 1-2 weeks
- Gradually increase frequency if you find it helpful
- Remember: you can always adjust settings

#### Embrace Customization
- Take 5 minutes to configure your preferences properly
- Set realistic stale ticket thresholds based on your workflow
- Use quiet hours to maintain work-life balance
- Experiment with different communication tones

#### Integrate with Your Workflow
- Check notifications at consistent times (e.g., start of day)
- Use the dashboard widget for quick daily overviews
- Set up project filters to focus on priority work
- Leverage team features for collaborative projects

#### Provide Feedback
- Use the feedback options to help improve recommendations
- Rate notification effectiveness when prompted
- Suggest new features through the feedback system
- Share success stories with the community

### Building Better Habits

#### Consistent Engagement
- Respond to notifications promptly, even if just to acknowledge them
- Use the quick action buttons to streamline your workflow
- Set aside specific times for addressing stale tickets
- Celebrate small wins and progress milestones

#### Team Collaboration
- Encourage teammates to install and configure the app
- Share configuration tips and best practices
- Use team features to coordinate project-wide improvements
- Celebrate team achievements and progress together

#### Long-term Success
- Review your settings monthly and adjust as needed
- Track your productivity improvements over time
- Stay engaged with new features and updates
- Help newer users get started with the app

### Common Pitfalls to Avoid

#### Over-Configuration
- Don't obsess over perfect settings initially
- Avoid creating overly complex filtering rules
- Start simple and evolve your configuration over time
- Trust the smart defaults while you learn

#### Notification Fatigue
- Don't set frequency too high initially
- Use quiet hours to prevent overwhelming periods
- Take breaks from notifications when feeling stressed
- Remember that less can be more effective

#### Ignoring the Positive Approach
- Embrace the encouraging tone rather than viewing it as "fluffy"
- Trust that positive reinforcement leads to better outcomes
- Share the positive approach with skeptical teammates
- Focus on progress and improvement rather than perfection

**Screenshot Placeholder**: [Success tips infographic with key recommendations]

---

## Getting Help

If you need assistance with any feature covered in this guide:

- **FAQ**: Check our [Frequently Asked Questions](faq.md) for quick answers
- **Best Practices**: Review our [Best Practices Guide](best-practices.md) for optimization tips
- **Configuration**: See the [Configuration Guide](configuration-guide.md) for detailed settings help
- **Support**: Contact our friendly support team at [support portal link]

Remember, we're here to help you succeed, and every small step forward is worth celebrating! 🌟

*Next: [Configuration Guide →](configuration-guide.md)*