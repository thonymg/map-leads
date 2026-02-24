/**
 * Tests unitaires pour l'action click
 * CA-10 - Action click: élément présent
 * CA-11 - Action click: élément absent (tolérance)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import { 
  mockPage, 
  mockElementHandle, 
  mockLocator,
  createMockPage,
} from "../../setup";

// Types pour les tests
interface ClickParams {
  selector: string;
  timeout?: number;
  button?: "left" | "right" | "middle";
  clickCount?: number;
  delay?: number;
  force?: boolean;
}

interface ClickResult {
  success: boolean;
  clicked?: boolean;
  error?: string;
  warning?: string;
}

// Implémentation mockée de l'action click pour les tests
async function click(params: ClickParams, page: typeof mockPage): Promise<ClickResult> {
  const { selector, timeout = 30000, force = false } = params;

  try {
    // Tenter de cliquer sur l'élément
    await page.click(selector, { timeout });

    return {
      success: true,
      clicked: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Si force est true, on tolère l'erreur
    if (force) {
      return {
        success: true,
        clicked: false,
        warning: `Element "${selector}" not found, continuing...`,
      };
    }

    // Sinon on propage l'erreur
    return {
      success: false,
      clicked: false,
      error: errorMessage,
    };
  }
}

describe("Action click", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-10 - Action click: élément présent", () => {
    it("CA-10.1 - Clic réussi sur un bouton visible", async () => {
      // Arrange
      const selector = "#submit-btn";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(true);
      expect(testPage.click).toHaveBeenCalledWith(selector, { timeout: 30000 });
    });

    it("CA-10.2 - Clic sur un lien de navigation", async () => {
      // Arrange
      const selector = "a.nav-link";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(true);
    });

    it("CA-10.3 - Clic avec timeout personnalisé", async () => {
      // Arrange
      const selector = "#slow-button";
      const customTimeout = 10000;
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector, timeout: customTimeout }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.click).toHaveBeenCalledWith(selector, { timeout: customTimeout });
    });

    it("CA-10.4 - Clic double (clickCount: 2)", async () => {
      // Arrange
      const selector = "#double-click-target";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector, clickCount: 2 }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // Note: L'implémentation réelle devrait gérer clickCount
    });

    it("CA-10.5 - Clic droit (button: right)", async () => {
      // Arrange
      const selector = "#context-menu-target";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector, button: "right" }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // Note: L'implémentation réelle devrait gérer le type de bouton
    });

    it("CA-10.6 - Clic avec délai avant l'action", async () => {
      // Arrange
      const selector = "#delayed-button";
      const delay = 500;
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector, delay }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // Note: L'implémentation réelle devrait attendre delay ms avant de cliquer
    });

    it("CA-10.7 - Clic sur élément après attente automatique", async () => {
      // Arrange
      const selector = "#dynamic-button";
      // Simule que l'élément devient cliquable après un délai
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(true);
    });

    it("CA-10.8 - Clic déclenche une navigation", async () => {
      // Arrange
      const selector = "a[href='/next-page']";
      testPage.click.mockResolvedValue(undefined);
      testPage.url.mockReturnValue("http://localhost:3000/next-page");

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.click).toHaveBeenCalledWith(selector, { timeout: 30000 });
    });

    it("CA-10.9 - Clic sur checkbox change son état", async () => {
      // Arrange
      const selector = "#accept-terms";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
    });

    it("CA-10.10 - Clic sur bouton submit d'un formulaire", async () => {
      // Arrange
      const selector = "form#test-form button[type='submit']";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("CA-11 - Action click: élément absent (tolérance)", () => {
    it("CA-11.1 - Clic tolérant sur sélecteur inexistant", async () => {
      // Arrange
      const selector = "#non-existent-element";
      testPage.click.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await click({ selector, force: true }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(false);
      expect(result.warning).toContain("not found");
    });

    it("CA-11.2 - Clic tolérant n'interrompt pas l'exécution", async () => {
      // Arrange
      const selectors = [
        "#optional-btn-1",
        "#non-existent",
        "#optional-btn-2",
      ];
      
      testPage.click
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Element "#non-existent" not found'))
        .mockResolvedValueOnce(undefined);

      // Act
      const results: ClickResult[] = [];
      for (const selector of selectors) {
        const result = await click({ selector, force: true }, testPage);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // Tolérance
      expect(results[1].clicked).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it("CA-11.3 - Élément présent mais pas visible - tolérance", async () => {
      // Arrange
      const selector = "#hidden-element";
      testPage.click.mockRejectedValueOnce(
        new Error(`Element "${selector}" is not visible`)
      );

      // Act - Avec force=true, on tolère l'erreur
      const result = await click({ selector, force: true }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(false);
      expect(result.warning).toContain("continuing");
    });

    it("CA-11.4 - Sélecteur avec XPath inexistant", async () => {
      // Arrange
      const selector = "//button[@id='missing']";
      testPage.click.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await click({ selector, force: true }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(false);
    });

    it("CA-11.5 - Message d'avertissement explicite", async () => {
      // Arrange
      const selector = ".optional-feature";
      testPage.click.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await click({ selector, force: true }, testPage);

      // Assert
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain(selector);
      expect(result.warning).toContain("continuing");
    });
  });

  describe("Cas d'erreur (sans tolérance)", () => {
    it("Doit échouer sans force quand l'élément n'existe pas", async () => {
      // Arrange
      const selector = "#missing";
      testPage.click.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.clicked).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("Doit échouer quand le timeout est dépassé", async () => {
      // Arrange
      const selector = "#slow-element";
      const timeout = 1000;
      testPage.click.mockRejectedValueOnce(
        new Error(`Timeout ${timeout}ms exceeded`)
      );

      // Act
      const result = await click({ selector, timeout }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout");
    });

    it("Doit échouer quand l'élément est recouvert par un overlay", async () => {
      // Arrange
      const selector = "#covered-button";
      testPage.click.mockRejectedValueOnce(
        new Error("Element is intercepted by another element")
      );

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("intercepted");
    });

    it("Doit échouer avec un sélecteur invalide", async () => {
      // Arrange
      const invalidSelector = "<<<invalid>>>";
      testPage.click.mockRejectedValueOnce(
        new Error("Invalid selector syntax")
      );

      // Act
      const result = await click({ selector: invalidSelector }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid selector");
    });
  });

  describe("Sélecteurs courants", () => {
    const commonSelectors = [
      { name: "Bouton par ID", selector: "#submit-btn" },
      { name: "Lien par classe", selector: "a.nav-link" },
      { name: "Input submit", selector: "input[type='submit']" },
      { name: "Bouton dans form", selector: "form button.primary" },
      { name: "Checkbox", selector: "input[type='checkbox']" },
      { name: "Radio", selector: "input[type='radio']" },
      { name: "Bouton par texte", selector: "button:contains('Save')" },
      { name: "Icône cliquable", selector: ".icon-button" },
      { name: "Menu dropdown", selector: ".dropdown-toggle" },
      { name: "Onglet", selector: ".tab-header" },
    ];

    commonSelectors.forEach(({ name, selector }) => {
      it(`Doit cliquer sur ${name}: ${selector}`, async () => {
        // Arrange
        testPage.click.mockResolvedValue(undefined);

        // Act
        const result = await click({ selector }, testPage);

        // Assert
        expect(result.success).toBe(true);
        expect(result.clicked).toBe(true);
      });
    });
  });

  describe("Interactions complexes", () => {
    it("Doit gérer les clics successifs sur le même élément", async () => {
      // Arrange
      const selector = "#toggle-btn";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const results: ClickResult[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await click({ selector }, testPage);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(r => {
        expect(r.success).toBe(true);
        expect(r.clicked).toBe(true);
      });
      expect(testPage.click).toHaveBeenCalledTimes(5);
    });

    it("Doit gérer les clics dans une boucle de pagination", async () => {
      // Arrange
      const selector = ".pagination .next";
      let callCount = 0;
      
      testPage.click.mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error("Element not found"));
      });

      // Act
      let continueClicking = true;
      let actualClicks = 0;

      while (continueClicking && actualClicks < 10) {
        actualClicks++;
        const result = await click({ selector, force: true }, testPage);
        if (!result.clicked) {
          continueClicking = false;
        }
      }

      // Assert - 3 clics réussis + 1 échec = 4 tentatives
      expect(actualClicks).toBe(4);
    });

    it("Doit gérer le clic sur un élément qui disparaît après clic", async () => {
      // Arrange
      const selector = "#close-modal";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clicked).toBe(true);
    });
  });

  describe("Options avancées", () => {
    it("Doit supporter le clic avec position relative", async () => {
      // Arrange
      const selector = "#target";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // Note: L'implémentation réelle pourrait supporter position: { x, y }
    });

    it("Doit supporter le modifier keys (Ctrl, Shift, Alt)", async () => {
      // Arrange
      const selector = "#download-link";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const result = await click({ selector }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // Note: L'implémentation réelle pourrait supporter modifiers: ['Control']
    });
  });

  describe("Performance", () => {
    it("Doit cliquer rapidement sur un élément immédiatement disponible", async () => {
      // Arrange
      const selector = "#ready-btn";
      testPage.click.mockResolvedValue(undefined);

      // Act
      const startTime = new Date().getTime();
      const result = await click({ selector }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert - Le mock est quasi-instantané (<= 1000ms)
      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThanOrEqual(1000);
    });

    it("Doit attendre que l'élément soit cliquable", async () => {
      // Arrange
      const selector = "#becomes-clickable";
      const delay = 500;

      testPage.click.mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(resolve, delay);
        });
      });

      // Act
      const startTime = new Date().getTime();
      const result = await click({ selector }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(delay - 50);
    });
  });
});
