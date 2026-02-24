/**
 * Converter — Types partagés
 * Définit les interfaces pour la conversion Code → YAML
 */

import type { ActionType, ExtractField } from '../types';

/**
 * Étape convertie avec options
 */
export interface ConvertedStep {
  action: ActionType;
  params: Record<string, unknown>;
  options?: StepOptions;
}

/**
 * Options d'une étape
 */
export interface StepOptions {
  optional?: boolean;
  timeout?: number;
  retry?: RetryConfig;
  minCount?: number;
}

/**
 * Configuration de retry
 */
export interface RetryConfig {
  maxAttempts: number;
  backoffFactor: number;
}

/**
 * Configuration convertie complète
 */
export interface ConvertedConfig {
  name: string;
  url: string;
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  steps: ConvertedStep[];
  metadata?: {
    recordedAt: string;
    playwrightVersion: string;
    optimizerVersion: string;
  };
}

/**
 * Résultat de l'analyse d'un statement
 */
export interface StatementAnalysis {
  type: ActionType | 'unknown';
  selector?: string;
  url?: string;
  value?: string;
  fields?: ExtractField[];
  isOptional?: boolean;
  timeout?: number;
  attribute?: string;
  role?: string;
  roleOptions?: RoleOptions;
}

/**
 * Options pour les sélecteurs par rôle
 */
export interface RoleOptions {
  name?: string;
  level?: number;
  checked?: boolean;
  pressed?: boolean;
  disabled?: boolean;
}

/**
 * Sélecteur optimisé avec score de confiance
 */
export interface OptimizedSelector {
  original: string;
  optimized: string;
  strategy: 'role' | 'aria' | 'css' | 'text';
  confidence: number;
}
