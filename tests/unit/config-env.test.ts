/**
 * Tests unitaires pour src/config-env.ts
 * Couverture: chargement .env, credentials, interpolation
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_ENV_FILE = join(process.cwd(), '.env.test');

describe('ConfigEnv', () => {
  beforeEach(() => {
    // Clean environment before each test
    delete process.env.LINKEDIN_EMAIL;
    delete process.env.LINKEDIN_PASS;
    delete process.env.LINKEDIN_URL;
    delete process.env.FACEBOOK_EMAIL;
    delete process.env.FACEBOOK_PASS;
    delete process.env.TEST_EMAIL;
    delete process.env.TEST_PASS;
    delete process.env.TEST_URL;
  });

  afterEach(() => {
    if (existsSync(TEST_ENV_FILE)) {
      rmSync(TEST_ENV_FILE);
    }
    // Clean up
    delete process.env.LINKEDIN_EMAIL;
    delete process.env.LINKEDIN_PASS;
    delete process.env.LINKEDIN_URL;
    delete process.env.FACEBOOK_EMAIL;
    delete process.env.FACEBOOK_PASS;
    delete process.env.TEST_EMAIL;
    delete process.env.TEST_PASS;
    delete process.env.TEST_URL;
  });

  describe('loadEnv', () => {
    test('should load .env file when it exists', async () => {
      // Create a test .env file
      const envContent = `
TEST_EMAIL=test@example.com
TEST_PASS=testpassword
TEST_URL=https://test.com
`;
      writeFileSync(join(process.cwd(), '.env'), envContent);
      
      const { loadEnv, getEnvVar } = await import('../../src/config-env.ts');
      loadEnv();
      
      expect(process.env.TEST_EMAIL).toBe('test@example.com');
      expect(process.env.TEST_PASS).toBe('testpassword');
      expect(process.env.TEST_URL).toBe('https://test.com');
      
      // Cleanup
      rmSync(join(process.cwd(), '.env'));
    });
  });

  describe('getCredentials', () => {
    test('should return credentials for domain', async () => {
      process.env.LINKEDIN_EMAIL = 'linkedin@example.com';
      process.env.LINKEDIN_PASS = 'linkedinpass';
      process.env.LINKEDIN_URL = 'https://linkedin.com';

      const { getCredentials } = await import('../../src/config-env.ts');
      const creds = getCredentials('LINKEDIN');

      expect(creds.email).toBe('linkedin@example.com');
      expect(creds.password).toBe('linkedinpass');
      expect(creds.url).toBe('https://linkedin.com');
    });

    test('should handle domain with underscores', async () => {
      process.env.MY_DOMAIN_EMAIL = 'test@example.com';
      process.env.MY_DOMAIN_PASS = 'password';

      const { getCredentials } = await import('../../src/config-env.ts');
      const creds = getCredentials('MY_DOMAIN');

      expect(creds.email).toBe('test@example.com');
      expect(creds.password).toBe('password');
    });

    test('should return undefined for missing credentials', async () => {
      const { getCredentials } = await import('../../src/config-env.ts');
      const creds = getCredentials('NONEXISTENT');

      expect(creds.email).toBeUndefined();
      expect(creds.password).toBeUndefined();
      expect(creds.url).toBeUndefined();
    });

    test('should return partial credentials', async () => {
      process.env.PARTIAL_EMAIL = 'test@example.com';

      const { getCredentials } = await import('../../src/config-env.ts');
      const creds = getCredentials('PARTIAL');

      expect(creds.email).toBe('test@example.com');
      expect(creds.password).toBeUndefined();
      expect(creds.url).toBeUndefined();
    });
  });

  describe('getEnvVar', () => {
    test('should return environment variable', async () => {
      process.env.CUSTOM_VAR = 'custom_value';

      const { getEnvVar } = await import('../../src/config-env.ts');
      const value = getEnvVar('CUSTOM_VAR');

      expect(value).toBe('custom_value');
    });

    test('should return default value when env var is missing', async () => {
      const { getEnvVar } = await import('../../src/config-env.ts');
      const value = getEnvVar('NONEXISTENT_VAR', 'default_value');

      expect(value).toBe('default_value');
    });

    test('should return undefined when env var is missing and no default', async () => {
      const { getEnvVar } = await import('../../src/config-env.ts');
      const value = getEnvVar('NONEXISTENT_VAR');

      expect(value).toBeUndefined();
    });
  });

  describe('hasCredentials', () => {
    test('should return true when credentials exist', async () => {
      process.env.COMPLETE_EMAIL = 'test@example.com';
      process.env.COMPLETE_PASS = 'password';

      const { hasCredentials } = await import('../../src/config-env.ts');
      const has = hasCredentials('COMPLETE');

      expect(has).toBe(true);
    });

    test('should return false when email is missing', async () => {
      process.env.INCOMPLETE_PASS = 'password';

      const { hasCredentials } = await import('../../src/config-env.ts');
      const has = hasCredentials('INCOMPLETE');

      expect(has).toBe(false);
    });

    test('should return false when password is missing', async () => {
      process.env.INCOMPLETE2_EMAIL = 'test@example.com';

      const { hasCredentials } = await import('../../src/config-env.ts');
      const has = hasCredentials('INCOMPLETE2');

      expect(has).toBe(false);
    });

    test('should return false when both are missing', async () => {
      const { hasCredentials } = await import('../../src/config-env.ts');
      const has = hasCredentials('NONEXISTENT');

      expect(has).toBe(false);
    });
  });

  describe('listConfiguredDomains', () => {
    test('should return list of configured domains', async () => {
      process.env.DOMAIN1_EMAIL = 'test1@example.com';
      process.env.DOMAIN1_PASS = 'pass1';
      process.env.DOMAIN2_EMAIL = 'test2@example.com';
      process.env.DOMAIN2_PASS = 'pass2';
      process.env.DOMAIN2_URL = 'https://domain2.com';
      process.env.OTHER_VAR = 'value';

      const { listConfiguredDomains } = await import('../../src/config-env.ts');
      const domains = listConfiguredDomains();

      expect(domains).toContain('DOMAIN1');
      expect(domains).toContain('DOMAIN2');
      expect(domains).not.toContain('OTHER');
    });

    test('should return empty array when no domains configured', async () => {
      const { listConfiguredDomains } = await import('../../src/config-env.ts');
      const domains = listConfiguredDomains();

      expect(domains).toEqual([]);
    });

    test('should not duplicate domains', async () => {
      process.env.DUP_EMAIL = 'test@example.com';
      process.env.DUP_PASS = 'pass';
      process.env.DUP_URL = 'https://dup.com';

      const { listConfiguredDomains } = await import('../../src/config-env.ts');
      const domains = listConfiguredDomains();

      expect(domains.filter(d => d === 'DUP')).toHaveLength(1);
    });
  });

  describe('interpolateEnvVars', () => {
    test('should interpolate variables with ${VAR} syntax', async () => {
      process.env.INTERPOLATED_URL = 'https://example.com';

      const { interpolateEnvVars } = await import('../../src/config-env.ts');
      const content = 'url: ${INTERPOLATED_URL}';
      const result = interpolateEnvVars(content);

      expect(result).toBe('url: https://example.com');
    });

    test('should interpolate variables with $VAR syntax', async () => {
      process.env.SIMPLE_VAR = 'simple_value';

      const { interpolateEnvVars } = await import('../../src/config-env.ts');
      const content = 'value: $SIMPLE_VAR';
      const result = interpolateEnvVars(content);

      expect(result).toBe('value: simple_value');
    });

    test('should leave undefined variables unchanged', async () => {
      const { interpolateEnvVars } = await import('../../src/config-env.ts');
      const content = 'url: ${NONEXISTENT_VAR}';
      const result = interpolateEnvVars(content);

      expect(result).toBe('url: ${NONEXISTENT_VAR}');
    });

    test('should interpolate multiple variables', async () => {
      process.env.MULTI_EMAIL = 'test@example.com';
      process.env.MULTI_PASS = 'password';

      const { interpolateEnvVars } = await import('../../src/config-env.ts');
      const content = 'email: ${MULTI_EMAIL}\npassword: ${MULTI_PASS}';
      const result = interpolateEnvVars(content);

      expect(result).toBe('email: test@example.com\npassword: password');
    });

    test('should handle mixed defined and undefined variables', async () => {
      process.env.DEFINED = 'defined_value';

      const { interpolateEnvVars } = await import('../../src/config-env.ts');
      const content = 'defined: ${DEFINED}\nundefined: ${UNDEFINED}';
      const result = interpolateEnvVars(content);

      expect(result).toBe('defined: defined_value\nundefined: ${UNDEFINED}');
    });
  });
});
