/**
 * Action: Navigate Back
 * Revient en arrière dans l'historique de navigation
 */

import type { Page } from 'playwright';
import type { NavigateBackParams, ActionResult } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Exécute l'action de navigation en arrière
 * @param params - Paramètres de navigation en arrière
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action
 */
export async function navigateBack(params: NavigateBackParams, page: Page): Promise<ActionResult> {
  const { count = 1, timeout = DEFAULT_TIMEOUT } = params;

  try {
    // Fonction récursive terminale pour la navigation arrière
    const goBack = async (remaining: number): Promise<void> => {
      // Condition de sortie : plus de pages à remonter
      if (remaining <= 0) {
        return;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout }),
        page.goBack({ timeout }),
      ]);

      // Appel récursif pour la page suivante
      return goBack(remaining - 1);
    };

    // Lancer la récursion
    await goBack(count);

    return {
      success: true,
      message: `Navigation en arrière de ${count} page(s) réussie`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de la navigation en arrière: ${errorMessage}`,
    };
  }
}
