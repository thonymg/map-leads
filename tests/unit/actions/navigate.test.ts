/**
 * Tests unitaires pour src/actions/navigate.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Navigate Action', () => {
  test('should navigate successfully', async () => {
    const { navigate } = await import('../../../src/actions/navigate.ts');
    
    const mockPage = {
      goto: mock((url: string) => Promise.resolve()),
    };

    const result = await navigate({ url: 'https://example.com' }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Navigation réussie');
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  });

  test('should use custom timeout', async () => {
    const { navigate } = await import('../../../src/actions/navigate.ts');
    
    const mockPage = {
      goto: mock((url: string) => Promise.resolve()),
    };

    await navigate({ url: 'https://example.com', timeout: 60000 }, mockPage as any);

    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
  });

  test('should handle navigation error', async () => {
    const { navigate } = await import('../../../src/actions/navigate.ts');
    
    const mockPage = {
      goto: mock(() => Promise.reject(new Error('Timeout'))),
    };

    const result = await navigate({ url: 'https://example.com' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de la navigation');
    expect(result.message).toContain('Timeout');
  });

  test('should handle unknown error', async () => {
    const { navigate } = await import('../../../src/actions/navigate.ts');
    
    const mockPage = {
      goto: mock(() => Promise.reject('string error')),
    };

    const result = await navigate({ url: 'https://example.com' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de la navigation');
  });
});
