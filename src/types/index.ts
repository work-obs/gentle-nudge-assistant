// Core types for the Gentle Nudge Assistant

export interface UserPreferences {
  userId: string;
  notificationFrequency: 'gentle' | 'moderate' | 'minimal';
  quietHours: {
    start: string;
    end: string;
  };
  preferredTone: 'encouraging' | 'casual' | 'professional';
  staleDaysThreshold: number;
  deadlineWarningDays: number;
  enabledNotificationTypes: NotificationType[];
}

export interface NudgeTracking {
  issueKey: string;
  lastNudgeDate: Date;
  nudgeCount: number;
  userResponse: 'dismissed' | 'acknowledged' | 'actioned';
  effectivenessScore: number;
}

export type NotificationType =
  | 'stale-reminder'
  | 'deadline-notification'
  | 'progress-update'
  | 'team-encouragement';

export interface Issue {
  key: string;
  summary: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: User;
  reporter: User;
  created: Date;
  updated: Date;
  dueDate?: Date;
  project: Project;
  issueType: string;
}

export interface User {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    '16x16'?: string;
    '24x24'?: string;
    '32x32'?: string;
    '48x48'?: string;
  };
}

export interface Project {
  key: string;
  name: string;
  description?: string;
  lead?: User;
  projectTypeKey: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  issueKey: string;
  userId: string;
  createdAt: Date;
  scheduledFor?: Date;
  dismissed: boolean;
  acknowledged: boolean;
  tone: UserPreferences['preferredTone'];
}

export interface AnalyticsData {
  issueKey: string;
  daysSinceLastUpdate: number;
  daysUntilDeadline?: number;
  priority: string;
  userWorkload: number;
  contextScore: number;
  stalenessScore: number;
}

export interface NudgeEngineConfig {
  maxNotificationsPerDay: number;
  minHoursBetweenNudges: number;
  stalenessThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  deadlineThresholds: {
    urgent: number;
    warning: number;
    reminder: number;
  };
}

export interface ForgeContext {
  accountId: string;
  cloudId: string;
  moduleKey: string;
  siteUrl: string;
}

// API Response types
export interface JiraApiResponse<T> {
  expand?: string;
  startAt?: number;
  maxResults?: number;
  total?: number;
  values?: T[];
  issues?: T[];
}

export interface ApiError {
  errorMessages?: string[];
  errors?: Record<string, string>;
  status: number;
  message: string;
}

// Component Props
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface NotificationComponentProps extends ComponentProps {
  notification: Notification;
  onDismiss: (notificationId: string) => void;
  onAcknowledge: (notificationId: string) => void;
  onAction: (notificationId: string, issueKey: string) => void;
}

export interface SettingsPanelProps extends ComponentProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
  onSave: () => void;
}

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user-preferences',
  NUDGE_TRACKING: 'nudge-tracking',
  NOTIFICATION_HISTORY: 'notification-history',
  ANALYTICS_CACHE: 'analytics-cache',
} as const;

// Default values
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'userId'> = {
  notificationFrequency: 'gentle',
  quietHours: {
    start: '18:00',
    end: '09:00',
  },
  preferredTone: 'encouraging',
  staleDaysThreshold: 3,
  deadlineWarningDays: 2,
  enabledNotificationTypes: [
    'stale-reminder',
    'deadline-notification',
    'progress-update',
  ],
};

export const DEFAULT_NUDGE_ENGINE_CONFIG: NudgeEngineConfig = {
  maxNotificationsPerDay: 3,
  minHoursBetweenNudges: 4,
  stalenessThresholds: {
    low: 1,
    medium: 3,
    high: 7,
    critical: 14,
  },
  deadlineThresholds: {
    urgent: 1,
    warning: 3,
    reminder: 7,
  },
};

// Missing types needed by other files
export interface JiraIssueData {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    priority: {
      name: string;
    };
    assignee?: User;
    reporter: User;
    created: string;
    updated: string;
    duedate?: string;
    project: Project;
    issuetype: {
      name: string;
    };
    worklog?: {
      worklogs: Array<{
        author: User;
        created: string;
        updated: string;
        timeSpent: string;
      }>;
    };
  };
}

export interface UserWorkloadInfo {
  userId: string;
  activeIssues: number;
  overallWorkload: 'light' | 'moderate' | 'heavy' | 'overwhelming';
  lastActivityDate?: Date;
  notificationFrequency: 'gentle' | 'moderate' | 'minimal' | 'disabled';
}

export interface TeamMetrics {
  teamId: string;
  totalIssues: number;
  completedThisWeek: number;
  averageResolutionDays: number;
  staleIssues: number;
  upcomingDeadlines: number;
}

export interface DeadlineInfo {
  issueKey: string;
  dueDate?: Date;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: User;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface GentleNudgeError extends Error {
  code: string;
  statusCode?: number;
  context?: Record<string, any>;
}

// SLA Types
export interface SLAConfig {
  name: string;
  priority: string;
  responseTimeHours: number;
  resolutionTimeDays: number;
  businessHoursOnly: boolean;
}

export interface SLAStatus {
  isActive: boolean;
  timeRemaining: {
    response?: number;
    resolution?: number;
  };
  breached: boolean;
  warningThreshold: boolean;
}

// Context and Analysis Types
export interface ContextualFactors {
  isBlocking: boolean;
  isSecurityRelated: boolean;
  isPerformanceCritical: boolean;
  hasExternalDependencies: boolean;
  requiresSpecializedSkills: boolean;
  isPartOfEpic: boolean;
  epicPriority?: number;
}

export interface DeadlineAnalysis {
  hasDueDate: boolean;
  dueDate?: Date;
  daysUntilDue?: number;
  hasFixVersion: boolean;
  fixVersionDate?: Date;
  daysUntilRelease?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  slaStatus: SLAStatus;
  timeRemaining?: {
    response?: number;
    resolution?: number;
  };
}

export interface NotificationFrequencyAnalysis {
  recentNotifications: number;
  lastNotificationTime?: Date;
  userPreference: 'gentle' | 'moderate' | 'minimal' | 'disabled';
  frequencyScore: number;
  cooldownPeriod: number;
}

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  issue?: Issue;
  issues?: Issue[];
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  dismissible: boolean;
}
