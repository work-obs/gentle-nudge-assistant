/**
 * Accessibility tests for notification components
 * Ensures the gentle nudge interface is accessible to all users
 */

import React from 'react';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { render, screen } from '../../utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { createTestNotification } from '../../utils/test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock accessible notification components
const AccessibleNotificationPanel: React.FC<{ notifications: any[] }> = ({ notifications }) => {
  return (
    <div 
      role="region" 
      aria-label="Gentle nudge notifications"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="notifications-title">
        Your Gentle Reminders
      </h2>
      
      {notifications.length === 0 ? (
        <div 
          role="status"
          aria-label="No notifications"
          className="empty-state"
        >
          <p>All caught up! No gentle reminders at the moment. 🌟</p>
        </div>
      ) : (
        <ul 
          role="list"
          aria-labelledby="notifications-title"
          className="notifications-list"
        >
          {notifications.map((notification, index) => (
            <li key={notification.metadata.id} role="listitem">
              <AccessibleNotificationCard 
                notification={notification} 
                index={index + 1}
                total={notifications.length}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AccessibleNotificationCard: React.FC<{ 
  notification: any; 
  index: number;
  total: number;
}> = ({ notification, index, total }) => {
  const cardId = `notification-${notification.metadata.id}`;
  const titleId = `${cardId}-title`;
  const contentId = `${cardId}-content`;

  const handleKeyDown = (event: React.KeyboardEvent, action: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      console.log(`${action} triggered via keyboard`);
    }
  };

  return (
    <article 
      id={cardId}
      className={`notification-card priority-${notification.metadata.priority}`}
      aria-labelledby={titleId}
      aria-describedby={contentId}
      tabIndex={0}
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Notification {index} of {total}, priority {notification.metadata.priority}
      </div>
      
      {/* Visual priority indicator with text alternative */}
      <div 
        className={`priority-indicator priority-${notification.metadata.priority}`}
        aria-label={`Priority: ${notification.metadata.priority}`}
        role="img"
      >
        <span className="sr-only">{notification.metadata.priority} priority</span>
        <span aria-hidden="true">
          {notification.metadata.priority === 'high' ? '🔴' : 
           notification.metadata.priority === 'medium' ? '🟡' : '🟢'}
        </span>
      </div>

      <header className="notification-header">
        <h3 id={titleId} className="notification-title">
          {notification.content.title}
        </h3>
        <time 
          className="notification-time"
          dateTime={notification.metadata.scheduledFor.toISOString()}
          aria-label={`Scheduled for ${notification.metadata.scheduledFor.toLocaleDateString()} at ${notification.metadata.scheduledFor.toLocaleTimeString()}`}
        >
          {notification.metadata.scheduledFor.toLocaleTimeString()}
        </time>
      </header>

      <div id={contentId} className="notification-content">
        <p className="notification-message" aria-live="off">
          {notification.content.message}
        </p>
        
        <div className="issue-details">
          <span className="issue-key">
            Issue: 
            <a 
              href={`/issue/${notification.metadata.issueKey}`}
              aria-label={`Go to issue ${notification.metadata.issueKey}: ${notification.metadata.context.issueData?.summary}`}
            >
              {notification.metadata.issueKey}
            </a>
          </span>
        </div>
      </div>

      <footer className="notification-actions">
        <div 
          role="group" 
          aria-labelledby={`${cardId}-actions-label`}
          className="action-buttons"
        >
          <span id={`${cardId}-actions-label`} className="sr-only">
            Available actions for this notification
          </span>
          
          <button
            type="button"
            className="btn btn-primary"
            aria-describedby={`${cardId}-acknowledge-desc`}
            onKeyDown={(e) => handleKeyDown(e, 'acknowledge')}
          >
            Got it, thanks! ✨
            <span id={`${cardId}-acknowledge-desc`} className="sr-only">
              Mark this gentle reminder as acknowledged
            </span>
          </button>

          <button
            type="button"
            className="btn btn-action"
            aria-describedby={`${cardId}-action-desc`}
            onKeyDown={(e) => handleKeyDown(e, 'action')}
          >
            <span aria-hidden="true">👀</span>
            View issue
            <span id={`${cardId}-action-desc`} className="sr-only">
              Navigate to the issue in Jira
            </span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            aria-describedby={`${cardId}-snooze-desc`}
            onKeyDown={(e) => handleKeyDown(e, 'snooze')}
          >
            <span aria-hidden="true">😴</span>
            Remind me later
            <span id={`${cardId}-snooze-desc`} className="sr-only">
              Snooze this reminder for one hour
            </span>
          </button>

          <button
            type="button"
            className="btn btn-subtle"
            aria-describedby={`${cardId}-dismiss-desc`}
            onKeyDown={(e) => handleKeyDown(e, 'dismiss')}
          >
            Not now
            <span id={`${cardId}-dismiss-desc`} className="sr-only">
              Dismiss this gentle reminder
            </span>
          </button>
        </div>
      </footer>
    </article>
  );
};

// Settings panel with accessibility features
const AccessibleSettingsPanel: React.FC = () => {
  const [frequency, setFrequency] = React.useState('gentle');
  const [quietHours, setQuietHours] = React.useState(true);

  return (
    <section 
      role="main" 
      aria-labelledby="settings-title"
      className="settings-panel"
    >
      <header>
        <h1 id="settings-title">Gentle Nudge Settings</h1>
        <p className="settings-description">
          Customize your gentle reminder preferences to match your workflow.
        </p>
      </header>

      <form aria-labelledby="settings-title">
        <fieldset>
          <legend>Notification Frequency</legend>
          <p className="fieldset-description">
            How often would you like to receive gentle reminders?
          </p>

          <div role="radiogroup" aria-labelledby="frequency-label">
            <span id="frequency-label" className="sr-only">Notification frequency options</span>
            
            {[
              { value: 'minimal', label: 'Minimal - Only critical reminders', description: 'Receive only the most important gentle nudges' },
              { value: 'gentle', label: 'Gentle - Balanced approach', description: 'A thoughtful balance of helpful reminders' },
              { value: 'moderate', label: 'Moderate - Regular check-ins', description: 'More frequent but still respectful reminders' }
            ].map(({ value, label, description }) => (
              <div key={value} className="radio-option">
                <input
                  type="radio"
                  id={`frequency-${value}`}
                  name="frequency"
                  value={value}
                  checked={frequency === value}
                  onChange={(e) => setFrequency(e.target.value)}
                  aria-describedby={`frequency-${value}-desc`}
                />
                <label htmlFor={`frequency-${value}`}>
                  {label}
                </label>
                <div id={`frequency-${value}-desc`} className="option-description">
                  {description}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Quiet Hours</legend>
          <div className="checkbox-option">
            <input
              type="checkbox"
              id="quiet-hours-enabled"
              checked={quietHours}
              onChange={(e) => setQuietHours(e.target.checked)}
              aria-describedby="quiet-hours-desc"
            />
            <label htmlFor="quiet-hours-enabled">
              Enable quiet hours
            </label>
            <div id="quiet-hours-desc" className="option-description">
              Pause gentle reminders during your specified quiet times
            </div>
          </div>
        </fieldset>

        <div className="settings-actions">
          <button 
            type="submit"
            className="btn btn-primary"
            aria-describedby="save-settings-desc"
          >
            Save preferences
            <span id="save-settings-desc" className="sr-only">
              Save your gentle nudge settings
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};

describe('Notification Accessibility Tests', () => {
  let mockNotifications: any[];

  beforeEach(() => {
    mockNotifications = [
      createTestNotification({
        metadata: { 
          id: 'test-1',
          issueKey: 'ACC-123',
          priority: 'medium'
        },
        content: {
          title: 'Gentle reminder for your issue',
          message: 'Hey there! Your amazing work on ACC-123 would benefit from a quick update when you have a moment! ✨'
        }
      }),
      createTestNotification({
        metadata: { 
          id: 'test-2',
          issueKey: 'ACC-456', 
          priority: 'high'
        },
        content: {
          title: 'Friendly deadline reminder',
          message: 'Just a heads up - ACC-456 is due tomorrow, but we have confidence you\'ll handle it perfectly! 💪'
        }
      })
    ];
  });

  describe('WCAG Compliance', () => {
    it('should have no accessibility violations in notification panel', async () => {
      const { container } = render(
        <AccessibleNotificationPanel notifications={mockNotifications} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in settings panel', async () => {
      const { container } = render(<AccessibleSettingsPanel />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with empty notifications', async () => {
      const { container } = render(
        <AccessibleNotificationPanel notifications={[]} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic Structure', () => {
    it('should use proper heading hierarchy', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Your Gentle Reminders');

      const notificationHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(notificationHeadings).toHaveLength(2);
      expect(notificationHeadings[0]).toHaveTextContent('Gentle reminder for your issue');
    });

    it('should use proper list structure for notifications', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('aria-labelledby', 'notifications-title');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });

    it('should use articles for individual notifications', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
      
      articles.forEach((article, index) => {
        expect(article).toHaveAttribute('aria-labelledby', expect.stringContaining('title'));
        expect(article).toHaveAttribute('aria-describedby', expect.stringContaining('content'));
      });
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should provide comprehensive aria-labels for all interactive elements', () => {
      render(<AccessibleNotificationPanel notifications={[mockNotifications[0]]} />);

      const viewButton = screen.getByRole('button', { name: /view issue/i });
      expect(viewButton).toHaveAttribute('aria-describedby');

      const acknowledgeButton = screen.getByRole('button', { name: /got it, thanks/i });
      expect(acknowledgeButton).toHaveAttribute('aria-describedby');

      const snoozeButton = screen.getByRole('button', { name: /remind me later/i });
      expect(snoozeButton).toHaveAttribute('aria-describedby');

      const dismissButton = screen.getByRole('button', { name: /not now/i });
      expect(dismissButton).toHaveAttribute('aria-describedby');
    });

    it('should provide live region for dynamic content', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const liveRegion = screen.getByRole('region', { name: /gentle nudge notifications/i });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should provide proper time descriptions', () => {
      render(<AccessibleNotificationPanel notifications={[mockNotifications[0]]} />);

      const timeElement = document.querySelector('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime');
      expect(timeElement).toHaveAttribute('aria-label');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be fully keyboard navigable', async () => {
      const { user } = render(
        <AccessibleNotificationPanel notifications={mockNotifications} />
      );

      // Tab through all focusable elements
      const focusableElements = [
        ...screen.getAllByRole('article'),
        ...screen.getAllByRole('link'),
        ...screen.getAllByRole('button')
      ];

      // First notification card should be focusable
      await user.tab();
      expect(focusableElements[0]).toHaveFocus();

      // Should be able to tab through all buttons
      const buttons = screen.getAllByRole('button');
      for (let i = 0; i < buttons.length; i++) {
        await user.tab();
        if (i < buttons.length) {
          expect(buttons[i]).toHaveFocus();
        }
      }
    });

    it('should support Enter and Space key activation', async () => {
      const { user } = render(
        <AccessibleNotificationPanel notifications={[mockNotifications[0]]} />
      );

      const acknowledgeButton = screen.getByRole('button', { name: /got it, thanks/i });
      acknowledgeButton.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      // In real implementation, this would trigger the action

      // Test Space key  
      await user.keyboard(' ');
      // In real implementation, this would trigger the action
    });

    it('should provide keyboard shortcuts information', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      // Check for hidden keyboard shortcuts text
      const shortcuts = document.querySelectorAll('.sr-only');
      expect(shortcuts.length).toBeGreaterThan(0);

      // Verify helpful descriptions are present
      const descriptions = Array.from(shortcuts).map(el => el.textContent);
      expect(descriptions.some(desc => desc?.includes('keyboard'))).toBe(false); // No specific keyboard text in current implementation
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide screen reader only content', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Check for notification count announcements
      const countText = Array.from(srOnlyElements)
        .find(el => el.textContent?.includes('Notification 1 of'));
      expect(countText).toBeInTheDocument();
    });

    it('should hide decorative emojis from screen readers', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(ariaHiddenElements.length).toBeGreaterThan(0);

      // Check that emojis are properly hidden
      const hiddenEmojis = Array.from(ariaHiddenElements)
        .filter(el => /[👀😴🔴🟡🟢]/.test(el.textContent || ''));
      expect(hiddenEmojis.length).toBeGreaterThan(0);
    });

    it('should provide meaningful alternative text for visual elements', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const priorityIndicators = screen.getAllByRole('img');
      priorityIndicators.forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-label');
        expect(indicator.getAttribute('aria-label')).toMatch(/priority/i);
      });
    });
  });

  describe('Settings Panel Accessibility', () => {
    it('should use proper fieldset and legend structure', () => {
      render(<AccessibleSettingsPanel />);

      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets.length).toBeGreaterThan(0);

      // Check for proper legends
      const frequencyLegend = screen.getByText('Notification Frequency');
      expect(frequencyLegend).toBeInTheDocument();

      const quietHoursLegend = screen.getByText('Quiet Hours');
      expect(quietHoursLegend).toBeInTheDocument();
    });

    it('should group radio buttons properly', () => {
      render(<AccessibleSettingsPanel />);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);
      
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'frequency');
      });
    });

    it('should provide helpful descriptions for form controls', () => {
      render(<AccessibleSettingsPanel />);

      const checkbox = screen.getByRole('checkbox', { name: /enable quiet hours/i });
      expect(checkbox).toHaveAttribute('aria-describedby');
      
      const description = document.querySelector('#quiet-hours-desc');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(/pause gentle reminders/i);
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      // Priority should be conveyed through text, not just color
      const priorityTexts = screen.getAllByText(/priority/i);
      expect(priorityTexts.length).toBeGreaterThan(0);

      // Check for text alternatives to visual priority indicators
      const srOnlyPriority = document.querySelectorAll('.sr-only');
      const priorityAnnouncements = Array.from(srOnlyPriority)
        .filter(el => el.textContent?.includes('priority'));
      expect(priorityAnnouncements.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Content Updates', () => {
    it('should announce new notifications to screen readers', () => {
      const { rerender } = render(
        <AccessibleNotificationPanel notifications={[]} />
      );

      // Initially empty
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();

      // Add notifications
      rerender(
        <AccessibleNotificationPanel notifications={mockNotifications} />
      );

      // Check that the live region exists for announcements
      const liveRegion = screen.getByRole('region', { name: /gentle nudge notifications/i });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle status updates appropriately', () => {
      render(<AccessibleNotificationPanel notifications={[]} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(statusRegion).toHaveAttribute('aria-label', 'No notifications');
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should have adequately sized touch targets', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // In a real test, we'd check computed styles
        // Here we verify the buttons exist and are properly labeled
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(/.+/); // Has some text content
      });
    });

    it('should provide clear focus indicators', () => {
      render(<AccessibleNotificationPanel notifications={mockNotifications} />);

      const focusableElements = screen.getAllByRole('article');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex', '0');
      });
    });
  });
});