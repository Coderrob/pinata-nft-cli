# Unit Testing Standards Guide

## Overview

This guide establishes comprehensive standards for writing unit tests in the pinata-nft-cli project. All tests must follow these principles to ensure consistency, maintainability, and reliability.

## Core Principles: FAST

### F - Fast

- Tests must execute quickly (< 100ms per test ideally)
- Use mocks instead of real implementations
- Avoid I/O operations, network calls, and database access
- Run tests in parallel when possible

### A - Automated

- Tests run automatically via CI/CD
- No manual intervention required
- Tests are deterministic and repeatable

### S - Self-Validating

- Tests have clear pass/fail outcomes
- Use explicit assertions
- Avoid console.log for verification

### T - Timely

- Write tests alongside production code
- Tests are updated when code changes
- Maintain test coverage

## Test File Structure

### File Organization

```typescript
// 1. Imports (grouped by type)
import { ClassUnderTest } from './class-under-test';
import { DependencyA, DependencyB } from './dependencies';
import { InterfaceA, InterfaceB } from '../types';

// 2. Mock declarations
jest.mock('./dependency-a');
jest.mock('./dependency-b');

// 3. Root describe (named after the class/file)
describe('ClassName', () => {
  // 4. Mock variable declarations (using let)
  let mockDependencyA: jest.Mocked<DependencyA>;
  let mockDependencyB: jest.Mocked<InterfaceB>;
  let instanceUnderTest: ClassUnderTest;

  // 5. Setup and teardown
  beforeEach(() => {
    // Initialize mocks
    // Create instance
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Cleanup resources
  });

  // 6. Function/method describes
  describe('methodName', () => {
    // Positive test cases
    // Negative test cases
  });
});
```

## Mock Management

### Mock Variable Declaration

```typescript
// ✅ CORRECT: Use let with jest.Mocked<T>
let mockService: jest.Mocked<ServiceInterface>;
let mockFunction: jest.MockedFunction<typeof utilFunction>;
let mockClass: jest.MockedClass<typeof SomeClass>;

// ❌ INCORRECT: Using const or no type
const mockService = serviceMock;
let mockService: any;
```

### Mock Initialization in beforeEach

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history and implementation

  // Initialize mock references
  mockAxios = axios as jest.Mocked<typeof axios>;
  mockService = ServiceClass as jest.MockedClass<typeof ServiceClass>;

  // Setup default mock implementations
  mockAxios.get.mockResolvedValue({ data: {} });
  mockService.prototype.method.mockResolvedValue('result');

  // Create instance under test
  instanceUnderTest = new ClassUnderTest(mockService);
});
```

### Mock Cleanup in afterEach

```typescript
afterEach(() => {
  jest.clearAllMocks();      // Clear mock call history and reset implementations
  jest.restoreAllMocks();    // Restore original implementations

  // Cleanup test resources to prevent memory leaks
  mockService = undefined as any;
  instanceUnderTest = undefined as any;
});
```

## Test Structure

### Test Naming Convention

```typescript
// ✅ CORRECT: Descriptive "should" statements
it('should return user data when API call succeeds', () => {});
it('should throw ValidationError when input is invalid', () => {});
it('should retry 3 times before failing', () => {});

// ❌ INCORRECT: Vague or non-descriptive names
it('works', () => {});
it('test user', () => {});
it('handles errors', () => {});
```

### Function-Level Describe Blocks

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    // Positive test cases
    it('should return expected result when given valid input', () => {});
    it('should handle edge case A successfully', () => {});

    // Negative test cases
    it('should throw TypeError when input is null', () => {});
    it('should return error when dependency fails', () => {});
  });

  describe('anotherMethod', () => {
    // Tests for anotherMethod
  });
});
```

### Using it.each for Test Tables

```typescript
describe('validateInput', () => {
  describe('positive cases', () => {
    it.each([
      ['valid string', 'test', true],
      ['empty string allowed', '', true],
      ['number converted', 123, true],
    ])('should return true for %s', (description, input, expected) => {
      const result = validateInput(input);
      expect(result).toBe(expected);
    });
  });

  describe('negative cases', () => {
    it.each([
      ['null value', null, false],
      ['undefined value', undefined, false],
      ['invalid object', {}, false],
    ])('should return false for %s', (description, input, expected) => {
      const result = validateInput(input);
      expect(result).toBe(expected);
    });
  });
});
```

## Assertion Best Practices

### Verify Call Counts

```typescript
// ✅ CORRECT: Explicit call count verification
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledTimes(0); // Not called
expect(mockFunction).toHaveBeenCalledTimes(3); // Called multiple times
```

### Verify Call Arguments

```typescript
// ✅ CORRECT: Verify arguments for specific call
expect(mockFunction).toHaveBeenCalledWith(arg1, arg2);
expect(mockFunction).toHaveBeenNthCalledWith(1, firstCallArg);
expect(mockFunction).toHaveBeenNthCalledWith(2, secondCallArg);

// For complex objects, use matchers
expect(mockFunction).toHaveBeenCalledWith(
  expect.objectContaining({ id: 123 }),
  expect.any(String)
);
```

### Return Value Verification

```typescript
// ✅ CORRECT: Verify the actual return value
const result = await functionUnderTest();
expect(result).toBe('expected');
expect(result).toEqual({ key: 'value' });
expect(result).toMatchObject({ id: expect.any(Number) });
```

### Error Handling Verification

```typescript
// ✅ CORRECT: Verify error thrown
await expect(functionUnderTest()).rejects.toThrow('Error message');
await expect(functionUnderTest()).rejects.toThrow(CustomError);
expect(() => functionUnderTest()).toThrow(TypeError);
```

## Mock Implementation Patterns

### Simple Return Values

```typescript
mockFunction.mockReturnValue('result');
mockFunction.mockResolvedValue('async result');
mockFunction.mockRejectedValue(new Error('failure'));
```

### Implementation Functions

```typescript
// For complex logic or multiple return values
mockFunction.mockImplementation((arg) => {
  if (arg === 'special') return 'special result';
  return 'normal result';
});

// For async functions
mockFunction.mockImplementation(async (arg) => {
  return processArg(arg);
});
```

### One-Time Return Values

```typescript
// For testing retry logic or changing behavior
mockFunction
  .mockResolvedValueOnce('first call')
  .mockResolvedValueOnce('second call')
  .mockRejectedValue(new Error('subsequent calls fail'));
```

## Complete Example

```typescript
import axios from 'axios';
import { UserService } from './user.service';
import { IUser, IUserRepository } from '../types';

jest.mock('axios');

describe('UserService', () => {
  let mockAxios: jest.Mocked<typeof axios>;
  let mockRepository: jest.Mocked<IUserRepository>;
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize mock references
    mockAxios = axios as jest.Mocked<typeof axios>;
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    // Setup default successful behaviors
    mockAxios.get.mockResolvedValue({ data: {} });
    mockRepository.findById.mockResolvedValue(null);

    // Create instance under test
    userService = new UserService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Cleanup to prevent memory leaks
    mockRepository = undefined as any;
    userService = undefined as any;
  });

  describe('getUserById', () => {
    describe('positive cases', () => {
      it.each([
        ['existing user', 1, { id: 1, name: 'Alice' }],
        ['another user', 2, { id: 2, name: 'Bob' }],
      ])('should return user data for %s', async (description, userId, expectedUser) => {
        mockRepository.findById.mockResolvedValue(expectedUser);

        const result = await userService.getUserById(userId);

        expect(result).toEqual(expectedUser);
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      });
    });

    describe('negative cases', () => {
      it.each([
        ['user not found', 999, null],
        ['invalid id', -1, null],
      ])('should return null for %s', async (description, userId, expected) => {
        mockRepository.findById.mockResolvedValue(expected);

        const result = await userService.getUserById(userId);

        expect(result).toBe(expected);
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      });

      it('should throw error when repository fails', async () => {
        const error = new Error('Database connection failed');
        mockRepository.findById.mockRejectedValue(error);

        await expect(userService.getUserById(1)).rejects.toThrow('Database connection failed');
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('saveUser', () => {
    describe('positive cases', () => {
      it('should save new user successfully', async () => {
        const newUser: IUser = { id: 0, name: 'Charlie' };
        const savedUser: IUser = { id: 3, name: 'Charlie' };
        mockRepository.save.mockResolvedValue(savedUser);

        const result = await userService.saveUser(newUser);

        expect(result).toEqual(savedUser);
        expect(mockRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRepository.save).toHaveBeenCalledWith(newUser);
      });
    });

    describe('negative cases', () => {
      it('should throw ValidationError when user data is invalid', async () => {
        const invalidUser = { id: 0, name: '' };

        await expect(userService.saveUser(invalidUser)).rejects.toThrow('ValidationError');
        expect(mockRepository.save).toHaveBeenCalledTimes(0);
      });
    });
  });
});
```

## Anti-Patterns to Avoid

### ❌ Global Mock Constants

```typescript
// AVOID: Global mocks that leak between tests
const mockService = { method: jest.fn() };

describe('Test', () => {
  it('test 1', () => {
    mockService.method(); // Affects test 2
  });

  it('test 2', () => {
    expect(mockService.method).toHaveBeenCalledTimes(0); // FAILS!
  });
});
```

### ❌ Missing afterEach Cleanup

```typescript
// AVOID: No cleanup causes memory leaks and test pollution
describe('Test', () => {
  let largeObject: LargeClass;

  beforeEach(() => {
    largeObject = new LargeClass();
  });

  // Missing afterEach to clean up largeObject
});
```

### ❌ Over-Mocking

```typescript
// AVOID: Mocking the class under test
jest.mock('./class-under-test'); // Don't do this!

// CORRECT: Only mock dependencies
jest.mock('./dependency');
```

### ❌ Testing Implementation Details

```typescript
// AVOID: Testing private methods or internal state
expect(instance['privateMethod']).toHaveBeenCalled();
expect(instance['privateField']).toBe(value);

// CORRECT: Test public API and observable behavior
expect(instance.publicMethod()).toBe(expectedResult);
```

### ❌ Implicit Assertions

```typescript
// AVOID: No explicit verification
const result = functionUnderTest();
// Test passes but doesn't verify anything!

// CORRECT: Always assert
const result = functionUnderTest();
expect(result).toBe(expectedValue);
expect(mockFunction).toHaveBeenCalledTimes(1);
```

## Type Safety in Tests

### Proper Mock Typing

```typescript
// ✅ CORRECT: Strongly typed mocks
let mockService: jest.Mocked<IServiceInterface>;
let mockClass: jest.MockedClass<typeof ConcreteClass>;
let mockFunction: jest.MockedFunction<typeof utilFunction>;

// ❌ INCORRECT: Losing type safety
let mockService: any;
let mockClass = jest.fn() as any;
```

### Type-Safe Test Data

```typescript
// ✅ CORRECT: Use proper interfaces
const testUser: IUser = {
  id: 1,
  name: 'Test',
  email: 'test@example.com'
};

// ❌ INCORRECT: Partial or any types in production interfaces
const testUser = { id: 1 } as IUser; // Missing required fields
const testUser: any = { id: 1 };
```

## Memory Management

### Resource Cleanup

```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Clean up large objects
  mockLargeObject = undefined as any;
  instanceUnderTest = undefined as any;

  // Close open handles (if any)
  // Clean up timers (if any)
  jest.clearAllTimers();
});
```

### Avoiding Memory Leaks

```typescript
// ✅ CORRECT: Clean up in afterEach
let connection: DatabaseConnection;

beforeEach(() => {
  connection = createConnection();
});

afterEach(async () => {
  await connection.close();
  connection = undefined as any;
});

// ❌ INCORRECT: No cleanup
let connection: DatabaseConnection;
beforeEach(() => {
  connection = createConnection(); // Leaks on each test
});
```

## Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

## Checklist for Test Reviews

- [ ] All mocks declared with `let` and typed with `jest.Mocked<T>`
- [ ] All mocks initialized in `beforeEach`
- [ ] All mocks and resources cleaned up in `afterEach`
- [ ] Each function has dedicated `describe` block
- [ ] Tests use `it.each` for parameterized cases when applicable
- [ ] All tests start with "should" for clarity
- [ ] Positive and negative test cases separated
- [ ] Call counts verified with `toHaveBeenCalledTimes`
- [ ] Call arguments verified with `toHaveBeenCalledWith` or `toHaveBeenNthCalledWith`
- [ ] Return values explicitly asserted
- [ ] No global mock state that leaks between tests
- [ ] No testing of implementation details
- [ ] Type safety maintained throughout tests
- [ ] Tests follow FAST principles

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.file.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle error"
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [FIRST Principles](https://github.com/tekguard/Principles-of-Unit-Testing)

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0
**Maintainer**: Robert Lindley
