/**
 * Action: Extract
 * Extraction de champs depuis des éléments répétés avec gestion null (CA-15)
 */

import type { Page } from 'playwright';
import type { ExtractParams, ActionResult, ExtractField } from '../types';

/**
 * Exécute l'action d'extraction
 * @param params - Paramètres d'extraction
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action avec les données extraites
 */
export async function extract(params: ExtractParams, page: Page): Promise<ActionResult> {
  const { selector, fields } = params;

  try {
    // Utiliser evaluate pour extraire les données directement dans le contexte du navigateur
    const results = await page.evaluate(
      ({ sel, fieldsList }) => {
        const elements = document.querySelectorAll(sel);
        const items: Record<string, unknown>[] = [];

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]!;
          const item: Record<string, unknown> = {};
          
          for (let j = 0; j < fieldsList.length; j++) {
            const field = fieldsList[j]!;
            const targetElement = element.querySelector(field.selector);
            
            if (!targetElement) {
              item[field.name] = null;
            } else if (field.attribute) {
              item[field.name] = targetElement.getAttribute(field.attribute);
            } else {
              item[field.name] = targetElement.textContent?.trim() ?? null;
            }
          }
          
          items.push(item);
        }

        return items;
      },
      { sel: selector, fieldsList: fields }
    );

    return {
      success: true,
      message: `${results.length} élément(s) extrait(s)`,
      data: results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de l'extraction avec "${selector}": ${errorMessage}`,
    };
  }
}
