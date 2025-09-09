/**
 * TypeScript type definitions for the Gentle Nudge Assistant analytics system
 * Defines interfaces for issue analysis, user workload, and detection criteria
 */

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
      };
    };
    priority: {
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    assignee?: {
      accountId: string;
      displayName: string;
      emailAddress?: string;
    };
    reporter: {
      accountId: string;
      displayName: string;
    };
    project: {
      id: string;
      key: string;
      name: string;
    };
    created: string;
    updated: string;
    duedate?: string;
    resolution?: {
      name: string;
    };
    labels: string[];
    components: Array<{
      id: string;
      name: string;
    }>;
    fixVersions: Array<{
      id: string;
      name: string;
      releaseDate?: string;
    }>;
    customfield_10016?: number; // Story points
    worklog?: {
      total: number;
      worklogs: Array<{
        id: string;
        author: {
          accountId: string;
        };
        created: string;
        timeSpent: string;
        timeSpentSeconds: number;
      }>;
    };
  };
}

export interface IssueAnalysisResult {
  issueKey: string;
  staleness: StalenessAnalysis;
  deadline: DeadlineAnalysis;
  context: ContextAnalysis;
  workload: WorkloadImpact;
  overallScore: number;
  recommendedAction: RecommendedAction;
  lastAnalyzed: Date;
}

export interface StalenessAnalysis {
  daysSinceLastUpdate: number;
  daysSinceLastComment: number;
  daysSinceLastWorklog: number;
  activityPattern: ActivityPattern;
  isStale: boolean;
  staleness: 'fresh' | 'aging' | 'stale' | 'very_stale' | 'abandoned';
  confidence: number;
  factors: StalenessFactors;
}

export interface StalenessFactors {
  hasRecentComments: boolean;
  hasRecentWorklogs: boolean;
  hasStatusChanges: boolean;
  assigneeActivity: AssigneeActivity;
  projectActivity: ProjectActivity;
}

export interface AssigneeActivity {
  overallActivityScore: number;
  recentIssuesUpdated: number;
  averageResponseTime: number;
  workloadLevel: 'light' | 'moderate' | 'heavy' | 'overloaded';
}

export interface ProjectActivity {
  overallActivityScore: number;
  teamSize: number;
  recentIssueUpdates: number;
  projectHealth: 'healthy' | 'moderate' | 'concerning' | 'critical';
}

export interface ActivityPattern {
  weekdayActivity: number[];
  hourlyActivity: number[];
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  seasonalFactors: {
    isHolidayPeriod: boolean;
    isEndOfSprint: boolean;
    isReleaseWeek: boolean;
  };
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
    days: number;
    hours: number;
    businessDaysRemaining: number;
  };
}

export interface SLAStatus {
  hasSLA: boolean;
  slaType?: 'response' | 'resolution' | 'custom';
  slaDeadline?: Date;
  timeToBreachSLA?: number;
  slaHealth: 'safe' | 'warning' | 'critical' | 'breached';
}

export interface ContextAnalysis {
  priorityScore: number;
  typeScore: number;
  projectImportance: number;
  businessImpact: BusinessImpact;
  technicalComplexity: TechnicalComplexity;
  stakeholderVisibility: StakeholderVisibility;
  contextualFactors: ContextualFactors;
}

export interface BusinessImpact {
  customerFacing: boolean;
  revenueImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  userImpact: number;
  blockingOtherWork: boolean;
  dependentIssuesCount: number;
}

export interface TechnicalComplexity {
  estimatedEffort: number;
  skillsRequired: string[];
  componentComplexity: 'simple' | 'moderate' | 'complex' | 'architectural';
  testingRequirements: 'minimal' | 'standard' | 'extensive' | 'critical';
}

export interface StakeholderVisibility {
  executiveVisibility: boolean;
  customerVisibility: boolean;
  partnerVisibility: boolean;
  communityVisibility: boolean;
  visibilityScore: number;
}

export interface ContextualFactors {
  isBlocking: boolean;
  isSecurityRelated: boolean;
  isPerformanceCritical: boolean;
  hasExternalDependencies: boolean;
  requiresSpecializedSkills: boolean;
  isPartOfEpic: boolean;
  epicPriority?: number;
}

export interface WorkloadImpact {
  assigneeWorkload: UserWorkload;
  teamWorkload: TeamWorkload;
  notificationFrequency: NotificationFrequency;
  optimalNotificationTime: Date;
  shouldNotify: boolean;
  notificationReason: string;
}

export interface UserWorkload {
  userId: string;
  currentOpenIssues: number;
  recentlyCompletedIssues: number;
  averageResolutionTime: number;
  workloadCapacity: 'under' | 'optimal' | 'near_capacity' | 'over_capacity';
  stressIndicators: StressIndicators;
  preferredWorkingHours: {
    start: number;
    end: number;
    timezone: string;
  };
}

export interface StressIndicators {
  rapidStatusChanges: number;
  lateNightActivity: number;
  weekendActivity: number;
  delayedResponses: number;
  overallStressLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export interface TeamWorkload {
  teamId?: string;
  projectId: string;
  totalActiveIssues: number;
  averageAge: number;
  teamCapacity: 'healthy' | 'busy' | 'overloaded' | 'critical';
  distributionBalance: number;
  collaborationScore: number;
}

export interface NotificationFrequency {
  recentNotifications: number;
  lastNotificationTime?: Date;
  userPreference: 'gentle' | 'moderate' | 'minimal' | 'disabled';
  frequencyScore: number;
  cooldownPeriod: number;
}

export interface RecommendedAction {
  actionType:
    | 'gentle_reminder'
    | 'deadline_notification'
    | 'priority_alert'
    | 'workload_suggestion'
    | 'no_action';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions: string[];
  timing: {
    immediate: boolean;
    scheduledTime?: Date;
    delayReason?: string;
  };
}

export interface AnalyticsConfiguration {
  staleness: StalenessConfig;
  deadlines: DeadlineConfig;
  context: ContextConfig;
  workload: WorkloadConfig;
  general: GeneralConfig;
}

export interface StalenessConfig {
  thresholds: {
    fresh: number;
    aging: number;
    stale: number;
    veryStale: number;
    abandoned: number;
  };
  factors: {
    lastUpdateWeight: number;
    lastCommentWeight: number;
    lastWorklogWeight: number;
    statusChangeWeight: number;
  };
  issueTypeMultipliers: Record<string, number>;
  priorityMultipliers: Record<string, number>;
}

export interface DeadlineConfig {
  warningThresholds: {
    critical: number; // days
    high: number;
    medium: number;
    low: number;
  };
  businessDaysOnly: boolean;
  holidays: string[];
  slaConfigurations: SLAConfig[];
}

export interface SLAConfig {
  name: string;
  type: 'response' | 'resolution' | 'custom';
  priority: string[];
  issueTypes: string[];
  timeLimit: number; // hours
  businessHoursOnly: boolean;
}

export interface ContextConfig {
  priorityWeights: Record<string, number>;
  issueTypeWeights: Record<string, number>;
  projectImportanceWeights: Record<string, number>;
  complexityFactors: {
    storyPointsWeight: number;
    componentCountWeight: number;
    dependencyWeight: number;
  };
}

export interface WorkloadConfig {
  capacityThresholds: {
    optimal: number;
    nearCapacity: number;
    overCapacity: number;
  };
  notificationLimits: {
    daily: number;
    weekly: number;
    perIssue: number;
  };
  cooldownPeriods: {
    gentle: number; // hours
    moderate: number;
    minimal: number;
  };
}

export interface GeneralConfig {
  enabledComponents: {
    staleness: boolean;
    deadlines: boolean;
    context: boolean;
    workload: boolean;
  };
  analysisFrequency: number; // hours
  cacheSettings: {
    issueDataTTL: number; // minutes
    userWorkloadTTL: number;
    projectDataTTL: number;
  };
  batchSizes: {
    issueAnalysis: number;
    userAnalysis: number;
    apiRequests: number;
  };
}

export interface AnalyticsCache {
  issues: Map<string, CachedIssueData>;
  users: Map<string, CachedUserData>;
  projects: Map<string, CachedProjectData>;
  analysis: Map<string, CachedAnalysisResult>;
}

export interface CachedIssueData {
  issue: JiraIssue;
  timestamp: Date;
  expiresAt: Date;
}

export interface CachedUserData {
  userId: string;
  workload: UserWorkload;
  preferences: UserPreferences;
  timestamp: Date;
  expiresAt: Date;
}

export interface CachedProjectData {
  projectId: string;
  teamMetrics: TeamWorkload;
  configuration: ProjectConfiguration;
  timestamp: Date;
  expiresAt: Date;
}

export interface CachedAnalysisResult {
  issueKey: string;
  result: IssueAnalysisResult;
  timestamp: Date;
  expiresAt: Date;
}

export interface UserPreferences {
  userId: string;
  notificationFrequency: 'gentle' | 'moderate' | 'minimal' | 'disabled';
  quietHours: {
    start: string;
    end: string;
    timezone: string;
  };
  preferredTone: 'encouraging' | 'casual' | 'professional';
  staleDaysThreshold: number;
  deadlineWarningDays: number;
  enabledNotificationTypes: NotificationType[];
  customThresholds?: Partial<AnalyticsConfiguration>;
}

export interface ProjectConfiguration {
  projectId: string;
  teamNudgePolicy: 'individual' | 'team' | 'hybrid';
  escalationRules: EscalationRule[];
  customSLAs: SLAConfig[];
  workingHours: {
    start: number;
    end: number;
    timezone: string;
  };
  holidays: string[];
}

export interface EscalationRule {
  condition: EscalationCondition;
  action: EscalationAction;
  delayHours: number;
}

export interface EscalationCondition {
  type: 'staleness' | 'deadline' | 'priority' | 'custom';
  threshold: number;
  issueTypes?: string[];
  priorities?: string[];
}

export interface EscalationAction {
  type: 'notify_assignee' | 'notify_manager' | 'notify_team' | 'auto_reassign';
  recipients?: string[];
  message?: string;
}

export type NotificationType =
  | 'stale_reminder'
  | 'deadline_warning'
  | 'priority_alert'
  | 'workload_optimization'
  | 'team_update'
  | 'achievement_recognition';

export interface BatchAnalysisRequest {
  issueKeys: string[];
  analysisType: 'full' | 'staleness_only' | 'deadlines_only' | 'workload_only';
  priority: 'low' | 'normal' | 'high';
  requestId: string;
  timestamp: Date;
}

export interface BatchAnalysisResult {
  requestId: string;
  results: IssueAnalysisResult[];
  errors: AnalysisError[];
  processingTime: number;
  timestamp: Date;
}

export interface AnalysisError {
  issueKey?: string;
  component: 'staleness' | 'deadline' | 'context' | 'workload' | 'api';
  error: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface PerformanceMetrics {
  analysisTime: {
    average: number;
    max: number;
    min: number;
  };
  apiCallCount: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // issues per minute
}
