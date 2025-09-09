module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types',
    '^@/utils$': '<rootDir>/src/utils',
    '^@/components(.*)$': '<rootDir>/src/ui/components$1',
    '^@/hooks(.*)$': '<rootDir>/src/ui/hooks$1',
    '^@/config$': '<rootDir>/src/config',
    '^@/notification-engine(.*)$': '<rootDir>/src/notification-engine$1',
    '^@/analytics(.*)$': '<rootDir>/src/analytics$1'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  maxWorkers: '50%'
};