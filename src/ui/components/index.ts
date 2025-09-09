// Main component exports for Gentle Nudge Assistant UI

export { default as SettingsPanel } from './SettingsPanel';
export { default as NotificationComponent } from './NotificationComponent';
export { default as DashboardWidget } from './DashboardWidget';
export { default as OnboardingTour, defaultOnboardingSteps } from './OnboardingTour';

// Re-export types for convenience
export type {
  SettingsPanelProps,
  NotificationComponentProps,
  DashboardWidgetProps,
  OnboardingTourProps,
  UserPreferences,
  NotificationMessage,
  DashboardData,
  OnboardingStep
} from '../types';

// Re-export hooks
export { usePreferences } from '../hooks/usePreferences';
export { useNotifications } from '../hooks/useNotifications';
export { useDashboardData } from '../hooks/useDashboardData';

// Re-export utilities
export * from '../utils/messageTemplates';
export * from '../utils/animations';