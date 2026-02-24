/**
 * Logger
 * Logs structurés avec horodatage pour chaque action
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Logger, LoggerConfig } from './types.ts';

/**
 * Niveau de log
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

/**
 * Entrée de log structurée
 */
interface LogEntry {
  /** Horodatage ISO */
  timestamp: string;
  /** Niveau de log */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Message */
  message: string;
  /** Données additionnelles */
  data?: Record<string, unknown>;
  /** Nom du scraper */
  scraper?: string;
}

/**
 * Formate une entrée de log en JSON
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Classe Logger implémentant l'interface Logger
 */
export class StructuredLogger implements Logger {
  private config: LoggerConfig;
  private logBuffer: string[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Vérifie si le niveau de log est suffisant pour logger
   */
  private shouldLog(level: string): boolean {
    const configLevel = LOG_LEVELS[this.config.level];
    const messageLevel = LOG_LEVELS[level as keyof typeof LOG_LEVELS];
    return messageLevel >= configLevel;
  }

  /**
   * Crée une entrée de log
   */
  private createEntry(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      scraper: this.config.scraperName,
    };
  }

  /**
   * Écrit un log dans le fichier
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    const logDir = this.config.logDir;

    // S'assurer que le dossier existe
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }

    // Nom du fichier par date
    const date = entry.timestamp.split('T')[0];
    const logFile = join(logDir, `${date}.log`);

    // Ajouter au buffer
    this.logBuffer.push(formatLogEntry(entry));

    // Flush immédiat pour les erreurs, différé pour les autres
    if (entry.level === 'error') {
      await this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush().catch(console.error);
        this.flushTimer = null;
      }, 1000);
    }
  }

  /**
   * Flush le buffer de logs vers le fichier
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logDir = this.config.logDir;
    const date = new Date().toISOString().split('T')[0];
    const logFile = join(logDir, `${date}.log`);

    const content = this.logBuffer.map(entry => entry + '\n').join('');
    
    await writeFile(logFile, content, 'utf-8');
    this.logBuffer = [];
  }

  /**
   * Log un message de niveau debug
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createEntry('debug', message, data);
    console.debug(`[DEBUG] ${message}`, data ?? '');
    this.writeLog(entry).catch(console.error);
  }

  /**
   * Log un message de niveau info
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createEntry('info', message, data);
    console.info(`[INFO] ${message}`, data ?? '');
    this.writeLog(entry).catch(console.error);
  }

  /**
   * Log un message de niveau warn
   */
  warn(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createEntry('warn', message, data);
    console.warn(`[WARN] ${message}`, data ?? '');
    this.writeLog(entry).catch(console.error);
  }

  /**
   * Log un message de niveau error
   */
  error(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createEntry('error', message, data);
    console.error(`[ERROR] ${message}`, data ?? '');
    this.writeLog(entry).catch(console.error);
  }

  /**
   * Flush final avant la fin de l'exécution
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    await this.flush();
  }
}

/**
 * Crée une instance de logger
 */
export function createLogger(config: LoggerConfig): Logger {
  return new StructuredLogger(config);
}
