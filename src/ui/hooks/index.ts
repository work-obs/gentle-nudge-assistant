// Main hooks exports for Gentle Nudge Assistant

export { usePreferences } from './usePreferences';
export { useNotifications } from './useNotifications';
export { useDashboardData } from './useDashboardData';
export { useOnboarding } from './useOnboarding';

// Re-export hook return types
export type {
  UsePreferencesReturn,
  UseNotificationsReturn,
  UseDashboardDataReturn,
} from '../types';
