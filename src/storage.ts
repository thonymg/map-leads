/**
 * Storage
 * Sauvegarde des résultats en JSON
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { ScraperResult } from './types.ts';

/**
 * Génère un nom de fichier unique pour un résultat
 * Format: {name}-{timestamp}.json
 */
export function generateFilename(result: ScraperResult): string {
  const timestamp = new Date(result.startedAt)
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, -5); // Garder jusqu'aux secondes

  return `${result.name}-${timestamp}.json`;
}

/**
 * Assure qu'un dossier existe, le crée si nécessaire
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Sauvegarde un résultat de scraper dans un fichier JSON
 * @param result - Résultat à sauvegarder
 * @param outputDir - Dossier de sortie
 * @returns Chemin du fichier créé
 */
export async function saveResult(
  result: ScraperResult,
  outputDir: string = './results'
): Promise<string> {
  // S'assurer que le dossier existe (CA-34)
  await ensureDirectoryExists(outputDir);

  // Générer le nom de fichier (CA-35)
  const filename = generateFilename(result);
  const filePath = join(outputDir, filename);

  // Sérialiser en JSON indenté (CA-36)
  const jsonContent = JSON.stringify(result, null, 2);

  // Écrire le fichier (CA-37)
  await writeFile(filePath, jsonContent, 'utf-8');

  return filePath;
}

/**
 * Liste tous les fichiers de résultats dans un dossier
 */
export async function listResults(outputDir: string = './results'): Promise<string[]> {
  const { readdir } = await import('fs/promises');

  if (!existsSync(outputDir)) {
    return [];
  }

  const files = await readdir(outputDir);
  return files.filter(file => file.endsWith('.json')).sort();
}

/**
 * Charge un résultat depuis un fichier JSON
 */
export async function loadResult(filePath: string): Promise<ScraperResult> {
  const { readFile } = await import('fs/promises');

  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as ScraperResult;
}
