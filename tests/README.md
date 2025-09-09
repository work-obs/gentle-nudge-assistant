# 🧪 Gentle Nudge Assistant - Testing Suite

This comprehensive testing suite ensures that the Gentle Nudge Assistant maintains its encouraging, user-friendly approach while delivering reliable functionality. The tests are designed to validate both the technical implementation and the user experience aspects of the plugin.

## 📋 Test Structure

### Test Categories

```
tests/
├── setup/                    # Test configuration and setup
│   ├── jest.setup.ts        # React Testing Library setup
│   ├── forge.setup.ts       # Forge platform mocks
│   ├── global.setup.ts      # Global test initialization
│   └── global.teardown.ts   # Global test cleanup
│
├── utils/                   # Test utilities and helpers
│   └── test-utils.tsx      # Custom render functions and helpers
│
├── mocks/                   # Mock implementations
│   ├── jira-api.mock.ts    # Jira REST API mocks
│   ├── forge-storage.mock.ts # Forge storage mocks
│   └── user-interactions.mock.ts # User behavior simulations
│
├── fixtures/                # Test data and fixtures
│   └── test-data.ts        # Sample data for comprehensive testing
│
├── unit/                    # Unit tests for individual components
│   ├── notification-engine/
│   │   ├── scheduler.test.ts
│   │   └── tone-analyzer.test.ts
│   └── ui/
│       └── components/
│           └── GentleNotification.test.tsx
│
├── integration/             # Integration tests for API interactions
│   └── jira-api/
│       └── issue-fetcher.test.ts
│
├── e2e/                     # End-to-end workflow tests
│   └── user-workflows/
│       └── gentle-nudge-flow.test.ts
│
├── performance/             # Performance and scalability tests
│   └── analytics-performance.test.ts
│
└── accessibility/           # Accessibility and WCAG compliance tests
    └── notification-accessibility.test.tsx
```

## 🚀 Running Tests

### All Tests
```bash
npm test                    # Run all tests with watch mode
npm run test:ci            # Run all tests in CI mode with coverage
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:performance  # Performance tests only
npm run test:accessibility # Accessibility tests only
```

### Coverage Reports
```bash
npm run test:coverage     # Generate comprehensive coverage report
```

## 🎯 Test Philosophy

### Encouraging Tone Validation
Our tests include custom Jest matchers to ensure all user-facing content maintains the gentle, encouraging tone that defines the plugin:

```typescript
expect(message).toHaveEncouragingTone();
expect(notification).toBeGentleNotification();
```

### User-Centric Testing
Tests are designed from the user's perspective, validating:
- ✨ **Encouraging messaging** - All notifications use positive, supportive language
- 🕐 **Respectful timing** - Notifications respect quiet hours and working schedules
- 🎯 **Contextual relevance** - Reminders are appropriate to the user's workload and preferences
- ♿ **Accessibility** - Interface is usable by everyone
- 🚀 **Performance** - Fast, responsive user experience

## 🔧 Test Configuration

### Jest Configuration
The Jest configuration (`jest.config.js`) includes:
- TypeScript and React support
- Custom matchers for tone validation
- Coverage thresholds for quality gates
- Comprehensive mocking setup

### Coverage Thresholds
- **Global**: 85% lines, 80% branches, 85% functions
- **Notification Engine**: 95% (critical for user experience)
- **Analytics**: 90% (performance-critical)
- **UI Components**: 80% (visual components)

## 🎭 Mock Infrastructure

### Jira API Mocks
Realistic mock responses for:
- Issue searches and details
- User workload calculations
- Project information
- Error scenarios (rate limiting, authentication, etc.)

### User Behavior Simulation
Different user behavior patterns:
- **Responsive**: Quick to acknowledge and act on notifications
- **Selective**: Only responds to high-priority items
- **Dismissive**: Often dismisses notifications
- **Overwhelmed**: May not respond due to high workload

### Forge Platform Mocks
Complete mocking of Forge APIs:
- Storage operations
- Jira REST API calls
- User authentication
- UI components

## 🌟 Special Testing Features

### Custom Matchers
```typescript
// Validates encouraging tone in messages
expect(message).toHaveEncouragingTone();

// Validates gentle notification structure
expect(notification).toBeGentleNotification();
```

### Accessibility Testing
Automated accessibility testing using `jest-axe`:
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- Color contrast validation

### Performance Testing
Scalability validation:
- Large dataset handling (10,000+ issues)
- Concurrent operation performance
- Memory leak detection
- Algorithm complexity analysis

### End-to-End Workflows
Complete user journey testing:
- Issue detection → Notification generation → User interaction → Follow-up
- Multiple user behavior patterns
- Error recovery scenarios
- System resilience testing

## 📊 Test Data

### Fixtures
Realistic test data including:
- **Users**: Different behavior profiles and preferences
- **Issues**: Various priorities, statuses, and staleness levels
- **Notifications**: Historical interaction patterns
- **Teams**: Configuration scenarios

### Data Generators
Performance test data generators for:
- Large-scale issue datasets
- User interaction histories
- Notification effectiveness metrics

## 🔍 Quality Gates

### Pre-commit Checks
- All tests must pass
- Coverage thresholds must be met
- Linting and formatting checks
- TypeScript compilation

### CI/CD Pipeline
Comprehensive testing pipeline:
1. **Lint & Format** - Code quality checks
2. **Unit Tests** - Component-level validation
3. **Integration Tests** - API interaction testing
4. **Performance Tests** - Scalability validation
5. **Accessibility Tests** - WCAG compliance
6. **E2E Tests** - Complete workflow validation
7. **Security Scan** - Vulnerability assessment
8. **Coverage Check** - Quality gate enforcement

## 🎨 Writing New Tests

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  describe('FeatureGroup', () => {
    it('should behave in expected way when condition is met', () => {
      // Test implementation
    });
  });
});
```

### Encouraging Tone Tests
Always validate user-facing content:
```typescript
it('should display encouraging message to user', () => {
  const message = generateNotificationMessage('stale-reminder');
  expect(message).toHaveEncouragingTone();
  expect(message).toContain('when you have a moment');
});
```

### Accessibility Tests
Include accessibility validation:
```typescript
it('should be accessible to screen readers', async () => {
  const { container } = render(<NotificationComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🚨 Test Debugging

### Debug Mode
```bash
DEBUG_MODE=true npm test
```

### Verbose Output
```bash
npm test -- --verbose
```

### Watch Specific Files
```bash
npm test -- --watch --testNamePattern="NotificationEngine"
```

### Coverage Reports
Detailed HTML coverage reports are generated in `coverage/` directory after running:
```bash
npm run test:coverage
```

## 🎉 Contributing to Tests

### Guidelines
1. **Test the user experience**, not just the code
2. **Validate encouraging tone** in all user-facing content
3. **Include edge cases** and error scenarios
4. **Maintain test readability** with clear descriptions
5. **Mock external dependencies** completely
6. **Test accessibility** for all UI components
7. **Performance test** for scalability-critical code

### Review Checklist
- [ ] Tests validate user experience
- [ ] Encouraging tone is verified
- [ ] Accessibility is tested
- [ ] Edge cases are covered
- [ ] Mocks are comprehensive
- [ ] Performance is considered
- [ ] Tests are readable and maintainable

---

*"Just like our gentle nudges help users stay productive, our comprehensive tests help us maintain excellence. Every test is a small step toward creating a more encouraging and reliable experience! ✨"*