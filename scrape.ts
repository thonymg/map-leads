/**
 * MapLeads — Script de Lancement de Scraping
 * Permet de lancer des scrapings sur plusieurs sites via des fichiers .scrappe.yaml
 * 
 * Usage:
 *   node --experimental-strip-types scrape.ts       # Lance tous les scrapers
 *   node --experimental-strip-types scrape.ts --list
 *   node --experimental-strip-types scrape.ts --file <fichier>
 *   node --experimental-strip-types scrape.ts --domain <domaine>
 */

import { readdir, stat } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { loadConfig, applyDefaults, ConfigValidationError, ConfigLoadError } from './src/config.ts';
import { orchestrate } from './src/orchestrator.ts';
import { loadEnv, interpolateEnvVars } from './src/config-env.ts';

// Charger les variables d'environnement
loadEnv();

/**
 * Dossier contenant les configurations de scraping
 */
const SCRAPPE_DIR = join(process.cwd(), 'scrappe');

/**
 * Extension des fichiers de configuration
 */
const CONFIG_EXTENSION = '.scrappe.yaml';

/**
 * Interface pour les arguments CLI
 */
interface CliArgs {
  /** Liste les configurations disponibles */
  list: boolean;
  /** Fichier de configuration spécifique */
  file?: string;
  /** Domaine spécifique */
  domain?: string;
  /** Aide */
  help: boolean;
}

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--list' || arg === '-l') {
      result.list = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--file' || arg === '-f') {
      result.file = args[++i];
    } else if (arg === '--domain' || arg === '-d') {
      result.domain = args[++i];
    }
  }

  return result;
}

/**
 * Affiche l'aide
 */
function showHelp(): void {
  console.log(`
MapLeads — Script de Lancement de Scraping
==========================================

Usage:
  bun run scrape [options]

Options:
  --list, -l              Liste les configurations disponibles
  --file, -f <fichier>    Lance un fichier de configuration spécifique
  --domain, -d <domaine>  Lance tous les scrapers d'un domaine spécifique
  --help, -h              Affiche cette aide

Exemples:
  bun run scrape                          # Lance tous les scrapers
  bun run scrape --list                   # Liste les configurations
  bun run scrape --file books.toscrape.com.scrappe.yaml
  bun run scrape --domain toscrape.com

Format des fichiers:
  Les fichiers de configuration doivent être placés dans le dossier ./scrappe
  et suivre le format: [nomdedomaine].scrappe.yaml

`);
}

/**
 * Liste tous les fichiers de configuration disponibles
 */
async function listConfigFiles(): Promise<string[]> {
  if (!existsSync(SCRAPPE_DIR)) {
    return [];
  }

  const files = await readdir(SCRAPPE_DIR);
  return files
    .filter(file => file.endsWith(CONFIG_EXTENSION))
    .sort();
}

/**
 * Charge une configuration depuis le dossier scrappe avec interpolation des variables d'environnement
 */
async function loadScrappeConfig(filename: string) {
  const filePath = join(SCRAPPE_DIR, filename);

  if (!existsSync(filePath)) {
    throw new Error(`Fichier de configuration introuvable: ${filePath}`);
  }

  // Lire le contenu du fichier
  const content = readFileSync(filePath, 'utf-8');
  
  // Interpoler les variables d'environnement
  const interpolatedContent = interpolateEnvVars(content);
  
  // Parser le YAML interpolé
  const { parse } = await import('yaml');
  const rawConfig = parse(interpolatedContent) as Record<string, unknown>;
  
  // Valider et appliquer les défauts
  const { validateConfig } = await import('./src/config.ts');
  validateConfig(rawConfig);
  
  return applyDefaults(rawConfig as any);
}

/**
 * Lance un scraping pour un fichier de configuration
 */
async function runScrappeConfig(filename: string): Promise<void> {
  console.log(`\n🚀 Lancement du scraping: ${filename}`);
  console.log('='.repeat(50));

  const config = await loadScrappeConfig(filename);

  console.log(`   ${config.scrapers.length} scraper(s) à exécuter`);
  console.log(`   Concurrence: ${config.concurrency}`);
  console.log(`   Dossier de sortie: ${config.output_dir}\n`);

  const summary = await orchestrate(config);

  if (summary.failureCount > 0) {
    console.warn(`⚠️  ${summary.failureCount} scraper(s) ont échoué`);
  } else {
    console.log('✅ Tous les scrapers ont été exécutés avec succès!');
  }
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Afficher l'aide
  if (options.help) {
    showHelp();
    return;
  }

  // Lister les configurations
  if (options.list) {
    const configs = await listConfigFiles();

    if (configs.length === 0) {
      console.log('Aucune configuration trouvée dans le dossier ./scrappe');
      console.log('Créez des fichiers *.scrappe.yaml pour ajouter des scrapers.');
      return;
    }

    console.log('\nConfigurations disponibles:');
    console.log('='.repeat(50));
    for (const config of configs) {
      console.log(`  📄 ${config}`);
    }
    console.log('='.repeat(50));
    console.log(`\nUtilisez --file <nom> pour lancer une configuration`);
    console.log(`Ex: bun run scrape --file ${configs[0]}\n`);
    return;
  }

  // Lancer un fichier spécifique
  if (options.file) {
    await runScrappeConfig(options.file);
    return;
  }

  // Lancer par domaine
  if (options.domain) {
    const configs = await listConfigFiles();
    const domainConfigs = configs.filter(config =>
      config.toLowerCase().includes(options.domain!.toLowerCase())
    );

    if (domainConfigs.length === 0) {
      console.log(`Aucune configuration trouvée pour le domaine: ${options.domain}`);
      return;
    }

    console.log(`\n📋 ${domainConfigs.length} configuration(s) trouvée(s) pour "${options.domain}"`);

    for (const config of domainConfigs) {
      await runScrappeConfig(config);
    }
    return;
  }

  // Lancer toutes les configurations
  const allConfigs = await listConfigFiles();

  if (allConfigs.length === 0) {
    console.log('Aucune configuration trouvée dans le dossier ./scrappe');
    console.log('Créez des fichiers *.scrappe.yaml pour ajouter des scrapers.');
    showHelp();
    return;
  }

  console.log(`\n📋 ${allConfigs.length} configuration(s) à exécuter\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const config of allConfigs) {
    try {
      await runScrappeConfig(config);
      successCount++;
    } catch (error) {
      console.error(`❌ Échec de ${config}:`, error instanceof Error ? error.message : String(error));
      failureCount++;
    }
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('RÉSUMÉ FINAL');
  console.log('='.repeat(60));
  console.log(`Configurations exécutées: ${allConfigs.length}`);
  console.log(`  ✓ Succès: ${successCount}`);
  console.log(`  ✗ Échecs: ${failureCount}`);
  console.log('='.repeat(60) + '\n');

  if (failureCount > 0) {
    process.exitCode = 1;
  }
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur fatale:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
