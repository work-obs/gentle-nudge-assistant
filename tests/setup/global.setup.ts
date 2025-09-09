/**
 * Global Jest setup that runs once before all tests
 */

export default async function globalSetup() {
  // Set timezone for consistent date/time testing
  process.env.TZ = 'UTC';
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DEBUG_MODE = 'true';
  
  // Initialize any global test fixtures or services
  console.log('🧪 Starting Gentle Nudge Assistant test suite...');
}