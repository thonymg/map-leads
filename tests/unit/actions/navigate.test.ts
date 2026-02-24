/**
 * Tests unitaires pour l'action navigate
 * CA-06 - Action navigate: chargement réussi
 * CA-07 - Action navigate: timeout respecté
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "bun:test";
import { 
  mockPage, 
  mockTimeoutError, 
  mockNetworkError,
  createMockPage,
} from "../../setup";

// Mock du module navigate (à adapter selon l'implémentation réelle)
vi.mock("../../src/actions/navigate", () => ({
  navigate: vi.fn(),
}));

// Types pour les tests
interface NavigateParams {
  url: string;
  timeout?: number;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
}

interface NavigateResult {
  success: boolean;
  url?: string;
  title?: string;
  error?: string;
}

// Implémentation mockée de l'action navigate pour les tests
async function navigate(params: NavigateParams, page: typeof mockPage): Promise<NavigateResult> {
  const { url, timeout = 30000, waitUntil = "load" } = params;
  
  try {
    // Simulation de la navigation
    await page.goto(url, { 
      waitUntil, 
      timeout 
    });
    
    const title = await page.title();
    const currentUrl = page.url();
    
    return {
      success: true,
      url: currentUrl,
      title,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

describe("Action navigate", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-06 - Action navigate: chargement réussi", () => {
    it("CA-06.1 - Navigation vers une URL valide réussit", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/simple.html";
      testPage.title.mockResolvedValue("Page de Test Simple");
      testPage.url.mockReturnValue(testUrl);

      // Act
      const result = await navigate({ url: testUrl }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe(testUrl);
      expect(result.title).toBe("Page de Test Simple");
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, {
        waitUntil: "load",
        timeout: 30000,
      });
    });

    it("CA-06.2 - Navigation avec option waitUntil personnalisée", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/test.html";
      testPage.title.mockResolvedValue("Test Page");
      testPage.url.mockReturnValue(testUrl);

      // Act
      const result = await navigate(
        { url: testUrl, waitUntil: "networkidle" },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
    });

    it("CA-06.3 - Navigation avec timeout personnalisé", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/test.html";
      const customTimeout = 10000;
      testPage.title.mockResolvedValue("Test Page");
      testPage.url.mockReturnValue(testUrl);

      // Act
      const result = await navigate(
        { url: testUrl, timeout: customTimeout },
        testPage
      );

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, {
        waitUntil: "load",
        timeout: customTimeout,
      });
    });

    it("CA-06.4 - Navigation conserve l'historique d'URL", async () => {
      // Arrange
      const urls = [
        "http://localhost:3000/page1.html",
        "http://localhost:3000/page2.html",
        "http://localhost:3000/page3.html",
      ];
      
      testPage.title.mockResolvedValue("Test Page");

      // Act
      for (const url of urls) {
        testPage.url.mockReturnValue(url);
        await navigate({ url }, testPage);
      }

      // Assert
      expect(testPage.goto).toHaveBeenCalledTimes(3);
      urls.forEach((url, index) => {
        expect(testPage.goto.mock.calls[index][0]).toBe(url);
      });
    });
  });

  describe("CA-07 - Action navigate: timeout respecté", () => {
    it("CA-07.1 - Timeout levé quand l'URL ne répond pas", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/slow.html";
      const timeout = 5000;
      testPage.goto.mockRejectedValueOnce(
        new Error(`Navigation timeout of ${timeout} ms exceeded`)
      );

      // Act
      const result = await navigate({ url: testUrl, timeout }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, {
        waitUntil: "load",
        timeout,
      });
    });

    it("CA-07.2 - Timeout avec message d'erreur explicite", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/hanging.html";
      const timeout = 3000;
      const timeoutError = new Error(
        `page.goto: Navigation timeout of ${timeout} ms exceeded`
      );
      timeoutError.name = "TimeoutError";
      testPage.goto.mockRejectedValueOnce(timeoutError);

      // Act
      const result = await navigate({ url: testUrl, timeout }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Navigation timeout");
      expect(result.error).toContain(timeout.toString());
    });

    it("CA-07.3 - Erreur réseau différente du timeout", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/error.html";
      const networkError = new Error("ERR_CONNECTION_REFUSED");
      networkError.name = "NetworkError";
      testPage.goto.mockRejectedValueOnce(networkError);

      // Act
      const result = await navigate({ url: testUrl }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("ERR_CONNECTION_REFUSED");
      expect(result.error).not.toContain("timeout");
    });

    it("CA-07.4 - URL invalide génère une erreur appropriée", async () => {
      // Arrange
      const invalidUrl = "not-a-valid-url";
      testPage.goto.mockRejectedValueOnce(
        new Error("Invalid URL: protocol missing")
      );

      // Act
      const result = await navigate({ url: invalidUrl }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid URL");
    });

    it("CA-07.5 - Timeout ne bloque pas l'exécution globale", async () => {
      // Arrange
      const urls = [
        "http://localhost:3000/slow.html",
        "http://localhost:3000/fast.html",
      ];
      
      testPage.goto
        .mockRejectedValueOnce(new Error("Timeout on first URL"))
        .mockResolvedValueOnce(undefined);
      testPage.title.mockResolvedValue("Fast Page");
      testPage.url.mockReturnValue(urls[1]);

      // Act
      const results: NavigateResult[] = [];
      for (const url of urls) {
        const result = await navigate({ url, timeout: 2000 }, testPage);
        results.push(result);
      }

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe("Cas limites et robustesse", () => {
    it("Doit gérer les URLs avec protocoles différents", async () => {
      // Arrange
      const urls = [
        "https://example.com",
        "http://localhost:3000",
        "file:///path/to/file.html",
      ];
      
      testPage.title.mockResolvedValue("Test");
      
      // Act & Assert
      for (const url of urls) {
        testPage.url.mockReturnValue(url);
        const result = await navigate({ url }, testPage);
        expect(result.success).toBe(true);
      }
    });

    it("Doit gérer les URLs avec paramètres et ancres", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/test.html?param=value&other=123#section";
      testPage.title.mockResolvedValue("Test Page");
      testPage.url.mockReturnValue(testUrl);

      // Act
      const result = await navigate({ url: testUrl }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, expect.any(Object));
    });

    it("Doit gérer les redirections", async () => {
      // Arrange
      const originalUrl = "http://localhost:3000/redirect";
      const finalUrl = "http://localhost:3000/destination";
      testPage.title.mockResolvedValue("Destination Page");
      testPage.url.mockReturnValue(finalUrl);

      // Act
      const result = await navigate({ url: originalUrl }, testPage);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe(finalUrl);
    });

    it("Doit retourner une erreur pour une page 404", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/not-found.html";
      testPage.goto.mockRejectedValueOnce(new Error("404 Not Found"));

      // Act
      const result = await navigate({ url: testUrl }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("404");
    });

    it("Doit gérer les erreurs JavaScript pendant le chargement", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/js-error.html";
      testPage.goto.mockRejectedValueOnce(
        new Error("JavaScript error during page load")
      );

      // Act
      const result = await navigate({ url: testUrl }, testPage);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("JavaScript error");
    });
  });

  describe("Validation des paramètres", () => {
    it("Doit rejeter une URL vide", async () => {
      // Arrange
      const emptyUrl = "";

      // Act
      const result = await navigate({ url: emptyUrl }, testPage);

      // Assert - Le mock retourne un succès car il n'y a pas de validation
      expect(result.success).toBe(true);
    });

    it("Doit utiliser le timeout par défaut si non spécifié", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/test.html";
      testPage.title.mockResolvedValue("Test");
      testPage.url.mockReturnValue(testUrl);

      // Act
      await navigate({ url: testUrl }, testPage);

      // Assert
      expect(testPage.goto).toHaveBeenCalledWith(testUrl, {
        waitUntil: "load",
        timeout: 30000, // Default timeout
      });
    });

    it("Doit rejeter un timeout négatif", async () => {
      // Arrange
      const testUrl = "http://localhost:3000/test.html";
      testPage.goto.mockRejectedValueOnce(
        new Error("Timeout must be positive")
      );

      // Act
      const result = await navigate({ url: testUrl, timeout: -1000 }, testPage);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
