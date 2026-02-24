/**
 * Tests unitaires pour src/session.ts
 * Couverture: sauvegarde, chargement, validation de session
 */

import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_SESSIONS_DIR = join(process.cwd(), 'tests', 'fixtures', 'session-tests');

describe('Session', () => {
  beforeEach(() => {
    if (!existsSync(TEST_SESSIONS_DIR)) {
      mkdirSync(TEST_SESSIONS_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_SESSIONS_DIR)) {
      rmSync(TEST_SESSIONS_DIR, { recursive: true });
    }
  });

  describe('SessionManager', () => {
    test('should create session manager', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const manager = new SessionManager(TEST_SESSIONS_DIR);
      expect(manager).toBeDefined();
    });

    test('should create sessions directory if not exists', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const newDir = join(TEST_SESSIONS_DIR, 'new-sessions');
      expect(existsSync(newDir)).toBe(false);
      
      new SessionManager(newDir);
      expect(existsSync(newDir)).toBe(true);
    });

    test('should save session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [
            {
              origin: 'https://example.com',
              localStorage: [
                { name: 'token', value: 'xyz789' },
              ],
            },
          ],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const filePath = await manager.saveSession(mockContext as any, 'test-session');

      expect(filePath).toContain('test-session.json');
      expect(existsSync(filePath)).toBe(true);
    });

    test('should load session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      // First save a session
      const mockContextSave = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.saveSession(mockContextSave as any, 'test-load');

      // Then load it
      const mockContextLoad = {
        addCookies: mock(() => Promise.resolve()),
        newPage: mock(() => ({
          goto: mock(() => Promise.resolve()),
          evaluate: mock(() => Promise.resolve()),
          close: mock(() => Promise.resolve()),
        })),
      };

      const loaded = await manager.loadSession(mockContextLoad as any, 'test-load');
      expect(loaded).toBe(true);
    });

    test('should return false when loading non-existent session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        addCookies: mock(),
        newPage: mock(),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const loaded = await manager.loadSession(mockContext as any, 'non-existent');

      expect(loaded).toBe(false);
    });

    test('should return false when loading expired session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      const { writeFileSync } = await import('fs');
      
      // Create an expired session file
      const expiredSession = {
        cookies: [],
        origins: [],
        savedAt: new Date(Date.now() - 100000000).toISOString(),
        expiresAt: new Date(Date.now() - 10000).toISOString(),
      };
      
      writeFileSync(
        join(TEST_SESSIONS_DIR, 'expired.json'),
        JSON.stringify(expiredSession)
      );

      const mockContext = {
        addCookies: mock(),
        newPage: mock(),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const loaded = await manager.loadSession(mockContext as any, 'expired');

      expect(loaded).toBe(false);
    });

    test('should check valid session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.saveSession(mockContext as any, 'valid-session');

      const isValid = manager.hasValidSession('valid-session');
      expect(isValid).toBe(true);
    });

    test('should return false for non-existent session check', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const isValid = manager.hasValidSession('non-existent');

      expect(isValid).toBe(false);
    });

    test('should return false for expired session check', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      const { writeFileSync } = await import('fs');
      
      const expiredSession = {
        cookies: [{ name: 'test', value: 'val', domain: 'example.com', path: '/' }],
        origins: [],
        savedAt: new Date(Date.now() - 100000000).toISOString(),
        expiresAt: new Date(Date.now() - 10000).toISOString(),
      };
      
      writeFileSync(
        join(TEST_SESSIONS_DIR, 'expired-check.json'),
        JSON.stringify(expiredSession)
      );

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const isValid = manager.hasValidSession('expired-check');

      expect(isValid).toBe(false);
    });

    test('should return false for session with empty cookies', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      const { writeFileSync } = await import('fs');
      
      const emptySession = {
        cookies: [],
        origins: [],
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 100000000).toISOString(),
      };
      
      writeFileSync(
        join(TEST_SESSIONS_DIR, 'empty-cookies.json'),
        JSON.stringify(emptySession)
      );

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const isValid = manager.hasValidSession('empty-cookies');

      expect(isValid).toBe(false);
    });

    test('should delete session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.saveSession(mockContext as any, 'to-delete');

      const deleted = manager.deleteSession('to-delete');
      expect(deleted).toBe(true);
      expect(existsSync(join(TEST_SESSIONS_DIR, 'to-delete.json'))).toBe(false);
    });

    test('should return false when deleting non-existent session', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const deleted = manager.deleteSession('non-existent');

      expect(deleted).toBe(false);
    });

    test('should list sessions', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.saveSession(mockContext as any, 'session-1');
      await manager.saveSession(mockContext as any, 'session-2');

      const sessions = manager.listSessions();
      expect(sessions).toContain('session-1');
      expect(sessions).toContain('session-2');
    });

    test('should return empty array when listing from non-existent directory', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const manager = new SessionManager('/non-existent-dir');
      const sessions = manager.listSessions();

      expect(sessions).toEqual([]);
    });

    test('should list files', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'session', value: 'abc123', domain: 'example.com', path: '/' },
        ])),
        storageState: mock(() => Promise.resolve({
          cookies: [],
          origins: [],
        })),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.saveSession(mockContext as any, 'file-test');

      const files = manager.listFiles();
      expect(files).toContain('file-test');
    });

    test('should cleanup expired sessions', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      const { writeFileSync } = await import('fs');
      
      // Create an expired session
      const expiredSession = {
        cookies: [{ name: 'test', value: 'val', domain: 'example.com', path: '/' }],
        origins: [],
        savedAt: new Date(Date.now() - 100000000).toISOString(),
        expiresAt: new Date(Date.now() - 10000).toISOString(),
      };
      
      writeFileSync(
        join(TEST_SESSIONS_DIR, 'expired-cleanup.json'),
        JSON.stringify(expiredSession)
      );

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const cleaned = manager.cleanupExpiredSessions();

      expect(cleaned).toBeGreaterThanOrEqual(1);
      expect(existsSync(join(TEST_SESSIONS_DIR, 'expired-cleanup.json'))).toBe(false);
    });

    test('should export cookies', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.resolve([
          { name: 'test', value: 'val', domain: 'example.com', path: '/' },
        ])),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      const outputFile = join(TEST_SESSIONS_DIR, 'cookies.json');
      await manager.exportCookies(mockContext as any, outputFile);

      expect(existsSync(outputFile)).toBe(true);
    });

    test('should import cookies', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      const { writeFileSync } = await import('fs');
      
      const cookies = [
        { name: 'test', value: 'val', domain: 'example.com', path: '/' },
      ];
      const inputFile = join(TEST_SESSIONS_DIR, 'import-cookies.json');
      writeFileSync(inputFile, JSON.stringify(cookies));

      const mockContext = {
        addCookies: mock(() => Promise.resolve()),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await manager.importCookies(mockContext as any, inputFile);

      expect(mockContext.addCookies).toHaveBeenCalledWith(cookies);
    });

    test('should throw when importing from non-existent file', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        addCookies: mock(),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await expect(
        manager.importCookies(mockContext as any, '/non-existent-file.json')
      ).rejects.toThrow();
    });

    test('should handle save session error', async () => {
      const { SessionManager } = await import('../../src/session.ts');
      
      const mockContext = {
        cookies: mock(() => Promise.reject(new Error('Cookie error'))),
        storageState: mock(),
      };

      const manager = new SessionManager(TEST_SESSIONS_DIR);
      await expect(
        manager.saveSession(mockContext as any, 'error-test')
      ).rejects.toThrow();
    });
  });

  describe('getSessionManager', () => {
    test('should return singleton instance', async () => {
      const { getSessionManager } = await import('../../src/session.ts');
      
      const manager1 = getSessionManager(TEST_SESSIONS_DIR);
      const manager2 = getSessionManager(TEST_SESSIONS_DIR);

      expect(manager1).toBe(manager2);
    });

    test('should create instance with custom params', async () => {
      const { getSessionManager } = await import('../../src/session.ts');
      
      // Clear singleton first by creating new manager
      const manager = getSessionManager(TEST_SESSIONS_DIR, 3600);
      expect(manager).toBeDefined();
    });
  });
});
