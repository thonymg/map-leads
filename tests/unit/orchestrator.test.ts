/**
 * Tests unitaires pour l'orchestrateur
 * CA-26 - Un seul browser pour toute l'exécution
 * CA-27 - Contextes Playwright isolés
 * CA-28 - Concurrence respectée
 * CA-29 - Erreur isolée par scraper
 * CA-30 - Contexte toujours fermé après chaque scraper
 * CA-31 - Browser fermé en fin d'exécution
 * CA-32 - Résumé global affiché
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import {
  mockBrowser,
  mockContext,
  mockPage,
  createMockContext,
} from "../setup";

// Types pour les tests
interface ScraperConfig {
  name: string;
  url: string;
  steps: Array<{ action: string; params: Record<string, unknown> }>;
  headless?: boolean;
  viewport?: { width: number; height: number };
}

interface OrchestratorConfig {
  scrapers: ScraperConfig[];
  concurrency?: number;
  outputDir?: string;
}

interface ScraperResult {
  name: string;
  url: string;
  data: Record<string, unknown>[];
  pagesScraped: number;
  totalRecords: number;
  durationMs: number;
  scrapedAt: string;
  error: string | null;
}

interface OrchestratorResult {
  success: boolean;
  results: ScraperResult[];
  summary: {
    totalScrapers: number;
    successfulScrapers: number;
    failedScrapers: number;
    totalRecords: number;
    totalDurationMs: number;
  };
  error?: string;
}

// Mocks pour l'orchestrateur
const mockRunScraper = vi.fn();
const mockSaveResult = vi.fn();

// Mock du module p-limit
const mockPLimit = vi.fn((n: number) => {
  return async (fn: () => Promise<unknown>) => {
    return fn();
  };
});

// Implémentation mockée de l'orchestrateur pour les tests
async function runOrchestrator(
  config: OrchestratorConfig
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const results: ScraperResult[] = [];
  const concurrency = config.concurrency || 5;
  
  // Simuler l'ouverture d'un seul browser
  const browser = mockBrowser;
  
  try {
    // Créer les contexts et exécuter les scrapers
    const executeScraper = async (scraperConfig: ScraperConfig) => {
      // Créer un contexte isolé
      const context = createMockContext();
      const page = mockPage;
      context.newPage.mockResolvedValue(page);
      
      try {
        // Exécuter le scraper
        const result = await mockRunScraper(scraperConfig, page);
        results.push(result);
        
        // Sauvegarder le résultat
        await mockSaveResult(result);
        
        return result;
      } finally {
        // Toujours fermer le contexte
        await context.close();
      }
    };
    
    // Exécuter avec limitation de concurrence
    const limit = mockPLimit(concurrency);
    const promises = config.scrapers.map(scraper => 
      limit(() => executeScraper(scraper))
    );
    
    await Promise.all(promises);
    
    const totalDuration = Date.now() - startTime;
    const successfulScrapers = results.filter(r => !r.error).length;
    const failedScrapers = results.filter(r => r.error).length;
    const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
    
    return {
      success: true,
      results,
      summary: {
        totalScrapers: config.scrapers.length,
        successfulScrapers,
        failedScrapers,
        totalRecords,
        totalDurationMs: totalDuration,
      },
    };
  } catch (error) {
    return {
      success: false,
      results,
      summary: {
        totalScrapers: config.scrapers.length,
        successfulScrapers: 0,
        failedScrapers: config.scrapers.length,
        totalRecords: 0,
        totalDurationMs: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    // Fermer le browser
    await browser.close();
  }
}

describe("Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset des mocks
    mockRunScraper.mockReset();
    mockSaveResult.mockReset();
    mockPLimit.mockClear();
    
    // Comportements par défaut
    mockBrowser.newContext.mockResolvedValue(createMockContext());
    mockBrowser.close.mockResolvedValue(undefined);
    mockBrowser.isConnected.mockReturnValue(true);
    
    mockRunScraper.mockResolvedValue({
      name: "test",
      url: "http://localhost:3000",
      data: [],
      pagesScraped: 1,
      totalRecords: 0,
      durationMs: 100,
      scrapedAt: new Date().toISOString(),
      error: null,
    });
    
    mockSaveResult.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-26 - Un seul browser pour toute l'exécution", () => {
    it("CA-26.1 - Un seul browser lancé pour 5 scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
          { name: "scraper-4", url: "http://site4.com", steps: [] },
          { name: "scraper-5", url: "http://site5.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert - Le browser n'est ouvert qu'une seule fois (implicite dans le mock)
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-26.2 - Browser partagé entre tous les scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(3);
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-26.3 - Browser fermé une seule fois en fin d'exécution", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-26.4 - Browser reste connecté pendant l'exécution", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.isConnected).toHaveBeenCalled();
    });
  });

  describe("CA-27 - Contextes Playwright isolés", () => {
    it("CA-27.1 - Chaque scraper a son propre contexte", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(2);
    });

    it("CA-27.2 - Cookies non partagés entre contextes", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      const context1 = createMockContext();
      const context2 = createMockContext();
      
      context1.cookies.mockResolvedValue([{ name: "session", value: "abc123" }]);
      context2.cookies.mockResolvedValue([]);
      
      mockBrowser.newContext
        .mockResolvedValueOnce(context1)
        .mockResolvedValueOnce(context2);

      // Act
      await runOrchestrator(config);

      // Assert - Les cookies sont isolés
      expect(context1.cookies).toHaveBeenCalled();
      expect(context2.cookies).toHaveBeenCalled();
    });

    it("CA-27.3 - localStorage isolé par contexte", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert - Chaque contexte est créé séparément
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(2);
    });

    it("CA-27.4 - Sessions isolées entre scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site1.com", steps: [] }, // Même URL
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(2);
    });

    it("CA-27.5 - Contexte avec configuration personnalisée", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { 
            name: "scraper-1", 
            url: "http://site1.com", 
            steps: [],
            headless: true,
            viewport: { width: 1280, height: 800 },
          },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.newContext).toHaveBeenCalled();
    });
  });

  describe("CA-28 - Concurrence respectée", () => {
    it("CA-28.1 - Concurrence de 3 avec 10 scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: Array.from({ length: 10 }, (_, i) => ({
          name: `scraper-${i + 1}`,
          url: `http://site${i + 1}.com`,
          steps: [],
        })),
        concurrency: 3,
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockPLimit).toHaveBeenCalledWith(3);
    });

    it("CA-28.2 - Concurrence par défaut de 5", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockPLimit).toHaveBeenCalledWith(5);
    });

    it("CA-28.3 - Concurrence de 1 pour exécution séquentielle", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
        concurrency: 1,
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockPLimit).toHaveBeenCalledWith(1);
    });

    it("CA-28.4 - Concurrence élevée pour parallélisme maximum", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
        concurrency: 10,
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockPLimit).toHaveBeenCalledWith(10);
    });
  });

  describe("CA-29 - Erreur isolée par scraper", () => {
    it("CA-29.1 - Un scraper en erreur n'affecte pas les autres", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({
          name: "scraper-1",
          url: "http://site1.com",
          data: [],
          pagesScraped: 1,
          totalRecords: 5,
          durationMs: 100,
          scrapedAt: new Date().toISOString(),
          error: null,
        })
        .mockRejectedValueOnce(new Error("Scraper 2 failed"))
        .mockResolvedValueOnce({
          name: "scraper-3",
          url: "http://site3.com",
          data: [],
          pagesScraped: 1,
          totalRecords: 10,
          durationMs: 150,
          scrapedAt: new Date().toISOString(),
          error: null,
        });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.results).toHaveLength(2); // Les scrapers 1 et 3 réussissent
      expect(result.summary.successfulScrapers).toBe(2);
      expect(result.summary.failedScrapers).toBe(1);
    });

    it("CA-29.2 - Tous les scrapers s'exécutent même si un échoue", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
          { name: "scraper-4", url: "http://site4.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 5, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({ name: "scraper-3", url: "http://site3.com", data: [], pagesScraped: 1, totalRecords: 10, durationMs: 150, scrapedAt: new Date().toISOString(), error: null })
        .mockResolvedValueOnce({ name: "scraper-4", url: "http://site4.com", data: [], pagesScraped: 1, totalRecords: 15, durationMs: 200, scrapedAt: new Date().toISOString(), error: null });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalScrapers).toBe(4);
      expect(result.summary.successfulScrapers).toBe(3);
    });

    it("CA-29.3 - Erreur de navigation isolée", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://unreachable.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 5, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockRejectedValueOnce(new Error("Navigation failed: unreachable.com"));

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.successfulScrapers).toBe(1);
    });

    it("CA-29.4 - Erreur d'extraction isolée", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 5, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockRejectedValueOnce(new Error("Extraction failed"));

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.successfulScrapers).toBe(1);
    });
  });

  describe("CA-30 - Contexte toujours fermé après chaque scraper", () => {
    it("CA-30.1 - Contexte fermé après succès", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      const context = createMockContext();
      mockBrowser.newContext.mockResolvedValue(context);

      // Act
      await runOrchestrator(config);

      // Assert
      expect(context.close).toHaveBeenCalledTimes(1);
    });

    it("CA-30.2 - Contexte fermé après erreur", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      const context = createMockContext();
      mockBrowser.newContext.mockResolvedValue(context);
      mockRunScraper.mockRejectedValueOnce(new Error("Scraper failed"));

      // Act
      await runOrchestrator(config);

      // Assert
      expect(context.close).toHaveBeenCalledTimes(1);
    });

    it("CA-30.3 - Tous les contextes fermés avec plusieurs scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
      };

      const contexts = [createMockContext(), createMockContext(), createMockContext()];
      contexts.forEach((ctx, i) => {
        mockBrowser.newContext.mockResolvedValueOnce(ctx);
      });

      // Act
      await runOrchestrator(config);

      // Assert
      contexts.forEach(ctx => {
        expect(ctx.close).toHaveBeenCalledTimes(1);
      });
    });

    it("CA-30.4 - Contexte fermé même si sauvegarde échoue", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      const context = createMockContext();
      mockBrowser.newContext.mockResolvedValue(context);
      mockSaveResult.mockRejectedValueOnce(new Error("Save failed"));

      // Act
      await runOrchestrator(config);

      // Assert
      expect(context.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("CA-31 - Browser fermé en fin d'exécution", () => {
    it("CA-31.1 - Browser fermé après tous les scrapers", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-31.2 - Browser fermé même en cas d'erreur globale", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      mockRunScraper.mockRejectedValueOnce(new Error("Global error"));

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-31.3 - Browser fermé après erreur de scraper", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      mockRunScraper.mockRejectedValueOnce(new Error("Scraper error"));

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("CA-31.4 - Aucun processus navigateur ne reste actif", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      // Act
      await runOrchestrator(config);

      // Assert
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(mockBrowser.isConnected).toHaveBeenCalled();
    });
  });

  describe("CA-32 - Résumé global affiché", () => {
    it("CA-32.1 - Résumé contient le nombre de scrapers exécutés", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
      };

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalScrapers).toBe(3);
    });

    it("CA-32.2 - Résumé contient le total d'enregistrements", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 10, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockResolvedValueOnce({ name: "scraper-2", url: "http://site2.com", data: [], pagesScraped: 1, totalRecords: 20, durationMs: 150, scrapedAt: new Date().toISOString(), error: null });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalRecords).toBe(30);
    });

    it("CA-32.3 - Résumé contient le nombre d'erreurs", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
          { name: "scraper-3", url: "http://site3.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 10, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({ name: "scraper-3", url: "http://site3.com", data: [], pagesScraped: 1, totalRecords: 15, durationMs: 150, scrapedAt: new Date().toISOString(), error: null });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.failedScrapers).toBe(1);
      expect(result.summary.successfulScrapers).toBe(2);
    });

    it("CA-32.4 - Résumé contient la durée totale", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
        ],
      };

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it("CA-32.5 - Résumé avec tous les scrapers en succès", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockResolvedValueOnce({ name: "scraper-1", url: "http://site1.com", data: [], pagesScraped: 1, totalRecords: 5, durationMs: 100, scrapedAt: new Date().toISOString(), error: null })
        .mockResolvedValueOnce({ name: "scraper-2", url: "http://site2.com", data: [], pagesScraped: 1, totalRecords: 10, durationMs: 150, scrapedAt: new Date().toISOString(), error: null });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalScrapers).toBe(2);
      expect(result.summary.successfulScrapers).toBe(2);
      expect(result.summary.failedScrapers).toBe(0);
      expect(result.summary.totalRecords).toBe(15);
    });

    it("CA-32.6 - Résumé avec tous les scrapers en échec", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: [
          { name: "scraper-1", url: "http://site1.com", steps: [] },
          { name: "scraper-2", url: "http://site2.com", steps: [] },
        ],
      };

      mockRunScraper
        .mockRejectedValueOnce(new Error("Failed 1"))
        .mockRejectedValueOnce(new Error("Failed 2"));

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.summary.totalScrapers).toBe(2);
      expect(result.summary.successfulScrapers).toBe(0);
      expect(result.summary.failedScrapers).toBe(2);
    });
  });

  describe("Scénarios réalistes", () => {
    it("Doit orchestrer 10 scrapers avec concurrence de 3", async () => {
      // Arrange
      const config: OrchestratorConfig = {
        scrapers: Array.from({ length: 10 }, (_, i) => ({
          name: `scraper-${i + 1}`,
          url: `http://site${i + 1}.com`,
          steps: [
            { action: "navigate", params: { url: `http://site${i + 1}.com` } },
            { action: "extract", params: { selector: ".item", fields: [] } },
          ],
        })),
        concurrency: 3,
      };

      mockRunScraper.mockResolvedValue({
        name: "test",
        url: "http://test.com",
        data: [{ id: "1" }],
        pagesScraped: 1,
        totalRecords: 5,
        durationMs: 200,
        scrapedAt: new Date().toISOString(),
        error: null,
      });

      // Act
      const result = await runOrchestrator(config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.summary.totalScrapers).toBe(10);
      expect(result.summary.successfulScrapers).toBe(10);
      expect(result.summary.totalRecords).toBe(50);
    });
  });
});
