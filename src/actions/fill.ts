/**
 * Action: Fill
 * Remplissage d'un champ de formulaire avec erreur si inexistant (CA-13)
 */

import type { Page } from 'playwright';
import type { FillParams, ActionResult } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Exécute l'action de remplissage
 * @param params - Paramètres de remplissage
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action
 */
export async function fill(params: FillParams, page: Page): Promise<ActionResult> {
  const { selector, value, timeout = DEFAULT_TIMEOUT } = params;

  try {
    // Vérifier si l'élément existe
    const element = await page.$(selector);
    
    if (!element) {
      // Erreur si inexistant (CA-13)
      return {
        success: false,
        message: `Champ "${selector}" introuvable`,
      };
    }

    // Remplir le champ
    await element.fill(value, { timeout });
    
    return {
      success: true,
      message: `Champ "${selector}" rempli avec "${value}"`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec du remplissage de "${selector}": ${errorMessage}`,
    };
  }
}
