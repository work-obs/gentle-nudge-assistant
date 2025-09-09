import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup } from '@forge/ui-kit';
import { NotificationComponentProps } from '../types';
import { fadeInOut, slideInFromRight, gentleHover } from '../utils/animations';

const NotificationComponent: React.FC<NotificationComponentProps> = ({
  notification,
  onDismiss,
  onAcknowledge,
  onAction,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Gentle entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAcknowledge = () => {
    onAcknowledge(notification.id);
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = () => {
    onAction(notification.id, notification.issue?.key);
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      width: '380px',
      maxWidth: 'calc(100vw - 32px)'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return {
          background: '#FEF3F2',
          border: '#FECDCA',
          accent: '#F04438',
          text: '#912018'
        };
      case 'medium':
        return {
          background: '#FFFCF0',
          border: '#FEDF89',
          accent: '#F79009',
          text: '#B54708'
        };
      case 'low':
      default:
        return {
          background: '#F0F9FF',
          border: '#B9E6FE',
          accent: '#0EA5E9',
          text: '#0369A1'
        };
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'stale-reminder':
        return '🌟';
      case 'deadline-warning':
        return '⏰';
      case 'progress-update':
        return '📈';
      case 'team-encouragement':
        return '🎯';
      default:
        return '💫';
    }
  };

  const colors = getPriorityColor();
  const icon = getNotificationIcon();

  const containerStyle: React.CSSProperties = {
    ...getPositionStyles(),
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    padding: '16px',
    transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
    opacity: isVisible ? 1 : 0,
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'default',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: colors.text,
    margin: 0
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    margin: '8px 0 16px 0'
  };

  const dismissButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: '#9CA3AF',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: colors.accent,
    border: `1px solid ${colors.accent}`,
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1
  };

  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    color: colors.text,
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: 1
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="polite"
    >
      <div style={headerStyle}>
        <h4 style={titleStyle}>
          <span>{icon}</span>
          {notification.title}
        </h4>
        {notification.dismissible && (
          <button
            style={{
              ...dismissButtonStyle,
              backgroundColor: isHovered ? '#F3F4F6' : 'transparent'
            }}
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      <p style={messageStyle}>
        {notification.message}
      </p>

      {/* Issue details if available */}
      {notification.issue && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '6px',
          padding: '8px',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          <strong>{notification.issue.key}</strong>: {notification.issue.summary}
          <br />
          Status: {notification.issue.status} | Priority: {notification.issue.priority}
        </div>
      )}

      {/* Action buttons */}
      <div style={buttonGroupStyle}>
        <button
          style={secondaryButtonStyle}
          onClick={handleAcknowledge}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          👍 Got it
        </button>
        
        {notification.issue && (
          <button
            style={primaryButtonStyle}
            onClick={handleAction}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🚀 Take Action
          </button>
        )}
      </div>

      {/* Subtle progress indicator for auto-dismiss (if implemented) */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: colors.border,
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: colors.accent,
          opacity: 0.3,
          width: '0%',
          transition: 'width 30s linear'
        }} />
      </div>
    </div>
  );
};

export default NotificationComponent;