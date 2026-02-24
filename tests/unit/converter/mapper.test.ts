/**
 * Tests unitaires pour src/converter/mapper.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('ActionMapper', () => {
  describe('mapStatements', () => {
    test('should map navigate statement', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0]?.action).toBe('navigate');
      }
    });

    test('should map wait statement', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.waitForSelector('.content');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0]?.action).toBe('wait');
      }
    });

    test('should map click statement', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0]?.action).toBe('click');
      }
    });

    test('should map fill statement', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.fill('input', 'value');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0]?.action).toBe('fill');
      }
    });

    test('should map multiple statements', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
          await page.waitForSelector('.content');
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps.length).toBeGreaterThanOrEqual(3);
      }
    });

    test('should handle empty statements', async () => {
      const { ActionMapper, PlaywrightCodeParser } = await import('../../../src/converter/mapper.ts');
      
      const code = `
        test('example', async ({ page }) => {});
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const mapper = new ActionMapper(parser);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        const steps = mapper.mapStatements(statements);
        
        expect(steps).toEqual([]);
      }
    });
  });
});

describe('generateScraperName', () => {
  test('should generate name from filename', async () => {
    const { generateScraperName } = await import('../../../src/converter/mapper.ts');
    
    const name = generateScraperName('recording.ts');
    expect(name).toBe('recording');
  });

  test('should handle complex filenames', async () => {
    const { generateScraperName } = await import('../../../src/converter/mapper.ts');
    
    const name = generateScraperName('my-test-recording.ts');
    expect(name).toBe('my-test-recording');
  });

  test('should handle js files', async () => {
    const { generateScraperName } = await import('../../../src/converter/mapper.ts');
    
    const name = generateScraperName('recording.js');
    expect(name).toBe('recording');
  });
});

describe('extractBaseUrl', () => {
  test('should extract base URL from navigate step', async () => {
    const { extractBaseUrl } = await import('../../../src/converter/mapper.ts');
    
    const steps = [
      {
        action: 'navigate',
        params: {
          url: 'https://example.com/page/subpage',
        },
      },
    ];
    
    const baseUrl = extractBaseUrl(steps as any);
    expect(baseUrl).toBe('https://example.com/');
  });

  test('should return default URL when no navigate step', async () => {
    const { extractBaseUrl } = await import('../../../src/converter/mapper.ts');
    
    const steps = [
      {
        action: 'wait',
        params: {
          selector: '.content',
        },
      },
    ];
    
    const baseUrl = extractBaseUrl(steps as any);
    expect(baseUrl).toBe('https://example.com');
  });

  test('should handle invalid URL', async () => {
    const { extractBaseUrl } = await import('../../../src/converter/mapper.ts');
    
    const steps = [
      {
        action: 'navigate',
        params: {
          url: 'not-a-valid-url',
        },
      },
    ];
    
    const baseUrl = extractBaseUrl(steps as any);
    expect(baseUrl).toBe('not-a-valid-url');
  });
});
