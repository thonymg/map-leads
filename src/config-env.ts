/**
 * Config — Gestion des variables d'environnement
 * Charge et utilise les credentials depuis .env
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Charge les variables d'environnement depuis .env
 */
export function loadEnv(): void {
  const envPath = join(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

/**
 * Obtient les credentials pour un domaine
 */
export function getCredentials(domain: string): { email?: string; password?: string; url?: string } {
  const domainUpper = domain.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  
  return {
    email: process.env[`${domainUpper}_EMAIL`],
    password: process.env[`${domainUpper}_PASS`],
    url: process.env[`${domainUpper}_URL`],
  };
}

/**
 * Obtient une variable d'environnement formatée
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Vérifie si les credentials sont définis
 */
export function hasCredentials(domain: string): boolean {
  const creds = getCredentials(domain);
  return !!(creds.email && creds.password);
}

/**
 * Liste tous les domaines configurés dans .env
 */
export function listConfiguredDomains(): string[] {
  const domains = new Set<string>();

  for (const key of Object.keys(process.env)) {
    const match = key.match(/^([A-Z0-9_]+)_(EMAIL|PASS|URL)$/);
    if (match && match[1]) {
      domains.add(match[1]);
    }
  }

  return Array.from(domains);
}

/**
 * Injecte les variables d'environnement dans un objet YAML
 */
export function interpolateEnvVars(content: string): string {
  return content.replace(/\$\{?([A-Z0-9_]+)\}?/g, (match, key) => {
    return process.env[key] || match;
  });
}

// Charger automatiquement les variables d'environnement
loadEnv();
