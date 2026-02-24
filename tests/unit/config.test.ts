/**
 * Tests unitaires pour src/config.ts
 * Couverture: validation, chargement, application des défauts
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  loadConfig,
  applyDefaults,
  validateConfig,
  ConfigValidationError,
  ConfigLoadError,
  loadYamlFile,
} from '../../src/config.ts';
import type { ScraperConfig } from '../../src/types.ts';

const TEST_DIR = join(process.cwd(), 'tests', 'fixtures', 'config-tests');
const TEST_CONFIG_FILE = join(TEST_DIR, 'test-config.yaml');

describe('Config', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_CONFIG_FILE)) {
      rmSync(TEST_CONFIG_FILE);
    }
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('ConfigValidationError', () => {
    test('should create error with path and expected', () => {
      const error = new ConfigValidationError('Test error', 'root.scraper', 'expected value');
      expect(error.message).toBe('Test error');
      expect(error.path).toBe('root.scraper');
      expect(error.expected).toBe('expected value');
      expect(error.name).toBe('ConfigValidationError');
    });

    test('should create error without expected', () => {
      const error = new ConfigValidationError('Test error', 'root');
      expect(error.message).toBe('Test error');
      expect(error.path).toBe('root');
      expect(error.expected).toBeUndefined();
    });

    test('toString should include name, message and path', () => {
      const error = new ConfigValidationError('Test error', 'root.scraper');
      expect(error.toString()).toBe('ConfigValidationError: Test error (root.scraper)');
    });
  });

  describe('ConfigLoadError', () => {
    test('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new ConfigLoadError('Load failed', cause);
      expect(error.message).toBe('Load failed');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ConfigLoadError');
    });

    test('should create error without cause', () => {
      const error = new ConfigLoadError('Load failed');
      expect(error.message).toBe('Load failed');
      expect(error.cause).toBeUndefined();
    });

    test('toString should include name and message', () => {
      const error = new ConfigLoadError('Load failed');
      expect(error.toString()).toBe('ConfigLoadError: Load failed');
    });
  });

  describe('loadYamlFile', () => {
    test('should load valid YAML file', async () => {
      const yamlContent = `
name: test-scraper
url: https://example.com
steps:
  - action: navigate
    params:
      url: https://example.com
`;
      writeFileSync(TEST_CONFIG_FILE, yamlContent);
      const result = await loadYamlFile<Record<string, unknown>>(TEST_CONFIG_FILE);
      expect(result.name).toBe('test-scraper');
      expect(result.url).toBe('https://example.com');
    });

    test('should throw ConfigLoadError for non-existent file', async () => {
      await expect(loadYamlFile('/non-existent-file.yaml')).rejects.toThrow(ConfigLoadError);
    });

    test('should throw ConfigLoadError for invalid YAML', async () => {
      const invalidYaml = `
name: test
  invalid: indentation
    broken: yaml
`;
      writeFileSync(TEST_CONFIG_FILE, invalidYaml);
      await expect(loadYamlFile<Record<string, unknown>>(TEST_CONFIG_FILE)).rejects.toThrow(
        ConfigLoadError
      );
    });
  });

  describe('validateConfig', () => {
    test('should validate minimal valid config', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should validate full config with all options', () => {
      const config = {
        concurrency: 3,
        output_dir: './output',
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            headless: true,
            viewport: { width: 1920, height: 1080 },
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com', timeout: 30000 },
              },
              {
                action: 'wait' as const,
                params: { selector: '.content', timeout: 10000 },
              },
              {
                action: 'click' as const,
                params: { selector: 'button' },
              },
              {
                action: 'fill' as const,
                params: { selector: 'input', value: 'test' },
              },
              {
                action: 'extract' as const,
                params: {
                  selector: '.item',
                  fields: [{ name: 'title', selector: 'h2' }],
                },
              },
              {
                action: 'paginate' as const,
                params: {
                  selector: '.next',
                  max_pages: 5,
                  fields: [{ name: 'title', selector: 'h2' }],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should throw for non-object config', () => {
      expect(() => validateConfig(null)).toThrow(ConfigValidationError);
      expect(() => validateConfig('string')).toThrow(ConfigValidationError);
      expect(() => validateConfig(123)).toThrow(ConfigValidationError);
    });

    test('should throw for missing scrapers', () => {
      const config = {} as Record<string, unknown>;
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Champ obligatoire manquant');
    });

    test('should throw for empty scrapers array', () => {
      const config = { scrapers: [] };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for invalid concurrency', () => {
      const config = {
        concurrency: 0,
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for scraper missing name', () => {
      const config = {
        scrapers: [
          {
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for scraper missing url', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for scraper missing steps', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for empty steps', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for invalid action type', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'invalid-action',
                params: {},
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow('Action invalide');
    });

    test('should throw for navigate missing url', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: {},
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for wait missing selector and duration', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'wait' as const,
                params: {},
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for click missing selector', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'click' as const,
                params: {},
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for fill missing selector', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'fill' as const,
                params: { value: 'test' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for fill missing value', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'fill' as const,
                params: { selector: 'input' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for extract missing selector', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'extract' as const,
                params: {
                  fields: [{ name: 'title', selector: 'h2' }],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for extract missing fields', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'extract' as const,
                params: { selector: '.item' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for extract empty fields', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'extract' as const,
                params: {
                  selector: '.item',
                  fields: [],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for extract field missing name', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'extract' as const,
                params: {
                  selector: '.item',
                  fields: [{ selector: 'h2' }],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for extract field missing selector', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'extract' as const,
                params: {
                  selector: '.item',
                  fields: [{ name: 'title' }],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for paginate missing selector', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'paginate' as const,
                params: {
                  fields: [{ name: 'title', selector: 'h2' }],
                },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for step missing params', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for invalid headless type', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            headless: 'true',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for invalid viewport', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            viewport: '1920x1080',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for viewport missing width', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            viewport: { height: 1080 },
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    test('should throw for viewport missing height', () => {
      const config = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            viewport: { width: 1920 },
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });
  });

  describe('loadConfig', () => {
    test('should load and validate config file', async () => {
      const yamlContent = `
scrapers:
  - name: test
    url: https://example.com
    steps:
      - action: navigate
        params:
          url: https://example.com
`;
      writeFileSync(TEST_CONFIG_FILE, yamlContent);
      const config = await loadConfig(TEST_CONFIG_FILE);
      expect(config.scrapers).toHaveLength(1);
      expect(config.scrapers[0]?.name).toBe('test');
    });
  });

  describe('applyDefaults', () => {
    test('should apply default concurrency', () => {
      const config: ScraperConfig = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.concurrency).toBe(5);
    });

    test('should apply default output_dir', () => {
      const config: ScraperConfig = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.output_dir).toBe('./results');
    });

    test('should apply default headless', () => {
      const config: ScraperConfig = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.scrapers[0]?.headless).toBe(true);
    });

    test('should apply default viewport', () => {
      const config: ScraperConfig = {
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.scrapers[0]?.viewport).toEqual({ width: 1920, height: 1080 });
    });

    test('should preserve existing values', () => {
      const config: ScraperConfig = {
        concurrency: 10,
        output_dir: './custom-output',
        scrapers: [
          {
            name: 'test',
            url: 'https://example.com',
            headless: false,
            viewport: { width: 800, height: 600 },
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.concurrency).toBe(10);
      expect(result.output_dir).toBe('./custom-output');
      expect(result.scrapers[0]?.headless).toBe(false);
      expect(result.scrapers[0]?.viewport).toEqual({ width: 800, height: 600 });
    });

    test('should apply defaults to multiple scrapers', () => {
      const config: ScraperConfig = {
        scrapers: [
          {
            name: 'test1',
            url: 'https://example1.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example1.com' },
              },
            ],
          },
          {
            name: 'test2',
            url: 'https://example2.com',
            steps: [
              {
                action: 'navigate' as const,
                params: { url: 'https://example2.com' },
              },
            ],
          },
        ],
      };
      const result = applyDefaults(config);
      expect(result.scrapers).toHaveLength(2);
      result.scrapers.forEach(scraper => {
        expect(scraper.headless).toBe(true);
        expect(scraper.viewport).toEqual({ width: 1920, height: 1080 });
      });
    });
  });
});
