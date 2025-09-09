/**
 * User preferences and configuration types
 */

import { NotificationFrequency, MessageTone, NotificationType } from './notification';

export interface UserPreferences {
  userId: string;
  displayName: string;
  email: string;
  notificationSettings: NotificationSettings;
  personalizedSettings: PersonalizedSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  frequency: NotificationFrequency;
  enabledTypes: NotificationType[];
  quietHours: QuietHours;
  staleDaysThreshold: number;
  deadlineWarningDays: number;
  maxDailyNotifications: number;
  preferredDeliveryMethods: DeliveryMethod[];
}

export interface PersonalizedSettings {
  preferredTone: MessageTone;
  encouragementStyle: EncouragementStyle;
  personalizedGreeting?: string;
  motivationalKeywords: string[];
  timeZone: string;
  workingHours: WorkingHours;
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM format
  end: string; // HH:MM format
  timezone: string;
  respectWeekends: boolean;
  respectHolidays: boolean;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // HH:MM format
  end: string; // HH:MM format
  breaks?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  label?: string;
}

export type DeliveryMethod = 'in-app' | 'email' | 'webhook' | 'banner' | 'modal';

export type EncouragementStyle = 
  | 'cheerful' // "You're doing amazing! ⭐"
  | 'supportive' // "We're here to help you succeed"
  | 'gentle' // "When you have a moment..."
  | 'motivational' // "You've got this! 💪"
  | 'professional' // "Kind reminder about..."
  | 'friendly'; // "Hey there! Just a friendly heads up"

export interface UserAnalytics {
  userId: string;
  responsePatterns: ResponsePattern[];
  optimalNotificationTimes: TimeSlot[];
  effectiveMessageTypes: NotificationType[];
  preferredEncouragementStyle: EncouragementStyle;
  averageResponseTime: number; // minutes
  engagementScore: number; // 1-10
  burnoutRisk: BurnoutRisk;
}

export interface ResponsePattern {
  notificationType: NotificationType;
  averageResponseTime: number;
  responseRate: number;
  actionTakenRate: number;
  dismissalRate: number;
  timeOfDay: number; // hour of day (0-23)
  dayOfWeek: number; // 0 = Sunday
}

export type BurnoutRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface TeamConfiguration {
  projectKey: string;
  projectName: string;
  adminUserId: string;
  teamSettings: TeamSettings;
  memberPreferences: Record<string, UserPreferences>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSettings {
  enableTeamNotifications: boolean;
  teamEncouragementFrequency: NotificationFrequency;
  escalationRules: EscalationRule[];
  celebrationSettings: CelebrationSettings;
  burnoutPrevention: BurnoutPreventionSettings;
}

export interface EscalationRule {
  triggerCondition: EscalationTrigger;
  escalateAfterHours: number;
  escalateToRoles: string[]; // 'admin', 'lead', 'team'
  notificationTemplate: string;
  maxEscalations: number;
}

export type EscalationTrigger = 
  | 'overdue-critical'
  | 'sla-breach-imminent'
  | 'user-unresponsive'
  | 'team-velocity-drop';

export interface CelebrationSettings {
  enableAchievementRecognition: boolean;
  celebrateMilestones: boolean;
  teamWinNotifications: boolean;
  personalBestRecognition: boolean;
  celebrationFrequency: 'immediate' | 'daily' | 'weekly';
}

export interface BurnoutPreventionSettings {
  enableWorkloadMonitoring: boolean;
  maxNotificationsPerDay: number;
  respectQuietHours: boolean;
  autoReduceFrequencyOnHeavyLoad: boolean;
  burnoutRecoveryPeriodDays: number;
}