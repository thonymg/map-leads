/**
 * Converter — Point d'entrée principal
 * Convertit le code généré par Playwright UI Mode en configuration YAML
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { PlaywrightCodeParser } from './parser.ts';
import { ActionMapper, generateScraperName, extractBaseUrl } from './mapper.ts';
import { YamlGenerator } from './generator.ts';
import { SelectorOptimizer } from './optimizer.ts';
import type { ConvertedConfig } from './types.ts';

/**
 * Options de conversion
 */
export interface ConvertOptions {
  /** Fichier d'entrée (code généré) */
  inputFile: string;
  /** Fichier de sortie (YAML) */
  outputFile: string;
  /** Optimiser les sélecteurs */
  optimizeSelectors?: boolean;
  /** Mode sec (ne pas écrire) */
  dryRun?: boolean;
  /** Nom du scraper */
  name?: string;
  /** URL de base */
  url?: string;
}

/**
 * Convertit le code Playwright en configuration YAML
 */
export async function convertCodeToYaml(options: ConvertOptions): Promise<ConvertedConfig> {
  console.log(`🔄 Conversion en cours...`);
  console.log(`   Input: ${options.inputFile}`);
  console.log(`   Output: ${options.outputFile}`);
  
  // Vérifier que le fichier d'entrée existe
  if (!existsSync(options.inputFile)) {
    throw new Error(`Fichier d'entrée introuvable: ${options.inputFile}`);
  }

  // Lire le code généré
  const code = readFileSync(options.inputFile, 'utf-8');
  console.log(`📖 Code lu: ${code.length} caractères`);

  // Parser le code
  console.log(`🔍 Parsing du code...`);
  const parser = new PlaywrightCodeParser(code);
  const testFn = parser.extractTestFunction();

  if (!testFn) {
    throw new Error('Fonction de test non trouvée dans le code généré');
  }
  console.log(`✅ Fonction de test trouvée`);

  // Extraire les statements
  const statements = parser.extractStatements(testFn);
  console.log(`📋 ${statements.length} statements extraits`);

  // Mapper vers des actions YAML
  console.log(`🗺️  Mapping vers actions YAML...`);
  const mapper = new ActionMapper(parser);
  let steps = mapper.mapStatements(statements);
  console.log(`✅ ${steps.length} actions mappées`);

  // Optimiser les sélecteurs
  if (options.optimizeSelectors !== false) {
    console.log(`🎨 Optimisation des sélecteurs...`);
    const optimizer = new SelectorOptimizer();
    steps = steps.map(step => {
      const optimizedParams = optimizer.optimizeParams(step.params);
      return {
        ...step,
        params: optimizedParams,
      };
    });
  }

  // Générer la configuration
  console.log(`📝 Génération de la configuration...`);
  const config: ConvertedConfig = {
    name: options.name || generateScraperName(basename(options.inputFile)),
    url: options.url || extractBaseUrl(steps),
    headless: true,
    viewport: {
      width: 1920,
      height: 1080,
    },
    steps,
    metadata: {
      recordedAt: new Date().toISOString(),
      playwrightVersion: '1.58.2',
      optimizerVersion: '1.0.0',
    },
  };

  // Sauvegarder
  if (!options.dryRun) {
    const generator = new YamlGenerator();
    generator.saveToFile(config, options.outputFile);
    console.log(`✅ Configuration générée: ${options.outputFile}`);
    console.log(`📄 Nom: ${config.name}`);
    console.log(`🔗 URL: ${config.url}`);
    console.log(`📝 Étapes: ${config.steps.length}`);
  } else {
    console.log('📄 Configuration générée (dry run):');
    const generator = new YamlGenerator();
    console.log(generator.generate(config));
  }

  return config;
}

/**
 * Convertit tous les fichiers d'un dossier
 */
export async function convertDirectory(options: {
  inputDir: string;
  outputDir: string;
  optimizeSelectors?: boolean;
}): Promise<void> {
  const { readdirSync } = require('fs');
  const { join } = require('path');

  const files = readdirSync(options.inputDir).filter((f: string) => 
    f.endsWith('.ts') || f.endsWith('.js')
  );

  for (const file of files) {
    const inputFile = join(options.inputDir, file);
    const outputFile = join(options.outputDir, file.replace(/\.(ts|js)$/, '.scrappe.yaml'));

    try {
      await convertCodeToYaml({
        inputFile,
        outputFile,
        optimizeSelectors: options.optimizeSelectors,
      });
    } catch (error) {
      console.error(`❌ Erreur lors de la conversion de ${file}:`, error);
    }
  }
}

/**
 * CLI: Lancer la conversion depuis la ligne de commande
 */
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  
  const options: ConvertOptions = {
    inputFile: '',
    outputFile: '',
    optimizeSelectors: true,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--input' || arg === '-i') {
      options.inputFile = args[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      options.outputFile = args[++i] || '';
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--no-optimize') {
      options.optimizeSelectors = false;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      return;
    }
  }

  if (!options.inputFile) {
    console.error('❌ Fichier d\'entrée requis');
    showHelp();
    process.exit(1);
  }

  if (!options.outputFile && !options.dryRun) {
    options.outputFile = options.inputFile.replace(/\.(ts|js)$/, '.scrappe.yaml');
  }

  try {
    await convertCodeToYaml(options);
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Affiche l'aide
 */
function showHelp(): void {
  console.log(`
Conversion Code Playwright → YAML

Usage:
  node --experimental-strip-types src/converter/index.ts --input <file> --output <file>
  node --experimental-strip-types src/converter/index.ts -i <file> -o <file>

Options:
  --input, -i      Fichier d'entrée (code généré)
  --output, -o     Fichier de sortie (YAML)
  --dry-run, -d    Mode sec (affiche sans écrire)
  --no-optimize    Désactiver l'optimisation des sélecteurs
  --help, -h       Afficher cette aide

Exemple:
  node --experimental-strip-types src/converter/index.ts -i recording.ts -o scraper.scrappe.yaml
`);
}

// Exécuter le CLI si ce fichier est lancé directement
const scriptArgs = process.argv.slice(2);
if (scriptArgs.length > 0 && (scriptArgs[0].startsWith('-i') || scriptArgs[0].startsWith('--input'))) {
  runCli();
}
