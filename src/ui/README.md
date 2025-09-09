# Gentle Nudge Assistant - React UI Components

A comprehensive set of React UI components for the Gentle Nudge Assistant Jira Cloud plugin, built with TypeScript, Forge UI Kit, and accessibility-first design principles.

## Overview

This UI layer provides all the components needed to deliver a gentle, encouraging user experience for issue management in Jira. The components follow the philosophy of supportive notifications that help users stay productive without feeling overwhelmed.

## Key Features

- 🌟 **Encouraging Design**: Non-intrusive notifications with positive, supportive messaging
- ♿ **Accessibility First**: WCAG 2.1 AA compliant with screen reader support
- 📱 **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- 🎨 **Subtle Animations**: Gentle transitions that respect user's motion preferences
- 🔧 **Highly Configurable**: Extensive customization options for tone, frequency, and behavior
- 🚀 **Performance Optimized**: Efficient state management with Forge storage integration

## Components

### Core Components

#### 1. SettingsPanel
User preference configuration with comprehensive customization options.

```tsx
import { SettingsPanel, usePreferences } from './ui/components';

function App() {
  const { preferences, updatePreferences, loading, error } = usePreferences(userId);
  
  return (
    <SettingsPanel
      preferences={preferences}
      onPreferencesUpdate={updatePreferences}
      loading={loading}
      error={error}
    />
  );
}
```

**Features:**
- Notification frequency control (gentle, moderate, minimal)
- Tone customization (encouraging, casual, professional)
- Quiet hours configuration
- Stale ticket threshold settings
- Notification type toggles

#### 2. NotificationComponent
Displays gentle reminders with dismissible, encouraging design.

```tsx
import { NotificationComponent } from './ui/components';

<NotificationComponent
  notification={notification}
  onDismiss={handleDismiss}
  onAcknowledge={handleAcknowledge}
  onAction={handleAction}
  position="top-right"
/>
```

**Features:**
- Priority-based color coding
- Smooth entrance/exit animations
- Multiple interaction options (dismiss, acknowledge, action)
- Responsive positioning
- Issue context display

#### 3. DashboardWidget
Team-level overview of nudges and progress with encouraging metrics.

```tsx
import { DashboardWidget, useDashboardData } from './ui/components';

function Dashboard() {
  const { data, loading, error, refresh } = useDashboardData(projectKey);
  
  return (
    <DashboardWidget
      data={data}
      loading={loading}
      error={error}
      onRefresh={refresh}
      refreshInterval={300000}
    />
  );
}
```

**Features:**
- Real-time team statistics
- Nudge effectiveness tracking
- Encouraging progress messages
- Auto-refresh functionality
- Responsive grid layout

#### 4. OnboardingTour
Welcome experience for new users with step-by-step guidance.

```tsx
import { OnboardingTour, useOnboarding, defaultOnboardingSteps } from './ui/components';

function App() {
  const {
    isVisible,
    currentStep,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding(userId);

  return (
    <OnboardingTour
      steps={defaultOnboardingSteps}
      isVisible={isVisible}
      currentStep={currentStep}
      onNext={nextStep}
      onPrevious={previousStep}
      onSkip={skipOnboarding}
      onComplete={completeOnboarding}
    />
  );
}
```

**Features:**
- Interactive step-by-step guidance
- Element highlighting and focus management
- Keyboard navigation support
- Progress tracking
- Customizable tour steps

## Hooks

### State Management Hooks

#### usePreferences
Manages user preferences with Forge storage persistence.

```tsx
const {
  preferences,
  updatePreferences,
  resetToDefaults,
  loading,
  error
} = usePreferences(userId);
```

#### useNotifications
Handles notification state and user interactions.

```tsx
const {
  notifications,
  dismissNotification,
  acknowledgeNotification,
  actionNotification,
  clearAllNotifications,
  loading,
  error
} = useNotifications(userId);
```

#### useDashboardData
Fetches and manages dashboard statistics.

```tsx
const {
  data,
  refresh,
  loading,
  error
} = useDashboardData(projectKey);
```

#### useOnboarding
Controls the onboarding tour experience.

```tsx
const {
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
  resetOnboarding
} = useOnboarding(userId, customSteps);
```

## Utilities

### Message Templates
Generates encouraging, context-aware notification messages.

```tsx
import { 
  generateStaleReminderMessage,
  generateDeadlineWarningMessage,
  createNotificationMessage
} from './ui/utils/messageTemplates';

const message = generateStaleReminderMessage(issue, 'encouraging', 3);
```

### Animations
Smooth, gentle animations that respect accessibility preferences.

```tsx
import { fadeInOut, slideInFromRight, bounceIn } from './ui/utils/animations';
```

### Responsive Design
Utilities for responsive layouts and mobile-first design.

```tsx
import { 
  getContainerStyles,
  getNotificationPosition,
  getDashboardLayout
} from './ui/utils/responsive';
```

### Accessibility
Comprehensive accessibility utilities and helpers.

```tsx
import { 
  focusManagement,
  screenReader,
  keyboardNavigation,
  initializeAccessibility
} from './ui/utils/accessibility';
```

## TypeScript Integration

All components are fully typed with comprehensive TypeScript definitions:

```tsx
import type {
  UserPreferences,
  NotificationMessage,
  DashboardData,
  OnboardingStep,
  SettingsPanelProps,
  NotificationComponentProps
} from './ui/types';
```

## Accessibility Features

- **WCAG 2.1 AA Compliant**: Proper color contrast, keyboard navigation, screen reader support
- **Focus Management**: Logical tab order and focus trapping for modals
- **ARIA Labels**: Comprehensive labeling for screen readers
- **Reduced Motion**: Respects user's motion preferences
- **High Contrast**: Support for high contrast mode
- **Keyboard Navigation**: Full keyboard accessibility

## Responsive Design

- **Mobile First**: Optimized for touch interactions
- **Breakpoint System**: Consistent responsive behavior
- **Flexible Layouts**: Adapts to different screen sizes
- **Touch Targets**: Appropriate sizing for mobile devices

## Integration Example

Complete integration example showing all components working together:

```tsx
import React from 'react';
import { GentleNudgeApp } from './ui/components/GentleNudgeApp';

function JiraPlugin() {
  return (
    <GentleNudgeApp
      userId="current-user-id"
      projectKey="PROJECT-KEY"
      view="dashboard"
    />
  );
}
```

## Styling

Global styles are provided in `src/ui/styles/global.css` and include:
- Animation keyframes
- Responsive typography
- Accessibility enhancements
- Theme support
- Print styles

## Development

### Prerequisites
- Node.js 20.x or 22.x LTS
- Atlassian Forge CLI
- TypeScript 4.9+
- React 18+

### Setup
1. Install dependencies: `npm install`
2. Start development: `forge tunnel`
3. Deploy changes: `forge deploy`

### Testing
Components can be tested individually or as part of the complete application:

```bash
# Run component tests
npm test

# Run accessibility tests
npm run test:a11y

# Run visual regression tests
npm run test:visual
```

## Contributing

When contributing to the UI components:

1. Follow the encouraging, non-intrusive design philosophy
2. Ensure all components are accessible (WCAG 2.1 AA)
3. Add TypeScript types for all new interfaces
4. Include responsive design considerations
5. Test with screen readers and keyboard navigation
6. Maintain consistent visual design patterns

## License

This project is part of the Gentle Nudge Assistant Jira Cloud plugin and follows the same licensing terms.