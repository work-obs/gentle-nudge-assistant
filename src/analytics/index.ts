/**
 * Analytics Module Index - Exports all analytics components
 *
 * This index file provides convenient access to all analytics system components
 * and includes factory functions for easy initialization.
 */

// Core Analytics Components
export { StalenessDetector } from './StalenessDetector';
export { DeadlineMonitor } from './DeadlineMonitor';
export { ContextAnalyzer } from './ContextAnalyzer';
export { UserWorkloadCalculator } from './UserWorkloadCalculator';
export { AnalyticsEngine } from './AnalyticsEngine';

// API Client
export { JiraApiClient } from '../api/JiraApiClient';

// Type Definitions
export * from '../types/analytics';

// Default configurations for easy setup
import {
  AnalyticsConfiguration,
  StalenessConfig,
  DeadlineConfig,
  ContextConfig,
  WorkloadConfig,
  GeneralConfig,
} from '../types/analytics';

/**
 * Default staleness detection configuration
 */
export const DEFAULT_STALENESS_CONFIG: StalenessConfig = {
  thresholds: {
    fresh: 2, // days
    aging: 5, // days
    stale: 10, // days
    veryStale: 20, // days
    abandoned: 45, // days
  },
  factors: {
    lastUpdateWeight: 0.4,
    lastCommentWeight: 0.3,
    lastWorklogWeight: 0.2,
    statusChangeWeight: 0.1,
  },
  issueTypeMultipliers: {
    Epic: 1.5, // Epics can age longer
    Story: 1.0, // Standard aging
    Task: 1.0, // Standard aging
    Bug: 0.7, // Bugs should be addressed faster
    'Sub-task': 0.8, // Sub-tasks need quicker turnaround
    Spike: 1.2, // Research tasks can take longer
  },
  priorityMultipliers: {
    Blocker: 0.3, // Blockers age much faster
    Critical: 0.5, // Critical issues age faster
    High: 0.8, // High priority ages faster
    Medium: 1.0, // Standard aging
    Low: 1.3, // Low priority can age longer
    Lowest: 1.5, // Lowest priority ages slowest
  },
};

/**
 * Default deadline monitoring configuration
 */
export const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = {
  warningThresholds: {
    critical: 1, // days
    high: 3, // days
    medium: 7, // days
    low: 14, // days
  },
  businessDaysOnly: true,
  holidays: [
    '2024-01-01',
    '2024-07-04',
    '2024-12-25', // Standard US holidays
    '2024-11-28',
    '2024-11-29', // Thanksgiving
  ],
  slaConfigurations: [
    {
      name: 'Critical Bug Response',
      type: 'response',
      priority: ['Blocker', 'Critical'],
      issueTypes: ['Bug'],
      timeLimit: 4, // hours
      businessHoursOnly: true,
    },
    {
      name: 'Standard Resolution',
      type: 'resolution',
      priority: ['Medium', 'High'],
      issueTypes: ['Story', 'Task'],
      timeLimit: 120, // hours (5 business days)
      businessHoursOnly: true,
    },
  ],
};

/**
 * Default context analysis configuration
 */
export const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  priorityWeights: {
    Blocker: 1.0,
    Critical: 0.9,
    High: 0.7,
    Medium: 0.5,
    Low: 0.3,
    Lowest: 0.1,
  },
  issueTypeWeights: {
    Epic: 0.9,
    Bug: 0.8,
    Story: 0.6,
    Task: 0.5,
    'Sub-task': 0.4,
    Spike: 0.3,
  },
  projectImportanceWeights: {
    CORE: 1.0, // Core platform project
    CUST: 0.9, // Customer-facing project
    INT: 0.6, // Internal tools
    TEST: 0.3, // Test project
  },
  complexityFactors: {
    storyPointsWeight: 0.4,
    componentCountWeight: 0.3,
    dependencyWeight: 0.3,
  },
};

/**
 * Default workload management configuration
 */
export const DEFAULT_WORKLOAD_CONFIG: WorkloadConfig = {
  capacityThresholds: {
    optimal: 8, // issues
    nearCapacity: 12, // issues
    overCapacity: 18, // issues
  },
  notificationLimits: {
    daily: 3, // notifications per day
    weekly: 15, // notifications per week
    perIssue: 2, // notifications per issue per week
  },
  cooldownPeriods: {
    gentle: 8, // hours
    moderate: 4, // hours
    minimal: 24, // hours
  },
};

/**
 * Default general configuration
 */
export const DEFAULT_GENERAL_CONFIG: GeneralConfig = {
  enabledComponents: {
    staleness: true,
    deadlines: true,
    context: true,
    workload: true,
  },
  analysisFrequency: 2, // hours
  cacheSettings: {
    issueDataTTL: 15, // minutes
    userWorkloadTTL: 60, // minutes
    projectDataTTL: 240, // minutes
  },
  batchSizes: {
    issueAnalysis: 50,
    userAnalysis: 25,
    apiRequests: 100,
  },
};

/**
 * Complete default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfiguration = {
  staleness: DEFAULT_STALENESS_CONFIG,
  deadlines: DEFAULT_DEADLINE_CONFIG,
  context: DEFAULT_CONTEXT_CONFIG,
  workload: DEFAULT_WORKLOAD_CONFIG,
  general: DEFAULT_GENERAL_CONFIG,
};

/**
 * Factory function to create a new AnalyticsEngine with default configuration
 */
export function createAnalyticsEngine(
  customConfig?: Partial<AnalyticsConfiguration>
): import('./AnalyticsEngine').AnalyticsEngine {
  const { AnalyticsEngine } = require('./AnalyticsEngine');

  const config = customConfig
    ? mergeConfigurations(DEFAULT_ANALYTICS_CONFIG, customConfig)
    : DEFAULT_ANALYTICS_CONFIG;

  return new AnalyticsEngine(config);
}

/**
 * Factory function to create analytics engine with minimal configuration
 * Suitable for lightweight usage or testing
 */
export function createMinimalAnalyticsEngine(): import('./AnalyticsEngine').AnalyticsEngine {
  const minimalConfig: Partial<AnalyticsConfiguration> = {
    general: {
      ...DEFAULT_GENERAL_CONFIG,
      enabledComponents: {
        staleness: true,
        deadlines: true,
        context: false,
        workload: false,
      },
      batchSizes: {
        issueAnalysis: 20,
        userAnalysis: 10,
        apiRequests: 50,
      },
    },
  };

  return createAnalyticsEngine(minimalConfig);
}

/**
 * Factory function to create analytics engine optimized for high-volume usage
 */
export function createHighVolumeAnalyticsEngine(): import('./AnalyticsEngine').AnalyticsEngine {
  const highVolumeConfig: Partial<AnalyticsConfiguration> = {
    general: {
      ...DEFAULT_GENERAL_CONFIG,
      batchSizes: {
        issueAnalysis: 100,
        userAnalysis: 50,
        apiRequests: 200,
      },
      cacheSettings: {
        issueDataTTL: 30, // Longer cache for high volume
        userWorkloadTTL: 120,
        projectDataTTL: 480,
      },
    },
  };

  return createAnalyticsEngine(highVolumeConfig);
}

/**
 * Utility function to merge configurations deeply
 */
function mergeConfigurations(
  defaultConfig: AnalyticsConfiguration,
  customConfig: Partial<AnalyticsConfiguration>
): AnalyticsConfiguration {
  const merged = { ...defaultConfig };

  if (customConfig.staleness) {
    merged.staleness = { ...merged.staleness, ...customConfig.staleness };
  }

  if (customConfig.deadlines) {
    merged.deadlines = { ...merged.deadlines, ...customConfig.deadlines };
    if (customConfig.deadlines.slaConfigurations) {
      merged.deadlines.slaConfigurations =
        customConfig.deadlines.slaConfigurations;
    }
    if (customConfig.deadlines.holidays) {
      merged.deadlines.holidays = [
        ...merged.deadlines.holidays,
        ...customConfig.deadlines.holidays,
      ];
    }
  }

  if (customConfig.context) {
    merged.context = { ...merged.context, ...customConfig.context };
  }

  if (customConfig.workload) {
    merged.workload = { ...merged.workload, ...customConfig.workload };
  }

  if (customConfig.general) {
    merged.general = { ...merged.general, ...customConfig.general };
  }

  return merged;
}

/**
 * Validation function for analytics configuration
 */
export function validateAnalyticsConfiguration(
  config: AnalyticsConfiguration
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate staleness thresholds
  const staleness = config.staleness.thresholds;
  if (staleness.fresh >= staleness.aging) {
    errors.push('Staleness fresh threshold must be less than aging threshold');
  }
  if (staleness.aging >= staleness.stale) {
    errors.push('Staleness aging threshold must be less than stale threshold');
  }

  // Validate deadline thresholds
  const deadline = config.deadlines.warningThresholds;
  if (deadline.critical >= deadline.high) {
    errors.push('Critical deadline threshold must be less than high threshold');
  }

  // Validate workload settings
  const workload = config.workload.capacityThresholds;
  if (workload.optimal >= workload.nearCapacity) {
    errors.push('Optimal capacity must be less than near capacity threshold');
  }

  // Validate batch sizes
  const batchSizes = config.general.batchSizes;
  if (batchSizes.issueAnalysis <= 0 || batchSizes.issueAnalysis > 200) {
    errors.push('Issue analysis batch size must be between 1 and 200');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Utility to create issue-type specific configurations
 */
export function createIssueTypeConfig(
  issueType: string
): Partial<AnalyticsConfiguration> {
  const configs: Record<string, Partial<AnalyticsConfiguration>> = {
    development: {
      staleness: {
        ...DEFAULT_STALENESS_CONFIG,
        thresholds: {
          fresh: 1,
          aging: 3,
          stale: 7,
          veryStale: 14,
          abandoned: 30,
        },
      },
    },
    support: {
      deadlines: {
        ...DEFAULT_DEADLINE_CONFIG,
        warningThresholds: {
          critical: 0.5, // 12 hours
          high: 1, // 1 day
          medium: 2, // 2 days
          low: 5, // 5 days
        },
      },
    },
    research: {
      staleness: {
        ...DEFAULT_STALENESS_CONFIG,
        thresholds: {
          fresh: 5,
          aging: 10,
          stale: 20,
          veryStale: 40,
          abandoned: 60,
        },
      },
    },
  };

  return configs[issueType] || {};
}
