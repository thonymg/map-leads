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

  const results: Record<string, unknown>[] = [];

  try {
    // Fonction récursive terminale pour la pagination
    const processPages = async (
      currentPage: number,
      acc: Record<string, unknown>[]
    ): Promise<{ pages: number }> => {
      // Condition de sortie : nombre maximum de pages atteint
      if (currentPage > max_pages) {
        return { pages: currentPage - 1 };
      }

      // Extraire les données de la page courante
      let extractParams;
      
      if (itemSelector && fields) {
        extractParams = { selector: itemSelector, fields };
      } else if (fields) {
        extractParams = { selector: 'body', fields };
      } else {
        extractParams = null;
      }

      if (extractParams) {
        const extractResult = await extract(extractParams, page);
        
        if (extractResult.success && Array.isArray(extractResult.data)) {
          // Mutation de l'accumulateur pour éviter la surcharge mémoire
          acc.push(...(extractResult.data as Record<string, unknown>[]));
        }
      }

      // Vérifier s'il y a une page suivante
      const nextButton = await page.$(selector);
      
      if (!nextButton) {
        // Bouton de pagination absent = arrêt automatique (CA-18)
        return { pages: currentPage };
      }

      // Cliquer sur le bouton "page suivante"
      await nextButton.click({ timeout });
      
      // Attendre le chargement de la nouvelle page
      await page.waitForLoadState('networkidle', { timeout });
      
      // Appel récursif pour la page suivante
      return processPages(currentPage + 1, acc);
    };

    const { pages } = await processPages(1, results);

    return {
      success: true,
      message: `${results.length} élément(s) extrait(s) sur ${pages} page(s)`,
      data: results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de la pagination avec "${selector}": ${errorMessage}`,
      data: results.length > 0 ? results : undefined,
    };
  }
}
