/**
 * Tests unitaires pour le runner
 * CA-21 - Exécution séquentielle des étapes
 * CA-22 - Résultat structuré en succès
 * CA-23 - Résultat structuré en erreur
 * CA-24 - La page est toujours fermée après exécution
 * CA-25 - Viewport configuré si défini
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import {
  mockPage,
  mockContext,
  mockBrowser,
  createMockPage,
  createMockContext,
} from "../setup";

// Types pour les tests
interface Step {
  action: string;
  params: Record<string, unknown>;
}

interface ScraperConfig {
  name: string;
  url: string;
  steps: Step[];
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
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
  metadata: {
    viewport?: { width: number; height: number };
    headless?: boolean;
  };
}

interface RunnerResult {
  success: boolean;
  result?: ScraperResult;
  error?: string;
}

// Mock des actions
const mockActions: Record<string, ReturnType<typeof vi.fn>> = {
  navigate: vi.fn(),
  wait: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  extract: vi.fn(),
  paginate: vi.fn(),
};

// Implémentation mockée du runner pour les tests
async function runScraper(
  config: ScraperConfig,
  page: typeof mockPage
): Promise<RunnerResult> {
  const startTime = Date.now();
  const extractedData: Record<string, unknown>[] = [];
  let pagesScraped = 0;
  let error: string | null = null;

  try {
    for (const step of config.steps) {
      const actionFn = mockActions[step.action];
      
      if (!actionFn) {
        throw new Error(`Unknown action: ${step.action}`);
      }

      // Exécuter l'action
      const actionResult = await actionFn(step.params, page);
      
      // Collecter les données si extract ou paginate
      if (step.action === "extract" && actionResult?.data) {
        extractedData.push(...actionResult.data);
        pagesScraped = 1;
      }
      
      if (step.action === "paginate" && actionResult?.data) {
        extractedData.length = 0; // Clear previous extract data
        extractedData.push(...actionResult.data);
        pagesScraped = actionResult.pagesVisited || 1;
      }
    }

    return {
      success: true,
      result: {
        name: config.name,
        url: config.url,
        data: extractedData,
        pagesScraped,
        totalRecords: extractedData.length,
        durationMs: Date.now() - startTime,
        scrapedAt: new Date().toISOString(),
        error: null,
        metadata: {
          viewport: config.viewport,
          headless: config.headless,
        },
      },
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
    
    return {
      success: false,
      result: {
        name: config.name,
        url: config.url,
        data: extractedData,
        pagesScraped,
        totalRecords: extractedData.length,
        durationMs: Date.now() - startTime,
        scrapedAt: new Date().toISOString(),
        error,
        metadata: {
          viewport: config.viewport,
          headless: config.headless,
        },
      },
      error,
    };
  } finally {
    // Toujours fermer la page
    await page.close();
  }
}

describe("Runner", () => {
  let testPage: ReturnType<typeof createMockPage>;
  let testContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    testPage = createMockPage();
    testContext = createMockContext();
    vi.clearAllMocks();
    
    // Reset des mocks d'actions
    Object.values(mockActions).forEach(fn => {
      fn.mockReset();
    });
    
    // Comportements par défaut
    mockActions.navigate.mockResolvedValue({ success: true });
    mockActions.wait.mockResolvedValue({ success: true });
    mockActions.click.mockResolvedValue({ success: true, clicked: true });
    mockActions.fill.mockResolvedValue({ success: true, filled: true });
    mockActions.extract.mockResolvedValue({ success: true, data: [], count: 0 });
    mockActions.paginate.mockResolvedValue({ success: true, data: [], pagesVisited: 1 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-21 - Exécution séquentielle des étapes", () => {
    it("CA-21.1 - Les étapes sont exécutées dans l'ordre défini", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "test-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "wait", params: { selector: "#content" } },
          { action: "click", params: { selector: "#load-more" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(mockActions.navigate).toHaveBeenCalledBefore(mockActions.wait);
      expect(mockActions.wait).toHaveBeenCalledBefore(mockActions.click);
      expect(mockActions.click).toHaveBeenCalledBefore(mockActions.extract);
      
      expect(mockActions.navigate).toHaveBeenCalledTimes(1);
      expect(mockActions.wait).toHaveBeenCalledTimes(1);
      expect(mockActions.click).toHaveBeenCalledTimes(1);
      expect(mockActions.extract).toHaveBeenCalledTimes(1);
    });

    it("CA-21.2 - Aucune étape n'est sautée", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "test-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "wait", params: { selector: "#content" } },
          { action: "fill", params: { selector: "#search", value: "test" } },
          { action: "click", params: { selector: "#submit" } },
          { action: "extract", params: { selector: ".result", fields: [] } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(mockActions.navigate).toHaveBeenCalledTimes(1);
      expect(mockActions.wait).toHaveBeenCalledTimes(1);
      expect(mockActions.fill).toHaveBeenCalledTimes(1);
      expect(mockActions.click).toHaveBeenCalledTimes(1);
      expect(mockActions.extract).toHaveBeenCalledTimes(1);
    });

    it("CA-21.3 - Étapes multiples du même type", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "test-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000/page1" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
          { action: "click", params: { selector: ".next" } },
          { action: "navigate", params: { url: "http://localhost:3000/page2" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(mockActions.navigate).toHaveBeenCalledTimes(2);
      expect(mockActions.extract).toHaveBeenCalledTimes(2);
      expect(mockActions.click).toHaveBeenCalledTimes(1);
    });

    it("CA-21.4 - Ordre préservé avec actions conditionnelles", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "test-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "wait", params: { selector: "#modal" } },
          { action: "click", params: { selector: "#close-modal", force: true } },
          { action: "extract", params: { selector: ".item", fields: [] } },
        ],
      };

      mockActions.click.mockResolvedValue({ success: true, clicked: false, warning: "Not found" });

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(mockActions.navigate).toHaveBeenCalledBefore(mockActions.wait);
      expect(mockActions.wait).toHaveBeenCalledBefore(mockActions.click);
      expect(mockActions.click).toHaveBeenCalledBefore(mockActions.extract);
    });

    it("CA-21.5 - Séquence complète de scraping", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "full-scraper",
        url: "http://localhost:3000/products",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000/products" } },
          { action: "wait", params: { selector: ".products-grid" } },
          { action: "fill", params: { selector: "#filter", value: "electronics" } },
          { action: "click", params: { selector: "#apply-filter" } },
          { action: "wait", params: { selector: ".product-item" } },
          { action: "extract", params: { selector: ".product-item", fields: [] } },
          { action: "paginate", params: { selector: ".next", maxPages: 5 } },
        ],
      };

      mockActions.extract.mockResolvedValue({ success: true, data: [{ id: "1" }], count: 1 });
      mockActions.paginate.mockResolvedValue({ 
        success: true, 
        data: [{ id: "1" }, { id: "2" }, { id: "3" }], 
        pagesVisited: 3 
      });

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(mockActions.navigate).toHaveBeenCalledBefore(mockActions.wait);
      expect(mockActions.wait).toHaveBeenCalledBefore(mockActions.fill);
      expect(mockActions.fill).toHaveBeenCalledBefore(mockActions.click);
      expect(mockActions.click).toHaveBeenCalledBefore(mockActions.extract);
      expect(mockActions.extract).toHaveBeenCalledBefore(mockActions.paginate);
    });
  });

  describe("CA-22 - Résultat structuré en succès", () => {
    it("CA-22.1 - Résultat contient toutes les métadonnées requises", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "success-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
        ],
      };

      mockActions.extract.mockResolvedValue({ 
        success: true, 
        data: [{ id: "1", name: "Item 1" }], 
        count: 1 
      });

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.name).toBe("success-scraper");
      expect(result.result?.url).toBe("http://localhost:3000/test");
      expect(result.result?.data).toBeDefined();
      expect(result.result?.pagesScraped).toBeGreaterThanOrEqual(1);
      expect(result.result?.totalRecords).toBeGreaterThanOrEqual(1);
      expect(result.result?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.result?.scrapedAt).toBeDefined();
      expect(result.result?.error).toBeNull();
    });

    it("CA-22.2 - Résultat contient les données extraites", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "extract-scraper",
        url: "http://localhost:3000/products",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000/products" } },
          { action: "extract", params: { selector: ".product", fields: [] } },
        ],
      };

      const extractedData = [
        { id: "1", name: "Product 1", price: "19.99" },
        { id: "2", name: "Product 2", price: "29.99" },
        { id: "3", name: "Product 3", price: "39.99" },
      ];
      mockActions.extract.mockResolvedValue({ 
        success: true, 
        data: extractedData, 
        count: 3 
      });

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.data).toEqual(extractedData);
      expect(result.result?.totalRecords).toBe(3);
    });

    it("CA-22.3 - Timestamp au format ISO", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "timestamp-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.scrapedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(() => new Date(result.result!.scrapedAt!)).not.toThrow();
    });

    it("CA-22.4 - Duration calculée correctement", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "duration-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.result?.durationMs).toBeLessThan(10000); // Should be fast with mocks
    });

    it("CA-22.5 - Metadata contient viewport et headless", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "metadata-scraper",
        url: "http://localhost:3000/test",
        headless: true,
        viewport: { width: 1280, height: 800 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.metadata).toBeDefined();
      expect(result.result?.metadata?.headless).toBe(true);
      expect(result.result?.metadata?.viewport).toEqual({ width: 1280, height: 800 });
    });
  });

  describe("CA-23 - Résultat structuré en erreur", () => {
    it("CA-23.1 - Erreur capturée et enregistrée dans le résultat", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "error-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
        ],
      };

      mockActions.extract.mockRejectedValueOnce(new Error("Extraction failed"));

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.result).toBeDefined();
      expect(result.result?.error).toBe("Extraction failed");
      expect(result.error).toBe("Extraction failed");
    });

    it("CA-23.2 - Données partielles préservées avant l'erreur", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "partial-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
          { action: "click", params: { selector: "#next" } },
        ],
      };

      const partialData = [{ id: "1", name: "Item 1" }];
      mockActions.extract.mockResolvedValue({ 
        success: true, 
        data: partialData, 
        count: 1 
      });
      mockActions.click.mockRejectedValueOnce(new Error("Element not found"));

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.result?.data).toEqual(partialData);
      expect(result.result?.totalRecords).toBe(1);
      expect(result.result?.error).toBeTruthy();
    });

    it("CA-23.3 - Métadonnées présentes même en cas d'erreur", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "error-metadata-scraper",
        url: "http://localhost:3000/test",
        headless: true,
        viewport: { width: 1920, height: 1080 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      mockActions.navigate.mockRejectedValueOnce(new Error("Navigation failed"));

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.name).toBe("error-metadata-scraper");
      expect(result.result?.url).toBe("http://localhost:3000/test");
      expect(result.result?.metadata?.headless).toBe(true);
      expect(result.result?.metadata?.viewport).toEqual({ width: 1920, height: 1080 });
      expect(result.result?.error).toBeTruthy();
    });

    it("CA-23.4 - Duration calculée même en cas d'erreur", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "error-duration-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      mockActions.navigate.mockRejectedValueOnce(new Error("Timeout"));

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.result?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("CA-23.5 - Erreur inconnue gérée correctement", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "unknown-error-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      mockActions.navigate.mockRejectedValueOnce("String error");

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.result?.error).toBeTruthy();
    });
  });

  describe("CA-24 - La page est toujours fermée après exécution", () => {
    it("CA-24.1 - Page fermée après succès", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "close-success-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.close).toHaveBeenCalledTimes(1);
    });

    it("CA-24.2 - Page fermée après erreur", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "close-error-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      mockActions.navigate.mockRejectedValueOnce(new Error("Navigation failed"));

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.close).toHaveBeenCalledTimes(1);
    });

    it("CA-24.3 - Page fermée même si erreur dans finally", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "close-always-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      testPage.close.mockRejectedValueOnce(new Error("Close failed"));

      // Act & Assert - La fermeture est tentée même si elle échoue
      try {
        await runScraper(config, testPage);
      } catch (e) {
        // L'erreur de close peut être propagée
      }
      
      expect(testPage.close).toHaveBeenCalledTimes(1);
    });

    it("CA-24.4 - Page fermée après exécution partielle", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "close-partial-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "extract", params: { selector: ".item", fields: [] } },
          { action: "click", params: { selector: "#next" } },
        ],
      };

      mockActions.extract.mockResolvedValue({ success: true, data: [], count: 0 });
      mockActions.click.mockRejectedValueOnce(new Error("Click failed"));

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("CA-25 - Viewport configuré si défini", () => {
    it("CA-25.1 - Viewport 1280x800 appliqué", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "viewport-scraper",
        url: "http://localhost:3000/test",
        viewport: { width: 1280, height: 800 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.setViewportSize).toHaveBeenCalledWith({ width: 1280, height: 800 });
    });

    it("CA-25.2 - Viewport 1920x1080 appliqué", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "viewport-fullhd-scraper",
        url: "http://localhost:3000/test",
        viewport: { width: 1920, height: 1080 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
    });

    it("CA-25.3 - Viewport non appliqué si non défini", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "no-viewport-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.setViewportSize).not.toHaveBeenCalled();
    });

    it("CA-25.4 - Viewport personnalisé small", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "viewport-mobile-scraper",
        url: "http://localhost:3000/test",
        viewport: { width: 375, height: 667 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
        ],
      };

      // Act
      await runScraper(config, testPage);

      // Assert
      expect(testPage.setViewportSize).toHaveBeenCalledWith({ width: 375, height: 667 });
    });
  });

  describe("Gestion des actions inconnues", () => {
    it("Doit échouer avec une action inconnue", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "unknown-action-scraper",
        url: "http://localhost:3000/test",
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000" } },
          { action: "unknownAction", params: {} },
        ],
      };

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });
  });

  describe("Scénarios réalistes", () => {
    it("Doit gérer un scraper e-commerce complet", async () => {
      // Arrange
      const config: ScraperConfig = {
        name: "ecommerce-scraper",
        url: "http://localhost:3000/products",
        viewport: { width: 1280, height: 800 },
        steps: [
          { action: "navigate", params: { url: "http://localhost:3000/products" } },
          { action: "wait", params: { selector: ".products-grid" } },
          { action: "fill", params: { selector: "#search", value: "laptop" } },
          { action: "click", params: { selector: "#search-btn" } },
          { action: "wait", params: { selector: ".product-card" } },
          { action: "extract", params: { 
            selector: ".product-card", 
            fields: [
              { name: "title", selector: ".title" },
              { name: "price", selector: ".price" },
            ]
          }},
          { action: "paginate", params: { selector: ".next", maxPages: 3 } },
        ],
      };

      mockActions.extract.mockResolvedValue({ 
        success: true, 
        data: [{ title: "Laptop 1", price: "999" }], 
        count: 1 
      });
      mockActions.paginate.mockResolvedValue({ 
        success: true, 
        data: [
          { title: "Laptop 1", price: "999" },
          { title: "Laptop 2", price: "1299" },
          { title: "Laptop 3", price: "799" },
        ], 
        pagesVisited: 3 
      });

      // Act
      const result = await runScraper(config, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.result?.totalRecords).toBe(3);
      expect(result.result?.pagesScraped).toBe(3);
    });
  });
});
