/**
 * Action: Loop
 * Exécute une série d'actions en boucle pour chaque élément d'un sélecteur
 * 
 * Usage:
 * - Cliquer sur chaque élément d'une liste
 * - Extraire des données depuis une page de détail
 * - Revenir en arrière et passer à l'élément suivant
 */

import type { Page } from 'playwright';
import type { LoopParams, ActionResult, StepDefinition } from '../types';

/**
 * Paramètres par défaut
 */
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_DELAY = 1000;

/**
 * Exécute une action individuelle (import dynamique pour éviter les cycles)
 */
async function executeStep(
  step: StepDefinition,
  page: Page,
  index: number,
  contextVars: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; message?: string }> {
  const { action, params } = step;

  try {
    let result: ActionResult;

    // Import dynamique des actions
    switch (action) {
      case 'navigate': {
        const { navigate } = await import('./navigate.ts');
        result = await navigate(params as any, page);
        break;
      }
      case 'wait': {
        const { wait } = await import('./wait.ts');
        result = await wait(params as any, page);
        break;
      }
      case 'click': {
        const { click } = await import('./click.ts');
        result = await click(params as any, page);
        break;
      }
      case 'fill': {
        const { fill } = await import('./fill.ts');
        result = await fill(params as any, page);
        break;
      }
      case 'extract': {
        const { extract } = await import('./extract.ts');
        result = await extract(params as any, page);
        break;
      }
      case 'navigate-back': {
        const { navigateBack } = await import('./navigate-back.ts');
        result = await navigateBack(params as any, page);
        break;
      }
      default:
        return {
          success: false,
          message: `Action non supportée dans loop: ${action}`,
        };
    }

    return {
      success: result.success,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Exécute l'action de boucle
 * @param params - Paramètres de boucle
 * @param page - Instance Playwright Page
 * @returns Résultat de l'action avec toutes les données concaténées
 */
export async function loop(params: LoopParams, page: Page): Promise<ActionResult> {
  const {
    selector,
    steps,
    max_iterations,
    delayBetweenIterations = DEFAULT_DELAY,
    timeout = DEFAULT_TIMEOUT,
  } = params;

  const allResults: Record<string, unknown>[] = [];
  let iterationCount = 0;

  try {
    // Compter le nombre d'éléments
    const elements = await page.$$(selector);
    const totalElements = elements.length;

    if (totalElements === 0) {
      return {
        success: true,
        message: `Aucun élément trouvé pour le sélecteur "${selector}"`,
        data: [],
      };
    }

    console.log(`      🔄 Début de la boucle: ${totalElements} élément(s) à traiter`);

    // Limiter le nombre d'itérations si spécifié
    const iterations = max_iterations ? Math.min(totalElements, max_iterations) : totalElements;

    // Contexte partagé entre les itérations
    const contextVars: Record<string, unknown> = {};

    // Itérer sur chaque élément
    for (let i = 0; i < iterations; i++) {
      iterationCount++;
      console.log(`        ↻ Itération ${i + 1}/${iterations}`);

      // Stocker l'index dans le contexte
      contextVars['index'] = i;
      contextVars['total'] = iterations;

      // Re-sélectionner les éléments à chaque itération (car le DOM peut changer)
      const currentElements = await page.$$(selector);
      
      if (i >= currentElements.length) {
        console.log(`        ⚠️  Plus d'éléments disponibles ( ${currentElements.length} < ${i})`);
        break;
      }

      // Exécuter les étapes pour cet élément
      for (const step of steps) {
        const stepResult = await executeStep(step, page, i, contextVars);

        if (!stepResult.success) {
          console.log(`          ❌ Échec étape ${step.action}: ${stepResult.message}`);
          // Continuer à l'étape suivante
        }

        // Collecter les données extraites
        if (stepResult.data && Array.isArray(stepResult.data)) {
          allResults.push(...stepResult.data);
        } else if (stepResult.data && typeof stepResult.data === 'object') {
          allResults.push(stepResult.data as Record<string, unknown>);
        }
      }

      // Délai entre les itérations
      if (delayBetweenIterations > 0 && i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenIterations));
      }
    }

    console.log(`      ✅ Boucle terminée: ${iterationCount} itération(s), ${allResults.length} résultat(s)`);

    return {
      success: true,
      message: `${iterationCount} itération(s), ${allResults.length} résultat(s) extrait(s)`,
      data: allResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Échec de la boucle avec "${selector}": ${errorMessage}`,
      data: allResults.length > 0 ? allResults : undefined,
    };
  }
}
