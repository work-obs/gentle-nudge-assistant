// Responsive design utilities for Gentle Nudge Assistant

export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export const breakpoints: Breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const mediaQueries = {
  xs: `(max-width: ${breakpoints.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  desktop: `(min-width: ${breakpoints.md}px)`,
};

// Hook for responsive values
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}): T => {
  const getResponsiveValue = (): T => {
    const width = window.innerWidth;

    if (width < breakpoints.sm && values.xs !== undefined) {
      return values.xs;
    }
    if (width < breakpoints.md && values.sm !== undefined) {
      return values.sm;
    }
    if (width < breakpoints.lg && values.md !== undefined) {
      return values.md;
    }
    if (width < breakpoints.xl && values.lg !== undefined) {
      return values.lg;
    }
    if (values.xl !== undefined) {
      return values.xl;
    }

    return values.default;
  };

  const [value, setValue] = React.useState<T>(getResponsiveValue);

  React.useEffect(() => {
    const handleResize = () => {
      setValue(getResponsiveValue());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [values]);

  return value;
};

// Responsive grid utilities
export const getGridColumns = (screenWidth: number): number => {
  if (screenWidth < breakpoints.sm) return 1;
  if (screenWidth < breakpoints.md) return 2;
  if (screenWidth < breakpoints.lg) return 3;
  return 4;
};

// Responsive spacing
export const getSpacing = (
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  isMobile: boolean
) => {
  const spacing = {
    xs: isMobile ? 4 : 8,
    sm: isMobile ? 8 : 12,
    md: isMobile ? 12 : 16,
    lg: isMobile ? 16 : 24,
    xl: isMobile ? 24 : 32,
  };

  return spacing[size];
};

// Responsive font sizes
export const getFontSize = (
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl',
  isMobile: boolean
) => {
  const fontSizes = {
    xs: isMobile ? 11 : 12,
    sm: isMobile ? 13 : 14,
    md: isMobile ? 15 : 16,
    lg: isMobile ? 17 : 18,
    xl: isMobile ? 19 : 20,
    xxl: isMobile ? 22 : 24,
  };

  return `${fontSizes[size]}px`;
};

// Container styles for different screen sizes
export const getContainerStyles = (
  screenWidth: number
): React.CSSProperties => {
  const isMobile = screenWidth < breakpoints.md;

  return {
    maxWidth: screenWidth < breakpoints.xl ? '100%' : '1200px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '24px',
    width: '100%',
  };
};

// Notification positioning for different screen sizes
export const getNotificationPosition = (
  preferredPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  screenWidth: number
): 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' => {
  const isMobile = screenWidth < breakpoints.md;

  // On mobile, default to top-right for better thumb accessibility
  if (isMobile) {
    return 'top-right';
  }

  return preferredPosition;
};

// Responsive notification width
export const getNotificationWidth = (screenWidth: number): string => {
  if (screenWidth < breakpoints.sm) return 'calc(100vw - 32px)';
  if (screenWidth < breakpoints.md) return '320px';
  return '380px';
};

// Dashboard widget responsive layout
export const getDashboardLayout = (screenWidth: number) => {
  const isMobile = screenWidth < breakpoints.md;
  const isTablet =
    screenWidth >= breakpoints.md && screenWidth < breakpoints.lg;

  return {
    statsGridColumns: isMobile ? 1 : isTablet ? 2 : 4,
    effectivenessLayout: isMobile ? '1fr' : '2fr 1fr',
    teamGridColumns: isMobile ? 1 : isTablet ? 2 : 3,
    padding: isMobile ? '16px' : '24px',
    gap: isMobile ? '12px' : '16px',
  };
};

// Settings panel responsive layout
export const getSettingsLayout = (screenWidth: number) => {
  const isMobile = screenWidth < breakpoints.md;

  return {
    maxWidth: isMobile ? '100%' : '600px',
    padding: isMobile ? '16px' : '20px',
    formSectionSpacing: isMobile ? '20px' : '24px',
    labelSize: isMobile ? '14px' : '16px',
    inputHeight: isMobile ? '44px' : '40px', // Larger touch targets on mobile
    buttonSize: isMobile ? 'large' : ('medium' as 'large' | 'medium'),
  };
};

// Onboarding responsive adjustments
export const getOnboardingLayout = (screenWidth: number) => {
  const isMobile = screenWidth < breakpoints.md;

  return {
    tooltipWidth: isMobile ? 'calc(100vw - 32px)' : '320px',
    tooltipMaxWidth: isMobile ? '100%' : '400px',
    overlayOpacity: isMobile ? 0.7 : 0.5,
    padding: isMobile ? '16px' : '20px',
    fontSize: {
      title: isMobile ? '16px' : '18px',
      description: isMobile ? '14px' : '14px',
    },
  };
};
