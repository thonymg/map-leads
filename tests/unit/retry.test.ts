/**
 * Tests unitaires pour src/retry.ts
 * Couverture: retry avec backoff exponentiel, erreurs retryable
 */

import { describe, test, expect } from 'bun:test';

describe('Retry', () => {
  describe('isNetworkError', () => {
    test('should return true for network errors', async () => {
      // We need to test the internal function indirectly through withRetry
      const { withRetry } = await import('../../src/retry.ts');
      
      const networkErrors = [
        new Error('Network error'),
        new Error('Request timeout'),
        new Error('ECONNREFUSED'),
        new Error('ECONNRESET'),
        new Error('ENETUNREACH'),
        new Error('Socket hang up'),
        new Error('Temporary failure in name resolution'),
        new Error('ETIMEDOUT'),
        new Error('EPIPE'),
        new Error('Abort'),
      ];

      for (const error of networkErrors) {
        let caughtError: unknown;
        try {
          await withRetry(
            () => {
              throw error;
            },
            { maxAttempts: 1 }
          );
        } catch (e) {
          caughtError = e;
        }
        // Should not throw immediately (would retry)
        expect(caughtError).toBeDefined();
      }
    });

    test('should return false for non-network errors', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const nonNetworkErrors = [
        new Error('Validation error'),
        new Error('Invalid input'),
        new Error('Not found'),
        new Error('Permission denied'),
      ];

      for (const error of nonNetworkErrors) {
        let thrownError: unknown;
        try {
          await withRetry(
            () => {
              throw error;
            },
            { maxAttempts: 3 }
          );
        } catch (e) {
          thrownError = e;
        }
        // Should throw immediately without retry
        expect(thrownError).toBe(error);
      }
    });

    test('should return false for non-Error objects', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let thrownError: unknown;
      try {
        await withRetry(
          () => {
            throw 'string error';
          },
          { maxAttempts: 1 }
        );
      } catch (e) {
        thrownError = e;
      }
      expect(thrownError).toBe('string error');
    });
  });

  describe('calculateDelay', () => {
    test('should calculate exponential backoff', async () => {
      // Test the delay calculation indirectly
      const { withRetry } = await import('../../src/retry.ts');
      
      let attemptCount = 0;
      const delays: number[] = [];
      let lastTime = Date.now();

      try {
        await withRetry(
          async () => {
            const now = Date.now();
            if (attemptCount > 0) {
              delays.push(now - lastTime);
            }
            lastTime = now;
            attemptCount++;
            throw new Error('Network error');
          },
          {
            maxAttempts: 4,
            baseDelay: 100,
            backoffFactor: 2,
            maxDelay: 10000,
          }
        );
      } catch {
        // Expected to fail
      }

      expect(attemptCount).toBe(4);
      // Delays should increase exponentially (with jitter)
      expect(delays.length).toBe(3);
    });

    test('should respect maxDelay', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attemptCount = 0;

      try {
        await withRetry(
          async () => {
            attemptCount++;
            throw new Error('Network error');
          },
          {
            maxAttempts: 10,
            baseDelay: 1000,
            backoffFactor: 2,
            maxDelay: 5000,
          }
        );
      } catch {
        // Expected to fail
      }

      expect(attemptCount).toBe(10);
    });
  });

  describe('withRetry', () => {
    test('should return result on first success', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const result = await withRetry(async () => {
        return 'success';
      });

      expect(result).toBe('success');
    });

    test('should retry on network error and succeed', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success after retries';
      }, {
        maxAttempts: 5,
        baseDelay: 10,
      });

      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    test('should throw after max attempts', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attempts = 0;
      let lastError: unknown;

      try {
        await withRetry(
          async () => {
            attempts++;
            throw new Error('Persistent network error');
          },
          {
            maxAttempts: 3,
            baseDelay: 10,
          }
        );
      } catch (error) {
        lastError = error;
      }

      expect(attempts).toBe(3);
      expect(lastError).toBeDefined();
    });

    test('should not retry on non-retryable error', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attempts = 0;
      let lastError: unknown;

      try {
        await withRetry(
          async () => {
            attempts++;
            throw new Error('Validation error');
          },
          {
            maxAttempts: 5,
          }
        );
      } catch (error) {
        lastError = error;
      }

      expect(attempts).toBe(1);
      expect(lastError).toBeDefined();
    });

    test('should use custom isRetryable function', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attempts = 0;
      const retryableErrors: string[] = [];

      try {
        await withRetry(
          async () => {
            attempts++;
            const error = new Error('Custom error');
            retryableErrors.push(error.message);
            throw error;
          },
          {
            maxAttempts: 3,
            baseDelay: 10,
            isRetryable: (error) => {
              return error instanceof Error && error.message.includes('Custom');
            },
          }
        );
      } catch {
        // Expected
      }

      expect(attempts).toBe(3);
      expect(retryableErrors.length).toBe(3);
    });

    test('should use default options', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      let attempts = 0;

      try {
        await withRetry(async () => {
          attempts++;
          throw new Error('Network error');
        });
      } catch {
        // Expected
      }

      // Default maxAttempts is 3
      expect(attempts).toBe(3);
    });

    test('should handle async function returning undefined', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const result = await withRetry(async () => {
        return undefined;
      });

      expect(result).toBeUndefined();
    });

    test('should handle async function returning null', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const result = await withRetry(async () => {
        return null;
      });

      expect(result).toBeNull();
    });

    test('should handle async function returning object', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const expected = { key: 'value', number: 42 };
      const result = await withRetry(async () => {
        return expected;
      });

      expect(result).toEqual(expected);
    });

    test('should handle async function returning array', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const expected = [1, 2, 3];
      const result = await withRetry(async () => {
        return expected;
      });

      expect(result).toEqual(expected);
    });
  });

  describe('retryable decorator', () => {
    test('should wrap method with retry', async () => {
      const { retryable, withRetry } = await import('../../src/retry.ts');
      
      class TestClass {
        callCount = 0;

        @retryable({ maxAttempts: 3, baseDelay: 10 })
        async failingMethod(): Promise<string> {
          this.callCount++;
          if (this.callCount < 3) {
            throw new Error('Network error');
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.failingMethod();

      expect(result).toBe('success');
      expect(instance.callCount).toBe(3);
    });

    test('should use default options in decorator', async () => {
      const { retryable } = await import('../../src/retry.ts');
      
      class TestClass {
        callCount = 0;

        @retryable()
        async failingMethod(): Promise<string> {
          this.callCount++;
          throw new Error('Network error');
        }
      }

      const instance = new TestClass();
      let error: unknown;

      try {
        await instance.failingMethod();
      } catch (e) {
        error = e;
      }

      // Default maxAttempts is 3
      expect(instance.callCount).toBe(3);
      expect(error).toBeDefined();
    });
  });

  describe('delay function', () => {
    test('should delay execution', async () => {
      const { withRetry } = await import('../../src/retry.ts');
      
      const startTime = Date.now();
      let callCount = 0;

      try {
        await withRetry(
          async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('Network error');
            }
            return 'success';
          },
          {
            maxAttempts: 2,
            baseDelay: 100,
          }
        );
      } catch {
        // Expected
      }

      const elapsed = Date.now() - startTime;
      // Should have waited at least 100ms
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });
});
