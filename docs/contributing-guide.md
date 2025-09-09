# Contributing Guide - Gentle Nudge Assistant

Welcome to the Gentle Nudge Assistant community! We're excited that you're interested in contributing to making Jira a more encouraging and productive place for everyone.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Contributing Workflow](#contributing-workflow)
4. [Code Standards and Guidelines](#code-standards-and-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Contributions](#documentation-contributions)
7. [Community Guidelines](#community-guidelines)
8. [Release Process](#release-process)

## Getting Started

### Ways to Contribute

We welcome contributions in many forms:

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new functionality
- **💻 Code Contributions**: Implement features and fixes
- **📚 Documentation**: Improve guides, examples, and API docs
- **🎨 Design**: UI/UX improvements and visual assets
- **🌍 Localization**: Translate the app for international users
- **🧪 Testing**: Manual testing, test case creation, and QA feedback
- **💡 Community Support**: Help other users in forums and discussions

### Before You Start

1. **Read our Code of Conduct**: We maintain a welcoming, inclusive community
2. **Check existing issues**: Avoid duplicate work by reviewing open issues
3. **Join our Discord/Slack**: Connect with other contributors and maintainers
4. **Review the Architecture**: Understand the system before making changes

## Development Environment Setup

### Prerequisites

**Required Software:**
```bash
# Node.js (LTS version)
node --version  # Should be 18.x or 20.x

# Atlassian Forge CLI
npm install -g @forge/cli

# Git for version control
git --version

# Your favorite code editor (VS Code recommended)
```

**Recommended Extensions (VS Code):**
- Atlassian for VS Code
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest Runner

### Initial Setup

1. **Fork and Clone the Repository**
   ```bash
   # Fork the repository on GitHub first
   git clone https://github.com/YOUR-USERNAME/gentle-nudge-assistant.git
   cd gentle-nudge-assistant
   
   # Add upstream remote
   git remote add upstream https://github.com/gentle-nudge/gentle-nudge-assistant.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   
   # Install development dependencies
   npm run dev:install
   ```

3. **Set Up Forge Development Environment**
   ```bash
   # Log in to Atlassian Developer Console
   forge login
   
   # Create your development app
   forge create --template custom-ui-jira-issue-panel
   
   # Deploy to development environment
   forge deploy --environment development
   
   # Install on your test Jira site
   forge install --site YOUR-TEST-SITE.atlassian.net
   ```

4. **Configure Development Settings**
   ```bash
   # Copy example environment file
   cp .env.example .env.development
   
   # Edit with your development values
   vim .env.development
   ```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Lint and format code
npm run lint
npm run format

# Build for production
npm run build

# Deploy to Forge
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Generate documentation
npm run docs:build
npm run docs:serve
```

### Project Structure

```
gentle-nudge-assistant/
├── src/
│   ├── components/          # UI components
│   ├── functions/           # Forge serverless functions
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── constants/          # App constants
├── static/                 # Static assets
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
├── manifest.yml            # Forge app manifest
└── package.json
```

## Contributing Workflow

### Standard Workflow

1. **Create Feature Branch**
   ```bash
   # Sync with upstream
   git fetch upstream
   git checkout main
   git merge upstream/main
   
   # Create feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following our style guidelines
   - Include appropriate tests
   - Update documentation as needed
   - Commit changes with descriptive messages

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Test in development environment
   forge deploy --environment development
   
   # Manual testing in Jira
   # Verify functionality works as expected
   ```

4. **Submit Pull Request**
   ```bash
   # Push to your fork
   git push origin feature/your-feature-name
   
   # Create PR via GitHub UI
   # Fill out PR template completely
   # Request review from maintainers
   ```

### Pull Request Process

**Before Submitting:**
- [ ] Tests pass and coverage is maintained
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive
- [ ] PR template is filled out completely

**PR Title Format:**
```
type(scope): brief description

Examples:
feat(notifications): add custom message templates
fix(ui): resolve notification overlap issue
docs(api): update authentication examples
```

**PR Description Template:**
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix/feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested in development Jira environment

## Screenshots
If applicable, add screenshots showing the changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated and passing
```

## Code Standards and Guidelines

### TypeScript Guidelines

**Type Safety:**
```typescript
// ✅ Good: Explicit types
interface NotificationRequest {
  userId: string;
  type: NotificationType;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

// ❌ Avoid: Any types
function processNotification(request: any) { ... }

// ✅ Good: Proper error handling with types
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

**Code Organization:**
```typescript
// File: src/services/NotificationService.ts
export class NotificationService {
  constructor(
    private readonly jiraApi: JiraApiClient,
    private readonly storage: StorageService,
    private readonly logger: Logger
  ) {}

  async createNotification(request: NotificationRequest): Promise<Result<Notification>> {
    try {
      // Validate input
      const validation = await this.validateRequest(request);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Business logic
      const notification = await this.buildNotification(request);
      
      // Persistence
      await this.storage.save(notification);
      
      // Logging
      this.logger.info('Notification created', { notificationId: notification.id });
      
      return { success: true, data: notification };
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      return { success: false, error: error as Error };
    }
  }
}
```

### React Component Guidelines

**Component Structure:**
```tsx
// ✅ Good: Functional component with proper typing
interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  loading?: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onNotificationClick,
  loading = false
}) => {
  // Custom hooks for logic
  const { markAsRead } = useNotificationActions();
  const { preferences } = useUserPreferences();
  
  // Event handlers
  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick(notification);
  }, [markAsRead, onNotificationClick]);
  
  // Early returns for loading/empty states
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (notifications.length === 0) {
    return <EmptyState message="No notifications yet!" />;
  }
  
  return (
    <div className="notification-panel">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClick={handleNotificationClick}
          tone={preferences.communicationTone}
        />
      ))}
    </div>
  );
};

export default NotificationPanel;
```

### Coding Standards

**General Principles:**
- **Readable Code**: Write code that tells a story
- **Single Responsibility**: Each function/class should do one thing well
- **No Magic Numbers**: Use named constants
- **Error Handling**: Always handle potential failures
- **Performance Conscious**: Consider impact of operations

**Naming Conventions:**
```typescript
// Variables and functions: camelCase
const userName = 'john.doe';
const getUserPreferences = () => { ... };

// Constants: SCREAMING_SNAKE_CASE
const MAX_NOTIFICATIONS_PER_DAY = 10;
const DEFAULT_STALE_THRESHOLD = 5;

// Interfaces and Types: PascalCase
interface UserPreferences { ... }
type NotificationStatus = 'pending' | 'sent' | 'dismissed';

// Components: PascalCase
const NotificationCard = () => { ... };

// Files: kebab-case
// notification-service.ts, user-preferences.ts
```

**Comments and Documentation:**
```typescript
/**
 * Analyzes user workload to determine optimal notification frequency.
 * 
 * @param userId - The user to analyze
 * @param timeframe - Period to analyze (default: 7 days)
 * @returns Promise resolving to workload analysis with recommendations
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeWorkload('user-123');
 * if (analysis.recommendedFrequency !== user.currentFrequency) {
 *   await updateUserPreferences(userId, { frequency: analysis.recommendedFrequency });
 * }
 * ```
 */
async function analyzeWorkload(
  userId: string, 
  timeframe: number = 7
): Promise<WorkloadAnalysis> {
  // Implementation details...
}
```

## Testing Requirements

### Testing Strategy

We maintain high code quality through comprehensive testing:

- **Unit Tests**: 90%+ code coverage required
- **Integration Tests**: Test component interactions
- **E2E Tests**: Critical user flows
- **Visual Regression Tests**: UI consistency
- **Performance Tests**: Response time benchmarks

### Writing Tests

**Unit Test Example:**
```typescript
// tests/services/NotificationService.test.ts
import { NotificationService } from '@/services/NotificationService';
import { createMockJiraApi, createMockStorage } from '@/tests/mocks';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockJiraApi: jest.Mocked<JiraApiClient>;
  let mockStorage: jest.Mocked<StorageService>;

  beforeEach(() => {
    mockJiraApi = createMockJiraApi();
    mockStorage = createMockStorage();
    service = new NotificationService(mockJiraApi, mockStorage);
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      // Arrange
      const request: NotificationRequest = {
        userId: 'user-123',
        type: 'stale',
        message: 'Test message',
        priority: 'medium'
      };
      
      mockStorage.save.mockResolvedValue(undefined);

      // Act
      const result = await service.createNotification(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          type: 'stale',
          message: 'Test message'
        })
      );
    });

    it('should handle validation errors', async () => {
      // Test validation error scenarios
    });

    it('should handle storage failures', async () => {
      // Test error handling
    });
  });
});
```

**Integration Test Example:**
```typescript
// tests/integration/notification-flow.test.ts
import { renderWithProviders } from '@/tests/test-utils';
import { NotificationPanel } from '@/components/NotificationPanel';
import { screen, fireEvent, waitFor } from '@testing-library/react';

describe('Notification Flow Integration', () => {
  it('should display and interact with notifications', async () => {
    // Arrange
    const mockNotifications = createMockNotifications(3);
    const onNotificationClick = jest.fn();

    // Act
    renderWithProviders(
      <NotificationPanel 
        notifications={mockNotifications} 
        onNotificationClick={onNotificationClick}
      />
    );

    // Assert - notifications are displayed
    expect(screen.getByText(mockNotifications[0].message)).toBeInTheDocument();
    
    // Act - click notification
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    
    // Assert - callback was called
    await waitFor(() => {
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual

# Performance tests
npm run test:performance
```

## Documentation Contributions

### Documentation Types

1. **API Documentation**: Inline code documentation
2. **User Guides**: How-to guides for end users
3. **Developer Docs**: Technical implementation guides
4. **Examples**: Sample code and use cases
5. **Troubleshooting**: Common issues and solutions

### Writing Guidelines

**Style Guide:**
- **Tone**: Friendly, encouraging, clear
- **Structure**: Use headings, lists, and code examples
- **Examples**: Provide practical, working examples
- **Screenshots**: Use placeholders for UI documentation
- **Updates**: Keep documentation current with code changes

**Documentation Template:**
```markdown
# Feature Name

Brief description of what this feature does and why it's useful.

## Overview

More detailed explanation with context and use cases.

## Quick Start

```typescript
// Simple example showing basic usage
const example = new FeatureClass();
await example.doSomething();
```

## Configuration

### Basic Configuration
Explain basic setup options.

### Advanced Configuration
Cover advanced scenarios with examples.

## Examples

### Example 1: Common Use Case
Detailed example with explanation.

### Example 2: Advanced Use Case
More complex example for power users.

## Troubleshooting

### Common Issue 1
Description and solution.

### Common Issue 2
Description and solution.

## API Reference

Link to detailed API documentation.
```

### Documentation Commands

```bash
# Build documentation site
npm run docs:build

# Serve documentation locally
npm run docs:serve

# Check for broken links
npm run docs:validate

# Generate API docs from code
npm run docs:api
```

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Our community follows these principles:

- **Be Respectful**: Treat all community members with respect and kindness
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Help newcomers learn and grow
- **Be Inclusive**: Welcome people of all backgrounds and experience levels
- **Be Professional**: Maintain professional conduct in all interactions

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests, and technical discussions
- **GitHub Discussions**: General questions, ideas, and community chat
- **Discord/Slack**: Real-time chat with contributors and maintainers
- **Email**: security@gentle-nudge-assistant.com for security issues

### Getting Help

**For Contributors:**
1. Check existing documentation and issues first
2. Ask questions in GitHub Discussions
3. Join our Discord/Slack for real-time help
4. Tag maintainers if you need specific guidance

**For Maintainers:**
- Respond to issues and PRs within 48 hours
- Provide constructive feedback on contributions
- Help newcomers get started
- Maintain project roadmap and priorities

## Release Process

### Release Schedule

- **Major Releases**: Quarterly (breaking changes, major features)
- **Minor Releases**: Monthly (new features, improvements)
- **Patch Releases**: As needed (bug fixes, security updates)
- **Hotfixes**: Immediate (critical security or stability issues)

### Release Workflow

1. **Feature Freeze**: Stop accepting new features for release
2. **Release Candidate**: Create RC branch for testing
3. **Quality Assurance**: Comprehensive testing of RC
4. **Release Notes**: Document all changes and breaking changes
5. **Deployment**: Deploy to production via Atlassian Marketplace
6. **Post-Release**: Monitor for issues and create hotfixes if needed

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)  
- **PATCH**: Bug fixes (backward compatible)

Examples:
- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

### Contributing to Releases

**Release Preparation:**
- Test release candidates thoroughly
- Update documentation for new features
- Review breaking changes and migration guides
- Validate marketplace listing information

**Release Notes:**
```markdown
# Release 1.2.0

## 🎉 New Features
- Custom message templates for notifications
- Team dashboard with workload insights
- Improved mobile responsiveness

## 🐛 Bug Fixes
- Fixed notification timing issues in different timezones
- Resolved configuration validation edge cases

## 📚 Documentation
- Updated API reference with new endpoints
- Added best practices guide for team adoption

## ⚠️ Breaking Changes
None in this release.

## 🔧 Migration
No migration steps required for this release.
```

---

## Quick Contribution Checklist

Before submitting your contribution:

- [ ] **Code Quality**
  - [ ] Follows TypeScript and React best practices
  - [ ] Includes appropriate error handling
  - [ ] Has clear, descriptive variable and function names
  - [ ] Includes JSDoc comments for public APIs

- [ ] **Testing**
  - [ ] Unit tests written and passing
  - [ ] Integration tests for new features
  - [ ] Manual testing completed in development environment
  - [ ] No decrease in code coverage

- [ ] **Documentation**
  - [ ] README updated if needed
  - [ ] API documentation updated for new endpoints
  - [ ] User guide updated for new features
  - [ ] Code comments explain complex logic

- [ ] **Process**
  - [ ] Feature branch created from latest main
  - [ ] Commit messages follow conventional format
  - [ ] PR template filled out completely
  - [ ] Requested reviews from appropriate maintainers

---

Thank you for contributing to Gentle Nudge Assistant! Your efforts help make Jira a more encouraging and productive place for developers and teams worldwide. 🌟

If you have questions about contributing, don't hesitate to reach out to our community. We're here to help you succeed!

*Next: [Deployment Guide →](deployment-guide.md)*