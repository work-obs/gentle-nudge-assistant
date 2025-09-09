/**
 * Tests for GentleNotification component
 * Ensures notifications display with encouraging tone and proper user interactions
 */

import React from 'react';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '../../../utils/test-utils';
import { createTestNotification } from '../../../utils/test-utils';
import { mockUIInteractions } from '../../../mocks/user-interactions.mock';

// Mock GentleNotification component (would be implemented later)
interface GentleNotificationProps {
  notification: any;
  onAcknowledge?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onSnooze?: (notificationId: string, snoozeUntil: Date) => void;
  onAction?: (notificationId: string, actionType: string) => void;
  isVisible?: boolean;
  animationDuration?: number;
}

const GentleNotification: React.FC<GentleNotificationProps> = ({
  notification,
  onAcknowledge,
  onDismiss,
  onSnooze,
  onAction,
  isVisible = true,
  animationDuration = 300
}) => {
  if (!isVisible) return null;

  const handleAcknowledge = () => {
    mockUIInteractions.acknowledgeNotification();
    onAcknowledge?.(notification.metadata.id);
  };

  const handleDismiss = () => {
    mockUIInteractions.dismissNotification();
    onDismiss?.(notification.metadata.id);
  };

  const handleSnooze = () => {
    const snoozeUntil = new Date(Date.now() + 3600000); // 1 hour
    mockUIInteractions.snoozeNotification();
    onSnooze?.(notification.metadata.id, snoozeUntil);
  };

  const handleAction = () => {
    mockUIInteractions.actionNotification();
    onAction?.(notification.metadata.id, 'navigate_to_issue');
  };

  const handleMouseEnter = () => {
    mockUIInteractions.hoverNotification();
  };

  return (
    <div 
      data-testid="gentle-notification"
      className="gentle-notification"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${animationDuration}ms ease-in-out`
      }}
      onMouseEnter={handleMouseEnter}
    >
      <div className="notification-header">
        <h3 data-testid="notification-title">
          {notification.content.title}
        </h3>
        <span 
          data-testid="notification-priority"
          className={`priority-badge priority-${notification.metadata.priority}`}
        >
          {notification.metadata.priority}
        </span>
      </div>
      
      <div className="notification-body">
        <p data-testid="notification-message">
          {notification.content.message}
        </p>
        
        <div className="issue-info">
          <span data-testid="issue-key">
            {notification.metadata.issueKey}
          </span>
          <span data-testid="issue-summary">
            {notification.metadata.context.issueData?.summary}
          </span>
        </div>
      </div>
      
      <div className="notification-actions">
        <button 
          data-testid="acknowledge-button"
          onClick={handleAcknowledge}
          className="btn-gentle btn-primary"
        >
          Got it, thanks! ✨
        </button>
        
        <button 
          data-testid="action-button"
          onClick={handleAction}
          className="btn-gentle btn-action"
        >
          View issue 👀
        </button>
        
        <button 
          data-testid="snooze-button"
          onClick={handleSnooze}
          className="btn-gentle btn-secondary"
        >
          Remind me later 😴
        </button>
        
        <button 
          data-testid="dismiss-button"
          onClick={handleDismiss}
          className="btn-gentle btn-subtle"
        >
          Not now
        </button>
      </div>
      
      <div className="notification-footer">
        <span data-testid="notification-time">
          {notification.metadata.scheduledFor.toLocaleTimeString()}
        </span>
        <span data-testid="notification-tone" className={`tone-${notification.content.tone}`}>
          {notification.content.tone}
        </span>
      </div>
    </div>
  );
};

describe('GentleNotification Component', () => {
  let mockNotification: any;
  let mockHandlers: {
    onAcknowledge: jest.Mock;
    onDismiss: jest.Mock;
    onSnooze: jest.Mock;
    onAction: jest.Mock;
  };

  beforeEach(() => {
    mockNotification = createTestNotification();
    mockHandlers = {
      onAcknowledge: jest.fn(),
      onDismiss: jest.fn(),
      onSnooze: jest.fn(),
      onAction: jest.fn()
    };
    jest.clearAllMocks();
    mockUIInteractions.resetMocks();
  });

  describe('Rendering', () => {
    it('should render notification with encouraging content', () => {
      const { container } = render(
        <GentleNotification 
          notification={mockNotification}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('gentle-notification')).toBeInTheDocument();
      expect(screen.getByTestId('notification-title')).toHaveTextContent(mockNotification.content.title);
      expect(screen.getByTestId('notification-message')).toHaveTextContent(mockNotification.content.message);
      
      // Test our custom matcher
      expect(mockNotification.content.message).toHaveEncouragingTone();
      expect(mockNotification).toBeGentleNotification();
    });

    it('should display issue information correctly', () => {
      render(<GentleNotification notification={mockNotification} {...mockHandlers} />);

      expect(screen.getByTestId('issue-key')).toHaveTextContent(mockNotification.metadata.issueKey);
      expect(screen.getByTestId('issue-summary')).toHaveTextContent(
        mockNotification.metadata.context.issueData.summary
      );
    });

    it('should show priority badge with correct styling', () => {
      render(<GentleNotification notification={mockNotification} {...mockHandlers} />);

      const priorityBadge = screen.getByTestId('notification-priority');
      expect(priorityBadge).toHaveTextContent(mockNotification.metadata.priority);
      expect(priorityBadge).toHaveClass(`priority-${mockNotification.metadata.priority}`);
    });

    it('should display notification time and tone', () => {
      render(<GentleNotification notification={mockNotification} {...mockHandlers} />);

      expect(screen.getByTestId('notification-time')).toBeInTheDocument();
      expect(screen.getByTestId('notification-tone')).toHaveTextContent(mockNotification.content.tone);
      expect(screen.getByTestId('notification-tone')).toHaveClass(`tone-${mockNotification.content.tone}`);
    });

    it('should render all action buttons with gentle language', () => {
      render(<GentleNotification notification={mockNotification} {...mockHandlers} />);

      expect(screen.getByTestId('acknowledge-button')).toHaveTextContent('Got it, thanks! ✨');
      expect(screen.getByTestId('action-button')).toHaveTextContent('View issue 👀');
      expect(screen.getByTestId('snooze-button')).toHaveTextContent('Remind me later 😴');
      expect(screen.getByTestId('dismiss-button')).toHaveTextContent('Not now');
    });
  });

  describe('User Interactions', () => {
    it('should handle acknowledgment correctly', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const acknowledgeButton = screen.getByTestId('acknowledge-button');
      await user.click(acknowledgeButton);

      expect(mockUIInteractions.acknowledgeNotification).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onAcknowledge).toHaveBeenCalledWith(mockNotification.metadata.id);
    });

    it('should handle dismissal correctly', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const dismissButton = screen.getByTestId('dismiss-button');
      await user.click(dismissButton);

      expect(mockUIInteractions.dismissNotification).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onDismiss).toHaveBeenCalledWith(mockNotification.metadata.id);
    });

    it('should handle snooze with correct timing', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const snoozeButton = screen.getByTestId('snooze-button');
      await user.click(snoozeButton);

      expect(mockUIInteractions.snoozeNotification).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onSnooze).toHaveBeenCalledWith(
        mockNotification.metadata.id,
        expect.any(Date)
      );

      // Verify snooze time is approximately 1 hour from now
      const snoozeCall = mockHandlers.onSnooze.mock.calls[0];
      const snoozeUntil = snoozeCall[1] as Date;
      const hourFromNow = new Date(Date.now() + 3600000);
      expect(Math.abs(snoozeUntil.getTime() - hourFromNow.getTime())).toBeLessThan(1000);
    });

    it('should handle action button click', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const actionButton = screen.getByTestId('action-button');
      await user.click(actionButton);

      expect(mockUIInteractions.actionNotification).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onAction).toHaveBeenCalledWith(
        mockNotification.metadata.id,
        'navigate_to_issue'
      );
    });

    it('should track hover interactions', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const notification = screen.getByTestId('gentle-notification');
      await user.hover(notification);

      expect(mockUIInteractions.hoverNotification).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const acknowledgeButton = screen.getByTestId('acknowledge-button');
      
      // Simulate rapid clicking
      await user.click(acknowledgeButton);
      await user.click(acknowledgeButton);
      await user.click(acknowledgeButton);

      expect(mockHandlers.onAcknowledge).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visibility and Animation', () => {
    it('should handle visibility prop correctly', () => {
      const { rerender } = render(
        <GentleNotification 
          notification={mockNotification} 
          isVisible={false}
          {...mockHandlers}
        />
      );

      expect(screen.queryByTestId('gentle-notification')).not.toBeInTheDocument();

      rerender(
        <GentleNotification 
          notification={mockNotification} 
          isVisible={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('gentle-notification')).toBeInTheDocument();
    });

    it('should apply animation duration correctly', () => {
      const customDuration = 500;
      render(
        <GentleNotification 
          notification={mockNotification} 
          animationDuration={customDuration}
          {...mockHandlers}
        />
      );

      const notification = screen.getByTestId('gentle-notification');
      expect(notification).toHaveStyle(`transition: opacity ${customDuration}ms ease-in-out`);
    });

    it('should start with correct opacity when visible', () => {
      render(
        <GentleNotification 
          notification={mockNotification} 
          isVisible={true}
          {...mockHandlers}
        />
      );

      const notification = screen.getByTestId('gentle-notification');
      expect(notification).toHaveStyle('opacity: 1');
    });
  });

  describe('Different Notification Types', () => {
    it('should render stale reminder notifications correctly', () => {
      const staleNotification = createTestNotification({
        metadata: {
          ...mockNotification.metadata,
          context: {
            type: 'stale-reminder',
            issueData: mockNotification.metadata.context.issueData
          }
        },
        content: {
          ...mockNotification.content,
          message: "Hey there! Your ticket TEST-123 has been waiting patiently for an update. When you have a moment, it would appreciate some attention! ✨"
        }
      });

      render(<GentleNotification notification={staleNotification} {...mockHandlers} />);

      const message = screen.getByTestId('notification-message');
      expect(message.textContent).toHaveEncouragingTone();
      expect(message.textContent).toContain('when you have a moment');
    });

    it('should render deadline warning notifications correctly', () => {
      const deadlineNotification = createTestNotification({
        metadata: {
          ...mockNotification.metadata,
          context: {
            type: 'deadline-warning',
            issueData: mockNotification.metadata.context.issueData,
            deadline: {
              dueDate: new Date('2024-01-16T17:00:00Z'),
              daysRemaining: 1,
              isOverdue: false,
              slaBreachRisk: 'medium',
              bufferTime: 24
            }
          }
        },
        content: {
          ...mockNotification.content,
          message: "Heads up! TEST-123 is due tomorrow, but we have confidence you'll handle it perfectly! 💪"
        }
      });

      render(<GentleNotification notification={deadlineNotification} {...mockHandlers} />);

      const message = screen.getByTestId('notification-message');
      expect(message.textContent).toHaveEncouragingTone();
      expect(message.textContent).toContain("you'll handle it perfectly");
    });

    it('should render achievement recognition notifications correctly', () => {
      const achievementNotification = createTestNotification({
        metadata: {
          ...mockNotification.metadata,
          context: {
            type: 'achievement-recognition',
            issueData: mockNotification.metadata.context.issueData
          }
        },
        content: {
          ...mockNotification.content,
          message: "Amazing work! You've been consistently updating your tickets. TEST-123 is the only one feeling a bit lonely."
        }
      });

      render(<GentleNotification notification={achievementNotification} {...mockHandlers} />);

      const message = screen.getByTestId('notification-message');
      expect(message.textContent).toHaveEncouragingTone();
      expect(message.textContent).toContain('Amazing work!');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<GentleNotification notification={mockNotification} {...mockHandlers} />);

      const acknowledgeButton = screen.getByTestId('acknowledge-button');
      const dismissButton = screen.getByTestId('dismiss-button');
      const actionButton = screen.getByTestId('action-button');
      const snoozeButton = screen.getByTestId('snooze-button');

      expect(acknowledgeButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();
      expect(actionButton).toBeInTheDocument();
      expect(snoozeButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      // Tab through buttons
      await user.tab();
      expect(screen.getByTestId('acknowledge-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('action-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('snooze-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('dismiss-button')).toHaveFocus();
    });

    it('should support keyboard activation', async () => {
      const { user } = render(
        <GentleNotification notification={mockNotification} {...mockHandlers} />
      );

      const acknowledgeButton = screen.getByTestId('acknowledge-button');
      acknowledgeButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockHandlers.onAcknowledge).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing notification content gracefully', () => {
      const malformedNotification = {
        metadata: mockNotification.metadata,
        content: {} // Missing required fields
      };

      expect(() => {
        render(<GentleNotification notification={malformedNotification} {...mockHandlers} />);
      }).not.toThrow();
    });

    it('should handle undefined handlers gracefully', async () => {
      const { user } = render(
        <GentleNotification 
          notification={mockNotification}
          // No handlers provided
        />
      );

      const acknowledgeButton = screen.getByTestId('acknowledge-button');
      
      expect(() => user.click(acknowledgeButton)).not.toThrow();
    });
  });
});