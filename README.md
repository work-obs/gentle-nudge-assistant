# Gentle Nudge Assistant - Jira Cloud Plugin

A friendly, encouraging Jira Cloud plugin built on Atlassian's Forge platform that provides context-aware reminders about stale tickets and approaching deadlines. Unlike traditional notification systems that can feel nagging or overwhelming, the Gentle Nudge Assistant emphasizes encouragement and positive reinforcement to help teams stay productive while maintaining morale.

## 🌟 Key Features

### Core Functionality
- **Smart Stale Ticket Detection**: Identifies issues that haven't been updated within configurable timeframes
- **Deadline Awareness**: Monitors due dates and SLA deadlines with gentle pre-deadline reminders  
- **Contextual Intelligence**: Considers issue priority, project context, and user workload
- **Encouraging Tone**: Uses positive, supportive language in all communications
- **User-Controlled Preferences**: Individual users can customize notification frequency and timing

### Notification Types
1. **Gentle Stale Reminders**: "Your ticket [ISSUE-123] might benefit from a quick check-in ✨"
2. **Friendly Deadline Notifications**: "Just a heads up - [ISSUE-456] is due tomorrow. You've got this! 💪"
3. **Motivational Progress Updates**: "Great progress on [PROJECT-X]! A few tickets could use your attention when you have time."
4. **Team Encouragement**: "The team is doing amazing work! Here are some tickets that might need a quick review."
5. **Achievement Recognition**: "Amazing work! You've been consistently updating your tickets. Keep it up! 🎉"

## 🏗️ Architecture

The plugin is built with a modular TypeScript architecture consisting of four main components:

### 1. Notification Engine (`/src/notification-engine/`)
- **SchedulerService**: Handles timing and frequency of notifications with smart algorithms
- **ContentGenerator**: Creates encouraging, contextual reminder messages using templates
- **DeliveryManager**: Routes notifications to appropriate UI components with fallback support
- **ToneAnalyzer**: Ensures all messages maintain positive, encouraging tone

### 2. Issue Analytics (`/src/analytics/`)
- **JiraApiService**: Integration with Jira Cloud REST API v3 for issue and project data
- **Staleness Detection**: Analyzes last update times and activity patterns
- **Deadline Monitoring**: Tracks due dates and SLA timelines
- **User Workload Calculator**: Prevents overwhelming users with too many notifications

### 3. Configuration Management (`/src/config/`)
- **StorageService**: Forge storage integration for user preferences and tracking data
- **User Preferences**: Individual notification settings and timing
- **Team Settings**: Project-level configuration for reminder policies
- **GDPR Compliance**: Data export and deletion capabilities

### 4. Type System (`/src/types/`)
- Comprehensive TypeScript interfaces for all data models
- Strong typing for notification objects, user preferences, and API responses
- Configuration constants and validation rules

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or 22.x LTS
- Atlassian Forge CLI (`@forge/cli`)
- Jira Cloud site with admin permissions

### Installation

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd jira-plugin
   npm install
   ```

2. **Build the TypeScript**:
   ```bash
   npm run build
   ```

3. **Initialize Forge App**:
   ```bash
   forge create --template custom-ui
   # Follow prompts and copy the generated files
   ```

4. **Deploy to Development**:
   ```bash
   forge deploy
   forge install --upgrade
   ```

### Configuration

The system uses intelligent defaults but can be customized:

```typescript
import { GentleNudgeAssistant } from './src';

const nudgeAssistant = new GentleNudgeAssistant({
  enableToneValidation: true,
  minimumToneScore: 0.7,
  batchProcessingEnabled: true,
  adaptiveLearningEnabled: true,
  debugMode: false
});

await nudgeAssistant.initialize();
```

## 💡 Usage Examples

### Basic Notification Creation
```typescript
// Create a stale reminder for an issue
const pipelineId = await nudgeAssistant.createNotification(
  'user-account-id',
  'PROJ-123',
  'stale-reminder',
  'medium'
);

// Process all stale issues for a user
await nudgeAssistant.processUserNotifications('user-account-id');
```

### Achievement Recognition
```typescript
// Celebrate when a user completes an issue
await nudgeAssistant.celebrateAchievement(
  'user-account-id',
  'issue-completed',
  {
    issueKey: 'PROJ-123',
    summary: 'Fixed critical bug',
    project: { key: 'PROJ', name: 'My Project' }
  }
);
```

### Analytics and Insights
```typescript
// Get notification effectiveness metrics
const analytics = await nudgeAssistant.getAnalytics('user-account-id', 30);
console.log('Delivery rate:', analytics.deliveryStatistics.successRate);
console.log('User engagement:', analytics.userAnalytics.engagementScore);
```

## 🎨 Message Examples

### Stale Issue Reminders
- **Cheerful**: "Hey there! PROJ-123 might benefit from a quick update. It's been 3 days since the last change, but no pressure - whenever you're ready! You've got this! ⭐"
- **Supportive**: "PROJ-123 (Fix login bug) has been waiting for an update for 3 days. We know you've got a lot on your plate, so take it at your own pace. We're here if you need any support! 💙"
- **Gentle**: "When you have a chance, PROJ-123 (Fix login bug) would appreciate some attention - it's been sitting quietly for 3 days. No rush, just keeping you informed so you can plan accordingly. 🌸"

### Deadline Notifications  
- **Motivational**: "PROJ-456 (User dashboard) is due in 2 days, but we have complete confidence you'll handle it perfectly! You've tackled challenging tasks before, and this one is no different. 💪"
- **Professional**: "Please note that PROJ-456 has a deadline approaching in 2 days. Your expertise and attention to this matter would be greatly appreciated. Thank you for your continued professionalism. 🎯"

## 🔧 Advanced Features

### Tone Analysis and Validation
Every message goes through tone analysis to ensure:
- Positive sentiment (score > 0.7)
- No negative or pressure-inducing language
- Appropriate encouragement level for the user's preferences
- Automatic suggestions for improvement

### Smart Scheduling
- Respects user quiet hours and working schedules
- Adapts to user response patterns over time
- Considers current workload to prevent overwhelming users
- Intelligent batching of related notifications

### User Preference Engine
- Customizable encouragement styles (cheerful, supportive, gentle, etc.)
- Flexible notification frequencies (gentle, moderate, minimal)
- Personal timezone and working hours support
- Delivery method preferences (in-app, email, banner, modal)

## 📊 Analytics and Metrics

The system tracks comprehensive metrics for continuous improvement:

- **Engagement Metrics**: Response rates, acknowledgment rates, action taken rates
- **Effectiveness Scores**: How well notifications drive desired behaviors
- **User Satisfaction**: Tone analysis scores and user feedback
- **Delivery Performance**: Success rates across different channels
- **Adaptive Learning**: How the system improves over time

## 🛡️ Privacy and Security

- **Minimal Data Collection**: Only stores necessary data for functionality
- **GDPR Compliant**: Full data export and deletion capabilities
- **Secure Storage**: Uses Forge's encrypted storage system
- **No External Data**: All processing happens within Atlassian's infrastructure
- **User Control**: Complete control over notification preferences and data

## 🎯 Development Roadmap

### Phase 1: Core Foundation ✅
- Basic notification engine architecture
- Jira API integration
- User preference system
- Simple stale ticket detection

### Phase 2: Smart Features ✅
- Advanced scheduling algorithms
- Tone analysis and validation
- Context-aware notifications
- User workload consideration

### Phase 3: Enhancement (Current)
- Machine learning for optimal timing
- Advanced analytics dashboard
- Team collaboration features
- External integrations (Slack, Teams)

### Phase 4: Optimization
- Predictive analytics
- Sentiment analysis improvements
- Mobile notifications
- Performance optimization

## 🤝 Contributing

We welcome contributions that align with our mission of creating encouraging, positive workplace tools:

1. **Code Contributions**: Follow our TypeScript coding standards and ensure all messages maintain a positive tone
2. **Message Templates**: Help us expand our library of encouraging message variations
3. **Language Support**: Assist with internationalization for global teams
4. **Testing**: Help us test across different Jira configurations and team sizes

## 📄 License

MIT License - see LICENSE file for details

## 🌟 Philosophy

The Gentle Nudge Assistant is built on the belief that workplace productivity tools should enhance human well-being, not create stress. Every notification is crafted to:

- **Encourage** rather than pressure
- **Support** rather than criticize  
- **Motivate** rather than overwhelm
- **Celebrate** achievements and progress
- **Respect** individual work styles and preferences

Our goal is to help teams stay organized and productive while maintaining a positive, supportive work environment that people actually enjoy being part of.

---

*"The best productivity tools don't just help you get work done - they help you feel good about the work you do."* ✨