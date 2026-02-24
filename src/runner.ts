/**
 * Runner
 * Exécute le parcours d'un scraper dans son contexte isolé
 */

import type { Page, BrowserContext } from 'playwright';
import type {
  ScraperDefinition,
  ScraperResult,
  ScraperError,
  StepDefinition,
  ActionType,
  ExtractParams,
} from './types.ts';
import { navigate } from './actions/navigate.ts';
import { wait } from './actions/wait.ts';
import { click } from './actions/click.ts';
import { fill } from './actions/fill.ts';
import { extract } from './actions/extract.ts';
import { paginate } from './actions/paginate.ts';

/**
 * Crée un résultat de scraper vide initialisé
 */
function createInitialResult(definition: ScraperDefinition): ScraperResult {
  return {
    name: definition.name,
    url: definition.url,
    startedAt: new Date().toISOString(),
    completedAt: '',
    duration: 0,
    success: true,
    pageCount: 0,
    recordCount: 0,
    data: [],
    errors: [],
  };
}

/**
 * Exécute une action individuelle
 */
async function executeStep(
  step: StepDefinition,
  page: Page,
  stepIndex: number
): Promise<{ success: boolean; data?: unknown; error?: ScraperError }> {
  const { action, params } = step;

  try {
    let result;

    switch (action) {
      case 'navigate':
        result = await navigate(params as unknown as import('./types').NavigateParams, page);
        break;
      case 'wait':
        result = await wait(params as unknown as import('./types').WaitParams, page);
        break;
      case 'click':
        result = await click(params as unknown as import('./types').ClickParams, page);
        break;
      case 'fill':
        result = await fill(params as unknown as import('./types').FillParams, page);
        break;
      case 'extract':
        result = await extract(params as unknown as import('./types').ExtractParams, page);
        break;
      case 'paginate':
        result = await paginate(params as unknown as import('./types').PaginateParams, page);
        break;
      default:
        throw new Error(`Action inconnue: ${action}`);
    }

    return {
      success: result.success,
      data: result.data,
      error: result.success
        ? undefined
        : {
            step: stepIndex,
            action: action as ActionType,
            message: result.message ?? 'Erreur inconnue',
          },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: {
        step: stepIndex,
        action: action as ActionType,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

/**
 * Exécute un scraper complet dans son contexte isolé
 * @param definition - Définition du scraper
 * @param browserContext - Contexte Playwright isolé
 * @returns Résultat du scraping
 */
export async function runScraper(
  definition: ScraperDefinition,
  browserContext: BrowserContext
): Promise<ScraperResult> {
  const result = createInitialResult(definition);
  const startTime = Date.now();

  let page: Page | null = null;
  
  // Données temporaires pour transmission extract → paginate
  let tempExtractData: { itemSelector?: string; fields?: ExtractParams } = {};

  try {
    // Créer une nouvelle page dans le contexte isolé (CA-24, CA-25)
    console.log('    📄 Création de la page...');
    page = await browserContext.newPage();

    // Appliquer le viewport si configuré
    if (definition.viewport) {
      await page.setViewportSize(definition.viewport);
    }

    console.log(`    🚀 Exécution de ${definition.steps.length} étapes...`);

    // Exécuter chaque étape dans l'ordre (CA-21)
    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i]!;
      console.log(`      Étape ${i + 1}/${definition.steps.length}: ${step.action}`);
      
      const stepResult = await executeStep(step, page, i);

      // Capture erreur sans interruption (CA-23)
      if (!stepResult.success && stepResult.error) {
        console.log(`        ❌ Erreur: ${stepResult.error.message}`);
        result.errors.push(stepResult.error);
        result.success = false;
        // Continuer à l'étape suivante
        continue;
      }

      console.log(`        ✅ Succès`);

      // Stocker les données extraites pour transmission (T3.3)
      if (step.action === 'extract' && stepResult.data) {
        tempExtractData = {
          itemSelector: (step.params as ExtractParams).selector,
          fields: step.params as ExtractParams,
        };
      }

      // Concaténer les données extraites
      if (stepResult.data && Array.isArray(stepResult.data)) {
        result.data.push(...stepResult.data);
        result.recordCount += stepResult.data.length;
      }

      // Compter les pages pour paginate
      if (step.action === 'paginate' && stepResult.data) {
        const dataArray = stepResult.data as unknown[];
        // Estimer le nombre de pages basé sur le nombre de résultats
        result.pageCount = Math.ceil(dataArray.length / 10) || 1;
      }
    }
  } catch (error) {
    // Erreur fatale non capturée
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    result.errors.push({
      step: -1,
      action: 'navigate' as ActionType,
      message: `Erreur fatale: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined,
    });
    result.success = false;
  } finally {
    // Fermer la page après exécution (CA-24)
    if (page) {
      await page.close().catch(() => {
        // Ignorer les erreurs de fermeture
      });
    }

    // Finaliser les métadonnées
    const endTime = Date.now();
    result.completedAt = new Date().toISOString();
    result.duration = endTime - startTime;
  }

  return result;
}
