import '@testing-library/jest-dom';

// Mock Forge APIs
global.window = global.window || {};

// Mock storage API
jest.mock('@forge/storage', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getSecret: jest.fn(),
    query: jest.fn(),
  },
}));

// Mock bridge API
jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  requestJira: jest.fn(),
  view: {
    getContext: jest.fn(),
    theme: {
      getTheme: jest.fn(),
    },
  },
}));

// Mock UI API
jest.mock('@forge/ui', () => ({
  render: jest.fn(),
  Fragment: 'Fragment',
  Text: 'Text',
  Button: 'Button',
  ButtonSet: 'ButtonSet',
  Form: 'Form',
  TextField: 'TextField',
  Select: 'Select',
  Option: 'Option',
  Toggle: 'Toggle',
  UserPicker: 'UserPicker',
  DatePicker: 'DatePicker',
  Table: 'Table',
  Row: 'Row',
  Cell: 'Cell',
  Head: 'Head',
  Modal: 'Modal',
  ModalHeader: 'ModalHeader',
  ModalBody: 'ModalBody',
  ModalFooter: 'ModalFooter',
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test timeout
jest.setTimeout(10000);