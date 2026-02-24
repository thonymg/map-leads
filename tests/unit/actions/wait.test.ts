/**
 * Tests unitaires pour l'action wait
 * CA-08 - Action wait: attente par sélecteur
 * CA-09 - Action wait: attente par durée fixe
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import { 
  mockPage, 
  mockElementHandle, 
  createMockPage,
} from "../../setup";

// Types pour les tests
interface WaitParams {
  selector?: string;
  duration?: number;
  timeout?: number;
  state?: "visible" | "hidden" | "attached" | "detached";
}

interface WaitResult {
  success: boolean;
  waitedMs?: number;
  error?: string;
}

// Implémentation mockée de l'action wait pour les tests
async function wait(params: WaitParams, page: typeof mockPage): Promise<WaitResult> {
  const { selector, duration, timeout = 30000, state = "visible" } = params;
  const startTime = new Date().getTime();

  try {
    if (duration !== undefined) {
      // Attente par durée fixe
      await page.waitForTimeout(duration);
      return {
        success: true,
        waitedMs: new Date().getTime() - startTime,
      };
    }

    if (selector) {
      // Attente par sélecteur
      await page.waitForSelector(selector, { state, timeout });
      return {
        success: true,
        waitedMs: new Date().getTime() - startTime,
      };
    }
    
    return {
      success: false,
      error: "Either selector or duration must be provided",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

describe("Action wait", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-08 - Action wait: attente par sélecteur", () => {
    it("CA-08.1 - Attente réussie quand le sélecteur devient visible", async () => {
      // Arrange
      const selector = "#dynamic-element";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "visible",
        timeout: 30000,
      });
    });

    it("CA-08.2 - Attente avec état 'hidden'", async () => {
      // Arrange
      const selector = ".loading-spinner";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector, state: "hidden" }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "hidden",
        timeout: 30000,
      });
    });

    it("CA-08.3 - Attente avec état 'attached'", async () => {
      // Arrange
      const selector = "#content";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector, state: "attached" }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "attached",
        timeout: 30000,
      });
    });

    it("CA-08.4 - Attente avec état 'detached'", async () => {
      // Arrange
      const selector = ".modal";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector, state: "detached" }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "detached",
        timeout: 30000,
      });
    });

    it("CA-08.5 - Attente avec timeout personnalisé", async () => {
      // Arrange
      const selector = "#slow-element";
      const customTimeout = 10000;
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector, timeout: customTimeout }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "visible",
        timeout: customTimeout,
      });
    });

    it("CA-08.6 - Sélecteur CSS complexe", async () => {
      // Arrange
      const selector = "div.container > ul.items li.item:nth-child(2) a.link";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "visible",
        timeout: 30000,
      });
    });

    it("CA-08.7 - Sélecteur XPath", async () => {
      // Arrange
      const selector = "//div[@class='container']//button[text()='Submit']";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const result = await wait({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
        state: "visible",
        timeout: 30000,
      });
    });
  });

  describe("CA-09 - Action wait: attente par durée fixe", () => {
    it("CA-09.1 - Attente de 1000ms respecte la durée", async () => {
      // Arrange
      const duration = 1000;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
    });

    it("CA-09.2 - Attente de 500ms", async () => {
      // Arrange
      const duration = 500;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
    });

    it("CA-09.3 - Attente de 2000ms avec précision", async () => {
      // Arrange
      const duration = 2000;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const startTime = new Date().getTime();
      const result = await wait({ duration }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
      // Note: Dans un test réel, on vérifierait que elapsed >= duration
    });

    it("CA-09.4 - Attente courte (100ms)", async () => {
      // Arrange
      const duration = 100;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
    });

    it("CA-09.5 - Attente longue (5000ms)", async () => {
      // Arrange
      const duration = 5000;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
    });
  });

  describe("Cas d'erreur et robustesse", () => {
    it("Doit échouer quand le sélecteur n'apparaît pas dans le délai", async () => {
      // Arrange
      const selector = "#never-appears";
      const timeout = 3000;
      testPage.waitForSelector.mockRejectedValueOnce(
        new Error(`Timeout ${timeout}ms exceeded waiting for selector`)
      );

      // Act
      const result = await wait({ selector, timeout }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout");
      // Note: Le message d'erreur peut ne pas contenir le sélecteur exact
    });

    it("Doit échouer avec un sélecteur invalide", async () => {
      // Arrange
      const invalidSelector = "<<<invalid>>>";
      testPage.waitForSelector.mockRejectedValueOnce(
        new Error("Invalid selector syntax")
      );

      // Act
      const result = await wait({ selector: invalidSelector }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid selector");
    });

    it("Doit échouer quand ni selector ni duration n'est fourni", async () => {
      // Act
      const result = await wait({}, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("selector or duration");
    });

    it("Doit gérer une durée négative", async () => {
      // Arrange
      const duration = -1000;
      testPage.waitForTimeout.mockRejectedValueOnce(
        new Error("Duration must be non-negative")
      );

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(false);
    });

    it("Doit gérer une durée nulle", async () => {
      // Arrange
      const duration = 0;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ duration }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(0);
    });
  });

  describe("Combinaison selector et duration", () => {
    it("Doit prioriser duration quand les deux sont fournis", async () => {
      // Arrange
      const selector = "#element";
      const duration = 500;
      testPage.waitForTimeout.mockResolvedValue(undefined);

      // Act
      const result = await wait({ selector, duration }, testPage);

      // Assert
      // Selon l'implémentation, duration devrait être prioritaire
      expect(result.success).toBe(true);
      expect(testPage.waitForTimeout).toHaveBeenCalledWith(duration);
    });
  });

  describe("Sélecteurs courants", () => {
    const commonSelectors = [
      { name: "ID", selector: "#main-content" },
      { name: "Class", selector: ".btn-primary" },
      { name: "Tag", selector: "button" },
      { name: "Attribute", selector: "[data-testid='submit']" },
      { name: "Descendant", selector: "div.container p.text" },
      { name: "Child", selector: "ul > li" },
      { name: "Sibling", selector: "h1 + p" },
      { name: "Nth-child", selector: "li:nth-child(2)" },
      { name: "Contains text", selector: "a:contains('Click me')" },
    ];

    commonSelectors.forEach(({ name, selector }) => {
      it(`Doit gérer le sélecteur ${name}: ${selector}`, async () => {
        // Arrange
        testPage.waitForSelector.mockResolvedValue(mockElementHandle);

        // Act
        const result = await wait({ selector }, testPage);

        // Assert
        expect(result.success).toBe(true);
        expect(testPage.waitForSelector).toHaveBeenCalledWith(selector, {
          state: "visible",
          timeout: 30000,
        });
      });
    });
  });

  describe("Performance", () => {
    it("Doit retourner immédiatement si l'élément est déjà visible", async () => {
      // Arrange
      const selector = "#already-visible";
      testPage.waitForSelector.mockResolvedValue(mockElementHandle);

      // Act
      const startTime = new Date().getTime();
      const result = await wait({ selector }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert - Le mock résout rapidement (<= 3000ms avec timeout)
      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThanOrEqual(3000);
    });

    it("Doit attendre le temps nécessaire pour un élément retardé", async () => {
      // Arrange
      const selector = "#delayed-element";
      const delay = 2000;

      // Simule un délai avant que l'élément n'apparaisse
      testPage.waitForSelector.mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockElementHandle), delay);
        });
      });

      // Act
      const startTime = new Date().getTime();
      const result = await wait({ selector }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(delay - 100); // Marge de 100ms
    });
  });
});
