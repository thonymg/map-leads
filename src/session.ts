/**
 * Session Manager
 * Gère les sessions et cookies pour les sites nécessitant une authentification
 */

import type { BrowserContext } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Cookie navigateur
 */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}

/**
 * État de session complet
 */
export interface SessionState {
  cookies: Cookie[];
  origins: OriginState[];
  savedAt: string;
  expiresAt?: string;
}

/**
 * État d'un origine (localStorage)
 */
export interface OriginState {
  origin: string;
  localStorage: Record<string, string>;
}

/**
 * Configuration de session
 */
export interface SessionConfig {
  /** Nom de la session */
  name: string;
  /** Dossier de stockage */
  sessionsDir?: string;
  /** Durée de vie en secondes (défaut: 24h) */
  maxAge?: number;
  /** Valider la session avant utilisation */
  validate?: boolean;
}

/**
 * Gestionnaire de sessions
 */
export class SessionManager {
  private readonly sessionsDir: string;
  private readonly maxAge: number;

  constructor(sessionsDir: string = './sessions', maxAge: number = 86400) {
    this.sessionsDir = sessionsDir;
    this.maxAge = maxAge;

    // Créer le dossier s'il n'existe pas
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
  }

  /**
   * Sauvegarde l'état de session d'un contexte
   */
  async saveSession(context: BrowserContext, sessionName: string): Promise<string> {
    const filePath = join(this.sessionsDir, `${sessionName}.json`);

    try {
      // Récupérer les cookies
      const cookies = await context.cookies();

      // Récupérer le storage state (localStorage)
      const storageState = await context.storageState();

      // Convertir les origins vers notre type
      const origins: OriginState[] = storageState.origins.map(origin => ({
        origin: origin.origin,
        localStorage: Object.fromEntries(
          (origin.localStorage || []).map(item => [item.name, item.value])
        ),
      }));

      // Créer l'état de session
      const state: SessionState = {
        cookies,
        origins,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.maxAge * 1000).toISOString(),
      };

      // Sauvegarder
      writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');

      console.log(`✅ Session sauvegardée: ${filePath}`);
      return filePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Échec de la sauvegarde de session: ${errorMessage}`);
    }
  }

  /**
   * Charge une session existante dans un contexte
   */
  async loadSession(context: BrowserContext, sessionName: string): Promise<boolean> {
    const filePath = join(this.sessionsDir, `${sessionName}.json`);

    if (!existsSync(filePath)) {
      console.log(`⚠️  Session non trouvée: ${filePath}`);
      return false;
    }

    try {
      const state: SessionState = JSON.parse(readFileSync(filePath, 'utf-8'));

      // Vérifier l'expiration
      if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
        console.log(`⚠️  Session expirée: ${sessionName}`);
        return false;
      }

      // Ajouter les cookies
      await context.addCookies(state.cookies);

      // Ajouter le localStorage via une page temporaire
      for (const origin of state.origins) {
        try {
          const page = await context.newPage();
          await page.goto(origin.origin, { waitUntil: 'commit' });
          await page.evaluate((storage) => {
            Object.entries(storage).forEach(([key, value]) => {
              try {
                localStorage.setItem(key, value);
              } catch (e) {
                // Ignorer les erreurs de localStorage
              }
            });
          }, origin.localStorage);
          await page.close();
        } catch (e) {
          // Continuer même si une origine échoue
        }
      }

      console.log(`✅ Session chargée: ${filePath}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`❌ Erreur lors du chargement: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Vérifie si une session existe et n'est pas expirée
   */
  hasValidSession(sessionName: string): boolean {
    const filePath = join(this.sessionsDir, `${sessionName}.json`);

    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const state: SessionState = JSON.parse(readFileSync(filePath, 'utf-8'));

      // Vérifier l'expiration
      if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
        return false;
      }

      // Vérifier que les cookies ne sont pas vides
      if (!state.cookies || state.cookies.length === 0) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Supprime une session
   */
  deleteSession(sessionName: string): boolean {
    const filePath = join(this.sessionsDir, `${sessionName}.json`);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`🗑️  Session supprimée: ${sessionName}`);
      return true;
    }

    return false;
  }

  /**
   * Liste les sessions disponibles
   */
  listSessions(): string[] {
    if (!existsSync(this.sessionsDir)) {
      return [];
    }

    const files = readdirSync(this.sessionsDir);
    return files
      .filter((f: string) => f.endsWith('.json'))
      .map((f: string) => f.replace('.json', ''));
  }

  /**
   * Liste les fichiers de session
   */
  listFiles(): string[] {
    return this.listSessions();
  }

  /**
   * Exporte les cookies vers un fichier
   */
  async exportCookies(context: BrowserContext, outputFile: string): Promise<void> {
    const cookies = await context.cookies();
    writeFileSync(outputFile, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log(`🍪 Cookies exportés: ${outputFile}`);
  }

  /**
   * Importe des cookies depuis un fichier
   */
  async importCookies(context: BrowserContext, inputFile: string): Promise<void> {
    if (!existsSync(inputFile)) {
      throw new Error(`Fichier de cookies introuvable: ${inputFile}`);
    }

    const cookies: Cookie[] = JSON.parse(readFileSync(inputFile, 'utf-8'));
    await context.addCookies(cookies);
    console.log(`🍪 Cookies importés: ${inputFile}`);
  }

  /**
   * Nettoie les sessions expirées
   */
  cleanupExpiredSessions(): number {
    const sessions = this.listFiles();
    let cleaned = 0;

    for (const session of sessions) {
      if (!this.hasValidSession(session)) {
        this.deleteSession(session);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} session(s) expirée(s) supprimée(s)`);
    }

    return cleaned;
  }
}

/**
 * Instance globale du gestionnaire de sessions
 */
let globalSessionManager: SessionManager | null = null;

/**
 * Obtient l'instance globale du gestionnaire de sessions
 */
export function getSessionManager(sessionsDir?: string, maxAge?: number): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager(sessionsDir, maxAge);
  }
  return globalSessionManager;
}
