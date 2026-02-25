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
 * Substitue les variables dans un objet ou une chaîne
 */
function substituteVars(obj: any, vars: Record<string, unknown>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\${(\w+)}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `\${${key}}`;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => substituteVars(item, vars));
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = substituteVars(obj[key], vars);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Exécute une action individuelle (import dynamique pour éviter les cycles)
 */
async function executeStep(
  step: StepDefinition,
  page: Page,
  index: number,
  contextVars: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; message?: string }> {
  const { action } = step;
  
  // Substituer les variables dans les paramètres
  const params = substituteVars(step.params, contextVars);

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

    // Itérer sur chaque élément via récursion
    const processIterations = async (
      index: number,
      acc: Record<string, unknown>[]
    ): Promise<Record<string, unknown>[]> => {
      // Condition de sortie : itérations terminées
      if (index >= iterations) {
        return acc;
      }

      iterationCount++;
      console.log(`        ↻ Itération ${index + 1}/${iterations}`);

      // Stocker l'index dans le contexte
      contextVars['index'] = index;
      contextVars['total'] = iterations;

      // Re-sélectionner les éléments à chaque itération (car le DOM peut changer)
      const currentElements = await page.$$(selector);
      
      if (index >= currentElements.length) {
        console.log(`        ⚠️  Plus d'éléments disponibles ( ${currentElements.length} < ${index})`);
        return acc;
      }

      // Fonction récursive pour traiter les étapes
      const processSteps = async (
        stepIndex: number,
        stepAcc: Record<string, unknown>[]
      ): Promise<Record<string, unknown>[]> => {
        // Condition de sortie : étapes terminées
        if (stepIndex >= steps.length) {
          return stepAcc;
        }

        const step = steps[stepIndex];
        const stepResult = await executeStep(step, page, index, contextVars);

        if (!stepResult.success) {
          console.log(`          ❌ Échec étape ${step.action}: ${stepResult.message}`);
          // Continuer à l'étape suivante malgré l'échec
        }

        // Collecter les données extraites
        if (stepResult.data) {
          if (Array.isArray(stepResult.data)) {
            stepAcc.push(...stepResult.data);
          } else if (typeof stepResult.data === 'object') {
            stepAcc.push(stepResult.data as Record<string, unknown>);
          }
        }

        // Appel récursif pour l'étape suivante
        return processSteps(stepIndex + 1, stepAcc);
      };

      // Exécuter les étapes pour cet élément
      const iterationResults = await processSteps(0, []);
      const newAcc = acc.concat(iterationResults);

      // Délai entre les itérations
      if (delayBetweenIterations > 0 && index < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenIterations));
      }

      // Appel récursif pour l'itération suivante
      return processIterations(index + 1, newAcc);
    };

    // Lancer la boucle récursive
    const allResults = await processIterations(0, []);

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
