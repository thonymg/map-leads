/**
 * Playwright Test Configuration
 * Configuration pour le mode UI et l'enregistrement des scrapers
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Dossier pour les enregistrements
  testDir: './recordings',
  
  // Timeout par défaut
  timeout: 60000,
  
  // Nombre de tests en parallèle
  workers: 1,
  
  // Options par défaut
  use: {
    // Mode headless pour l'exécution normale
    headless: true,

    // Viewport par défaut
    viewport: { width: 1920, height: 1080 },

    // Ignorer les erreurs HTTPS
    ignoreHTTPSErrors: true,

    // Capture d'écran en cas d'échec
    screenshot: 'only-on-failure',

    // Vidéo en cas d'échec
    video: 'retain-on-failure',
  },
  
  // Reporter pour la sortie console
  reporter: [['list']],
  
  // Projet par défaut
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  
  // Dossier de sortie
  outputDir: './recordings/output',
});
