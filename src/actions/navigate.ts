/**
 * Action: Navigate
 * Navigation vers une URL avec gestion du timeout et attente du chargement
 */

import type { Page } from 'playwright';
import type { NavigateParams, ActionResult } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Exécute l'action de navigation
 * @param params - Paramètres de navigation
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action
 */
export async function navigate(params: NavigateParams, page: Page): Promise<ActionResult> {
  const { url, timeout = DEFAULT_TIMEOUT } = params;

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    });

    return {
      success: true,
      message: `Navigation réussie vers ${url}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de la navigation vers ${url}: ${errorMessage}`,
    };
  }
}
