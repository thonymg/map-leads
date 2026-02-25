/**
 * Scraper Configurable — Config Parser
 * Chargement et validation de la configuration YAML
 */

import { parse } from 'yaml';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { ScraperConfig, ScraperDefinition, StepDefinition, ActionType, ExtractField } from './types.ts';

/**
 * Erreur de validation de configuration
 */
export class ConfigValidationError extends Error {
  public readonly path: string;
  public readonly expected?: string;

  constructor(
    message: string,
    path: string,
    expected?: string
  ) {
    super(`${message}\n  Contexte: ${path}${expected ? `\n  Attendu: ${expected}` : ''}`);
    this.name = 'ConfigValidationError';
    this.path = path;
    this.expected = expected;
  }

  override toString(): string {
    return `${this.name}: ${this.message} (${this.path})`;
  }
}

/**
 * Erreur de chargement de configuration
 */
export class ConfigLoadError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ConfigLoadError';
    this.cause = cause;
  }

  override toString(): string {
    return `${this.name}: ${this.message}`;
  }
}

/**
 * Actions valides pour validation
 */
const VALID_ACTIONS: ActionType[] = ['navigate', 'wait', 'click', 'fill', 'extract', 'paginate', 'session-load', 'session-save', 'loop', 'navigate-back'];

/**
 * Charge et parse un fichier YAML
 */
export async function loadYamlFile<T>(filePath: string): Promise<T> {
  if (!existsSync(filePath)) {
    throw new ConfigLoadError(`Fichier de configuration introuvable: ${filePath}`);
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    return parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new ConfigLoadError(`Erreur de parsing YAML: ${error.message}`, error);
    }
    throw new ConfigLoadError('Erreur inconnue lors du parsing YAML');
  }
}

/**
 * Valide un champ obligatoire
 */
function validateRequiredField<T>(value: T | undefined, fieldName: string, path: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new ConfigValidationError(
      `Champ obligatoire manquant: "${fieldName}"`,
      path,
      `${fieldName} est requis`
    );
  }
}

/**
 * Valide le type d'une valeur
 */
function validateType<T>(
  value: unknown,
  expectedType: string,
  fieldName: string,
  path: string
): asserts value is T {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new ConfigValidationError(
      `Type invalide pour ${fieldName}`,
      path,
      `attendu: ${expectedType}, reçu: ${actualType}`
    );
  }
}

/**
 * Récupère une valeur string d'un objet
 */
function getStringProp(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Récupère une valeur number d'un objet
 */
function getNumberProp(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Récupère une valeur boolean d'un objet
 */
function getBooleanProp(obj: Record<string, unknown>, key: string): boolean | undefined {
  const value = obj[key];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Récupère un tableau d'un objet
 */
function getArrayProp(obj: Record<string, unknown>, key: string): unknown[] | undefined {
  const value = obj[key];
  return Array.isArray(value) ? value : undefined;
}

/**
 * Valide les paramètres d'une action navigate
 */
function validateNavigateParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  validateRequiredField<string>(getStringProp(params, 'url'), 'url', path);
  
  const timeout = getNumberProp(params, 'timeout');
  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new ConfigValidationError('timeout doit être un nombre', path);
  }
}

/**
 * Valide les paramètres d'une action wait
 */
function validateWaitParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  const selector = getStringProp(params, 'selector');
  const duration = getNumberProp(params, 'duration');
  
  // Au moins un des deux doit être présent
  if (selector === undefined && duration === undefined) {
    throw new ConfigValidationError(
      'selector ou duration est requis',
      path,
      'selector (string) ou duration (number)'
    );
  }
  
  if (selector !== undefined && typeof selector !== 'string') {
    throw new ConfigValidationError('selector doit être une string', path);
  }
  
  if (duration !== undefined && typeof duration !== 'number') {
    throw new ConfigValidationError('duration doit être un nombre', path);
  }
  
  const timeout = getNumberProp(params, 'timeout');
  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new ConfigValidationError('timeout doit être un nombre', path);
  }
}

/**
 * Valide les paramètres d'une action click
 */
function validateClickParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  validateRequiredField<string>(getStringProp(params, 'selector'), 'selector', path);
  
  const timeout = getNumberProp(params, 'timeout');
  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new ConfigValidationError('timeout doit être un nombre', path);
  }
}

/**
 * Valide les paramètres d'une action fill
 */
function validateFillParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  validateRequiredField<string>(getStringProp(params, 'selector'), 'selector', path);
  validateRequiredField<string>(getStringProp(params, 'value'), 'value', path);
  
  const timeout = getNumberProp(params, 'timeout');
  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new ConfigValidationError('timeout doit être un nombre', path);
  }
}

/**
 * Valide un champ d'extraction
 */
function validateExtractField(field: unknown, fieldIndex: number, path: string): ExtractField {
  const fieldPath = `${path}.fields[${fieldIndex}]`;
  
  if (typeof field !== 'object' || field === null) {
    throw new ConfigValidationError('field doit être un objet', fieldPath);
  }
  
  const fieldObj = field as Record<string, unknown>;
  const name = getStringProp(fieldObj, 'name');
  const selector = getStringProp(fieldObj, 'selector');
  const attribute = getStringProp(fieldObj, 'attribute');
  
  validateRequiredField<string>(name, 'name', fieldPath);
  validateRequiredField<string>(selector, 'selector', fieldPath);
  
  return { name, selector, attribute };
}

/**
 * Valide les paramètres d'une action extract
 */
function validateExtractParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  validateRequiredField<string>(getStringProp(params, 'selector'), 'selector', path);
  
  const fields = getArrayProp(params, 'fields');
  validateRequiredField<unknown[]>(fields, 'fields', path);
  
  if (fields.length === 0) {
    throw new ConfigValidationError('fields ne peut pas être vide', path);
  }
  
  fields.forEach((field, index) => {
    validateExtractField(field, index, path);
  });
}

/**
 * Valide les paramètres d'une action paginate
 */
function validatePaginateParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;
  
  validateRequiredField<string>(getStringProp(params, 'selector'), 'selector', path);
  
  const max_pages = getNumberProp(params, 'max_pages');
  if (max_pages !== undefined && typeof max_pages !== 'number') {
    throw new ConfigValidationError('max_pages doit être un nombre', path);
  }
  
  const itemSelector = getStringProp(params, 'itemSelector');
  if (itemSelector !== undefined && typeof itemSelector !== 'string') {
    throw new ConfigValidationError('itemSelector doit être une string', path);
  }
  
  const fields = getArrayProp(params, 'fields');
  if (fields !== undefined) {
    fields.forEach((field, index) => {
      validateExtractField(field, index, path);
    });
  }
  
  const timeout = getNumberProp(params, 'timeout');
  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new ConfigValidationError('timeout doit être un nombre', path);
  }
}

/**
 * Valide les paramètres d'une action session-load
 */
function validateSessionLoadParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;

  validateRequiredField<string>(getStringProp(params, 'sessionName'), 'sessionName', path);

  const sessionsDir = getStringProp(params, 'sessionsDir');
  if (sessionsDir !== undefined && typeof sessionsDir !== 'string') {
    throw new ConfigValidationError('sessionsDir doit être une string', path);
  }
}

/**
 * Valide les paramètres d'une action session-save
 */
function validateSessionSaveParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;

  validateRequiredField<string>(getStringProp(params, 'sessionName'), 'sessionName', path);

  const sessionsDir = getStringProp(params, 'sessionsDir');
  if (sessionsDir !== undefined && typeof sessionsDir !== 'string') {
    throw new ConfigValidationError('sessionsDir doit être une string', path);
  }
}

/**
 * Valide les paramètres d'une action loop
 */
function validateLoopParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;

  validateRequiredField<string>(getStringProp(params, 'selector'), 'selector', path);

  const steps = getArrayProp(params, 'steps');
  validateRequiredField<unknown[]>(steps, 'steps', path);

  if (steps.length === 0) {
    throw new ConfigValidationError('steps ne peut pas être vide', `${path}.steps`);
  }

  // Valider chaque étape de la boucle
  steps.forEach((step, index) => {
    validateStep(step, index, `${scraperName}.loop[${stepIndex}]`);
  });

  const max_iterations = getNumberProp(params, 'max_iterations');
  if (max_iterations !== undefined && typeof max_iterations !== 'number') {
    throw new ConfigValidationError('max_iterations doit être un nombre', path);
  }

  const delayBetweenIterations = getNumberProp(params, 'delayBetweenIterations');
  if (delayBetweenIterations !== undefined && typeof delayBetweenIterations !== 'number') {
    throw new ConfigValidationError('delayBetweenIterations doit être un nombre', path);
  }
}

/**
 * Valide les paramètres d'une action navigate-back
 */
function validateNavigateBackParams(params: Record<string, unknown>, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}].params`;

  const count = getNumberProp(params, 'count');
  if (count !== undefined && typeof count !== 'number') {
    throw new ConfigValidationError('count doit être un nombre', path);
  }
}

/**
 * Valide une étape (step)
 */
function validateStep(step: unknown, stepIndex: number, scraperName: string): void {
  const path = `scrapers[${scraperName}].steps[${stepIndex}]`;
  
  if (typeof step !== 'object' || step === null) {
    throw new ConfigValidationError('step doit être un objet', path);
  }
  
  const stepObj = step as Record<string, unknown>;
  const action = getStringProp(stepObj, 'action');
  const params = stepObj.params as Record<string, unknown> | undefined;
  
  // Valider l'action
  validateRequiredField<string>(action, 'action', path);
  
  if (!VALID_ACTIONS.includes(action as ActionType)) {
    throw new ConfigValidationError(
      `Action invalide: ${action}`,
      `${path}.action`,
      `Une de: ${VALID_ACTIONS.join(', ')}`
    );
  }
  
  if (!params || typeof params !== 'object') {
    throw new ConfigValidationError('params doit être un objet', `${path}.params`);
  }
  
  // Valider les paramètres selon le type d'action
  const actionType = action as ActionType;
  switch (actionType) {
    case 'navigate':
      validateNavigateParams(params, stepIndex, scraperName);
      break;
    case 'wait':
      validateWaitParams(params, stepIndex, scraperName);
      break;
    case 'click':
      validateClickParams(params, stepIndex, scraperName);
      break;
    case 'fill':
      validateFillParams(params, stepIndex, scraperName);
      break;
    case 'extract':
      validateExtractParams(params, stepIndex, scraperName);
      break;
    case 'paginate':
      validatePaginateParams(params, stepIndex, scraperName);
      break;
    case 'session-load':
      validateSessionLoadParams(params, stepIndex, scraperName);
      break;
    case 'session-save':
      validateSessionSaveParams(params, stepIndex, scraperName);
      break;
    case 'loop':
      validateLoopParams(params, stepIndex, scraperName);
      break;
    case 'navigate-back':
      validateNavigateBackParams(params, stepIndex, scraperName);
      break;
  }
}

/**
 * Valide un scraper
 */
function validateScraper(scraper: unknown, scraperIndex: number): void {
  const path = `scrapers[${scraperIndex}]`;
  
  if (typeof scraper !== 'object' || scraper === null) {
    throw new ConfigValidationError('scraper doit être un objet', path);
  }
  
  const scraperObj = scraper as Record<string, unknown>;
  const name = getStringProp(scraperObj, 'name');
  const url = getStringProp(scraperObj, 'url');
  const steps = getArrayProp(scraperObj, 'steps');
  const headless = getBooleanProp(scraperObj, 'headless');
  const viewport = scraperObj.viewport as Record<string, unknown> | undefined;
  
  // Champs obligatoires
  validateRequiredField<string>(name, 'name', path);
  validateRequiredField<string>(url, 'url', path);
  validateRequiredField<unknown[]>(steps, 'steps', path);
  
  if (steps.length === 0) {
    throw new ConfigValidationError('steps ne peut pas être vide', `${path}.steps`);
  }
  
  // Champs optionnels
  if (headless !== undefined && typeof headless !== 'boolean') {
    throw new ConfigValidationError('headless doit être un boolean', `${path}.headless`);
  }
  
  if (viewport !== undefined) {
    if (typeof viewport !== 'object' || viewport === null) {
      throw new ConfigValidationError('viewport doit être un objet', `${path}.viewport`);
    }
    const width = getNumberProp(viewport, 'width');
    const height = getNumberProp(viewport, 'height');
    validateRequiredField<number>(width, 'width', `${path}.viewport`);
    validateRequiredField<number>(height, 'height', `${path}.viewport`);
  }
  
  // Valider chaque étape
  steps.forEach((step, index) => {
    validateStep(step, index, name);
  });
}

/**
 * Valide la configuration complète
 */
export function validateConfig(config: unknown): asserts config is ScraperConfig {
  if (typeof config !== 'object' || config === null) {
    throw new ConfigValidationError('La configuration doit être un objet', 'root');
  }
  
  const configObj = config as Record<string, unknown>;
  const concurrency = getNumberProp(configObj, 'concurrency');
  const output_dir = getStringProp(configObj, 'output_dir');
  const scrapers = getArrayProp(configObj, 'scrapers');
  
  // Champs optionnels
  if (concurrency !== undefined) {
    if (concurrency < 1) {
      throw new ConfigValidationError(
        'concurrency doit être >= 1',
        'root.concurrency',
        'nombre positif'
      );
    }
  }
  
  // Champ obligatoire
  validateRequiredField<unknown[]>(scrapers, 'scrapers', 'root');
  
  if (scrapers.length === 0) {
    throw new ConfigValidationError('scrapers ne peut pas être vide', 'root.scrapers');
  }
  
  // Valider chaque scraper
  scrapers.forEach((scraper, index) => {
    validateScraper(scraper, index);
  });
}

/**
 * Charge et valide un fichier de configuration
 */
export async function loadConfig(filePath: string): Promise<ScraperConfig> {
  const rawConfig = await loadYamlFile<Record<string, unknown>>(filePath);
  validateConfig(rawConfig);
  return rawConfig as ScraperConfig;
}

/**
 * Applique les valeurs par défaut à la configuration
 */
export function applyDefaults(config: ScraperConfig): ScraperConfig {
  return {
    ...config,
    concurrency: config.concurrency ?? 5,
    output_dir: config.output_dir ?? './results',
    scrapers: config.scrapers.map(scraper => ({
      ...scraper,
      headless: scraper.headless ?? true,
      viewport: scraper.viewport ?? { width: 1920, height: 1080 },
    })),
  };
}
