// Accessibility utilities for Gentle Nudge Assistant

// ARIA live region management
export class LiveRegionManager {
  private static instance: LiveRegionManager;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager();
    }
    return LiveRegionManager.instance;
  }

  constructor() {
    this.setupLiveRegions();
  }

  private setupLiveRegions() {
    // Create polite live region for gentle notifications
    if (!document.getElementById('gentle-nudge-live-polite')) {
      this.politeRegion = document.createElement('div');
      this.politeRegion.id = 'gentle-nudge-live-polite';
      this.politeRegion.setAttribute('aria-live', 'polite');
      this.politeRegion.setAttribute('aria-atomic', 'true');
      this.politeRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(this.politeRegion);
    }

    // Create assertive live region for urgent notifications
    if (!document.getElementById('gentle-nudge-live-assertive')) {
      this.assertiveRegion = document.createElement('div');
      this.assertiveRegion.id = 'gentle-nudge-live-assertive';
      this.assertiveRegion.setAttribute('aria-live', 'assertive');
      this.assertiveRegion.setAttribute('aria-atomic', 'true');
      this.assertiveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(this.assertiveRegion);
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      region.textContent = message;
      // Clear after announcement to allow re-announcements of the same message
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 1000);
    }
  }
}

// Focus management utilities
export const focusManagement = {
  // Store focus before opening modal/overlay
  storeFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  },

  // Restore focus after closing modal/overlay
  restoreFocus(element: HTMLElement | null) {
    if (element && element.focus) {
      element.focus();
    }
  },

  // Trap focus within a container (for modals, tours, etc.)
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusable.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getLuminance(...color1);
    const l2 = this.getLuminance(...color2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG(color1: [number, number, number], color2: [number, number, number], level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },

  // Convert hex to RGB
  hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  }
};

// Reduced motion detection and handling
export const motionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get appropriate animation duration based on user preference
  getAnimationDuration(normalDuration: number): number {
    return this.prefersReducedMotion() ? 0.01 : normalDuration;
  },

  // Create media query listener for motion preference changes
  onMotionPreferenceChange(callback: (prefersReduced: boolean) => void) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    mediaQuery.addListener(handler);
    
    // Return cleanup function
    return () => mediaQuery.removeListener(handler);
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Common keyboard event handlers
  handleEscapeKey(callback: () => void) {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };
  },

  handleEnterKey(callback: () => void) {
    return (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        callback();
      }
    };
  },

  handleSpaceKey(callback: () => void) {
    return (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };
  },

  // Arrow key navigation for lists/grids
  handleArrowNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onIndexChange: (newIndex: number) => void,
    orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
    gridColumns?: number
  ) {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = orientation === 'grid' && gridColumns
            ? Math.max(0, currentIndex - gridColumns)
            : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          newIndex = orientation === 'grid' && gridColumns
            ? Math.min(totalItems - 1, currentIndex + gridColumns)
            : Math.min(totalItems - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          newIndex = Math.min(totalItems - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = totalItems - 1;
        event.preventDefault();
        break;
    }

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
    }
  }
};

// Screen reader utilities
export const screenReader = {
  // Create screen reader only text
  createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    return span;
  },

  // Announce message to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    LiveRegionManager.getInstance().announce(message, priority);
  }
};

// High contrast mode detection
export const highContrastMode = {
  // Detect if high contrast mode is enabled (Windows)
  isHighContrastMode(): boolean {
    // Create a test element to detect high contrast
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      border: 1px solid;
      border-color: buttonface;
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
    `;
    document.body.appendChild(testElement);
    
    const isHighContrast = getComputedStyle(testElement).borderTopColor === getComputedStyle(testElement).borderRightColor;
    document.body.removeChild(testElement);
    
    return isHighContrast;
  },

  // Apply high contrast friendly styles
  getHighContrastStyles(): React.CSSProperties {
    return {
      outline: '2px solid',
      outlineOffset: '2px',
      background: 'ButtonFace',
      color: 'ButtonText',
      border: '1px solid ButtonShadow'
    };
  }
};

// Initialize accessibility utilities
export const initializeAccessibility = () => {
  // Initialize live region manager
  LiveRegionManager.getInstance();
  
  // Add skip link if it doesn't exist
  if (!document.getElementById('gentle-nudge-skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.id = 'gentle-nudge-skip-link';
    skipLink.href = '#gentle-nudge-main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  // Add main content landmark if it doesn't exist
  if (!document.getElementById('gentle-nudge-main-content')) {
    const mainContent = document.createElement('main');
    mainContent.id = 'gentle-nudge-main-content';
    mainContent.setAttribute('role', 'main');
    // This would typically wrap the main application content
  }
};