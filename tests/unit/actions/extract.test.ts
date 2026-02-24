/**
 * Tests unitaires pour src/actions/extract.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Extract Action', () => {
  test('should extract data successfully', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        // Simulate extraction
        return Promise.resolve([
          { title: 'Item 1', price: '$10' },
          { title: 'Item 2', price: '$20' },
        ]);
      }),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [
          { name: 'title', selector: 'h2' },
          { name: 'price', selector: '.price' },
        ],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('2 élément(s) extrait(s)');
    expect(result.data).toHaveLength(2);
    expect(result.data?.[0]?.title).toBe('Item 1');
  });

  test('should extract with attribute', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        return Promise.resolve([
          { href: 'https://example.com/link1' },
          { href: 'https://example.com/link2' },
        ]);
      }),
    };

    const result = await extract(
      {
        selector: 'a',
        fields: [{ name: 'href', selector: 'a', attribute: 'href' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.data?.[0]?.href).toBe('https://example.com/link1');
  });

  test('should handle null for missing element', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        return Promise.resolve([
          { title: null },
        ]);
      }),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.data?.[0]?.title).toBeNull();
  });

  test('should handle empty results', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        return Promise.resolve([]);
      }),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('0 élément(s)');
    expect(result.data).toEqual([]);
  });

  test('should handle extraction error', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock(() => Promise.reject(new Error('Selector not found'))),
    };

    const result = await extract(
      {
        selector: '.nonexistent',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de l\'extraction');
    expect(result.message).toContain('Selector not found');
  });

  test('should handle unknown error', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock(() => Promise.reject('string error')),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [{ name: 'title', selector: 'h2' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec de l\'extraction');
  });

  test('should extract text content by default', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        return Promise.resolve([
          { text: 'Some text content' },
        ]);
      }),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [{ name: 'text', selector: 'p' }],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.data?.[0]?.text).toBe('Some text content');
  });

  test('should handle multiple fields', async () => {
    const { extract } = await import('../../../src/actions/extract.ts');
    
    const mockPage = {
      evaluate: mock((fn, args) => {
        return Promise.resolve([
          { title: 'Title', description: 'Desc', price: '$10', link: '/item' },
        ]);
      }),
    };

    const result = await extract(
      {
        selector: '.item',
        fields: [
          { name: 'title', selector: 'h2' },
          { name: 'description', selector: 'p' },
          { name: 'price', selector: '.price' },
          { name: 'link', selector: 'a', attribute: 'href' },
        ],
      },
      mockPage as any
    );

    expect(result.success).toBe(true);
    expect(result.data?.[0]).toHaveProperty('title');
    expect(result.data?.[0]).toHaveProperty('description');
    expect(result.data?.[0]).toHaveProperty('price');
    expect(result.data?.[0]).toHaveProperty('link');
  });
});
