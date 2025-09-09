/**
 * Jest setup file for React Testing Library and custom matchers
 * This file runs before each test suite
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure React Testing Library
configure({
  // Increase timeout for async operations
  asyncUtilTimeout: 5000,
  
  // Configure test ID attribute
  testIdAttribute: 'data-testid',
  
  // Don't show suggestions for better queries (reduce noise in tests)
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    error.stack = null;
    return error;
  }
});

// Global test utilities and polyfills
Object.assign(global, { TextDecoder, TextEncoder });

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only show React warnings and errors that aren't related to missing act()
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning: An invalid form control') &&
      !args[0].includes('act()')
    ) {
      originalConsoleError(...args);
    }
  });
  
  console.warn = jest.fn((...args) => {
    // Filter out known warnings we don't care about in tests
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('componentWillReceiveProps')
    ) {
      originalConsoleWarn(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Custom Jest matchers for encouraging tone testing
expect.extend({
  toHaveEncouragingTone(received: string) {
    const encouragingWords = [
      'amazing', 'awesome', 'fantastic', 'great', 'excellent',
      'wonderful', 'perfect', 'brilliant', 'outstanding', 'superb',
      'you can do', 'you\'ve got', 'keep up', 'well done', 'good job',
      'nice work', 'way to go', 'proud of', 'celebrate', 'achievement'
    ];
    
    const discourageWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disgusting',
      'hate', 'stupid', 'dumb', 'failed', 'failure',
      'wrong', 'error', 'mistake', 'broken', 'useless'
    ];
    
    const lowerReceived = received.toLowerCase();
    const hasEncouraging = encouragingWords.some(word => 
      lowerReceived.includes(word.toLowerCase())
    );
    const hasDiscouraging = discourageWords.some(word =>
      lowerReceived.includes(word.toLowerCase())
    );
    
    const pass = hasEncouraging && !hasDiscouraging;
    
    if (pass) {
      return {
        message: () => `expected "${received}" not to have encouraging tone`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected "${received}" to have encouraging tone but found ${
          hasDiscouraging ? 'discouraging words' : 'no encouraging words'
        }`,
        pass: false,
      };
    }
  },

  toBeGentleNotification(received: any) {
    const requiredFields = ['title', 'message', 'tone', 'priority'];
    const missingFields = requiredFields.filter(field => !received[field]);
    
    if (missingFields.length > 0) {
      return {
        message: () => `expected notification to have gentle structure but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    const isGentle = received.priority !== 'urgent' && 
                    ['encouraging', 'casual', 'professional'].includes(received.tone) &&
                    received.message.length > 10 &&
                    !received.message.includes('!!!!');
    
    if (isGentle) {
      return {
        message: () => `expected notification not to be gentle`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected notification to be gentle (priority: ${received.priority}, tone: ${received.tone})`,
        pass: false,
      };
    }
  }
});

// Extend Jest matchers interface
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveEncouragingTone(): R;
      toBeGentleNotification(): R;
    }
  }
}

// Global test timeout
jest.setTimeout(30000);