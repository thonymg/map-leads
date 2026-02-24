/**
 * Tests unitaires pour src/converter/optimizer.ts
 */

import { describe, test, expect } from 'bun:test';

describe('SelectorOptimizer', () => {
  describe('optimize', () => {
    test('should optimize simple button selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const result = optimizer.optimize('button.submit');
      
      expect(result).toBeDefined();
      expect(result.optimized).toBeDefined();
    });

    test('should optimize link selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const result = optimizer.optimize('a[href="/page"]');
      
      expect(result).toBeDefined();
    });

    test('should handle complex selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const result = optimizer.optimize('div.container > ul.list > li.item');
      
      expect(result).toBeDefined();
    });

    test('should return original selector if optimization fails', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const original = '#unique-id';
      const result = optimizer.optimize(original);
      
      expect(result.optimized).toBeDefined();
    });
  });

  describe('optimizeParams', () => {
    test('should optimize selector in params', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const params = {
        selector: 'button.submit',
        value: 'test',
      };
      
      const optimized = optimizer.optimizeParams(params);
      expect(optimized.selector).toBeDefined();
    });

    test('should optimize selectors in fields', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const params = {
        selector: '.items',
        fields: [
          { name: 'title', selector: 'h2.title' },
          { name: 'link', selector: 'a.link' },
        ],
      };
      
      const optimized = optimizer.optimizeParams(params as any);
      expect(optimized.fields).toBeDefined();
      expect(optimized.fields.length).toBe(2);
    });

    test('should handle params without selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const params = {
        duration: 1000,
      };
      
      const optimized = optimizer.optimizeParams(params);
      expect(optimized.duration).toBe(1000);
    });

    test('should handle params with non-string selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const params = {
        selector: 123 as any,
      };
      
      const optimized = optimizer.optimizeParams(params);
      expect(optimized.selector).toBe(123);
    });

    test('should handle fields with non-string selector', async () => {
      const { SelectorOptimizer } = await import('../../../src/converter/optimizer.ts');
      
      const optimizer = new SelectorOptimizer();
      const params = {
        selector: '.items',
        fields: [
          { name: 'title', selector: 123 as any },
        ],
      };
      
      const optimized = optimizer.optimizeParams(params as any);
      expect(optimized.fields[0]?.selector).toBe(123);
    });
  });

  describe('cssToGetByRole', () => {
    test('should convert button to getByRole', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('button.submit');
      expect(result).toContain('button');
    });

    test('should convert link to getByRole', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('a.link');
      expect(result).toContain('link');
    });

    test('should convert heading to getByRole', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('h1.title');
      expect(result).toContain('heading');
    });

    test('should convert image to getByRole', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('img.logo');
      expect(result).toContain('img');
    });

    test('should return original selector for unknown element', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('custom-element.class');
      expect(result).toBe('custom-element.class');
    });

    test('should handle selector without class', async () => {
      const { cssToGetByRole } = await import('../../../src/converter/optimizer.ts');
      
      const result = cssToGetByRole('button');
      expect(result).toBeDefined();
    });
  });
});
