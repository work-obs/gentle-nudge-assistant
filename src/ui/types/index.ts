// TypeScript type definitions for Gentle Nudge Assistant UI Components

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
  enabledNotificationTypes: string[];
}

export interface NudgeTracking {
  issueKey: string;
  lastNudgeDate: Date;
  nudgeCount: number;
  userResponse: 'dismissed' | 'acknowledged' | 'actioned';
  effectivenessScore: number;
}

export interface Issue {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee?: {
    displayName: string;
    accountId: string;
  };
  updated: string;
  dueDate?: string;
  project: {
    key: string;
    name: string;
  };
}

export interface NotificationMessage {
  id: string;
  type:
    | 'stale-reminder'
    | 'deadline-warning'
    | 'progress-update'
    | 'team-encouragement';
  title: string;
  message: string;
  issue?: Issue;
  issues?: Issue[];
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  dismissible: boolean;
}

export interface DashboardData {
  teamStats: {
    totalActiveIssues: number;
    staleIssues: number;
    upcomingDeadlines: number;
    recentUpdates: number;
  };
  nudgeStats: {
    totalNudgesSent: number;
    acknowledgedNudges: number;
    actionedNudges: number;
    effectivenessRate: number;
  };
  teamMembers: {
    accountId: string;
    displayName: string;
    assignedIssues: number;
    staleIssues: number;
  }[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip: boolean;
}

// Component Props Interfaces
export interface SettingsPanelProps {
  preferences: UserPreferences;
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface NotificationComponentProps {
  notification: NotificationMessage;
  onDismiss: (notificationId: string) => void;
  onAcknowledge: (notificationId: string) => void;
  onAction: (notificationId: string, issueKey?: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface DashboardWidgetProps {
  data: DashboardData;
  loading?: boolean;
  error?: string;
  refreshInterval?: number;
  onRefresh?: () => void;
}

export interface OnboardingTourProps {
  steps: OnboardingStep[];
  isVisible: boolean;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

// Hook return types
export interface UseNotificationsReturn {
  notifications: NotificationMessage[];
  dismissNotification: (id: string) => void;
  acknowledgeNotification: (id: string) => void;
  actionNotification: (id: string, issueKey?: string) => void;
  clearAllNotifications: () => void;
  loading: boolean;
  error: string | null;
}

export interface UsePreferencesReturn {
  preferences: UserPreferences | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Utility types
export type NotificationType = NotificationMessage['type'];
export type UserResponseType = NudgeTracking['userResponse'];
export type NotificationFrequency = UserPreferences['notificationFrequency'];
export type PreferredTone = UserPreferences['preferredTone'];

// Animation and styling types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export interface NotificationStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
}
