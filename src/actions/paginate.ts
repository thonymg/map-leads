/**
 * Action: Paginate
 * Navigation multi-pages avec concaténation résultats et arrêt automatique (CA-18)
 */

import type { Page } from 'playwright';
import type { PaginateParams, ActionResult, ExtractField } from '../types.ts';
import { extract } from './extract.ts';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_PAGES = 10;

/**
 * Exécute l'action de pagination
 * @param params - Paramètres de pagination
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action avec toutes les données concaténées
 */
export async function paginate(params: PaginateParams, page: Page): Promise<ActionResult> {
  const {
    selector,
    max_pages = DEFAULT_MAX_PAGES,
    timeout = DEFAULT_TIMEOUT,
    fields,
    itemSelector,
  } = params;

  const allResults: Record<string, unknown>[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage && currentPage <= max_pages) {
      // Extraire les données de la page courante
      let extractParams;
      
      if (itemSelector && fields) {
        // Utiliser les paramètres fournis
        extractParams = {
          selector: itemSelector,
          fields,
        };
      } else if (fields) {
        // Fallback: utiliser un sélecteur générique
        extractParams = {
          selector: 'body',
          fields,
        };
      } else {
        // Pas de champs spécifiés, on continue juste la pagination
        extractParams = null;
      }

      if (extractParams) {
        const extractResult = await extract(extractParams, page);
        
        if (extractResult.success && Array.isArray(extractResult.data)) {
          allResults.push(...extractResult.data);
        }
      }

      // Vérifier s'il y a une page suivante
      const nextButton = await page.$(selector);
      
      if (!nextButton) {
        // Bouton de pagination absent = arrêt automatique (CA-18)
        hasNextPage = false;
        break;
      }

      // Cliquer sur le bouton "page suivante"
      await nextButton.click({ timeout });
      
      // Attendre le chargement de la nouvelle page
      await page.waitForLoadState('networkidle', { timeout });
      
      currentPage++;
    }

    return {
      success: true,
      message: `${allResults.length} élément(s) extrait(s) sur ${currentPage - 1} page(s)`,
      data: allResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de la pagination avec "${selector}": ${errorMessage}`,
      data: allResults.length > 0 ? allResults : undefined,
    };
  }
}
