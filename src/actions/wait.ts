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
      await page.waitForSelector(selector, { timeout, state: 'visible' });
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
