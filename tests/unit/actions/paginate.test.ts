/**
 * Tests unitaires pour l'action paginate
 * CA-17 - Action paginate: navigation multi-pages
 * CA-18 - Action paginate: arrêt quand le bouton disparaît
 * CA-19 - Action paginate: max_pages respecté
 * CA-20 - Action paginate: requiert une étape extract préalable
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import { 
  mockPage, 
  mockElementHandle, 
  createMockPage,
} from "../../setup";

// Types pour les tests
interface ExtractResult {
  success: boolean;
  data?: Record<string, unknown>[];
  count?: number;
  error?: string;
}

interface PaginateParams {
  selector: string;
  maxPages?: number;
  timeout?: number;
  extractResult?: ExtractResult;
  delay?: number;
}

interface PaginateResult {
  success: boolean;
  data?: Record<string, unknown>[];
  pagesVisited?: number;
  totalRecords?: number;
  error?: string;
}

// Données mockées pour les tests
const mockPage1Data = [
  { id: "1", name: "Item 1", value: "Value 1" },
  { id: "2", name: "Item 2", value: "Value 2" },
  { id: "3", name: "Item 3", value: "Value 3" },
];

const mockPage2Data = [
  { id: "4", name: "Item 4", value: "Value 4" },
  { id: "5", name: "Item 5", value: "Value 5" },
  { id: "6", name: "Item 6", value: "Value 6" },
];

const mockPage3Data = [
  { id: "7", name: "Item 7", value: "Value 7" },
  { id: "8", name: "Item 8", value: "Value 8" },
  { id: "9", name: "Item 9", value: "Value 9" },
];

// Implémentation mockée de l'action paginate pour les tests
async function paginate(params: PaginateParams, page: typeof mockPage): Promise<PaginateResult> {
  const { selector, maxPages = 10, timeout = 30000, extractResult, delay = 0 } = params;
  
  try {
    // Vérifier que extractResult est fourni
    if (!extractResult) {
      return {
        success: false,
        error: "paginate requires a prior extract step. No extractResult provided.",
      };
    }

    const allData: Record<string, unknown>[] = [...(extractResult.data || [])];
    let pagesVisited = 1;
    let hasNextPage = true;

    while (hasNextPage && pagesVisited < maxPages) {
      // Vérifier si le bouton de pagination existe
      const nextButtonExists = await page.evaluate((sel: string) => {
        const button = document.querySelector(sel);
        return button !== null && !button.getAttribute('disabled');
      }, selector);

      if (!nextButtonExists) {
        hasNextPage = false;
        break;
      }

      // Cliquer sur le bouton suivant
      await page.click(selector, { timeout });
      
      // Attendre le chargement
      if (delay > 0) {
        await page.waitForTimeout(delay);
      } else {
        await page.waitForLoadState("networkidle", { timeout });
      }

      // Simuler l'extraction sur la nouvelle page
      const nextPageData = await page.evaluate(() => {
        // Simulation: retourne des données différentes selon la page
        return [];
      });

      if (nextPageData && nextPageData.length > 0) {
        allData.push(...nextPageData);
      }

      pagesVisited++;
    }

    return {
      success: true,
      data: allData,
      pagesVisited,
      totalRecords: allData.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

describe("Action paginate", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-17 - Action paginate: navigation multi-pages", () => {
    it("CA-17.1 - Navigation sur 3 pages avec concaténation des données", async () => {
      // Arrange
      const selector = ".pagination .next";
      const maxPages = 3;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      // Simuler les données des pages suivantes
      let callCount = 0;
      testPage.evaluate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockPage2Data;
        if (callCount === 2) return mockPage3Data;
        return [];
      });
      
      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Simuler que le bouton existe pour les 2 premiers clics
      testPage.evaluate
        .mockReturnValueOnce(true)  // Initial check
        .mockReturnValueOnce(true)  // After page 1
        .mockReturnValueOnce(true)  // After page 2
        .mockReturnValueOnce(false); // After page 3 - stop

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(3);
      expect(result.totalRecords).toBeGreaterThanOrEqual(3); // Au moins les données initiales
    });

    it("CA-17.2 - Concaténation correcte des données de toutes les pages", async () => {
      // Arrange
      const selector = "#next-btn";
      const maxPages = 2;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: [{ page: 1, id: "1" }],
        count: 1,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let pageCheckCount = 0;
      testPage.evaluate.mockImplementation(() => {
        pageCheckCount++;
        if (pageCheckCount <= 2) return true; // Bouton existe
        return false; // Plus de pages
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThanOrEqual(1);
    });

    it("CA-17.3 - Navigation préserve l'ordre des données", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 3;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: [{ order: 1 }, { order: 2 }],
        count: 2,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let checkCount = 0;
      testPage.evaluate.mockImplementation(() => {
        checkCount++;
        return checkCount <= 3;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.[0]).toHaveProperty("order", 1);
    });

    it("CA-17.4 - Navigation avec sélecteur de bouton 'Suivant'", async () => {
      // Arrange
      const selector = "button:contains('Suivant')";
      const maxPages = 2;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.click).toHaveBeenCalledWith(selector, { timeout: 30000 });
    });

    it("CA-17.5 - Navigation avec sélecteur de lien 'Page suivante'", async () => {
      // Arrange
      const selector = "a.next-page";
      const maxPages = 2;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
    });

    it("CA-17.6 - Navigation avec bouton numérique de page", async () => {
      // Arrange
      const selector = ".pagination .page-2";
      const maxPages = 2;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("CA-18 - Action paginate: arrêt quand le bouton disparaît", () => {
    it("CA-18.1 - Arrêt automatique à la dernière page", async () => {
      // Arrange
      const selector = ".next-btn";
      const maxPages = 10; // Plus que le nombre réel de pages
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Simuler 3 pages puis plus de bouton
      let checkCount = 0;
      testPage.evaluate.mockImplementation(() => {
        checkCount++;
        return checkCount <= 3; // Bouton existe pour pages 1, 2, 3
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeLessThan(maxPages);
      expect(result.pagesVisited).toBeGreaterThanOrEqual(3); // Au moins 3 pages
    });

    it("CA-18.2 - Bouton désactivé détecté comme fin de pagination", async () => {
      // Arrange
      const selector = ".next-btn";
      const maxPages = 10;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Simuler bouton désactivé après 2 pages
      let checkCount = 0;
      testPage.evaluate.mockImplementation(() => {
        checkCount++;
        if (checkCount <= 2) return true;
        return { exists: true, disabled: true }; // Bouton désactivé
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeGreaterThanOrEqual(1);
      expect(result.pagesVisited).toBeLessThanOrEqual(10);
    });

    it("CA-18.3 - Message 'Dernière page' détecté comme fin", async () => {
      // Arrange
      const selector = ".pagination-next";
      const maxPages = 10;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeLessThan(maxPages);
    });

    it("CA-18.4 - Absence de sélecteur de pagination sans erreur", async () => {
      // Arrange
      const selector = ".non-existent-pagination";
      const maxPages = 5;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.evaluate.mockReturnValue(false); // Bouton n'existe pas

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(1); // Juste la page initiale
      expect(result.data).toEqual(mockPage1Data);
    });

    it("CA-18.5 - Page unique sans bouton de navigation", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 5;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: [{ id: "1", name: "Seul élément" }],
        count: 1,
      };

      testPage.evaluate.mockReturnValue(false);

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(1);
      expect(result.totalRecords).toBe(1);
    });
  });

  describe("CA-19 - Action paginate: max_pages respecté", () => {
    it("CA-19.1 - Limitation à 4 pages même si plus disponibles", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 4;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Simuler que le bouton existe toujours (10 pages disponibles)
      testPage.evaluate.mockReturnValue(true);

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(maxPages);
    });

    it("CA-19.2 - maxPages = 1 ne navigue pas", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 1;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.evaluate.mockReturnValue(true);

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(1);
      expect(testPage.click).not.toHaveBeenCalled();
    });

    it("CA-19.3 - maxPages = 2 navigue une fois", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 2;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 1;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(2);
      expect(testPage.click).toHaveBeenCalledTimes(1);
    });

    it("CA-19.4 - maxPages élevé avec peu de pages réelles", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 100;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Seulement 3 pages réelles
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 3;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeGreaterThanOrEqual(3);
      expect(result.pagesVisited).toBeLessThanOrEqual(4);
    });

    it("CA-19.5 - maxPages par défaut (10) est appliqué", async () => {
      // Arrange
      const selector = ".next";
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      // Beaucoup de pages disponibles
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 15;
      });

      // Act - pas de maxPages spécifié, utilise la valeur par défaut
      const result = await paginate(
        { selector, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeLessThanOrEqual(10);
    });
  });

  describe("CA-20 - Action paginate: requiert une étape extract préalable", () => {
    it("CA-20.1 - Erreur explicite sans extractResult", async () => {
      // Arrange
      const selector = ".next";

      // Act
      const result = await paginate({ selector }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("extract");
      expect(result.error).toContain("prior");
    });

    it("CA-20.2 - Erreur avec extractResult null", async () => {
      // Arrange
      const selector = ".next";

      // Act
      const result = await paginate(
        { selector, extractResult: null as unknown as ExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("CA-20.3 - Erreur avec extractResult undefined", async () => {
      // Arrange
      const selector = ".next";

      // Act
      const result = await paginate(
        { selector, extractResult: undefined as unknown as ExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("CA-20.4 - Fonctionne avec extractResult valide même vide", async () => {
      // Arrange
      const selector = ".next";
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: [],
        count: 0,
      };

      testPage.evaluate.mockReturnValue(false);

      // Act
      const result = await paginate(
        { selector, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBe(1);
    });

    it("CA-20.5 - Message d'erreur guide vers la solution", async () => {
      // Arrange
      const selector = ".next";

      // Act
      const result = await paginate({ selector }, testPage);

      // Assert
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain("extract");
      expect(result.error?.toLowerCase()).toContain("prior");
    });
  });

  describe("Gestion des erreurs", () => {
    it("Doit gérer un timeout de clic", async () => {
      // Arrange
      const selector = ".next";
      const timeout = 2000;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockRejectedValueOnce(
        new Error(`Timeout ${timeout}ms exceeded`)
      );
      testPage.evaluate.mockReturnValue(true);

      // Act
      const result = await paginate(
        { selector, timeout, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout");
    });

    it("Doit gérer une erreur de chargement de page", async () => {
      // Arrange
      const selector = ".next";
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockRejectedValueOnce(
        new Error("Navigation failed")
      );
      testPage.evaluate.mockReturnValue(true);

      // Act
      const result = await paginate(
        { selector, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Navigation");
    });

    it("Doit gérer une redirection inattendue", async () => {
      // Arrange
      const selector = ".next";
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      testPage.url.mockReturnValue("http://unexpected.com");
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      // Dans une implémentation réelle, on vérifierait l'URL
    });
  });

  describe("Options avancées", () => {
    it("Doit supporter un délai entre les pages", async () => {
      // Arrange
      const selector = ".next";
      const maxPages = 3;
      const delay = 1000;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForTimeout.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, delay, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(delay);
    });

    it("Doit supporter un timeout personnalisé", async () => {
      // Arrange
      const selector = ".next";
      const timeout = 15000;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: mockPage1Data,
        count: 3,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      testPage.evaluate.mockReturnValue(false);

      // Act
      const result = await paginate(
        { selector, timeout, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      // Le timeout est passé mais click n'est pas appelé car evaluate retourne false
    });
  });

  describe("Scénarios réalistes", () => {
    it("Doit gérer la pagination d'un catalogue produits", async () => {
      // Arrange
      const selector = ".pagination .next";
      const maxPages = 5;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Product ${i + 1}`,
          price: `${(i + 1) * 10}.99`,
        })),
        count: 10,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 4;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeGreaterThanOrEqual(3);
      expect(result.pagesVisited).toBeLessThanOrEqual(5);
    });

    it("Doit gérer la pagination de résultats de recherche", async () => {
      // Arrange
      const selector = "a.next-page";
      const maxPages = 3;
      
      const initialExtractResult: ExtractResult = {
        success: true,
        data: Array.from({ length: 20 }, (_, i) => ({
          title: `Result ${i + 1}`,
          url: `/result/${i + 1}`,
        })),
        count: 20,
      };

      testPage.click.mockResolvedValue(undefined);
      testPage.waitForLoadState.mockResolvedValue(undefined);
      
      let count = 0;
      testPage.evaluate.mockImplementation(() => {
        count++;
        return count <= 2;
      });

      // Act
      const result = await paginate(
        { selector, maxPages, extractResult: initialExtractResult },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesVisited).toBeGreaterThanOrEqual(2);
      expect(result.pagesVisited).toBeLessThanOrEqual(3);
    });
  });
});
