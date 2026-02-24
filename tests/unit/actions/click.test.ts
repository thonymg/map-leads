/**
 * Tests unitaires pour src/actions/click.ts
 */

import { describe, test, expect, mock } from 'bun:test';

describe('Click Action', () => {
  test('should click element successfully', async () => {
    const { click } = await import('../../../src/actions/click.ts');
    
    const mockElement = {
      click: mock(() => Promise.resolve()),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await click({ selector: 'button' }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Clic réussi');
    expect(mockPage.$).toHaveBeenCalledWith('button');
    expect(mockElement.click).toHaveBeenCalledWith({ timeout: 10000 });
  });

  test('should use custom timeout', async () => {
    const { click } = await import('../../../src/actions/click.ts');
    
    const mockElement = {
      click: mock(() => Promise.resolve()),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    await click({ selector: 'button', timeout: 20000 }, mockPage as any);

    expect(mockElement.click).toHaveBeenCalledWith({ timeout: 20000 });
  });

  test('should succeed when element not found (tolerance)', async () => {
    const { click } = await import('../../../src/actions/click.ts');
    
    const mockPage = {
      $: mock(() => Promise.resolve(null)),
    };

    const result = await click({ selector: 'button' }, mockPage as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain('non trouvé');
    expect(result.message).toContain('ignoré');
  });

  test('should handle click error', async () => {
    const { click } = await import('../../../src/actions/click.ts');
    
    const mockElement = {
      click: mock(() => Promise.reject(new Error('Element detached'))),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await click({ selector: 'button' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec du clic');
    expect(result.message).toContain('Element detached');
  });

  test('should handle unknown error', async () => {
    const { click } = await import('../../../src/actions/click.ts');
    
    const mockElement = {
      click: mock(() => Promise.reject('string error')),
    };
    const mockPage = {
      $: mock(() => Promise.resolve(mockElement)),
    };

    const result = await click({ selector: 'button' }, mockPage as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Échec du clic');
  });
});
