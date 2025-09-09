import React, { useState, useEffect, useCallback } from 'react';
import { Button, ButtonGroup } from '@forge/ui-kit';
import { OnboardingTourProps, OnboardingStep } from '../types';
import { fadeInOut, bounceIn } from '../utils/animations';

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isVisible,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete
}) => {
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position based on target element and preferred position
  const calculatePosition = useCallback((targetElement: HTMLElement, preferredPosition: string) => {
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (preferredPosition) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + padding;
        break;
      case 'center':
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return { top, left };
  }, []);

  // Update highlighted element and tooltip position when step changes
  useEffect(() => {
    if (!isVisible || !currentStepData) return;

    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
      highlightedElement.style.transition = '';
    }

    // Find and highlight new target element
    if (currentStepData.targetElement) {
      const element = document.querySelector(currentStepData.targetElement) as HTMLElement;
      if (element) {
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)';
        element.style.borderRadius = '6px';
        element.style.transition = 'all 0.3s ease';
        
        setHighlightedElement(element);
        setTooltipPosition(calculatePosition(element, currentStepData.position));
      } else {
        setHighlightedElement(null);
        setTooltipPosition(calculatePosition(document.body, 'center'));
      }
    } else {
      setHighlightedElement(null);
      setTooltipPosition(calculatePosition(document.body, 'center'));
    }
  }, [currentStep, currentStepData, isVisible, calculatePosition, highlightedElement]);

  // Clean up highlight when tour ends
  useEffect(() => {
    if (!isVisible && highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
      highlightedElement.style.transition = '';
      setHighlightedElement(null);
    }
  }, [isVisible, highlightedElement]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'Escape':
          onSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep) {
            onNext();
          } else {
            onComplete();
          }
          break;
        case 'ArrowLeft':
          if (!isFirstStep) {
            onPrevious();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, isFirstStep, isLastStep, onNext, onPrevious, onSkip, onComplete]);

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} />
      
      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={stepIndicatorStyle}>
            <span style={stepNumberStyle}>
              {currentStep + 1}
            </span>
            <span style={stepTotalStyle}>
              of {steps.length}
            </span>
          </div>
          {currentStepData.showSkip && (
            <button
              style={skipButtonStyle}
              onClick={onSkip}
              aria-label="Skip tour"
            >
              Skip
            </button>
          )}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <h3 style={titleStyle} id="onboarding-title">
            {currentStepData.title}
          </h3>
          <p style={descriptionStyle} id="onboarding-description">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress dots */}
        <div style={progressStyle}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                ...progressDotStyle,
                backgroundColor: index <= currentStep ? '#3B82F6' : '#E5E7EB'
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={navigationStyle}>
          <Button
            appearance="subtle"
            onClick={onPrevious}
            disabled={isFirstStep}
            size="small"
          >
            Previous
          </Button>
          
          <div style={navigationRightStyle}>
            {isLastStep ? (
              <Button
                appearance="primary"
                onClick={onComplete}
                size="small"
              >
                🎉 Get Started!
              </Button>
            ) : (
              <Button
                appearance="primary"
                onClick={onNext}
                size="small"
              >
                Next →
              </Button>
            )}
          </div>
        </div>

        {/* Pointer arrow (if targeting an element) */}
        {currentStepData.targetElement && highlightedElement && (
          <div style={getArrowStyle(currentStepData.position)} />
        )}
      </div>
    </>
  );
};

// Helper function to get arrow styles based on position
const getArrowStyle = (position: string): React.CSSProperties => {
  const baseArrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid'
  };

  switch (position) {
    case 'top':
      return {
        ...baseArrowStyle,
        bottom: '-8px',
        left: '50%',
        marginLeft: '-8px',
        borderWidth: '8px 8px 0 8px',
        borderColor: '#FFFFFF transparent transparent transparent'
      };
    case 'bottom':
      return {
        ...baseArrowStyle,
        top: '-8px',
        left: '50%',
        marginLeft: '-8px',
        borderWidth: '0 8px 8px 8px',
        borderColor: 'transparent transparent #FFFFFF transparent'
      };
    case 'left':
      return {
        ...baseArrowStyle,
        right: '-8px',
        top: '50%',
        marginTop: '-8px',
        borderWidth: '8px 0 8px 8px',
        borderColor: 'transparent transparent transparent #FFFFFF'
      };
    case 'right':
      return {
        ...baseArrowStyle,
        left: '-8px',
        top: '50%',
        marginTop: '-8px',
        borderWidth: '8px 8px 8px 0',
        borderColor: 'transparent #FFFFFF transparent transparent'
      };
    default:
      return { display: 'none' };
  }
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  transition: 'all 0.3s ease'
};

const tooltipStyle: React.CSSProperties = {
  position: 'fixed',
  width: '320px',
  maxWidth: 'calc(100vw - 32px)',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  border: '1px solid #E5E7EB',
  zIndex: 1002,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  animation: 'gentleBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const stepIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const stepNumberStyle: React.CSSProperties = {
  backgroundColor: '#3B82F6',
  color: 'white',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 600
};

const stepTotalStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B7280'
};

const skipButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6B7280',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'all 0.2s ease'
};

const contentStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '18px',
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.3
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.5,
  color: '#374151'
};

const progressStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  marginBottom: '20px',
  justifyContent: 'center'
};

const progressDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  transition: 'all 0.2s ease'
};

const navigationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const navigationRightStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
};

export default OnboardingTour;

// Default onboarding steps for the Gentle Nudge Assistant
export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Gentle Nudge Assistant!',
    description: 'We\'re here to help you stay on top of your Jira issues with friendly, encouraging reminders. Let\'s take a quick tour to get you started.',
    position: 'center',
    showSkip: true
  },
  {
    id: 'settings',
    title: '⚙️ Personalize Your Experience',
    description: 'Access your settings to customize notification frequency, tone, and quiet hours. We believe in giving you full control over your gentle nudges.',
    targetElement: '[data-onboarding="settings-button"]',
    position: 'bottom',
    showSkip: true
  },
  {
    id: 'notifications',
    title: '🌟 Gentle Notifications',
    description: 'Our notifications appear here with encouraging messages about your tickets. You can acknowledge them, take action, or dismiss them - no pressure!',
    targetElement: '[data-onboarding="notification-area"]',
    position: 'left',
    showSkip: true
  },
  {
    id: 'dashboard',
    title: '📊 Team Dashboard',
    description: 'Keep an eye on team progress with our encouraging dashboard. It shows stale issues and upcoming deadlines in a positive, supportive way.',
    targetElement: '[data-onboarding="dashboard-widget"]',
    position: 'top',
    showSkip: true
  },
  {
    id: 'complete',
    title: '🚀 You\'re All Set!',
    description: 'That\'s it! The Gentle Nudge Assistant is now ready to help you and your team stay productive with kindness. Remember, we\'re here to support, not stress you out.',
    position: 'center',
    showSkip: false
  }
];