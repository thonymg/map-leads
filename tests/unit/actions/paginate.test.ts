/**
 * Tests unitaires pour src/actions/paginate.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Paginate Action', () => {
  test('should paginate through multiple pages', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    let currentPage = 1;
    const mockPage = {
      $: mock(() => {
        if (currentPage < 3) {
          return Promise.resolve({ click: mock(() => Promise.resolve()) });
        }
        return Promise.resolve(null);
      }),
      waitForLoadState: mock(() => Promise.resolve()),
    };

    const result = await paginate(
      {
        selector: '.next',
        max_pages: 5,
        fields: [{ name: 'title', selector: 'h2' }],
        itemSelector: '.item',
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('page(s)');
    expect(mockPage.$).toHaveBeenCalledTimes(3); // 2 clicks + 1 final check
  });

  test('should respect max_pages limit', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve({ click: mock(() => Promise.resolve()) })),
      waitForLoadState: mock(() => Promise.resolve()),
    };

    const result = await paginate(
      {
        selector: '.next',
        max_pages: 2,
        fields: [{ name: 'title', selector: 'h2' }],
        itemSelector: '.item',
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    // Should stop at max_pages
    expect(mockPage.$.calls.length).toBeLessThanOrEqual(3);
  });

  test('should stop when next button not found', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve(null)),
      waitForLoadState: mock(),
    };

    const result = await paginate(
      {
        selector: '.next',
        fields: [{ name: 'title', selector: 'h2' }],
        itemSelector: '.item',
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(mockPage.$.calls.length).toBe(1);
  });

  test('should handle pagination without fields', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve(null)),
      waitForLoadState: mock(),
    };

    const result = await paginate(
      {
        selector: '.next',
        max_pages: 3,
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
  });

  test('should use default max_pages', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve(null)),
      waitForLoadState: mock(),
    };

    const result = await paginate(
      {
        selector: '.next',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
  });

  test('should use custom timeout', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    let clickCount = 0;
    const mockNextButton = {
      click: mock((options?: { timeout?: number }) => {
        clickCount++;
        return Promise.resolve();
      }),
    };
    const mockPage = {
      $: mock(() => {
        if (clickCount === 0) {
          return Promise.resolve(mockNextButton);
        }
        return Promise.resolve(null);
      }),
      waitForLoadState: mock(() => Promise.resolve()),
    };

    await paginate(
      {
        selector: '.next',
        timeout: 20000,
        fields: [{ name: 'title', selector: 'h2' }],
        itemSelector: '.item',
      },
      mockPage as any
    );

    expect(mockNextButton.click).toHaveBeenCalledWith({ timeout: 20000 });
  });

  test('should handle pagination error', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.reject(new Error('Selector error'))),
      waitForLoadState: mock(),
    };

    const result = await paginate(
      {
        selector: '.next',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de la pagination');
  });

  test('should return partial data on error', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    let callCount = 0;
    const mockPage = {
      $: mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ click: mock(() => Promise.resolve()) });
        }
        throw new Error('Page load failed');
      }),
      waitForLoadState: mock(() => Promise.resolve()),
    };

    const result = await paginate(
      {
        selector: '.next',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(false);
    expect(result.data).toBeDefined();
  });

  test('should handle unknown error', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    const mockPage = {
      $: mock(() => Promise.reject('string error')),
      waitForLoadState: mock(),
    };

    const result = await paginate(
      {
        selector: '.next',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de la pagination');
  });

  test('should concatenate results from multiple pages', async () => {
    const { paginate } = await import('../../../src/actions/paginate.ts');
    
    let page = 1;
    const mockPage = {
      $: mock(() => {
        if (page < 3) {
          page++;
          return Promise.resolve({ click: mock(() => Promise.resolve()) });
        }
        return Promise.resolve(null);
      }),
      waitForLoadState: mock(() => Promise.resolve()),
    };

    const result = await paginate(
      {
        selector: '.next',
        max_pages: 5,
        fields: [{ name: 'title', selector: 'h2' }],
        itemSelector: '.item',
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('2 page(s)');
  });
});
