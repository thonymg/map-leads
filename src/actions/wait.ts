/**
 * Action: Wait
 * Attente d'un sélecteur CSS ou d'une durée fixe
 */

import type { Page } from 'playwright';
import type { WaitParams, ActionResult } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Exécute l'action d'attente
 * @param params - Paramètres d'attente
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action
 */
export async function wait(params: WaitParams, page: Page): Promise<ActionResult> {
  const { selector, duration, timeout = DEFAULT_TIMEOUT } = params;

  try {
    // Attente d'une durée fixe
    if (duration !== undefined) {
      await new Promise(resolve => setTimeout(resolve, duration));
      return {
        success: true,
        message: `Attente de ${duration}ms terminée`,
      };
    }

    // Attente d'un sélecteur
    if (selector !== undefined) {
      // Si le selector ressemble à [role=...] avec des espaces, utiliser getByRole
      const roleMatch = selector.match(/^\[role=(\w+)\s+(.*)\]$/);
      if (roleMatch) {
        const [, role, text] = roleMatch;
        const locator = page.getByRole(role as any, { name: new RegExp(text, 'i') });
        await locator.waitFor({ timeout, state: 'visible' });
      } else {
        await page.waitForSelector(selector, { timeout, state: 'visible' });
      }
      return {
        success: true,
        message: `Sélecteur "${selector}" trouvé`,
      };
    }

    // Aucun paramètre fourni
    return {
      success: false,
      message: 'Paramètre "selector" ou "duration" requis',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const context = selector ? `sélecteur "${selector}"` : `durée ${duration}ms`;
    return {
      success: false,
      message: `Échec de l'attente pour ${context}: ${errorMessage}`,
    };
  }
}
