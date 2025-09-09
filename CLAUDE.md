# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Gentle Nudge Assistant, a Jira Cloud plugin built on Atlassian's Forge platform that provides friendly, context-aware reminders about stale tickets and approaching deadlines. The plugin emphasizes encouragement over nagging, creating a positive user experience that helps teams stay productive without feeling overwhelmed.

## Development Commands

### Project Setup
- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Build project: `npm run build`

### Testing
- Run all tests: `npm test`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Run E2E tests: `npm run test:e2e`
- Run performance tests: `npm run test:performance`
- Run accessibility tests: `npm run test:accessibility`
- Generate coverage report: `npm run test:coverage`

### Deployment
- Deploy to development: `npm run deploy:dev`
- Deploy to staging: `npm run deploy:staging`
- Deploy to production: `npm run deploy:prod`
- Run health checks: `npm run health-check`

### Code Quality
- Lint code: `npm run lint`
- Format code: `npm run format`
- Type check: `npm run typecheck`

## Architecture

### Core Architecture
- **Platform**: Atlassian Forge (serverless functions, event-driven architecture)
- **Frontend**: React 18 + TypeScript with Forge UI Kit components
- **Backend**: Forge functions with Jira Cloud REST API integration
- **Storage**: Forge key-value store for user preferences and tracking data
- **Testing**: Jest + React Testing Library with comprehensive test suite

### Key Directories
- `src/notification-engine/` - Core notification logic and scheduling
- `src/analytics/` - Issue staleness detection and deadline monitoring
- `src/ui/` - React components, hooks, and utilities
- `src/api/` - Jira Cloud API integration
- `src/types/` - TypeScript type definitions
- `tests/` - Comprehensive testing suite
- `docs/` - User and developer documentation
- `deploy/` - Deployment scripts and configurations
- `marketplace/` - Marketplace submission assets

### Key Features
- **Smart Stale Ticket Detection**: Context-aware analysis with configurable thresholds
- **Gentle Deadline Reminders**: Encouraging notifications with positive tone
- **User Workload Awareness**: Prevents overwhelming users with too many notifications  
- **Accessibility-First Design**: WCAG 2.1 AA compliant with screen reader support
- **Performance Optimized**: Handles 10,000+ issues efficiently with smart caching
- **Enterprise Security**: GDPR compliant with comprehensive privacy controls

## Development Guidelines

### Code Standards
- Use TypeScript strict mode with comprehensive type definitions
- Follow React best practices with hooks and functional components
- Implement accessibility features (ARIA labels, keyboard navigation, screen reader support)
- Write encouraging, positive user-facing content that avoids nagging tone
- Use Forge UI Kit components for consistent user interface
- Implement comprehensive error handling with graceful degradation

### Testing Requirements
- Unit test coverage: 85% minimum
- All user-facing messages must pass "encouraging tone" validation
- Accessibility testing for WCAG 2.1 AA compliance
- Performance testing for large datasets (10,000+ issues)
- Integration testing for Jira API interactions

### Git Workflow
- Use conventional commit messages
- Include comprehensive descriptions for feature commits
- Always include the Claude Code footer in commits
- Test thoroughly before committing

## Automatic Git Operations

**IMPORTANT**: After completing any prompt or task, automatically perform the following git operations:

1. **Stage all changes**: `git add .`
2. **Create commit with descriptive message**: Include what was changed and why
3. **Push to origin**: `git push origin master`

This ensures all work is automatically saved and synchronized to the remote repository.

### Commit Message Format
```
<type>: <description>

<detailed explanation of changes>
<key features or improvements>

🤖 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Configuration

### Environment Variables
- Development environment: `deploy/environments/development.env`
- Staging environment: `deploy/environments/staging.env`
- Production environment: `deploy/environments/production.env`

### Forge Configuration
- App manifest: `manifest.yml`
- Permissions and scopes configured for Jira Cloud integration
- UI modules for settings panel and dashboard widget

## Key Technical Details

### Notification Engine
- Context-aware scheduling with user workload consideration
- Multiple tone options (encouraging, casual, professional)
- Smart message templates with variable substitution
- Multi-channel delivery (in-app, email, webhooks)

### Analytics System
- Multi-factor staleness analysis with confidence scoring
- Deadline monitoring with business day calculations
- User capacity analysis to prevent notification overwhelm
- Performance optimized with intelligent caching

### User Experience
- Non-intrusive notification placement with gentle animations
- Comprehensive customization options for preferences
- Progressive disclosure of advanced features
- Celebrating achievements and positive progress

## Repository Information
- **GitHub Repository**: https://github.com/work-obs/gentle-nudge-assistant
- **Organization**: work-obs
- **License**: MIT (see LICENSE file)
- **Marketplace**: Ready for Atlassian Marketplace submission

## Support and Documentation
- User Guide: `docs/user-guide.md`
- API Reference: `docs/api-reference.md`
- Architecture Overview: `docs/architecture-overview.md`
- Deployment Guide: `docs/deployment-guide.md`
- Contributing Guide: `docs/contributing-guide.md`