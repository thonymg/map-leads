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
        const elements = Array.from(document.querySelectorAll(sel));

        /**
         * Fonction récursive terminale pour traiter les champs d'un élément (Profondeur)
         * @param element - L'élément DOM parent
         * @param fields - La liste des champs à extraire
         * @param index - L'index du champ en cours
         * @param acc - L'accumulateur pour l'objet résultat
         */
        const processFields = (
          element: Element,
          fields: any[],
          index: number = 0,
          acc: Record<string, unknown> = {}
        ): Record<string, unknown> => {
          // Condition de sortie : tous les champs traités
          if (index >= fields.length) {
            return acc;
          }

          const field = fields[index];
          const target = element.querySelector(field.selector);
          
          let value: string | null = null;
          if (target) {
            if (field.attribute) {
              value = target.getAttribute(field.attribute);
            } else {
              // Extraction profonde du texte : textContent récupère tout le texte descendant
              value = target.textContent?.trim() ?? null;
            }
          }
          
          acc[field.name] = value;

          // Appel récursif terminal
          return processFields(element, fields, index + 1, acc);
        };

        /**
         * Fonction récursive terminale pour traiter la liste des éléments (Largeur)
         * @param elems - La liste des éléments DOM
         * @param index - L'index de l'élément en cours
         * @param acc - L'accumulateur pour la liste des résultats
         */
        const processElements = (
          elems: Element[],
          index: number = 0,
          acc: Record<string, unknown>[] = []
        ): Record<string, unknown>[] => {
          // Condition de sortie : tous les éléments traités
          if (index >= elems.length) {
            return acc;
          }

          const element = elems[index];
          // Traitement de l'élément courant
          const item = processFields(element, fieldsList);
          
          // Optimisation : on pousse dans l'accumulateur existant (évite la création de nouveaux tableaux)
          acc.push(item);

          // Appel récursif terminal
          return processElements(elems, index + 1, acc);
        };

        // Lancement de la récursion sur les éléments trouvés
        return processElements(elements);
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
