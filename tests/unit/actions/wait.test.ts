/**
 * Tests unitaires pour src/actions/wait.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Wait Action', () => {
  test('should wait for duration', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(),
    };

    const result = await wait({ duration: 1000 }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('1000ms');
    expect(mockPage.waitForSelector).not.toHaveBeenCalled();
  });

  test('should wait for selector', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(() => Promise.resolve()),
    };

    const result = await wait({ selector: '.content' }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('.content');
    expect(mockPage.waitForSelector).toHaveBeenCalledWith('.content', {
      timeout: 10000,
      state: 'visible',
    });
  });

  test('should use custom timeout', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(() => Promise.resolve()),
    };

    await wait({ selector: '.content', timeout: 20000 }, mockPage as any);

    expect(mockPage.waitForSelector).toHaveBeenCalledWith('.content', {
      timeout: 20000,
      state: 'visible',
    });
  });

  test('should prioritize duration over selector', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(),
    };

    const result = await wait({ selector: '.content', duration: 500 }, mockPage as any);

    expect(result.success).toBe(true);
    expect(mockPage.waitForSelector).not.toHaveBeenCalled();
  });

  test('should fail when no selector or duration', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(),
    };

    const result = await wait({}, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('requis');
  });

  test('should handle selector wait error', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(() => Promise.reject(new Error('Timeout'))),
    };

    const result = await wait({ selector: '.content' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de l\'attente');
    expect(result.message).toContain('Timeout');
  });

  test('should handle unknown error', async () => {
    const { wait } = await import('../../../src/actions/wait.ts');
    
    const mockPage = {
      waitForSelector: mock(() => Promise.reject('string error')),
    };

    const result = await wait({ selector: '.content' }, mockPage as any);

    expect(result.success).toBe(false);
  });
});
