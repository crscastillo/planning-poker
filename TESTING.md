# Testing Guide

This document provides information about the testing setup and how to write and run tests for the Planning Poker application.

## 📋 Testing Stack

- **Test Framework**: [Jest](https://jestjs.io/)
- **React Testing**: [React Testing Library](https://testing-library.com/react)
- **API Testing**: [node-mocks-http](https://github.com/howardabrams/node-mocks-http)
- **Coverage**: Jest built-in coverage tool

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- ThemeContext.test
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="toggles theme"
```

## 📁 Test Structure

Tests are located alongside the code they test in `__tests__` directories:

```
src/
├── components/
│   ├── ThemeToggle.tsx
│   └── __tests__/
│       └── ThemeToggle.test.tsx
├── contexts/
│   ├── ThemeContext.tsx
│   └── __tests__/
│       └── ThemeContext.test.tsx
├── lib/
│   ├── store.ts
│   └── __tests__/
│       └── store.test.ts
└── pages/
    └── api/
        └── sessions/
            ├── index.ts
            └── __tests__/
                └── index.test.ts
```

## 🧪 Test Coverage

Current test coverage includes:

### ✅ Component Tests
- **ThemeToggle** - Theme switching UI component
- **ThemeContext** - Theme state management

### ✅ Business Logic Tests
- **sessionStore** - All CRUD operations for sessions
  - createSession
  - getSession
  - updateSession
  - addItem
  - addVote
  - removeUser
  - revealVotes
  - resetVotes
  - setFinalEstimate
  - deleteSession

### ✅ API Route Tests
- **POST /api/sessions** - Session creation endpoint

## 📝 Writing Tests

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import YourComponent from '@/components/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(
      <ThemeProvider>
        <YourComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Hook Test Example

```tsx
import { renderHook, act } from '@testing-library/react'
import { useYourHook } from '@/hooks/useYourHook'

describe('useYourHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useYourHook())
    
    expect(result.current.value).toBe('expected')
  })
  
  it('updates value on action', () => {
    const { result } = renderHook(() => useYourHook())
    
    act(() => {
      result.current.updateValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

### API Route Test Example

```tsx
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/your-endpoint'

describe('/api/your-endpoint', () => {
  it('returns expected response', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { data: 'test' },
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ success: true })
  })
})
```

### Store Function Test Example

```tsx
import { sessionStore } from '@/lib/store'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
      })),
    },
  },
}))

describe('sessionStore', () => {
  it('creates session successfully', async () => {
    const session = await sessionStore.createSession('id', 'name', 'creator')
    
    expect(session).toMatchObject({
      id: 'id',
      name: 'name',
      createdBy: 'creator',
    })
  })
})
```

## 🔧 Test Configuration

### jest.config.js

The Jest configuration is set up to work with Next.js:

- **Test Environment**: jsdom (for DOM testing)
- **Module Mapping**: `@/` aliases to `src/` directory
- **Setup Files**: `jest.setup.js` for global test configuration
- **Coverage Collection**: Configured to collect from `src/**` files

### jest.setup.js

Global test setup includes:

- **@testing-library/jest-dom** - Custom matchers
- **matchMedia mock** - For responsive/media query tests
- **localStorage mock** - For storage tests
- **fetch mock** - For API call tests

## 🎯 Best Practices

### 1. Test Behavior, Not Implementation
```tsx
// ✅ Good - tests behavior
expect(screen.getByText('Submit')).toBeInTheDocument()

// ❌ Bad - tests implementation
expect(component.state.isSubmitted).toBe(true)
```

### 2. Use Testing Library Queries
```tsx
// ✅ Good - accessible query
screen.getByRole('button', { name: 'Submit' })

// ❌ Bad - implementation detail
screen.getByTestId('submit-button')
```

### 3. Clean Up After Tests
```tsx
beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})
```

### 4. Mock External Dependencies
```tsx
// Mock Supabase
jest.mock('@/lib/supabase')

// Mock Next Router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { sessionId: 'test-id' },
  }),
}))
```

### 5. Test Error Cases
```tsx
it('handles errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Failed'))
  
  await expect(yourFunction()).rejects.toThrow('Failed')
})
```

## 📊 Coverage Goals

### Current Status

As of initial test setup:
- **ThemeToggle component**: 100% coverage ✓
- **ThemeContext**: 100% coverage ✓
- **store.ts**: ~70% coverage (all major functions tested)
- **API sessions endpoint**: 100% coverage ✓

### Target Coverage

Target coverage for the project:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### View Coverage Report

After running `npm run test:coverage`, open:

```
coverage/lcov-report/index.html
```

**Note**: Console.error messages during test runs are expected when testing error handling paths.

## 🐛 Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout for async operations
```tsx
it('async test', async () => {
  // ...
}, 10000) // 10 second timeout
```

### Issue: React Hook warnings
**Solution**: Wrap state updates in `act()`
```tsx
act(() => {
  result.current.updateState()
})
```

### Issue: "Cannot find module" errors
**Solution**: Check module paths use `@/` alias correctly

### Issue: Mock not working
**Solution**: Ensure mock is defined before importing the module
```tsx
jest.mock('@/lib/supabase')  // Must be before import
import { sessionStore } from '@/lib/store'
```

## 🔄 Continuous Integration

Tests should run on:
- ✅ Pre-commit (optional: use husky)
- ✅ Pull request CI/CD
- ✅ Before deployment

Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Testing Library Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Testing Philosophy

We follow these principles:

1. **Test user behavior** - Write tests from the user's perspective
2. **Avoid implementation details** - Don't test internal state
3. **Keep tests simple** - One assertion per test when possible
4. **Fast feedback** - Tests should run quickly
5. **Maintainable** - Tests should be easy to update

## 🤝 Contributing Tests

When adding new features:

1. Write tests alongside your code
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Document complex test scenarios
5. Follow existing test patterns

---

**Remember**: Good tests are investments in code quality and developer confidence! 🚀
