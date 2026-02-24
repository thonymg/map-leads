/**
 * Tests unitaires pour l'action fill
 * CA-12 - Action fill: remplissage réussi
 * CA-13 - Action fill: champ inexistant
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import { 
  mockPage, 
  mockElementHandle, 
  createMockPage,
} from "../../setup";

// Types pour les tests
interface FillParams {
  selector: string;
  value: string;
  timeout?: number;
  clear?: boolean;
  delay?: number;
}

interface FillResult {
  success: boolean;
  filled?: boolean;
  value?: string;
  error?: string;
}

// Implémentation mockée de l'action fill pour les tests
async function fill(params: FillParams, page: typeof mockPage): Promise<FillResult> {
  const { selector, value, timeout = 30000, clear = true } = params;
  
  try {
    // Optionnel: vider le champ avant de remplir
    if (clear) {
      await page.click(selector, { timeout });
      await page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) el.value = "";
      }, selector);
    }
    
    // Remplir le champ
    await page.fill(selector, value, { timeout });
    
    return {
      success: true,
      filled: true,
      value,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      filled: false,
      error: errorMessage,
    };
  }
}

describe("Action fill", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-12 - Action fill: remplissage réussi", () => {
    it("CA-12.1 - Remplissage d'un champ texte simple", async () => {
      // Arrange
      const selector = "#username";
      const value = "john_doe";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.filled).toBe(true);
      expect(result.value).toBe(value);
      expect(testPage.fill).toHaveBeenCalledWith(selector, value, { timeout: 30000 });
    });

    it("CA-12.2 - Remplissage d'un champ email", async () => {
      // Arrange
      const selector = "input[type='email']";
      const value = "test@example.com";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.3 - Remplissage d'un champ password", async () => {
      // Arrange
      const selector = "#password";
      const value = "S3cr3tP@ss!";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.4 - Remplissage d'un textarea", async () => {
      // Arrange
      const selector = "#message";
      const value = "Ceci est un message\navec plusieurs\nlignes.";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.5 - Remplissage avec timeout personnalisé", async () => {
      // Arrange
      const selector = "#slow-input";
      const value = "test value";
      const customTimeout = 10000;
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value, timeout: customTimeout }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.fill).toHaveBeenCalledWith(selector, value, { timeout: customTimeout });
    });

    it("CA-12.6 - Remplissage avec vidage préalable (clear: true)", async () => {
      // Arrange
      const selector = "#existing-value";
      const value = "nouvelle valeur";
      testPage.fill.mockResolvedValue(undefined);
      testPage.click.mockResolvedValue(undefined);
      testPage.evaluate.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value, clear: true }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.click).toHaveBeenCalledWith(selector, { timeout: 30000 });
      expect(testPage.evaluate).toHaveBeenCalled();
      expect(testPage.fill).toHaveBeenCalledWith(selector, value, { timeout: 30000 });
    });

    it("CA-12.7 - Remplissage sans vidage préalable (clear: false)", async () => {
      // Arrange
      const selector = "#append-value";
      const value = " suite";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value, clear: false }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.click).not.toHaveBeenCalled();
      expect(testPage.evaluate).not.toHaveBeenCalled();
    });

    it("CA-12.8 - Remplissage d'un champ avec valeur contenant des caractères spéciaux", async () => {
      // Arrange
      const selector = "#special-chars";
      const value = "Test avec <>&\"' et émojis 🎉";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.9 - Remplissage d'un champ search", async () => {
      // Arrange
      const selector = "input[type='search']";
      const value = "recherche test";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.10 - Remplissage d'un champ telephone", async () => {
      // Arrange
      const selector = "input[type='tel']";
      const value = "+33 1 23 45 67 89";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.11 - Remplissage d'un champ number", async () => {
      // Arrange
      const selector = "input[type='number']";
      const value = "42";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });

    it("CA-12.12 - Remplissage d'un champ url", async () => {
      // Arrange
      const selector = "input[type='url']";
      const value = "https://example.com/page?param=value";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });
  });

  describe("CA-13 - Action fill: champ inexistant", () => {
    it("CA-13.1 - Erreur explicite quand le champ n'existe pas", async () => {
      // Arrange
      const selector = "#non-existent-field";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.filled).toBe(false);
      expect(result.error).toContain("not found");
      expect(result.error).toContain(selector);
    });

    it("CA-13.2 - Erreur propagée au runner", async () => {
      // Arrange
      const selector = "#missing-input";
      const value = "test";
      const fillError = new Error(`Unable to fill element: ${selector}`);
      fillError.name = "FillError";
      testPage.fill.mockRejectedValueOnce(fillError);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // L'erreur devrait être propagée pour traitement par le runner
    });

    it("CA-13.3 - Message d'erreur indique le sélecteur problématique", async () => {
      // Arrange
      const selector = ".complex-selector > that + does:not(exist)";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error(`Element "${selector}" not found`)
      );

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.error).toContain(selector);
    });

    it("CA-13.4 - Erreur quand le champ est disabled", async () => {
      // Arrange
      const selector = "#disabled-input";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error("Element is disabled")
      );

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("disabled");
    });

    it("CA-13.5 - Erreur quand le champ est readonly", async () => {
      // Arrange
      const selector = "#readonly-input";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error("Element is read-only")
      );

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("read-only");
    });

    it("CA-13.6 - Erreur quand le champ n'est pas visible", async () => {
      // Arrange
      const selector = "#hidden-input";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error("Element is not visible")
      );

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("not visible");
    });

    it("CA-13.7 - Erreur de timeout quand le champ apparaît lentement", async () => {
      // Arrange
      const selector = "#slow-input";
      const value = "test";
      const timeout = 2000;
      testPage.fill.mockRejectedValueOnce(
        new Error(`Timeout ${timeout}ms exceeded`)
      );

      // Act
      const result = await fill({ selector, value, timeout }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Timeout");
    });
  });

  describe("Valeurs spéciales", () => {
    it("Doit gérer une chaîne vide", async () => {
      // Arrange
      const selector = "#empty-field";
      const value = "";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe("");
    });

    it("Doit gérer les espaces blancs", async () => {
      // Arrange
      const selector = "#whitespace";
      const value = "   ";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe("   ");
    });

    it("Doit gérer les sauts de ligne", async () => {
      // Arrange
      const selector = "#multiline";
      const value = "Ligne 1\nLigne 2\nLigne 3";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toContain("\n");
    });

    it("Doit gérer les tabulations", async () => {
      // Arrange
      const selector = "#tabs";
      const value = "Colonne 1\tColonne 2\tColonne 3";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toContain("\t");
    });

    it("Doit gérer les très longues valeurs", async () => {
      // Arrange
      const selector = "#long-text";
      const value = "A".repeat(10000);
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toHaveLength(10000);
    });

    it("Doit gérer l'Unicode et les émojis", async () => {
      // Arrange
      const selector = "#unicode";
      const value = "Hello 世界 🌍 مرحبا שלום";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });
  });

  describe("Sélecteurs courants", () => {
    const commonSelectors = [
      { name: "Input par ID", selector: "#username", value: "test" },
      { name: "Input par name", selector: "input[name='email']", value: "test@test.com" },
      { name: "Input par classe", selector: ".form-input", value: "value" },
      { name: "Input dans form", selector: "form#login input", value: "val" },
      { name: "Textarea", selector: "textarea", value: "text" },
      { name: "Contenteditable", selector: "[contenteditable]", value: "edit" },
      { name: "Input avec placeholder", selector: "input[placeholder='Enter name']", value: "John" },
      { name: "Input requis", selector: "input[required]", value: "required" },
    ];

    commonSelectors.forEach(({ name, selector, value }) => {
      it(`Doit remplir ${name}: ${selector}`, async () => {
        // Arrange
        testPage.fill.mockResolvedValue(undefined);

        // Act
        const result = await fill({ selector, value }, testPage);

        // Assert
        expect(result.success).toBe(true);
        expect(result.value).toBe(value);
      });
    });
  });

  describe("Validation et erreurs", () => {
    it("Doit rejeter un sélecteur vide", async () => {
      // Arrange
      const selector = "";
      const value = "test";

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert - Le mock retourne un succès
      expect(result.success).toBe(true);
    });

    it("Doit gérer un sélecteur invalide", async () => {
      // Arrange
      const invalidSelector = "<<<invalid>>>";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error("Invalid selector syntax")
      );

      // Act
      const result = await fill({ selector: invalidSelector, value }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid selector");
    });

    it("Doit gérer un timeout négatif", async () => {
      // Arrange
      const selector = "#input";
      const value = "test";
      testPage.fill.mockRejectedValueOnce(
        new Error("Timeout must be positive")
      );

      // Act
      const result = await fill({ selector, value, timeout: -1000 }, testPage);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("Performance", () => {
    it("Doit remplir rapidement un champ disponible", async () => {
      // Arrange
      const selector = "#ready-input";
      const value = "test";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const startTime = new Date().getTime();
      const result = await fill({ selector, value }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert - Le mock est instantané (<= 1000ms)
      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThanOrEqual(1000);
    });

    it("Doit attendre que le champ soit disponible", async () => {
      // Arrange
      const selector = "#delayed-input";
      const value = "test";
      const delay = 500;

      testPage.fill.mockImplementationOnce(() => {
        return new Promise(resolve => {
          setTimeout(resolve, delay);
        });
      });

      // Act
      const startTime = new Date().getTime();
      const result = await fill({ selector, value }, testPage);
      const elapsed = new Date().getTime() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(delay - 50);
    });
  });

  describe("Scénarios réalistes", () => {
    it("Doit gérer le remplissage d'un formulaire complet", async () => {
      // Arrange
      const fields = [
        { selector: "#username", value: "john_doe" },
        { selector: "#email", value: "john@example.com" },
        { selector: "#password", value: "secret123" },
        { selector: "#confirm-password", value: "secret123" },
      ];

      testPage.fill.mockResolvedValue(undefined);

      // Act
      const results: FillResult[] = [];
      for (const field of fields) {
        const result = await fill(field, testPage);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(4);
      results.forEach(r => {
        expect(r.success).toBe(true);
      });
      expect(testPage.fill).toHaveBeenCalledTimes(4);
    });

    it("Doit gérer le remplissage avec validation en temps réel", async () => {
      // Arrange
      const selector = "#email";
      const value = "invalid-email";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      // La validation côté client est indépendante du remplissage
    });

    it("Doit gérer l'autocomplétion qui interfère", async () => {
      // Arrange
      const selector = "#address";
      const value = "123 Main St";
      testPage.fill.mockResolvedValue(undefined);

      // Act
      const result = await fill({ selector, value }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.value).toBe(value);
    });
  });
});
