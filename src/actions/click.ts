/**
 * Action: Click
 * Clic sur un élément avec tolérance si l'élément est absent (CA-11)
 */

import type { Page } from 'playwright';
import type { ClickParams, ActionResult } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Exécute l'action de clic
 * @param params - Paramètres de clic
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action
 */
export async function click(params: ClickParams, page: Page): Promise<ActionResult> {
  const { selector, timeout = DEFAULT_TIMEOUT } = params;

  try {
    // Nettoyer le selector s'il contient des espaces non valides pour CSS
    let cleanSelector = selector;
    
    // Si le selector ressemble à [role=...] avec des espaces, utiliser text= ou getByRole
    const roleMatch = selector.match(/^\[role=(\w+)\s+(.*)\]$/);
    if (roleMatch) {
      const [, role, text] = roleMatch;
      // Utiliser getByRole avec le texte
      const locator = page.getByRole(role as any, { name: new RegExp(text, 'i') });
      await locator.click({ timeout, force: true });
      
      return {
        success: true,
        message: `Clic réussi sur "${selector}"`,
      };
    }
    
    // Vérifier si l'élément existe
    const element = await page.$(selector);

    if (!element) {
      // Tolérance: élément absent n'est pas une erreur (CA-11)
      return {
        success: true,
        message: `Élément "${selector}" non trouvé, clic ignoré`,
      };
    }

    // Tenter le clic
    await element.click({ timeout });

    return {
      success: true,
      message: `Clic réussi sur "${selector}"`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec du clic sur "${selector}": ${errorMessage}`,
    };
  }
}
