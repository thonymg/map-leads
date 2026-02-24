/**
 * Orchestrator
 * Gère le browser partagé et le parallélisme des scrapers
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';
import pLimit from 'p-limit';
import type { ScraperConfig, ScraperResult, ScraperDefinition, ActionType } from './types.ts';
import { runScraper } from './runner.ts';
import { saveResult } from './storage.ts';

/**
 * Résumé d'exécution globale
 */
export interface ExecutionSummary {
  /** Date de début */
  startedAt: string;
  /** Date de fin */
  completedAt: string;
  /** Durée totale en ms */
  duration: number;
  /** Nombre de scrapers exécutés */
  scraperCount: number;
  /** Nombre de scrapers en succès */
  successCount: number;
  /** Nombre de scrapers en échec */
  failureCount: number;
  /** Nombre total d'enregistrements extraits */
  totalRecords: number;
  /** Résultats individuels */
  results: ScraperResult[];
}

/**
 * Exécute un scraper avec son contexte isolé
 */
async function executeScraperWithIsolation(
  definition: ScraperDefinition,
  browser: Browser
): Promise<ScraperResult> {
  let browserContext: BrowserContext | null = null;

  try {
    // Créer un BrowserContext isolé (CA-27)
    browserContext = await browser.newContext({
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    });

    // Exécuter le scraper dans son contexte
    const result = await runScraper(definition, browserContext);

    return result;
  } finally {
    // Fermer le contexte après chaque scraper (CA-30)
    if (browserContext) {
      await browserContext.close().catch(() => {
        // Ignorer les erreurs de fermeture
      });
    }
  }
}

/**
 * Orchestre l'exécution de tous les scrapers en parallèle
 * @param config - Configuration validée
 * @returns Résumé de l'exécution
 */
export async function orchestrate(config: ScraperConfig): Promise<ExecutionSummary> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const results: ScraperResult[] = [];

  console.log('🌐 Ouverture du navigateur...');
  // Ouvrir un browser unique partagé (CA-26)
  const browser = await chromium.launch({
    headless: true,
  });
  console.log('✅ Navigateur ouvert');

  try {
    // Limiter la concurrence via p-limit (CA-28)
    const limit = pLimit(config.concurrency ?? 5);

    console.log(`📡 Lancement de ${config.scrapers.length} scraper(s) en parallèle...`);

    // Créer les tâches pour chaque scraper
    const tasks = config.scrapers.map(definition =>
      limit(async () => {
        console.log(`  ▶️  Démarrage: ${definition.name}`);
        try {
          const result = await executeScraperWithIsolation(definition, browser);

          // Sauvegarder le résultat (CA-33 à CA-37)
          await saveResult(result, config.output_dir ?? './results');
          console.log(`  ✅ Terminé: ${definition.name} (${result.recordCount} résultats)`);

          return result;
        } catch (error) {
          // Scraper en erreur ne doit pas interrompre les autres
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.log(`  ❌ Échec: ${definition.name} - ${errorMessage}`);
          
          const errorResult: ScraperResult = {
            name: definition.name,
            url: definition.url,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            duration: 0,
            success: false,
            pageCount: 0,
            recordCount: 0,
            data: [],
            errors: [
              {
                step: -1,
                action: 'navigate' as ActionType,
                message: `Échec critique: ${errorMessage}`,
                stack: error instanceof Error ? error.stack : undefined,
              },
            ],
          };

          // Sauvegarder même en cas d'erreur
          await saveResult(errorResult, config.output_dir ?? './results');

          return errorResult;
        }
      })
    );

    // Exécuter toutes les tâches en parallèle (limitée)
    const settledResults = await Promise.allSettled(tasks);

    // Collecter les résultats
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        // Rejet non géré
        results.push({
          name: 'unknown',
          url: '',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          duration: 0,
          success: false,
          pageCount: 0,
          recordCount: 0,
          data: [],
          errors: [
            {
              step: -1,
              action: 'navigate' as ActionType,
              message: settled.reason instanceof Error ? settled.reason.message : 'Erreur inconnue',
              stack: settled.reason instanceof Error ? settled.reason.stack : undefined,
            },
          ],
        });
      }
    }
  } finally {
    // Fermer le browser en fin d'exécution (CA-31)
    await browser.close().catch(() => {
      // Ignorer les erreurs de fermeture
    });
  }

  // Construire le résumé global (CA-32)
  const completedAt = new Date().toISOString();
  const endTime = Date.now();
  const duration = endTime - startTime;

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);

  const summary: ExecutionSummary = {
    startedAt,
    completedAt,
    duration,
    scraperCount: results.length,
    successCount,
    failureCount,
    totalRecords,
    results,
  };

  // Afficher le résumé global
  printSummary(summary);

  return summary;
}

/**
 * Affiche le résumé global de l'exécution
 */
function printSummary(summary: ExecutionSummary): void {
  console.log('\n' + '='.repeat(60));
  console.log('RÉSUMÉ GLOBAL DE L\'EXÉCUTION');
  console.log('='.repeat(60));
  console.log(`Démarrage: ${summary.startedAt}`);
  console.log(`Fin:       ${summary.completedAt}`);
  console.log(`Durée:     ${summary.duration}ms (${(summary.duration / 1000).toFixed(2)}s)`);
  console.log('-'.repeat(60));
  console.log(`Scrapers exécutés: ${summary.scraperCount}`);
  console.log(`  ✓ Succès:        ${summary.successCount}`);
  console.log(`  ✗ Échecs:        ${summary.failureCount}`);
  console.log(`Total enregistrements: ${summary.totalRecords}`);
  console.log('-'.repeat(60));

  // Détails par scraper
  console.log('DÉTAILS PAR SCRAPER:');
  for (const result of summary.results) {
    const status = result.success ? '✓' : '✗';
    const duration = `${result.duration}ms`;
    const records = `${result.recordCount} records`;
    const errors = result.errors.length > 0 ? `(${result.errors.length} erreurs)` : '';

    console.log(
      `  ${status} ${result.name.padEnd(20)} | ${duration.padStart(8)} | ${records.padEnd(12)} ${errors}`
    );
  }

  console.log('='.repeat(60) + '\n');
}
