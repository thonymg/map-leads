/**
 * Retry Utility
 * Retry automatique en cas d'erreur réseau avec backoff exponentiel (CA-38)
 */

/**
 * Options de retry
 */
export interface RetryOptions {
  /** Nombre maximum de tentatives (défaut: 3) */
  maxAttempts?: number;
  /** Délai initial en ms (défaut: 1000) */
  baseDelay?: number;
  /** Facteur de backoff (défaut: 2) */
  backoffFactor?: number;
  /** Délai maximum en ms (défaut: 30000) */
  maxDelay?: number;
  /** Fonction pour déterminer si l'erreur est retryable */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Délai en ms
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Vérifie si une erreur est retryable (erreur réseau, timeout, etc.)
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  
  // Erreurs réseau courantes
  const retryablePatterns = [
    'network',
    'timeout',
    'econnrefused',
    'econnreset',
    'enetunreach',
    'socket hang up',
    'temporary failure in name resolution',
    'etimedout',
    'epipe',
    'abort',
  ];

  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Calcule le délai avec backoff exponentiel
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  backoffFactor: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  // Ajouter un jitter aléatoire (±20%) pour éviter le thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Exécute une fonction avec retry automatique en cas d'erreur
 * @param fn - Fonction à exécuter
 * @param options - Options de retry
 * @returns Résultat de la fonction
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    backoffFactor = 2,
    maxDelay = 30000,
    isRetryable = isNetworkError,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Vérifier si l'erreur est retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // Dernière tentative, ne pas retry
      if (attempt === maxAttempts) {
        throw error;
      }

      // Attendre avant la prochaine tentative
      const retryDelay = calculateDelay(attempt, baseDelay, backoffFactor, maxDelay);
      await delay(retryDelay);
    }
  }

  // Ne devrait jamais arriver, mais TypeScript n'est pas sûr
  throw lastError;
}

/**
 * Wrapper pour ajouter le retry à une fonction
 */
export function retryable<T extends (...args: unknown[]) => Promise<unknown>>(
  options: RetryOptions = {}
) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
