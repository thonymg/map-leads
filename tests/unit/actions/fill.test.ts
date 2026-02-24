/**
 * Tests unitaires pour src/actions/fill.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Fill Action', () => {
  test('should fill field successfully', async () => {
    const { fill } = await import('../../../src/actions/fill.ts');
    
    const mockElement = {
      fill: mock(() => Promise.resolve()),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await fill({ selector: 'input', value: 'test' }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('rempli');
    expect(mockPage.$).toHaveBeenCalledWith('input');
    expect(mockElement.fill).toHaveBeenCalledWith('test', { timeout: 10000 });
  });

  test('should use custom timeout', async () => {
    const { fill } = await import('../../../src/actions/fill.ts');
    
    const mockElement = {
      fill: mock(() => Promise.resolve()),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    await fill({ selector: 'input', value: 'test', timeout: 20000 }, mockPage as any);

    expect(mockElement.fill).toHaveBeenCalledWith('test', { timeout: 20000 });
  });

  test('should fail when field not found', async () => {
    const { fill } = await import('../../../src/actions/fill.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve(null)),
    };

    const result = await fill({ selector: 'input', value: 'test' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('introuvable');
  });

  test('should handle fill error', async () => {
    const { fill } = await import('../../../src/actions/fill.ts');
    
    const mockElement = {
      fill: mock(() => Promise.reject(new Error('Element not editable'))),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await fill({ selector: 'input', value: 'test' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec du remplissage');
    expect(result.message).toContain('Element not editable');
  });

  test('should handle unknown error', async () => {
    const { fill } = await import('../../../src/actions/fill.ts');
    
    const mockElement = {
      fill: mock(() => Promise.reject('string error')),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await fill({ selector: 'input', value: 'test' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec du remplissage');
  });
});
