/**
 * Tests unitaires pour src/storage.ts
 * Couverture: sauvegarde, chargement, liste des résultats
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ScraperResult } from '../../src/types.ts';

const TEST_OUTPUT_DIR = join(process.cwd(), 'tests', 'fixtures', 'storage-tests');

describe('Storage', () => {
  beforeEach(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  describe('generateFilename', () => {
    test('should generate filename with timestamp', async () => {
      const { generateFilename } = await import('../../src/storage.ts');
      
      const result: ScraperResult = {
        name: 'test-scraper',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 1,
        recordCount: 10,
        data: [],
        errors: [],
      };

      const filename = generateFilename(result);
      expect(filename).toMatch(/test-scraper-2026-02-24T10-30-00\.json/);
    });

    test('should handle special characters in name', async () => {
      const { generateFilename } = await import('../../src/storage.ts');
      
      const result: ScraperResult = {
        name: 'test-scraper-with-special-chars',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 1,
        recordCount: 10,
        data: [],
        errors: [],
      };

      const filename = generateFilename(result);
      expect(filename).toMatch(/test-scraper-with-special-chars-2026-02-24T10-30-00\.json/);
    });
  });

  describe('saveResult', () => {
    test('should save result to JSON file', async () => {
      const { saveResult } = await import('../../src/storage.ts');
      
      const result: ScraperResult = {
        name: 'test-save',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 1,
        recordCount: 10,
        data: [{ title: 'Test' }],
        errors: [],
      };

      const filePath = await saveResult(result, TEST_OUTPUT_DIR);
      
      expect(filePath).toContain(TEST_OUTPUT_DIR);
      expect(filePath).toEndWith('.json');
      expect(existsSync(filePath)).toBe(true);
    });

    test('should create output directory if it does not exist', async () => {
      const { saveResult } = await import('../../src/storage.ts');
      const newDir = join(TEST_OUTPUT_DIR, 'subdir', 'nested');
      
      const result: ScraperResult = {
        name: 'test-nested',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 1,
        recordCount: 10,
        data: [],
        errors: [],
      };

      const filePath = await saveResult(result, newDir);
      
      expect(existsSync(newDir)).toBe(true);
      expect(existsSync(filePath)).toBe(true);
    });

    test('should save result with proper JSON formatting', async () => {
      const { saveResult } = await import('../../src/storage.ts');
      const { readFile } = await import('fs/promises');
      
      const result: ScraperResult = {
        name: 'test-format',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 2,
        recordCount: 20,
        data: [{ title: 'Item 1' }, { title: 'Item 2' }],
        errors: [],
      };

      const filePath = await saveResult(result, TEST_OUTPUT_DIR);
      const content = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('test-format');
      expect(parsed.recordCount).toBe(20);
      expect(parsed.data).toHaveLength(2);
    });

    test('should save failed result with errors', async () => {
      const { saveResult } = await import('../../src/storage.ts');
      
      const result: ScraperResult = {
        name: 'test-failed',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: false,
        pageCount: 0,
        recordCount: 0,
        data: [],
        errors: [
          {
            step: 0,
            action: 'navigate',
            message: 'Navigation failed',
          },
        ],
      };

      const filePath = await saveResult(result, TEST_OUTPUT_DIR);
      expect(existsSync(filePath)).toBe(true);
    });

    test('should use default output directory', async () => {
      const { saveResult } = await import('../../src/storage.ts');
      
      const result: ScraperResult = {
        name: 'test-default',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 1,
        recordCount: 10,
        data: [],
        errors: [],
      };

      // This will use the default './results' directory
      const filePath = await saveResult(result);
      expect(filePath).toContain('results');
      
      // Cleanup default directory
      if (existsSync('./results')) {
        rmSync('./results', { recursive: true });
      }
    });
  });

  describe('listResults', () => {
    test('should list all JSON files in directory', async () => {
      const { saveResult, listResults } = await import('../../src/storage.ts');
      
      // Create some test files
      await saveResult(
        {
          name: 'result1',
          url: 'https://example1.com',
          startedAt: '2026-02-24T10:00:00.000Z',
          completedAt: '2026-02-24T10:01:00.000Z',
          duration: 60000,
          success: true,
          pageCount: 1,
          recordCount: 10,
          data: [],
          errors: [],
        },
        TEST_OUTPUT_DIR
      );

      await saveResult(
        {
          name: 'result2',
          url: 'https://example2.com',
          startedAt: '2026-02-24T11:00:00.000Z',
          completedAt: '2026-02-24T11:01:00.000Z',
          duration: 60000,
          success: true,
          pageCount: 1,
          recordCount: 20,
          data: [],
          errors: [],
        },
        TEST_OUTPUT_DIR
      );

      const files = await listResults(TEST_OUTPUT_DIR);
      
      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files.every(f => f.endsWith('.json'))).toBe(true);
    });

    test('should return empty array for non-existent directory', async () => {
      const { listResults } = await import('../../src/storage.ts');
      const files = await listResults('/non-existent-directory');
      expect(files).toEqual([]);
    });

    test('should return empty array for empty directory', async () => {
      const { listResults } = await import('../../src/storage.ts');
      const emptyDir = join(TEST_OUTPUT_DIR, 'empty');
      mkdirSync(emptyDir, { recursive: true });
      
      const files = await listResults(emptyDir);
      expect(files).toEqual([]);
    });

    test('should filter only JSON files', async () => {
      const { listResults } = await import('../../src/storage.ts');
      const { writeFile } = await import('fs/promises');
      
      // Create non-JSON files
      await writeFile(join(TEST_OUTPUT_DIR, 'test.txt'), 'content');
      await writeFile(join(TEST_OUTPUT_DIR, 'test.yaml'), 'content');
      await writeFile(join(TEST_OUTPUT_DIR, 'test.json'), '{}');

      const files = await listResults(TEST_OUTPUT_DIR);
      
      expect(files).toContain('test.json');
      expect(files).not.toContain('test.txt');
      expect(files).not.toContain('test.yaml');
    });

    test('should return sorted files', async () => {
      const { listResults } = await import('../../src/storage.ts');
      
      const files = await listResults(TEST_OUTPUT_DIR);
      
      // Check if files are sorted
      const sortedFiles = [...files].sort();
      expect(files).toEqual(sortedFiles);
    });
  });

  describe('loadResult', () => {
    test('should load result from JSON file', async () => {
      const { saveResult, loadResult } = await import('../../src/storage.ts');
      
      const originalResult: ScraperResult = {
        name: 'test-load',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: true,
        pageCount: 3,
        recordCount: 30,
        data: [{ title: 'Test Item' }],
        errors: [],
      };

      const filePath = await saveResult(originalResult, TEST_OUTPUT_DIR);
      const loadedResult = await loadResult(filePath);

      expect(loadedResult.name).toBe('test-load');
      expect(loadedResult.recordCount).toBe(30);
      expect(loadedResult.data).toHaveLength(1);
      expect(loadedResult.success).toBe(true);
    });

    test('should load result with errors', async () => {
      const { saveResult, loadResult } = await import('../../src/storage.ts');
      
      const originalResult: ScraperResult = {
        name: 'test-load-errors',
        url: 'https://example.com',
        startedAt: '2026-02-24T10:30:00.000Z',
        completedAt: '2026-02-24T10:31:00.000Z',
        duration: 60000,
        success: false,
        pageCount: 0,
        recordCount: 0,
        data: [],
        errors: [
          {
            step: 1,
            action: 'click',
            message: 'Element not found',
            stack: 'Error stack trace',
          },
        ],
      };

      const filePath = await saveResult(originalResult, TEST_OUTPUT_DIR);
      const loadedResult = await loadResult(filePath);

      expect(loadedResult.success).toBe(false);
      expect(loadedResult.errors).toHaveLength(1);
      expect(loadedResult.errors[0]?.message).toBe('Element not found');
    });

    test('should throw for non-existent file', async () => {
      const { loadResult } = await import('../../src/storage.ts');
      
      await expect(loadResult('/non-existent-file.json')).rejects.toThrow();
    });

    test('should throw for invalid JSON', async () => {
      const { writeFile } = await import('fs/promises');
      const { loadResult } = await import('../../src/storage.ts');
      
      const invalidFile = join(TEST_OUTPUT_DIR, 'invalid.json');
      await writeFile(invalidFile, 'not valid json');

      await expect(loadResult(invalidFile)).rejects.toThrow();
    });
  });
});
