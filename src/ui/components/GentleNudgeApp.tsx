import React, { useEffect, useState, useCallback } from 'react';
import { view, router } from '@forge/bridge';
import {
  SettingsPanel,
  NotificationComponent,
  DashboardWidget,
  OnboardingTour,
  defaultOnboardingSteps
} from './index';
import { usePreferences } from '../hooks/usePreferences';
import { useNotifications } from '../hooks/useNotifications';
import { useDashboardData } from '../hooks/useDashboardData';
import { useOnboarding } from '../hooks/useOnboarding';
import { getContainerStyles, getNotificationPosition } from '../utils/responsive';
import { initializeAccessibility, screenReader } from '../utils/accessibility';
import { createNotificationMessage } from '../utils/messageTemplates';
import { UserPreferences, NotificationMessage } from '../types';

interface GentleNudgeAppProps {
  userId: string;
  projectKey?: string;
  view: 'dashboard' | 'settings' | 'notifications';
}

const GentleNudgeApp: React.FC<GentleNudgeAppProps> = ({
  userId,
  projectKey,
  view: initialView
}) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'notifications'>(initialView);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Initialize hooks
  const { preferences, updatePreferences, loading: preferencesLoading, error: preferencesError } = usePreferences(userId);
  const { notifications, dismissNotification, acknowledgeNotification, actionNotification } = useNotifications(userId);
  const { data: dashboardData, refresh: refreshDashboard, loading: dashboardLoading, error: dashboardError } = useDashboardData(projectKey);
  const { 
    isVisible: onboardingVisible, 
    currentStep: onboardingStep,
    nextStep: nextOnboardingStep,
    previousStep: previousOnboardingStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding(userId);

  // Initialize accessibility on mount
  useEffect(() => {
    initializeAccessibility();
  }, []);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle navigation
  const handleNavigation = useCallback((newView: 'dashboard' | 'settings' | 'notifications') => {
    setCurrentView(newView);
    screenReader.announce(`Switched to ${newView} view`, 'polite');
  }, []);

  // Handle notification actions
  const handleNotificationAction = useCallback(async (notificationId: string, issueKey?: string) => {
    actionNotification(notificationId, issueKey);
    
    // Navigate to issue in Jira if issue key is provided
    if (issueKey) {
      try {
        await router.navigate(`/browse/${issueKey}`);
        screenReader.announce(`Navigating to issue ${issueKey}`, 'polite');
      } catch (err) {
        console.error('Failed to navigate to issue:', err);
        screenReader.announce('Failed to navigate to issue', 'assertive');
      }
    }
  }, [actionNotification]);

  // Handle preferences update
  const handlePreferencesUpdate = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      await updatePreferences(updates);
      screenReader.announce('Preferences updated successfully', 'polite');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      screenReader.announce('Failed to update preferences', 'assertive');
    }
  }, [updatePreferences]);

  // Generate sample notification for demo purposes
  const generateSampleNotification = useCallback(() => {
    if (!preferences) return;

    const sampleNotification = createNotificationMessage(
      'stale-reminder',
      {
        key: 'DEMO-123',
        summary: 'Sample issue for gentle nudge demonstration',
        status: 'In Progress',
        priority: 'Medium',
        updated: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        project: { key: 'DEMO', name: 'Demo Project' }
      },
      undefined,
      preferences.preferredTone,
      { daysSinceUpdate: 3 }
    );

    // Dispatch custom event to trigger notification
    window.dispatchEvent(new CustomEvent('gentle-nudge-notification', {
      detail: sampleNotification
    }));
  }, [preferences]);

  const containerStyles = getContainerStyles(screenWidth);
  const notificationPosition = getNotificationPosition('top-right', screenWidth);

  return (
    <div style={containerStyles}>
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
        onFocus={(e) => {
          e.currentTarget.style.position = 'static';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.overflow = 'visible';
        }}
        onBlur={(e) => {
          e.currentTarget.style.position = 'absolute';
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
          e.currentTarget.style.overflow = 'hidden';
        }}
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav style={navigationStyle} aria-label="Gentle Nudge Assistant navigation">
        <div style={navigationContainerStyle}>
          <h1 style={logoStyle}>
            <span style={{ marginRight: '8px' }}>🌟</span>
            Gentle Nudge Assistant
          </h1>
          
          <div style={navigationButtonsStyle}>
            <button
              style={{
                ...navigationButtonStyle,
                ...(currentView === 'dashboard' ? activeNavigationButtonStyle : {})
              }}
              onClick={() => handleNavigation('dashboard')}
              aria-current={currentView === 'dashboard' ? 'page' : undefined}
              data-onboarding="dashboard-button"
            >
              📊 Dashboard
            </button>
            <button
              style={{
                ...navigationButtonStyle,
                ...(currentView === 'settings' ? activeNavigationButtonStyle : {})
              }}
              onClick={() => handleNavigation('settings')}
              aria-current={currentView === 'settings' ? 'page' : undefined}
              data-onboarding="settings-button"
            >
              ⚙️ Settings
            </button>
            {/* Demo button for testing */}
            <button
              style={demoButtonStyle}
              onClick={generateSampleNotification}
              title="Generate sample notification for testing"
            >
              💫 Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" style={mainContentStyle}>
        {currentView === 'dashboard' && (
          <div data-onboarding="dashboard-widget">
            <DashboardWidget
              data={dashboardData}
              loading={dashboardLoading}
              error={dashboardError}
              onRefresh={refreshDashboard}
              refreshInterval={300000} // 5 minutes
            />
          </div>
        )}

        {currentView === 'settings' && (
          <div>
            {preferences && (
              <SettingsPanel
                preferences={preferences}
                onPreferencesUpdate={handlePreferencesUpdate}
                loading={preferencesLoading}
                error={preferencesError}
              />
            )}
          </div>
        )}

        {currentView === 'notifications' && (
          <div data-onboarding="notification-area" style={notificationAreaStyle}>
            <h2 style={sectionTitleStyle}>Recent Notifications</h2>
            {notifications.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyStateIconStyle}>✨</div>
                <h3>All caught up!</h3>
                <p>No gentle nudges at the moment. You're doing great! 🎉</p>
              </div>
            ) : (
              <div style={notificationListStyle}>
                {notifications.map(notification => (
                  <div key={notification.id} style={notificationItemStyle}>
                    <NotificationComponent
                      notification={notification}
                      onDismiss={dismissNotification}
                      onAcknowledge={acknowledgeNotification}
                      onAction={handleNotificationAction}
                      position="top-right"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Live notifications */}
      <div data-onboarding="notification-area" style={liveNotificationAreaStyle}>
        {notifications
          .filter(notification => notification.timestamp.getTime() > Date.now() - 30000) // Show recent notifications
          .map(notification => (
            <NotificationComponent
              key={notification.id}
              notification={notification}
              onDismiss={dismissNotification}
              onAcknowledge={acknowledgeNotification}
              onAction={handleNotificationAction}
              position={notificationPosition}
            />
          ))
        }
      </div>

      {/* Onboarding tour */}
      <OnboardingTour
        steps={defaultOnboardingSteps}
        isVisible={onboardingVisible}
        currentStep={onboardingStep}
        onNext={nextOnboardingStep}
        onPrevious={previousOnboardingStep}
        onSkip={skipOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

// Styles
const navigationStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderBottom: '1px solid #E5E7EB',
  marginBottom: '24px'
};

const navigationContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const logoStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  color: '#111827',
  display: 'flex',
  alignItems: 'center'
};

const navigationButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
};

const navigationButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  color: '#6B7280',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const activeNavigationButtonStyle: React.CSSProperties = {
  backgroundColor: '#EFF6FF',
  color: '#2563EB'
};

const demoButtonStyle: React.CSSProperties = {
  ...navigationButtonStyle,
  backgroundColor: '#F3F4F6',
  color: '#374151',
  marginLeft: '8px'
};

const mainContentStyle: React.CSSProperties = {
  minHeight: '400px'
};

const notificationAreaStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '24px'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#6B7280'
};

const emptyStateIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '16px'
};

const notificationListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const notificationItemStyle: React.CSSProperties = {
  position: 'relative'
};

const liveNotificationAreaStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  zIndex: 1000,
  pointerEvents: 'none'
};

export default GentleNudgeApp;