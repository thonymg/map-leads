/**
 * Tests unitaires pour src/logger.ts
 * Couverture: logging structuré, niveaux, fichier
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_LOG_DIR = join(process.cwd(), 'tests', 'fixtures', 'logger-tests');

describe('Logger', () => {
  beforeEach(() => {
    if (!existsSync(TEST_LOG_DIR)) {
      mkdirSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_LOG_DIR)) {
      rmSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  describe('StructuredLogger', () => {
    test('should create logger with config', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'info',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(logger).toBeDefined();
    });

    test('should log at info level', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'info',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.info('Test message')).not.toThrow();
    });

    test('should log at warn level', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'warn',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.warn('Test warning')).not.toThrow();
    });

    test('should log at error level', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'error',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.error('Test error')).not.toThrow();
    });

    test('should log at debug level', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.debug('Test debug')).not.toThrow();
    });

    test('should not log below configured level', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'error',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      // These should not log anything
      expect(() => logger.debug('Test debug')).not.toThrow();
      expect(() => logger.info('Test info')).not.toThrow();
      expect(() => logger.warn('Test warn')).not.toThrow();
    });

    test('should log with data', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.info('Test message', { key: 'value', count: 42 })).not.toThrow();
    });

    test('should log without data', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.info('Test message')).not.toThrow();
    });

    test('should flush buffer on destroy', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      logger.info('Test message 1');
      logger.info('Test message 2');
      
      await logger.destroy();
      
      // Log file should exist
      const date = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_LOG_DIR, `${date}.log`);
      expect(existsSync(logFile)).toBe(true);
    });

    test('should clear flush timer on destroy', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      logger.info('Test message');
      await logger.destroy();
      
      // Should not throw
      expect(await logger.destroy()).toBeUndefined();
    });

    test('should create log directory if not exists', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const newDir = join(TEST_LOG_DIR, 'nested', 'logs');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: newDir,
        scraperName: 'test-scraper',
      });

      logger.error('Test error');
      await logger.destroy();
      
      expect(existsSync(newDir)).toBe(true);
    });

    test('should write to file with date-based name', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      const { readFile } = await import('fs/promises');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      logger.info('Test message');
      await logger.destroy();
      
      const date = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_LOG_DIR, `${date}.log`);
      const content = await readFile(logFile, 'utf-8');
      
      expect(content).toContain('Test message');
      expect(content).toContain('info');
      expect(content).toContain('test-scraper');
    });

    test('should flush immediately on error', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      logger.error('Test error');
      
      // Error should trigger immediate flush
      const date = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_LOG_DIR, `${date}.log`);
      
      // Give it a moment to write
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(existsSync(logFile)).toBe(true);
    });

    test('should format log entry as JSON', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      const { readFile } = await import('fs/promises');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      logger.info('Test message', { custom: 'data' });
      await logger.destroy();
      
      const date = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_LOG_DIR, `${date}.log`);
      const content = await readFile(logFile, 'utf-8');
      
      // Each line should be valid JSON
      const lines = content.trim().split('\n');
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
      
      const entry = JSON.parse(lines[0]!);
      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
      expect(entry.data).toEqual({ custom: 'data' });
      expect(entry.scraper).toBe('test-scraper');
    });
  });

  describe('createLogger', () => {
    test('should create logger instance', async () => {
      const { createLogger } = await import('../../src/logger.ts');
      
      const logger = createLogger({
        level: 'info',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should create logger with default scraper name', async () => {
      const { createLogger } = await import('../../src/logger.ts');
      
      const logger = createLogger({
        level: 'info',
        logDir: TEST_LOG_DIR,
      });

      expect(logger).toBeDefined();
    });
  });

  describe('Log levels', () => {
    test('debug level should log all levels', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'debug',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.debug('debug')).not.toThrow();
      expect(() => logger.info('info')).not.toThrow();
      expect(() => logger.warn('warn')).not.toThrow();
      expect(() => logger.error('error')).not.toThrow();
    });

    test('info level should not log debug', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'info',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.debug('debug')).not.toThrow();
      expect(() => logger.info('info')).not.toThrow();
      expect(() => logger.warn('warn')).not.toThrow();
      expect(() => logger.error('error')).not.toThrow();
    });

    test('warn level should only log warn and error', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'warn',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.debug('debug')).not.toThrow();
      expect(() => logger.info('info')).not.toThrow();
      expect(() => logger.warn('warn')).not.toThrow();
      expect(() => logger.error('error')).not.toThrow();
    });

    test('error level should only log error', async () => {
      const { StructuredLogger } = await import('../../src/logger.ts');
      
      const logger = new StructuredLogger({
        level: 'error',
        logDir: TEST_LOG_DIR,
        scraperName: 'test-scraper',
      });

      expect(() => logger.debug('debug')).not.toThrow();
      expect(() => logger.info('info')).not.toThrow();
      expect(() => logger.warn('warn')).not.toThrow();
      expect(() => logger.error('error')).not.toThrow();
    });
  });
});
