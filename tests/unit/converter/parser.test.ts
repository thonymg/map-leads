/**
 * Tests unitaires pour src/converter/parser.ts
 */

import { describe, test, expect } from 'bun:test';

describe('PlaywrightCodeParser', () => {
  describe('extractTestFunction', () => {
    test('should extract test function from code', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        import { test, expect } from '@playwright/test';
        
        test('example test', async ({ page }) => {
          await page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });

    test('should extract arrow function test', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });

    test('should return null when no test function found', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        const x = 1;
        console.log('hello');
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).toBeNull();
    });

    test('should extract function declaration test', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        async function test({ page }) {
          await page.goto('https://example.com');
        }
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });
  });

  describe('extractStatements', () => {
    test('should extract statements from function body', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        expect(statements.length).toBeGreaterThan(0);
      }
    });

    test('should return empty array for null body', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {});
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        expect(statements).toEqual([]);
      }
    });
  });

  describe('isPageGotoCall', () => {
    test('should detect await page.goto()', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        expect(statements.length).toBeGreaterThan(0);
        if (statements[0]) {
          const isGoto = parser.isPageGotoCall(statements[0]);
          expect(isGoto).toBe(true);
        }
      }
    });

    test('should detect page.goto() without await', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        if (statements[0]) {
          const isGoto = parser.isPageGotoCall(statements[0]);
          expect(isGoto).toBe(true);
        }
      }
    });

    test('should return false for non-goto statement', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        if (statements[0]) {
          const isGoto = parser.isPageGotoCall(statements[0]);
          expect(isGoto).toBe(false);
        }
      }
    });
  });

  describe('extractUrlFromGoto', () => {
    test('should extract URL from page.goto()', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.goto('https://example.com');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        if (statements[0]) {
          const url = parser.extractUrlFromGoto(statements[0]);
          expect(url).toBe('https://example.com');
        }
      }
    });

    test('should return null for non-goto statement', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
      if (testFn) {
        const statements = parser.extractStatements(testFn);
        if (statements[0]) {
          const url = parser.extractUrlFromGoto(statements[0]);
          expect(url).toBeNull();
        }
      }
    });
  });

  describe('isLocatorCall', () => {
    test('should detect locator call', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.locator('.button').click();
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });

    test('should detect getByRole call', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.getByRole('button').click();
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });
  });

  describe('isClickCall', () => {
    test('should detect click call', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.click('button');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });
  });

  describe('isFillCall', () => {
    test('should detect fill call', async () => {
      const { PlaywrightCodeParser } = await import('../../../src/converter/parser.ts');
      
      const code = `
        test('example', async ({ page }) => {
          await page.fill('input', 'value');
        });
      `;
      
      const parser = new PlaywrightCodeParser(code);
      const testFn = parser.extractTestFunction();
      
      expect(testFn).not.toBeNull();
    });
  });
});
