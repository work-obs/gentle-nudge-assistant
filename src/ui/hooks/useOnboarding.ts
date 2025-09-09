import { useState, useEffect, useCallback } from 'react';
import { storage } from '@forge/bridge';
import { OnboardingStep } from '../types';
import { defaultOnboardingSteps } from '../components/OnboardingTour';

interface UseOnboardingReturn {
  isVisible: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (
  userId: string,
  customSteps?: OnboardingStep[]
): UseOnboardingReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const steps = customSteps || defaultOnboardingSteps;

  // Load onboarding status from storage
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      try {
        const status = await storage.get(`onboarding_status_${userId}`);
        if (status) {
          setHasCompletedOnboarding(status.completed || false);
          setCurrentStep(status.currentStep || 0);
        }
      } catch (err) {
        console.error('Failed to load onboarding status:', err);
      }
    };

    if (userId) {
      loadOnboardingStatus();
    }
  }, [userId]);

  // Auto-show onboarding for new users
  useEffect(() => {
    if (userId && !hasCompletedOnboarding && !isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Show after 1 second delay

      return () => clearTimeout(timer);
    }
  }, [userId, hasCompletedOnboarding, isVisible]);

  // Save onboarding status
  const saveOnboardingStatus = useCallback(
    async (status: {
      completed: boolean;
      currentStep: number;
      completedAt?: Date;
    }) => {
      try {
        await storage.set(`onboarding_status_${userId}`, {
          ...status,
          userId,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error('Failed to save onboarding status:', err);
      }
    },
    [userId]
  );

  const showOnboarding = useCallback(() => {
    setIsVisible(true);
    setCurrentStep(0);
  }, []);

  const hideOnboarding = useCallback(() => {
    setIsVisible(false);
  }, []);

  const nextStep = useCallback(() => {
    const newStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(newStep);

    // Save progress
    saveOnboardingStatus({
      completed: false,
      currentStep: newStep,
    });
  }, [currentStep, steps.length, saveOnboardingStatus]);

  const previousStep = useCallback(() => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);

    // Save progress
    saveOnboardingStatus({
      completed: false,
      currentStep: newStep,
    });
  }, [currentStep, saveOnboardingStatus]);

  const skipOnboarding = useCallback(async () => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);

    await saveOnboardingStatus({
      completed: true,
      currentStep: steps.length - 1,
      completedAt: new Date(),
    });

    // Track skip event for analytics
    try {
      await storage.set(`onboarding_skipped_${userId}`, {
        skippedAt: new Date(),
        skippedAtStep: currentStep,
        userId,
      });
    } catch (err) {
      console.error('Failed to track onboarding skip:', err);
    }
  }, [currentStep, steps.length, userId, saveOnboardingStatus]);

  const completeOnboarding = useCallback(async () => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);

    await saveOnboardingStatus({
      completed: true,
      currentStep: steps.length - 1,
      completedAt: new Date(),
    });

    // Track completion for analytics
    try {
      await storage.set(`onboarding_completed_${userId}`, {
        completedAt: new Date(),
        totalSteps: steps.length,
        userId,
      });
    } catch (err) {
      console.error('Failed to track onboarding completion:', err);
    }

    // Show a subtle success notification
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('gentle-nudge-notification', {
          detail: {
            id: `onboarding-complete-${Date.now()}`,
            type: 'team-encouragement',
            title: 'Welcome aboard! 🎉',
            message:
              "You're all set up with the Gentle Nudge Assistant. We're excited to help you stay productive with kindness!",
            priority: 'low',
            timestamp: new Date(),
            dismissible: true,
          },
        })
      );
    }
  }, [steps.length, userId, saveOnboardingStatus]);

  const resetOnboarding = useCallback(async () => {
    setIsVisible(false);
    setCurrentStep(0);
    setHasCompletedOnboarding(false);

    await saveOnboardingStatus({
      completed: false,
      currentStep: 0,
    });

    // Clean up stored completion/skip data
    try {
      await storage.delete(`onboarding_completed_${userId}`);
      await storage.delete(`onboarding_skipped_${userId}`);
    } catch (err) {
      console.error('Failed to clean up onboarding data:', err);
    }
  }, [userId, saveOnboardingStatus]);

  return {
    isVisible,
    currentStep,
    steps,
    hasCompletedOnboarding,
    showOnboarding,
    hideOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};
