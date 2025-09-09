import { useState, useEffect, useCallback } from 'react';
import { storage } from '@forge/bridge';
import { UserPreferences, UsePreferencesReturn } from '../types';

const DEFAULT_PREFERENCES: UserPreferences = {
  userId: '',
  notificationFrequency: 'gentle',
  quietHours: {
    start: '18:00',
    end: '09:00'
  },
  preferredTone: 'encouraging',
  staleDaysThreshold: 3,
  deadlineWarningDays: 2,
  enabledNotificationTypes: [
    'stale-reminder',
    'deadline-warning',
    'progress-update',
    'team-encouragement'
  ]
};

export const usePreferences = (userId: string): UsePreferencesReturn => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storedPreferences = await storage.get(`user_preferences_${userId}`);
      
      if (storedPreferences) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...storedPreferences,
          userId
        });
      } else {
        // First time user - set defaults
        const defaultPrefs = { ...DEFAULT_PREFERENCES, userId };
        await storage.set(`user_preferences_${userId}`, defaultPrefs);
        setPreferences(defaultPrefs);
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err);
      setError('Failed to load preferences. Please try again.');
      setPreferences({ ...DEFAULT_PREFERENCES, userId });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      setError(null);
      
      const updatedPreferences = {
        ...preferences,
        ...updates,
        userId // Ensure userId is not overwritten
      };

      await storage.set(`user_preferences_${userId}`, updatedPreferences);
      setPreferences(updatedPreferences);
    } catch (err) {
      console.error('Failed to update user preferences:', err);
      setError('Failed to save preferences. Please try again.');
      throw err;
    }
  }, [preferences, userId]);

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      const defaultPrefs = { ...DEFAULT_PREFERENCES, userId };
      await storage.set(`user_preferences_${userId}`, defaultPrefs);
      setPreferences(defaultPrefs);
    } catch (err) {
      console.error('Failed to reset preferences to defaults:', err);
      setError('Failed to reset preferences. Please try again.');
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId, loadPreferences]);

  return {
    preferences,
    updatePreferences,
    resetToDefaults,
    loading,
    error
  };
};