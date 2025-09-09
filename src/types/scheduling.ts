/**
 * Scheduling and timing types for the notification engine
 */

import { NotificationType, NotificationPriority } from './notification';

export interface SchedulingConfiguration {
  baseFrequencyMinutes: number;
  priorityMultipliers: Record<NotificationPriority, number>;
  typeScheduling: Record<NotificationType, TypeScheduleConfig>;
  globalLimits: GlobalSchedulingLimits;
  adaptiveScheduling: AdaptiveSchedulingConfig;
}

export interface TypeScheduleConfig {
  minIntervalMinutes: number;
  maxIntervalMinutes: number;
  optimalTimeWindows: TimeWindow[];
  avoidTimeWindows: TimeWindow[];
  backoffMultiplier: number; // Multiplier for subsequent notifications
  maxDailyCount: number;
}

export interface TimeWindow {
  start: string; // HH:MM format
  end: string; // HH:MM format
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  weight: number; // 0-1, higher is more preferred
  label?: string;
}

export interface GlobalSchedulingLimits {
  maxNotificationsPerHour: number;
  maxNotificationsPerDay: number;
  minIntervalBetweenNotifications: number; // minutes
  respectQuietHours: boolean;
  respectWeekends: boolean;
  respectHolidays: boolean;
}

export interface AdaptiveSchedulingConfig {
  enableLearning: boolean;
  learningPeriodDays: number;
  adaptToUserResponse: boolean;
  adaptToWorkload: boolean;
  adaptToTeamVelocity: boolean;
  minimumDataPoints: number; // Before making adaptive changes
}

export interface ScheduledNotification {
  id: string;
  issueKey: string;
  userId: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  scheduledFor: Date;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  backoffMultiplier: number;
  context: SchedulingContext;
  status: ScheduleStatus;
}

export type ScheduleStatus = 
  | 'pending'
  | 'queued'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface SchedulingContext {
  userWorkload: 'light' | 'moderate' | 'heavy' | 'overloaded';
  timeZone: string;
  isInQuietHours: boolean;
  isInWorkingHours: boolean;
  recentNotificationCount: number;
  lastNotificationTime?: Date;
  userResponseHistory: UserResponseHistoryItem[];
}

export interface UserResponseHistoryItem {
  notificationId: string;
  responseType: 'dismissed' | 'acknowledged' | 'actioned' | 'ignored';
  responseTime: number; // minutes from delivery to response
  timeOfDay: number; // hour of day when responded
  dayOfWeek: number; // day of week when responded
}

export interface SchedulingDecision {
  shouldSchedule: boolean;
  recommendedTime: Date;
  reasoning: string[];
  alternativeTimes: Date[];
  confidenceScore: number; // 0-1
  adaptiveAdjustments: AdaptiveAdjustment[];
}

export interface AdaptiveAdjustment {
  type: 'timing' | 'frequency' | 'content' | 'delivery';
  reason: string;
  adjustment: string;
  impact: 'minor' | 'moderate' | 'significant';
}

export interface NotificationQueue {
  userId: string;
  notifications: QueuedNotification[];
  nextProcessingTime: Date;
  processingStatus: 'idle' | 'processing' | 'paused' | 'error';
  lastProcessedAt?: Date;
  errorCount: number;
  maxRetries: number;
}

export interface QueuedNotification {
  scheduledNotification: ScheduledNotification;
  priority: number; // Calculated priority for queue ordering
  estimatedDeliveryTime: Date;
  dependencies: string[]; // Other notification IDs this depends on
  canBeBatched: boolean;
  batchKey?: string; // Group notifications that can be delivered together
}

export interface BatchDeliveryConfig {
  maxBatchSize: number;
  batchTimeoutMinutes: number;
  batchingRules: BatchingRule[];
}

export interface BatchingRule {
  condition: BatchingCondition;
  maxBatchSize: number;
  timeWindowMinutes: number;
  template: string; // Template for batched notifications
}

export type BatchingCondition = 
  | 'same-project'
  | 'same-type'
  | 'same-priority'
  | 'related-issues'
  | 'user-preference';

export interface SchedulingMetrics {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalNotificationsScheduled: number;
  totalNotificationsDelivered: number;
  averageDeliveryTime: number; // minutes from schedule to delivery
  userResponseRate: number;
  optimalTimeAccuracy: number; // How often we got the timing right
  adaptiveAdjustmentCount: number;
  effectivenessScore: number; // Overall effectiveness of scheduling
}