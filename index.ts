/**
 * MapLeads — Scraper Web Modulaire
 * Point d'entrée principal
 * 
 * Charge la configuration YAML et lance l'orchestrateur
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, applyDefaults, ConfigValidationError, ConfigLoadError } from './src/config';
import { orchestrate } from './src/orchestrator';

/**
 * Obtient le chemin absolu vers le fichier de configuration
 */
function getConfigPath(): string {
  // Chercher d'abord dans le dossier courant
  const localPath = join(process.cwd(), 'scraper.config.yaml');
  
  // Sinon, utiliser le chemin relatif depuis ce fichier
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const modulePath = join(__dirname, '..', 'scraper.config.yaml');
  
  return localPath;
}

/**
 * Point d'entrée principal
 */
async function main(): Promise<void> {
  console.log('MapLeads — Scraper Web Modulaire');
  console.log('================================\n');

  // Déterminer le chemin de configuration
  const configPath = getConfigPath();
  console.log(`Chargement de la configuration: ${configPath}\n`);

  try {
    // Charger et valider la configuration (CA-04, CA-05)
    const rawConfig = await loadConfig(configPath);
    
    // Appliquer les valeurs par défaut
    const config = applyDefaults(rawConfig);
    
    console.log(`Configuration chargée avec succès`);
    console.log(`  - ${config.scrapers.length} scraper(s) à exécuter`);
    console.log(`  - Concurrence: ${config.concurrency}`);
    console.log(`  - Dossier de sortie: ${config.output_dir}\n`);

    // Lancer l'orchestrateur
    const summary = await orchestrate(config);

    // Résumé déjà affiché par l'orchestrateur
    // Vérifier s'il y a des échecs
    if (summary.failureCount > 0) {
      console.warn(`Attention: ${summary.failureCount} scraper(s) ont échoué`);
      process.exitCode = 1;
    } else {
      console.log('Tous les scrapers ont été exécutés avec succès!');
    }
  } catch (error) {
    // Gérer les erreurs de configuration
    if (error instanceof ConfigValidationError) {
      console.error('Erreur de validation de configuration:');
      console.error(`  Chemin: ${error.path}`);
      console.error(`  Problème: ${error.message}`);
      if (error.expected) {
        console.error(`  Attendu: ${error.expected}`);
      }
      process.exitCode = 1;
      return;
    }

    if (error instanceof ConfigLoadError) {
      console.error('Erreur de chargement de configuration:');
      console.error(`  ${error.message}`);
      if (error.cause) {
        console.error(`  Cause: ${error.cause.message}`);
      }
      process.exitCode = 1;
      return;
    }

    // Erreur inconnue
    console.error('Erreur inattendue:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

// Exécuter le programme principal
main().catch(error => {
  console.error('Erreur fatale:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
