# PageFlow Testing Guide

This guide covers the comprehensive testing strategy for the PageFlow AI Learning Platform.

## Testing Strategy

PageFlow implements a multi-layered testing approach to ensure quality, reliability, and performance:

### 1. **Unit Tests**
- **Purpose**: Test individual functions and components in isolation
- **Coverage**: Business logic, utility functions, service methods
- **Tools**: Jest, TypeScript
- **Location**: `src/__tests__/` directories

### 2. **Integration Tests**
- **Purpose**: Test service interactions and API endpoints
- **Coverage**: HTTP endpoints, database operations, service communication
- **Tools**: Supertest, Jest
- **Location**: `src/__tests__/integration.test.ts`

### 3. **Performance Tests**
- **Purpose**: Ensure system meets performance requirements
- **Coverage**: Response times, load handling, memory usage
- **Tools**: Supertest, Jest
- **Location**: `src/__tests__/performance.test.ts`

### 4. **End-to-End Tests**
- **Purpose**: Test complete user workflows
- **Coverage**: User journeys, cross-service interactions
- **Tools**: Playwright, Cypress
- **Location**: `apps/web/src/__tests__/e2e/`

### 5. **Accessibility Tests**
- **Purpose**: Ensure platform is accessible to all users
- **Coverage**: Screen reader compatibility, keyboard navigation, ARIA labels
- **Tools**: Jest, Testing Library
- **Location**: `apps/web/src/__tests__/accessibility/`

## Running Tests

### Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e
npm run test:accessibility

# Run with coverage
npm run test:coverage

# Run tests in parallel
npm run test:parallel
```

### Using the Test Runner Script

```bash
# Basic usage
./scripts/test-runner.sh [test-type] [coverage] [parallel]

# Examples
./scripts/test-runner.sh unit
./scripts/test-runner.sh integration true
./scripts/test-runner.sh all false true
```

### Test Types

| Test Type | Description | Command |
|-----------|-------------|---------|
| `unit` | Unit tests for individual functions | `npm run test:unit` |
| `integration` | API and service integration tests | `npm run test:integration` |
| `performance` | Load and performance tests | `npm run test:performance` |
| `e2e` | End-to-end user workflow tests | `npm run test:e2e` |
| `accessibility` | Accessibility compliance tests | `npm run test:accessibility` |
| `coverage` | All tests with coverage reporting | `npm run test:coverage` |
| `all` | All test types | `npm run test:all` |

## Test Structure

### Service Tests

Each service follows this test structure:

```
services/[service-name]/src/__tests__/
├── [serviceName].test.ts          # Unit tests
├── integration.test.ts            # Integration tests
├── performance.test.ts            # Performance tests
└── setup.ts                       # Test configuration
```

### Package Tests

Shared packages have their own tests:

```
packages/[package-name]/src/__tests__/
├── [packageName].test.ts          # Unit tests
└── setup.ts                       # Test configuration
```

### Web App Tests

```
apps/web/src/__tests__/
├── unit/                          # Component unit tests
├── integration/                   # API integration tests
├── e2e/                          # End-to-end tests
└── accessibility/                # Accessibility tests
```

## Writing Tests

### Unit Test Example

```typescript
import { assessmentService } from '../services/assessmentService';

describe('AssessmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAssessment', () => {
    it('should create assessment with valid data', async () => {
      const assessmentData = {
        title: 'Test Assessment',
        description: 'A test assessment',
        type: 'quiz',
        questions: [],
        passingScore: 70,
        maxAttempts: 3,
      };

      const result = await assessmentService.createAssessment(assessmentData);
      
      expect(result.id).toBeDefined();
      expect(result.title).toBe(assessmentData.title);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import express from 'express';
import { assessmentRoutes } from '../routes/assessmentRoutes';

describe('Assessment API Integration', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/assessments', assessmentRoutes);
  });

  it('should create and retrieve assessment', async () => {
    const assessmentData = {
      title: 'Integration Test',
      description: 'Test assessment',
      type: 'quiz',
      questions: [],
      passingScore: 70,
      maxAttempts: 3,
    };

    const createResponse = await request(app)
      .post('/api/assessments')
      .send(assessmentData)
      .expect(201);

    const assessmentId = createResponse.body.id;

    const getResponse = await request(app)
      .get(`/api/assessments/${assessmentId}`)
      .expect(200);

    expect(getResponse.body.id).toBe(assessmentId);
  });
});
```

### Performance Test Example

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const startTime = Date.now();
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/health')
          .expect(200)
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    expect(results).toHaveLength(concurrentRequests);
  });
});
```

## Test Configuration

### Jest Configuration

Each service has its own Jest configuration:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

### Test Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
});
```

## Coverage Requirements

### Minimum Coverage Targets

| Component | Unit Tests | Integration Tests | Overall |
|-----------|------------|-------------------|---------|
| Services | 80% | 70% | 75% |
| Packages | 90% | N/A | 90% |
| Web App | 75% | 60% | 70% |
| Infrastructure | 70% | N/A | 70% |

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: Interactive coverage reports in `coverage/lcov-report/`
- **LCOV**: Machine-readable coverage data
- **Console**: Summary output during test runs

## Continuous Integration

### GitHub Actions

Tests are automatically run on:

- **Pull Requests**: All test types
- **Main Branch**: Full test suite with coverage
- **Scheduled**: Performance and security tests

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm run install:all
npx husky install

# Hooks run automatically on commit
git commit -m "Add new feature"
```

## Performance Testing

### Load Testing

```bash
# Run load tests
npm run test:performance

# Custom load test
./scripts/test-runner.sh performance
```

### Performance Benchmarks

| Operation | Target Response Time | Target Throughput |
|-----------|---------------------|-------------------|
| Health Check | < 100ms | 1000 req/s |
| Assessment Creation | < 500ms | 100 req/s |
| Assessment Retrieval | < 200ms | 500 req/s |
| Assessment Submission | < 1000ms | 50 req/s |

### Memory Testing

```bash
# Run memory leak tests
npm run test:performance
```

Memory usage should not increase by more than 10MB during extended operations.

## Accessibility Testing

### Automated Tests

```bash
# Run accessibility tests
npm run test:accessibility
```

### Manual Testing Checklist

- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Font size scaling
- [ ] Color blindness support
- [ ] Focus indicators
- [ ] ARIA labels

## Debugging Tests

### Common Issues

1. **Timeout Errors**
   ```bash
   # Increase timeout
   jest.setTimeout(30000);
   ```

2. **Mock Issues**
   ```bash
   # Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Database Issues**
   ```bash
   # Use test database
   process.env.DATABASE_URL = 'test-database-url';
   ```

### Debug Mode

```bash
# Run tests in debug mode
NODE_ENV=debug npm test

# Debug specific test
npm test -- --testNamePattern="specific test name"
```

## Test Data Management

### Fixtures

```typescript
// src/__tests__/fixtures/assessmentData.ts
export const mockAssessment = {
  title: 'Test Assessment',
  description: 'Test description',
  type: 'quiz',
  questions: [],
  passingScore: 70,
  maxAttempts: 3,
};
```

### Test Database

```bash
# Setup test database
npm run test:setup

# Clean test data
npm run test:cleanup
```

## Best Practices

### Test Organization

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test descriptions
3. **Single Responsibility**: Test one thing per test
4. **Independent Tests**: Tests should not depend on each other

### Mocking

```typescript
// Mock external dependencies
jest.mock('../services/externalService');

// Mock database operations
jest.mock('../repositories/assessmentRepository');
```

### Error Testing

```typescript
it('should handle errors gracefully', async () => {
  await expect(
    assessmentService.getAssessmentById('invalid-id')
  ).rejects.toThrow('Assessment not found');
});
```

## Reporting

### Test Reports

Test reports are generated in the `reports/` directory:

- `test-summary.md`: Overall test results
- `coverage-reports/`: Detailed coverage information
- `performance-reports/`: Performance test results

### Metrics

Key testing metrics are tracked:

- **Test Coverage**: Percentage of code covered by tests
- **Test Duration**: Time to run all tests
- **Test Reliability**: Percentage of tests passing consistently
- **Performance**: Response times and throughput

## Troubleshooting

### Common Problems

1. **Tests Failing Intermittently**
   - Check for race conditions
   - Ensure proper cleanup
   - Use proper async/await

2. **Slow Tests**
   - Mock external dependencies
   - Use test databases
   - Run tests in parallel

3. **Coverage Issues**
   - Add tests for uncovered code paths
   - Check for dead code
   - Review test organization

### Getting Help

- Check the test logs for detailed error messages
- Review the test configuration
- Consult the testing documentation
- Contact the development team

---

**Note**: This testing guide should be updated as the testing strategy evolves. Always run tests before deploying to ensure code quality and reliability. 