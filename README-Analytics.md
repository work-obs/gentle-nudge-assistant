# Gentle Nudge Assistant - Issue Analytics System

A comprehensive TypeScript-based analytics system that provides intelligent insights about Jira issues to enable gentle, context-aware notifications. The system analyzes issue staleness, deadlines, context, and user workload to make smart decisions about when and how to nudge users.

## 🎯 Overview

The analytics system is designed around four core principles:
- **Intelligence**: Smart detection algorithms that understand context
- **Respect**: User workload and preferences are always considered
- **Performance**: Efficient API usage with intelligent caching
- **Flexibility**: Configurable thresholds and customizable behavior

## 🏗️ Architecture

### Core Components

#### 1. **StalenessDetector** (`src/analytics/StalenessDetector.ts`)
Analyzes issue update patterns and determines staleness levels.

**Features:**
- Smart staleness detection with configurable thresholds
- Activity pattern analysis (comments, worklogs, status changes)
- Issue type and priority considerations
- Assignee and project context integration

**Staleness Levels:**
- `fresh`: Recently updated issues
- `aging`: Issues that haven't been updated recently
- `stale`: Issues that need attention
- `very_stale`: Issues that urgently need attention
- `abandoned`: Issues that may have been forgotten

#### 2. **DeadlineMonitor** (`src/analytics/DeadlineMonitor.ts`)
Tracks due dates, SLA timelines, and deadline proximity.

**Features:**
- Due date and fix version deadline tracking
- Configurable SLA monitoring with business hours support
- Holiday and business day calculations
- Context-aware urgency scoring

**Urgency Levels:**
- `low`: No immediate deadline concerns
- `medium`: Approaching deadlines
- `high`: Near-deadline issues
- `critical`: Overdue or critical timeline issues

#### 3. **ContextAnalyzer** (`src/analytics/ContextAnalyzer.ts`)
Analyzes issue priority, type, and project importance.

**Features:**
- Multi-dimensional context analysis
- Business impact assessment
- Technical complexity evaluation
- Stakeholder visibility tracking
- Blocking issue identification

#### 4. **UserWorkloadCalculator** (`src/analytics/UserWorkloadCalculator.ts`)
Prevents overwhelming users by analyzing workload and optimizing timing.

**Features:**
- User capacity analysis
- Stress indicator monitoring
- Optimal notification timing
- Team workload distribution analysis
- Notification frequency management

#### 5. **JiraApiClient** (`src/api/JiraApiClient.ts`)
Efficient Jira API integration with caching and batching.

**Features:**
- Smart caching with configurable TTL
- Batched API requests for performance
- Rate limiting and retry logic
- Optimized field selection
- Mock data support for development

#### 6. **AnalyticsEngine** (`src/analytics/AnalyticsEngine.ts`)
Main orchestrator that coordinates all components.

**Features:**
- Component orchestration and data flow
- Batch processing optimization
- Result aggregation and ranking
- Performance monitoring
- Configuration management

## 🚀 Quick Start

### Basic Usage

```typescript
import { createAnalyticsEngine } from './src/analytics';

// Create engine with default configuration
const engine = createAnalyticsEngine();

// Analyze a single issue
const result = await engine.analyzeIssue(jiraIssue, userPreferences);
console.log('Should notify:', result.workload.shouldNotify);
console.log('Recommended action:', result.recommendedAction.actionType);
```

### Custom Configuration

```typescript
import { createAnalyticsEngine, DEFAULT_ANALYTICS_CONFIG } from './src/analytics';

const customConfig = {
  staleness: {
    thresholds: {
      fresh: 1,      // Issues become aging after 1 day
      aging: 3,      // Issues become stale after 3 days
      stale: 7,      // Issues become very stale after 7 days
      veryStale: 14,
      abandoned: 30
    }
  },
  workload: {
    notificationLimits: {
      daily: 5,      // More notifications per day
      weekly: 25,
      perIssue: 3
    }
  }
};

const engine = createAnalyticsEngine(customConfig);
```

### Batch Analysis

```typescript
// Find issues needing attention across projects
const results = await engine.findIssuesNeedingAttention({
  projectIds: ['PROJ-1', 'PROJ-2'],
  maxResults: 100,
  analysisTypes: ['staleness', 'deadlines']
});

console.log(`High priority: ${results.highPriority.length} issues`);
console.log(`Recommendations:`, results.insights.recommendations);
```

## 📊 Analysis Results

### IssueAnalysisResult Structure

```typescript
interface IssueAnalysisResult {
  issueKey: string;
  staleness: StalenessAnalysis;     // How stale is the issue?
  deadline: DeadlineAnalysis;       // Any deadline concerns?
  context: ContextAnalysis;         // How important is it?
  workload: WorkloadImpact;         // Should we notify the user?
  overallScore: number;             // Combined importance score (0-1)
  recommendedAction: RecommendedAction; // What should we do?
  lastAnalyzed: Date;
}
```

### Recommended Actions

The system generates contextual recommendations:

- **`gentle_reminder`**: Friendly nudge for stale issues
- **`deadline_notification`**: Approaching deadline alert
- **`priority_alert`**: High-priority issue notification  
- **`workload_suggestion`**: Suggestion when user has capacity
- **`no_action`**: No notification needed

## ⚙️ Configuration

### Default Configurations

The system includes several pre-configured setups:

```typescript
// Standard configuration
const engine = createAnalyticsEngine();

// Minimal configuration (staleness + deadlines only)
const minimalEngine = createMinimalAnalyticsEngine();

// High-volume configuration (optimized for large instances)
const highVolumeEngine = createHighVolumeAnalyticsEngine();
```

### Staleness Configuration

```typescript
const stalenessConfig = {
  thresholds: {
    fresh: 2,      // days
    aging: 5,
    stale: 10,
    veryStale: 20,
    abandoned: 45
  },
  issueTypeMultipliers: {
    'Bug': 0.7,        // Bugs should be addressed faster
    'Epic': 1.5,       // Epics can age longer
    'Story': 1.0       // Standard aging
  },
  priorityMultipliers: {
    'Blocker': 0.3,    // Blockers age much faster
    'Low': 1.3         // Low priority can age longer
  }
};
```

### Deadline Configuration

```typescript
const deadlineConfig = {
  warningThresholds: {
    critical: 1,  // days
    high: 3,
    medium: 7,
    low: 14
  },
  businessDaysOnly: true,
  holidays: ['2024-12-25', '2024-01-01'],
  slaConfigurations: [
    {
      name: 'Critical Bug Response',
      type: 'response',
      priority: ['Blocker', 'Critical'],
      issueTypes: ['Bug'],
      timeLimit: 4, // hours
      businessHoursOnly: true
    }
  ]
};
```

### Workload Configuration

```typescript
const workloadConfig = {
  capacityThresholds: {
    optimal: 8,        // issues
    nearCapacity: 12,
    overCapacity: 18
  },
  notificationLimits: {
    daily: 3,          // notifications per day
    weekly: 15,
    perIssue: 2
  },
  cooldownPeriods: {
    gentle: 8,         // hours between gentle reminders
    moderate: 4,
    minimal: 24
  }
};
```

## 🚀 Performance Features

### Intelligent Caching

- **Issue Data**: 15-minute TTL with intelligent invalidation
- **User Workload**: 1-hour TTL with activity-based updates
- **Project Data**: 4-hour TTL for team-level metrics
- **Analysis Results**: 2-hour TTL for computed insights

### Batch Processing

- **Issue Analysis**: Process up to 50 issues per batch
- **API Requests**: Batch up to 100 API calls
- **Memory Management**: Automatic cleanup and optimization

### Rate Limiting

- **API Calls**: Respects Jira rate limits (100/min, 5000/hour)
- **Retry Logic**: Exponential backoff for failed requests
- **Circuit Breaking**: Prevents cascading failures

## 📈 Monitoring and Metrics

### Performance Metrics

```typescript
const metrics = engine.getPerformanceMetrics();
console.log({
  averageAnalysisTime: metrics.analysisTime.average,
  apiCallCount: metrics.apiCallCount,
  cacheHitRate: metrics.cacheHitRate,
  errorRate: metrics.errorRate,
  throughput: metrics.throughput // issues per minute
});
```

### Cache Statistics

```typescript
const cacheStats = engine.getCacheStats();
console.log({
  totalCachedIssues: cacheStats.issues,
  totalCachedUsers: cacheStats.users,
  totalCachedProjects: cacheStats.projects,
  totalCacheSize: cacheStats.totalSize
});
```

## 🧪 Testing and Development

### Mock Data Support

The system includes comprehensive mock data generators for development:

```typescript
// Mock Jira issue for testing
const mockIssue = jiraClient.createMockIssue();

// Run analysis with mock data
const result = await engine.analyzeIssue(mockIssue);
```

### Example Usage

See `examples/analytics-usage.ts` for comprehensive usage examples:

```bash
# Run all examples
npx ts-node examples/analytics-usage.ts

# Run specific example
import { basicAnalyticsExample } from './examples/analytics-usage';
await basicAnalyticsExample();
```

## 🔧 Integration with Forge

### Setup for Jira Cloud Plugin

```typescript
// In your Forge app
import { invoke } from '@forge/bridge';
import { createAnalyticsEngine } from './analytics';

// Initialize analytics engine
const engine = createAnalyticsEngine({
  // Configure for your Jira instance
  general: {
    batchSizes: {
      apiRequests: 50 // Conservative for Forge limits
    }
  }
});

// Use in your resolver
export const analyzeUserIssues = async (req) => {
  const { accountId } = req.context;
  
  // Get user's assigned issues
  const issues = await jiraClient.getUserAssignedIssues(accountId);
  
  // Analyze for nudge opportunities
  const results = await engine.findIssuesNeedingAttention({
    assignees: [accountId],
    maxResults: 50
  });
  
  return {
    needsAttention: results.highPriority.length,
    insights: results.insights,
    recommendations: results.insights.recommendations
  };
};
```

### Storage Integration

```typescript
// Store user preferences
import { storage } from '@forge/api';

const userPreferences = await storage.get(`user-prefs-${accountId}`);
const analysisResult = await engine.analyzeIssue(issue, userPreferences);

// Store notification history
await storage.set(`notifications-${accountId}`, {
  last: new Date(),
  count: dailyCount + 1
});
```

## 🎨 Customization Examples

### Development Team Configuration

```typescript
const devTeamConfig = createAnalyticsEngine({
  staleness: {
    thresholds: { fresh: 1, aging: 3, stale: 7, veryStale: 14, abandoned: 30 }
  },
  workload: {
    capacityThresholds: { optimal: 5, nearCapacity: 8, overCapacity: 12 }
  }
});
```

### Support Team Configuration  

```typescript
const supportConfig = createAnalyticsEngine({
  deadlines: {
    warningThresholds: { critical: 0.5, high: 1, medium: 2, low: 5 }
  },
  staleness: {
    priorityMultipliers: { 'Blocker': 0.1, 'Critical': 0.2 }
  }
});
```

### Research Team Configuration

```typescript
const researchConfig = createAnalyticsEngine({
  staleness: {
    thresholds: { fresh: 5, aging: 10, stale: 20, veryStale: 40, abandoned: 60 }
  },
  workload: {
    notificationLimits: { daily: 1, weekly: 5, perIssue: 1 }
  }
});
```

## 🤝 Contributing

### Adding New Analysis Components

1. Implement the analysis interface
2. Add configuration options to types
3. Integrate with AnalyticsEngine
4. Add tests and documentation
5. Update examples

### Configuration Validation

```typescript
import { validateAnalyticsConfiguration } from './analytics';

const validation = validateAnalyticsConfiguration(customConfig);
if (!validation.valid) {
  console.error('Invalid configuration:', validation.errors);
}
```

## 📚 API Reference

### Main Classes

- **`AnalyticsEngine`**: Primary interface for issue analysis
- **`StalenessDetector`**: Issue staleness analysis  
- **`DeadlineMonitor`**: Deadline and SLA tracking
- **`ContextAnalyzer`**: Issue importance and context
- **`UserWorkloadCalculator`**: User capacity and notification optimization
- **`JiraApiClient`**: Efficient Jira API integration

### Factory Functions

- **`createAnalyticsEngine(config?)`**: Create standard engine
- **`createMinimalAnalyticsEngine()`**: Lightweight configuration
- **`createHighVolumeAnalyticsEngine()`**: High-performance configuration

### Utility Functions

- **`validateAnalyticsConfiguration(config)`**: Validate configuration
- **`mergeConfigurations(default, custom)`**: Merge configurations
- **`createIssueTypeConfig(type)`**: Create type-specific configuration

## 🐛 Troubleshooting

### Common Issues

**High memory usage**: Reduce batch sizes and cache TTL
```typescript
const config = {
  general: {
    batchSizes: { issueAnalysis: 25 },
    cacheSettings: { issueDataTTL: 5 }
  }
};
```

**Slow performance**: Enable caching and increase batch sizes
```typescript
const config = {
  general: {
    batchSizes: { issueAnalysis: 100, apiRequests: 200 }
  }
};
```

**Too many notifications**: Adjust workload limits
```typescript
const config = {
  workload: {
    notificationLimits: { daily: 2, weekly: 10 }
  }
};
```

## 📄 License

This analytics system is part of the Gentle Nudge Assistant Jira Cloud Plugin. See the main project license for details.