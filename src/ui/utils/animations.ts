// Animation utilities for smooth, gentle transitions

export const fadeInOut = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
};

export const slideInFromRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: {
    duration: 0.4,
    ease: 'easeOut'
  }
};

export const slideInFromTop = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
};

export const bounceIn = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      scale: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  },
  exit: { scale: 0.3, opacity: 0, transition: { duration: 0.2 } }
};

export const gentleHover = {
  scale: 1.02,
  transition: {
    duration: 0.2,
    ease: 'easeOut'
  }
};

export const pulseGlow = {
  boxShadow: [
    '0 0 0 0 rgba(59, 130, 246, 0.7)',
    '0 0 0 10px rgba(59, 130, 246, 0)',
    '0 0 0 0 rgba(59, 130, 246, 0)'
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export const staggerItem = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

// Accessibility-friendly reduced motion variants
export const createReducedMotionVariant = (animation: any) => ({
  ...animation,
  transition: {
    ...animation.transition,
    duration: 0.01 // Nearly instant for users who prefer reduced motion
  }
});