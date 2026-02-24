import { describe, it, expect, vi } from "bun:test";
import { withRetry } from "../../src/retry";

describe("withRetry", () => {
    it("should return the result on the first try if the function succeeds", async () => {
        const successfulFunction = vi.fn().mockResolvedValue("success");
        const result = await withRetry(successfulFunction);
        expect(result).toBe("success");
        expect(successfulFunction).toHaveBeenCalledTimes(1);
    });

    it("should retry the function and succeed", async () => {
        const functionThatSucceedsOnThirdTry = vi.fn()
            .mockRejectedValueOnce(new Error("Timeout"))
            .mockRejectedValueOnce(new Error("Network error"))
            .mockResolvedValue("success");

        const result = await withRetry(functionThatSucceedsOnThirdTry, { baseDelay: 10, maxAttempts: 3 });
        expect(result).toBe("success");
        expect(functionThatSucceedsOnThirdTry).toHaveBeenCalledTimes(3);
    });

    it("should fail after all attempts", async () => {
        const failingFunction = vi.fn().mockRejectedValue(new Error("Persistent network error"));
        
        await expect(withRetry(failingFunction, { baseDelay: 10, maxAttempts: 3 }))
              .rejects.toThrow("Persistent network error");
        expect(failingFunction).toHaveBeenCalledTimes(3);
    });

    it("should not retry on non-retryable errors", async () => {
        const nonRetryableError = new Error("Invalid input");
        const failingFunction = vi.fn().mockRejectedValue(nonRetryableError);
        
        const isRetryable = (error: Error) => !/Invalid input/.test(error.message);

        await expect(withRetry(failingFunction, { baseDelay: 10, isRetryable }))
              .rejects.toThrow("Invalid input");
        expect(failingFunction).toHaveBeenCalledTimes(1);
    });
    
    it("should calculate delay with exponential backoff", async () => {
        const delays: number[] = [];
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = ((cb: () => void, ms: number) => {
            delays.push(ms);
            return originalSetTimeout(cb, 0); 
        }) as any;

        const failingFunction = vi.fn().mockRejectedValue(new Error("Network error"));
        
        try {
            await withRetry(failingFunction, { baseDelay: 100, backoffFactor: 2, maxAttempts: 4 });
        } catch (e) {
            // expected
        }

        expect(delays.length).toBe(3);
        expect(delays[0]).toBeGreaterThanOrEqual(100 * 0.8);
        expect(delays[1]).toBeGreaterThanOrEqual(200 * 0.8);
        expect(delays[2]).toBeGreaterThanOrEqual(400 * 0.8);

        global.setTimeout = originalSetTimeout;
    });
});
