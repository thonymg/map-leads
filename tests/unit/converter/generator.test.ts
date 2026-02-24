/**
 * Tests unitaires pour src/converter/generator.ts
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_OUTPUT_FILE = join(process.cwd(), 'tests', 'fixtures', 'converter-tests', 'test-output.yaml');

describe('YamlGenerator', () => {
  beforeEach(() => {
    const { mkdirSync } = require('fs');
    const dir = join(TEST_OUTPUT_FILE, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_OUTPUT_FILE)) {
      rmSync(TEST_OUTPUT_FILE);
    }
  });

  describe('generate', () => {
    test('should generate YAML from config', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'test-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'navigate',
            params: {
              url: 'https://example.com',
            },
          },
          {
            action: 'wait',
            params: {
              selector: '.content',
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const yaml = generator.generate(config);

      expect(yaml).toContain('name: test-scraper');
      expect(yaml).toContain('url: https://example.com');
      expect(yaml).toContain('headless: true');
      expect(yaml).toContain('navigate');
      expect(yaml).toContain('wait');
    });

    test('should generate YAML with extract step', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'extract-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'extract',
            params: {
              selector: '.item',
              fields: [
                { name: 'title', selector: 'h2' },
                { name: 'price', selector: '.price' },
              ],
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const yaml = generator.generate(config);

      expect(yaml).toContain('extract');
      expect(yaml).toContain('fields');
      expect(yaml).toContain('title');
      expect(yaml).toContain('price');
    });

    test('should generate YAML with paginate step', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'paginate-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'paginate',
            params: {
              selector: '.next',
              max_pages: 5,
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const yaml = generator.generate(config);

      expect(yaml).toContain('paginate');
      expect(yaml).toContain('max_pages');
    });

    test('should generate YAML with fill step', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'fill-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'fill',
            params: {
              selector: 'input[name="search"]',
              value: 'test query',
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const yaml = generator.generate(config);

      expect(yaml).toContain('fill');
      expect(yaml).toContain('value');
    });

    test('should generate YAML with click step', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'click-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'click',
            params: {
              selector: 'button.submit',
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const yaml = generator.generate(config);

      expect(yaml).toContain('click');
      expect(yaml).toContain('selector');
    });
  });

  describe('saveToFile', () => {
    test('should save YAML to file', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'test-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [
          {
            action: 'navigate',
            params: {
              url: 'https://example.com',
            },
          },
        ],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      generator.saveToFile(config, TEST_OUTPUT_FILE);

      expect(existsSync(TEST_OUTPUT_FILE)).toBe(true);
    });

    test('should create directory if not exists', async () => {
      const { YamlGenerator } = await import('../../../src/converter/generator.ts');
      
      const generator = new YamlGenerator();
      const config = {
        name: 'test-scraper',
        url: 'https://example.com',
        headless: true,
        viewport: {
          width: 1920,
          height: 1080,
        },
        steps: [],
        metadata: {
          recordedAt: '2026-02-24T10:00:00.000Z',
          playwrightVersion: '1.58.2',
          optimizerVersion: '1.0.0',
        },
      };

      const nestedPath = join(TEST_OUTPUT_FILE, '..', 'nested', 'dir', 'output.yaml');
      generator.saveToFile(config, nestedPath);

      expect(existsSync(nestedPath)).toBe(true);
      
      // Cleanup
      rmSync(nestedPath);
      rmSync(join(nestedPath, '..', '..'), { recursive: true });
    });
  });
});
