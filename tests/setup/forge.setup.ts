/**
 * Forge platform specific setup and mocks
 * This configures mocks for Forge APIs and services
 */

// Mock Forge Bridge API
const mockBridge = {
  storage: {
    get: jest.fn(),
    set: jest.fn(), 
    delete: jest.fn(),
    query: jest.fn(),
  },
  requestJira: jest.fn(),
  invoke: jest.fn(),
  router: {
    navigate: jest.fn(),
    getHistory: jest.fn(),
  },
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  user: {
    getCurrentUser: jest.fn(),
  },
  project: {
    getProject: jest.fn(),
  }
};

// Mock Forge Storage API
const mockStorage = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  getSecret: jest.fn(),
  setSecret: jest.fn(),
};

// Mock Forge UI components
const mockUI = {
  render: jest.fn(),
  Fragment: 'Fragment',
  Text: 'Text',
  Button: 'Button', 
  Form: 'Form',
  TextField: 'TextField',
  Select: 'Select',
  Checkbox: 'Checkbox',
  DatePicker: 'DatePicker',
  Modal: 'Modal',
  Tabs: 'Tabs',
  Tab: 'Tab',
  Table: 'Table',
  Strong: 'Strong',
  Em: 'Em',
  Link: 'Link',
  Image: 'Image',
  Heading: 'Heading',
  StatusLozenge: 'StatusLozenge',
  SectionMessage: 'SectionMessage',
};

// Mock Forge Resolver
const mockResolver = {
  define: jest.fn(),
};

// Set up mocks before tests run
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Set up default mock implementations
  mockBridge.storage.get.mockResolvedValue(null);
  mockBridge.storage.set.mockResolvedValue(undefined);
  mockBridge.storage.delete.mockResolvedValue(undefined);
  mockBridge.storage.query.mockResolvedValue({ results: [], nextCursor: null });
  
  mockBridge.requestJira.mockResolvedValue({
    status: 200,
    data: {},
  });
  
  mockBridge.user.getCurrentUser.mockResolvedValue({
    accountId: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  });

  mockStorage.get.mockResolvedValue(null);
  mockStorage.set.mockResolvedValue(undefined);
  mockStorage.delete.mockResolvedValue(undefined);
  mockStorage.query.mockResolvedValue({ results: [] });
});

// Export mocks for use in tests
export {
  mockBridge,
  mockStorage, 
  mockUI,
  mockResolver,
};

// Make mocks available globally
global.__FORGE_BRIDGE__ = mockBridge;
global.__FORGE_STORAGE__ = mockStorage;
global.__FORGE_UI__ = mockUI;
global.__FORGE_RESOLVER__ = mockResolver;

// Mock the actual Forge modules
jest.mock('@forge/bridge', () => mockBridge);
jest.mock('@forge/storage', () => mockStorage);
jest.mock('@forge/ui', () => mockUI);  
jest.mock('@forge/resolver', () => mockResolver);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG_MODE = 'true';
process.env.LOG_LEVEL = 'debug';