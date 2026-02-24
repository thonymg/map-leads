/**
 * Scraper Configurable — Types partagés
 * Définit toutes les interfaces utilisées dans le projet
 */

import type { Page, BrowserContext } from 'playwright';

// ============================================================================
// Configuration YAML
// ============================================================================

/**
 * Configuration globale du scraper
 */
export interface ScraperConfig {
  /** Nombre de scrapers en parallèle (défaut: 5) */
  concurrency?: number;
  /** Dossier de sortie (défaut: ./results) */
  output_dir?: string;
  /** Liste des scrapers à exécuter */
  scrapers: ScraperDefinition[];
}

/**
 * Définition d'un scraper individuel
 */
export interface ScraperDefinition {
  /** Identifiant unique du scraper */
  name: string;
  /** URL de départ */
  url: string;
  /** Séquence d'actions à exécuter */
  steps: StepDefinition[];
  /** Mode headless (défaut: true) */
  headless?: boolean;
  /** Dimensions du viewport */
  viewport?: ViewportSize;
}

/**
 * Dimensions du viewport
 */
export interface ViewportSize {
  width: number;
  height: number;
}

// ============================================================================
// Étapes et Actions
// ============================================================================

/**
 * Type d'action disponible
 */
export type ActionType = 'navigate' | 'wait' | 'click' | 'fill' | 'extract' | 'paginate';

/**
 * Définition d'une étape dans un scraper
 */
export interface StepDefinition {
  /** Type d'action à exécuter */
  action: ActionType;
  /** Paramètres de l'action */
  params: ActionParams;
}

/**
 * Paramètres communs à toutes les actions
 */
export interface BaseActionParams {
  /** Timeout en millisecondes (optionnel) */
  timeout?: number;
}

/**
 * Paramètres pour l'action navigate
 */
export interface NavigateParams extends BaseActionParams {
  /** URL de navigation */
  url: string;
}

/**
 * Paramètres pour l'action wait
 */
export interface WaitParams extends BaseActionParams {
  /** Sélecteur CSS à attendre */
  selector?: string;
  /** Durée d'attente en ms (alternative au selector) */
  duration?: number;
}

/**
 * Paramètres pour l'action click
 */
export interface ClickParams extends BaseActionParams {
  /** Sélecteur CSS de l'élément à cliquer */
  selector: string;
}

/**
 * Paramètres pour l'action fill
 */
export interface FillParams extends BaseActionParams {
  /** Sélecteur CSS du champ à remplir */
  selector: string;
  /** Valeur à remplir */
  value: string;
}

/**
 * Définition d'un champ à extraire
 */
export interface ExtractField {
  /** Nom du champ dans le résultat */
  name: string;
  /** Sélecteur CSS pour trouver l'élément */
  selector: string;
  /** Attribut à extraire (défaut: textContent) */
  attribute?: string;
}

/**
 * Paramètres pour l'action extract
 */
export interface ExtractParams {
  /** Sélecteur CSS pour les éléments répétés */
  selector: string;
  /** Champs à extraire pour chaque élément */
  fields: ExtractField[];
}

/**
 * Paramètres pour l'action paginate
 */
export interface PaginateParams extends BaseActionParams {
  /** Sélecteur CSS du bouton "page suivante" */
  selector: string;
  /** Nombre maximum de pages à parcourir (optionnel) */
  max_pages?: number;
  /** Champs à extraire (hérités de extract si non spécifiés) */
  fields?: ExtractField[];
  /** Sélecteur pour les éléments à extraire */
  itemSelector?: string;
}

/**
 * Union de tous les types de paramètres d'actions
 */
export type ActionParams =
  | NavigateParams
  | WaitParams
  | ClickParams
  | FillParams
  | ExtractParams
  | PaginateParams;

// ============================================================================
// Résultats
// ============================================================================

/**
 * Résultat d'une action individuelle
 */
export interface ActionResult {
  /** Succès de l'action */
  success: boolean;
  /** Message d'erreur ou description */
  message?: string;
  /** Données extraites (pour extract/paginate) */
  data?: unknown;
}

/**
 * Résultat d'un scraper complet
 */
export interface ScraperResult {
  /** Nom du scraper */
  name: string;
  /** URL de départ */
  url: string;
  /** Date de début d'exécution */
  startedAt: string;
  /** Date de fin d'exécution */
  completedAt: string;
  /** Durée d'exécution en ms */
  duration: number;
  /** Succès global */
  success: boolean;
  /** Nombre de pages traitées */
  pageCount: number;
  /** Nombre d'enregistrements extraits */
  recordCount: number;
  /** Données extraites */
  data: Record<string, unknown>[];
  /** Erreurs rencontrées */
  errors: ScraperError[];
}

/**
 * Erreur rencontrée pendant le scraping
 */
export interface ScraperError {
  /** Étape où l'erreur est survenue */
  step: number;
  /** Type d'action */
  action: ActionType;
  /** Message d'erreur */
  message: string;
  /** Stack trace (optionnel) */
  stack?: string;
}

// ============================================================================
// Runtime
// ============================================================================

/**
 * Contexte d'exécution pour un scraper
 */
export interface ScraperContext {
  /** Page Playwright */
  page: Page;
  /** BrowserContext isolé */
  browserContext: BrowserContext;
  /** Définition du scraper */
  definition: ScraperDefinition;
  /** Résultats intermédiaires */
  results: ScraperResult;
  /** Données temporaires (pour transmission extract → paginate) */
  tempData?: {
    itemSelector?: string;
    fields?: ExtractField[];
  };
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

/**
 * Configuration du logger
 */
export interface LoggerConfig {
  /** Niveau de log minimum */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Dossier de sortie des logs */
  logDir: string;
  /** Nom du scraper pour préfixe */
  scraperName?: string;
}
