/**
 * Core notification types and interfaces for the Gentle Nudge Assistant
 */

export interface NotificationMetadata {
  id: string;
  issueKey: string;
  userId: string;
  createdAt: Date;
  scheduledFor: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  dismissedAt?: Date;
  priority: NotificationPriority;
  context: NotificationContext;
}

export interface NotificationContent {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  tone: MessageTone;
  templateId: string;
  variables: Record<string, any>;
}

export interface Notification {
  metadata: NotificationMetadata;
  content: NotificationContent;
}

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationFrequency = 'gentle' | 'moderate' | 'minimal';

export type MessageTone = 'encouraging' | 'casual' | 'professional';

export interface NotificationContext {
  type: NotificationType;
  issueData: JiraIssueData;
  userWorkload: UserWorkloadInfo;
  teamMetrics?: TeamMetrics;
  deadline?: DeadlineInfo;
}

export type NotificationType =
  | 'stale-reminder'
  | 'deadline-warning'
  | 'progress-update'
  | 'team-encouragement'
  | 'achievement-recognition';

export interface JiraIssueData {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: Date;
  updated: Date;
  dueDate?: Date;
  project: {
    key: string;
    name: string;
  };
  issueType: string;
  description?: string;
  components: string[];
  labels: string[];
}

export interface UserWorkloadInfo {
  totalAssignedIssues: number;
  overdueIssues: number;
  staleDaysAverage: number;
  recentActivityScore: number;
  currentCapacityLevel: 'light' | 'moderate' | 'heavy' | 'overloaded';
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface TeamMetrics {
  projectKey: string;
  teamSize: number;
  averageResolutionTime: number;
  teamVelocity: number;
  morale: number; // 1-10 scale
  completionRate: number;
}

export interface DeadlineInfo {
  dueDate: Date;
  daysRemaining: number;
  isOverdue: boolean;
  slaBreachRisk: 'none' | 'low' | 'medium' | 'high';
  bufferTime: number; // hours
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  deliveryMethod: string;
  error?: string;
  retryCount?: number;
  userResponse?: UserResponse;
}

export type UserResponse =
  | 'dismissed'
  | 'acknowledged'
  | 'actioned'
  | 'snoozed';

export interface NotificationHistory {
  issueKey: string;
  notifications: NotificationMetadata[];
  lastNudgeDate: Date;
  totalNudgeCount: number;
  effectivenessScore: number;
  userResponsePattern: UserResponse[];
}
