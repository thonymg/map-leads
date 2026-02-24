/**
 * Action: Login
 * Connexion automatique à un site avec authentification
 */

import { Page } from 'playwright';
import type { ActionResult } from '../types';

/**
 * Paramètres de l'action de login
 */
export interface LoginParams {
  /** URL de la page de connexion */
  loginUrl: string;
  /** Sélecteur du champ email/username */
  emailSelector: string;
  /** Sélecteur du champ mot de passe */
  passwordSelector: string;
  /** Sélecteur du bouton de soumission */
  submitSelector: string;
  /** Sélecteur pour vérifier la connexion réussie */
  successSelector?: string;
  /** Timeout en millisecondes */
  timeout?: number;
  /** Délai après connexion (ms) */
  delayAfter?: number;
}

/**
 * Exécute l'action de connexion
 * Utilise les variables d'environnement LINKEDIN_EMAIL et LINKEDIN_PASSWORD
 */
export async function login(params: LoginParams, page: Page): Promise<ActionResult> {
  const {
    loginUrl,
    emailSelector,
    passwordSelector,
    submitSelector,
    successSelector,
    timeout = 30000,
    delayAfter = 2000,
  } = params;

  try {
    // Récupérer les credentials depuis les variables d'environnement
    const email = process.env.LOGIN_EMAIL || process.env.LINKEDIN_EMAIL;
    const password = process.env.LOGIN_PASSWORD || process.env.LINKEDIN_PASSWORD;

    if (!email || !password) {
      return {
        success: false,
        message: 'Credentials manquants: définissez LOGIN_EMAIL et LOGIN_PASSWORD',
      };
    }

    // Navigation vers la page de connexion
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout });

    // Attendre que le formulaire soit visible
    await page.waitForSelector(emailSelector, { state: 'visible', timeout });

    // Remplir l'email
    const emailInput = await page.$(emailSelector);
    if (!emailInput) {
      return {
        success: false,
        message: `Champ email non trouvé: ${emailSelector}`,
      };
    }
    await emailInput.fill(email);

    // Remplir le mot de passe
    const passwordInput = await page.$(passwordSelector);
    if (!passwordInput) {
      return {
        success: false,
        message: `Champ mot de passe non trouvé: ${passwordSelector}`,
      };
    }
    await passwordInput.fill(password);

    // Cliquer sur le bouton de connexion
    const submitButton = await page.$(submitSelector);
    if (!submitButton) {
      return {
        success: false,
        message: `Bouton de connexion non trouvé: ${submitSelector}`,
      };
    }

    // Cliquer et attendre
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout }),
      submitButton.click(),
    ]);

    // Délai après connexion
    if (delayAfter > 0) {
      await page.waitForTimeout(delayAfter);
    }

    // Vérifier la connexion
    if (successSelector) {
      const successElement = await page.$(successSelector);
      if (!successElement) {
        return {
          success: false,
          message: 'Échec de la connexion (sélecteur de succès non trouvé)',
        };
      }
    }

    return {
      success: true,
      message: 'Connexion réussie',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Erreur lors de la connexion: ${errorMessage}`,
    };
  }
}

/**
 * Action: Session Load
 * Charge une session existante
 */
export interface SessionLoadParams {
  /** Nom de la session */
  sessionName: string;
  /** Dossier des sessions */
  sessionsDir?: string;
}

export async function sessionLoad(
  params: SessionLoadParams,
  page: Page
): Promise<ActionResult> {
  const { sessionName, sessionsDir = './sessions' } = params;

  try {
    const { SessionManager } = await import('./session');
    const manager = new SessionManager(sessionsDir);

    const loaded = await manager.loadSession(page.context(), sessionName);

    if (!loaded) {
      return {
        success: false,
        message: `Session "${sessionName}" non trouvée`,
      };
    }

    return {
      success: true,
      message: `Session "${sessionName}" chargée`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Erreur lors du chargement de la session: ${errorMessage}`,
    };
  }
}

/**
 * Action: Session Save
 * Sauvegarde la session actuelle
 */
export interface SessionSaveParams {
  /** Nom de la session */
  sessionName: string;
  /** Dossier des sessions */
  sessionsDir?: string;
}

export async function sessionSave(
  params: SessionSaveParams,
  page: Page
): Promise<ActionResult> {
  const { sessionName, sessionsDir = './sessions' } = params;

  try {
    const { SessionManager } = await import('./session');
    const manager = new SessionManager(sessionsDir);

    await manager.saveSession(page.context(), sessionName);

    return {
      success: true,
      message: `Session "${sessionName}" sauvegardée`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Erreur lors de la sauvegarde de la session: ${errorMessage}`,
    };
  }
}

/**
 * Action: Session Check
 * Vérifie si une session est valide
 */
export async function sessionCheck(
  params: SessionLoadParams,
  page: Page
): Promise<ActionResult> {
  const { sessionName, sessionsDir = './sessions' } = params;

  try {
    const { SessionManager } = await import('./session');
    const manager = new SessionManager(sessionsDir);

    const isValid = manager.hasValidSession(sessionName);

    return {
      success: isValid,
      message: isValid ? `Session "${sessionName}" valide` : `Session "${sessionName}" invalide ou expirée`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      message: `Erreur lors de la vérification de la session: ${errorMessage}`,
    };
  }
}
