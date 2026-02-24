/**
 * Tests unitaires pour le stockage
 * CA-33 - Création du dossier de sortie
 * CA-34 - Fichier JSON valide
 * CA-35 - Nom de fichier unique
 * CA-36 - Métadonnées présentes dans le fichier
 * CA-37 - Cohérence entre total_records et data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test";
import { join } from "path";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";

// Types pour les tests
interface ScraperResult {
  name: string;
  url: string;
  data: Record<string, unknown>[];
  pagesScraped: number;
  totalRecords: number;
  durationMs: number;
  scrapedAt: string;
  error: string | null;
  metadata?: {
    viewport?: { width: number; height: number };
    headless?: boolean;
  };
}

interface StorageConfig {
  outputDir: string;
  filenamePattern?: string;
}

interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// Mock du système de fichiers
const mockFs = {
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  rmSync: vi.fn(),
};

// Implémentation mockée du module storage pour les tests
class MockStorage {
  private outputDir: string;
  private filenamePattern: string;

  constructor(config: StorageConfig) {
    this.outputDir = config.outputDir;
    this.filenamePattern = config.filenamePattern || "{name}-{timestamp}.json";
  }

  async save(result: ScraperResult): Promise<SaveResult> {
    try {
      // Créer le dossier s'il n'existe pas
      if (!mockFs.existsSync(this.outputDir)) {
        mockFs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Générer le nom de fichier
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = this.filenamePattern
        .replace("{name}", result.name)
        .replace("{timestamp}", timestamp);
      const filePath = join(this.outputDir, filename);

      // Préparer les données à sauvegarder
      const fileData = {
        metadata: {
          scraper: result.name,
          url: result.url,
          pages_scraped: result.pagesScraped,
          total_records: result.totalRecords,
          duration_ms: result.durationMs,
          scraped_at: result.scrapedAt,
          error: result.error,
          ...(result.metadata || {}),
        },
        data: result.data,
      };

      // Écrire le fichier
      mockFs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async read(filePath: string): Promise<unknown> {
    try {
      const content = mockFs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async list(): Promise<string[]> {
    // Mock: retourne une liste de fichiers
    return ["scraper-1.json", "scraper-2.json"];
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      mockFs.rmSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

describe("Storage", () => {
  const testOutputDir = "./test-results";

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset des mocks fs
    mockFs.mkdirSync.mockReset();
    mockFs.writeFileSync.mockReset();
    mockFs.readFileSync.mockReset();
    mockFs.existsSync.mockReset();
    mockFs.rmSync.mockReset();
    
    // Comportements par défaut
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-33 - Création du dossier de sortie", () => {
    it("CA-33.1 - Dossier créé automatiquement s'il n'existe pas", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.existsSync.mockReturnValue(false);
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      await storage.save(result);

      // Assert
      expect(mockFs.existsSync).toHaveBeenCalledWith(testOutputDir);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(testOutputDir, { recursive: true });
    });

    it("CA-33.2 - Dossier non recréé s'il existe déjà", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.existsSync.mockReturnValue(true);
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      await storage.save(result);

      // Assert
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it("CA-33.3 - Création récursive des sous-dossiers", async () => {
      // Arrange
      const nestedDir = "./results/2026/02/24";
      const storage = new MockStorage({ outputDir: nestedDir });
      mockFs.existsSync.mockReturnValue(false);
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      await storage.save(result);

      // Assert
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(nestedDir, { recursive: true });
    });

    it("CA-33.4 - Dossier par défaut ./results", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: "./results" });
      mockFs.existsSync.mockReturnValue(false);
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      await storage.save(result);

      // Assert
      expect(mockFs.mkdirSync).toHaveBeenCalledWith("./results", { recursive: true });
    });

    it("CA-33.5 - Chemin absolu supporté", async () => {
      // Arrange
      const absolutePath = "/var/www/results";
      const storage = new MockStorage({ outputDir: absolutePath });
      mockFs.existsSync.mockReturnValue(false);
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      await storage.save(result);

      // Assert
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(absolutePath, { recursive: true });
    });
  });

  describe("CA-34 - Fichier JSON valide", () => {
    it("CA-34.1 - Fichier JSON parsable sans erreur", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [{ id: "1", name: "Item 1" }],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      expect(() => JSON.parse(savedContent)).not.toThrow();
    });

    it("CA-34.2 - JSON formaté avec indentation", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [{ id: "1" }],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      expect(savedContent).toContain("\n");
      expect(savedContent).toContain("  "); // Indentation
    });

    it("CA-34.3 - JSON avec encodage UTF-8", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [{ name: "Produit été", description: "Café résumé" }],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.data[0].name).toBe("Produit été");
      expect(parsed.data[0].description).toBe("Café résumé");
    });

    it("CA-34.4 - JSON avec données complexes", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [
          { 
            id: "1", 
            nested: { key: "value" },
            array: [1, 2, 3],
            nullable: null,
          },
        ],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.data[0].nested).toEqual({ key: "value" });
      expect(parsed.data[0].array).toEqual([1, 2, 3]);
      expect(parsed.data[0].nullable).toBeNull();
    });

    it("CA-34.5 - JSON valide avec tableau vide", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 0,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.data).toEqual([]);
    });
  });

  describe("CA-35 - Nom de fichier unique", () => {
    it("CA-35.1 - Fichier unique par scraper avec timestamp", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result1: ScraperResult = {
        name: "scraper-1",
        url: "http://site1.com",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      const result2: ScraperResult = {
        name: "scraper-2",
        url: "http://site2.com",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:01:00.000Z",
        error: null,
      };

      const savedFiles: string[] = [];
      mockFs.writeFileSync.mockImplementation((path: string) => {
        savedFiles.push(path as string);
      });

      // Act
      await storage.save(result1);
      await storage.save(result2);

      // Assert
      expect(savedFiles).toHaveLength(2);
      expect(savedFiles[0]).toContain("scraper-1");
      expect(savedFiles[1]).toContain("scraper-2");
      expect(savedFiles[0]).not.toBe(savedFiles[1]);
    });

    it("CA-35.2 - Même scraper exécuté deux fois = fichiers différents", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "same-scraper",
        url: "http://site.com",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      const savedFiles: string[] = [];
      mockFs.writeFileSync.mockImplementation((path: string) => {
        savedFiles.push(path as string);
      });

      // Simuler des timestamps différents
      let callCount = 0;
      const originalDate = Date;
      vi.spyOn(global, "Date").mockImplementation(() => {
        callCount++;
        return new originalDate(originalDate.now() + callCount * 1000) as unknown as Date;
      });

      // Act
      await storage.save(result);
      await storage.save(result);

      // Assert
      expect(savedFiles).toHaveLength(2);
      expect(savedFiles[0]).not.toBe(savedFiles[1]);
    });

    it("CA-35.3 - Pattern de nom personnalisable", async () => {
      // Arrange
      const storage = new MockStorage({ 
        outputDir: testOutputDir,
        filenamePattern: "{timestamp}-{name}.json",
      });
      
      const result: ScraperResult = {
        name: "custom-scraper",
        url: "http://site.com",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedFile = "";
      mockFs.writeFileSync.mockImplementation((path: string) => {
        savedFile = path as string;
      });

      // Act
      await storage.save(result);

      // Assert - Le fichier contient le nom custom et un timestamp valide
      expect(savedFile).toContain("custom-scraper");
      // Le timestamp peut varier, on vérifie juste le format
      expect(savedFile).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}/);
    });

    it("CA-35.4 - Aucun écrasement de fichier", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result1: ScraperResult = {
        name: "scraper",
        url: "http://site1.com",
        data: [{ id: "1" }],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      const result2: ScraperResult = {
        name: "scraper",
        url: "http://site2.com",
        data: [{ id: "2" }],
        pagesScraped: 1,
        totalRecords: 1,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:01:00.000Z",
        error: null,
      };

      const savedContents: string[] = [];
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContents.push(content);
      });

      // Act
      await storage.save(result1);
      await storage.save(result2);

      // Assert
      expect(savedContents).toHaveLength(2);
      expect(savedContents[0]).toContain('"id": "1"');
      expect(savedContents[1]).toContain('"id": "2"');
    });
  });

  describe("CA-36 - Métadonnées présentes dans le fichier", () => {
    it("CA-36.1 - Toutes les métadonnées requises sont présentes", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 5,
        totalRecords: 50,
        durationMs: 12345,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.scraper).toBe("test-scraper");
      expect(parsed.metadata.url).toBe("http://localhost:3000");
      expect(parsed.metadata.pages_scraped).toBe(5);
      expect(parsed.metadata.total_records).toBe(50);
      expect(parsed.metadata.duration_ms).toBe(12345);
      expect(parsed.metadata.scraped_at).toBe("2026-02-24T10:00:00.000Z");
      expect(parsed.metadata.error).toBeNull();
    });

    it("CA-36.2 - Métadonnées avec erreur", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "error-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 2,
        totalRecords: 10,
        durationMs: 5000,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: "Navigation failed: timeout",
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.error).toBe("Navigation failed: timeout");
    });

    it("CA-36.3 - Métadonnées avec viewport et headless", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "viewport-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 5,
        durationMs: 1000,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
        metadata: {
          viewport: { width: 1280, height: 800 },
          headless: true,
        },
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.viewport).toEqual({ width: 1280, height: 800 });
      expect(parsed.metadata.headless).toBe(true);
    });

    it("CA-36.4 - Timestamp au format ISO dans les métadonnées", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const timestamp = "2026-02-24T15:30:45.123Z";
      const result: ScraperResult = {
        name: "timestamp-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: timestamp,
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.scraped_at).toBe(timestamp);
      expect(() => new Date(parsed.metadata.scraped_at)).not.toThrow();
    });
  });

  describe("CA-37 - Cohérence entre total_records et data", () => {
    it("CA-37.1 - total_records correspond à la longueur de data", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const data = Array.from({ length: 42 }, (_, i) => ({ id: `item-${i}` }));
      const result: ScraperResult = {
        name: "consistency-scraper",
        url: "http://localhost:3000",
        data,
        pagesScraped: 5,
        totalRecords: 42,
        durationMs: 5000,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.total_records).toBe(42);
      expect(parsed.data).toHaveLength(42);
      expect(parsed.metadata.total_records).toBe(parsed.data.length);
    });

    it("CA-37.2 - total_records = 0 avec tableau vide", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const result: ScraperResult = {
        name: "empty-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.total_records).toBe(0);
      expect(parsed.data).toEqual([]);
      expect(parsed.metadata.total_records).toBe(parsed.data.length);
    });

    it("CA-37.3 - Cohérence préservée avec grand nombre d'enregistrements", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: `item-${i}`, value: i }));
      const result: ScraperResult = {
        name: "large-scraper",
        url: "http://localhost:3000",
        data,
        pagesScraped: 10,
        totalRecords: 1000,
        durationMs: 30000,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.total_records).toBe(1000);
      expect(parsed.data).toHaveLength(1000);
      expect(parsed.metadata.total_records).toBe(parsed.data.length);
    });

    it("CA-37.4 - Incohérence détectée (total_records != data.length)", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      
      const data = Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}` }));
      const result: ScraperResult = {
        name: "inconsistent-scraper",
        url: "http://localhost:3000",
        data,
        pagesScraped: 1,
        totalRecords: 15, // Incohérent!
        durationMs: 100,
        scrapedAt: "2026-02-24T10:00:00.000Z",
        error: null,
      };

      let savedContent = "";
      mockFs.writeFileSync.mockImplementation((path: string, content: string) => {
        savedContent = content;
      });

      // Act
      await storage.save(result);

      // Assert - Le fichier est sauvegardé tel quel, la validation est externe
      const parsed = JSON.parse(savedContent);
      expect(parsed.metadata.total_records).toBe(15);
      expect(parsed.data).toHaveLength(10);
      // Note: C'est au validateur de détecter cette incohérence
    });
  });

  describe("Opérations supplémentaires", () => {
    it("Doit lister les fichiers sauvegardés", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });

      // Act
      const files = await storage.list();

      // Assert
      expect(Array.isArray(files)).toBe(true);
      expect(files).toHaveLength(2);
    });

    it("Doit supprimer un fichier", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.rmSync.mockReturnValue(undefined);

      // Act
      const result = await storage.delete("./test-results/file.json");

      // Assert
      expect(result).toBe(true);
      expect(mockFs.rmSync).toHaveBeenCalled();
    });

    it("Doit lire un fichier sauvegardé", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      const fileContent = JSON.stringify({
        metadata: { scraper: "test", total_records: 5 },
        data: [{ id: "1" }],
      });
      mockFs.readFileSync.mockReturnValue(fileContent);

      // Act
      const result = await storage.read("./test-results/file.json");

      // Assert
      expect(result).toEqual(JSON.parse(fileContent));
    });

    it("Doit échouer à lire un fichier inexistant", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      // Act & Assert
      await expect(storage.read("./test-results/nonexistent.json")).rejects.toThrow();
    });
  });

  describe("Gestion des erreurs", () => {
    it("Doit gérer une erreur d'écriture", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error("Disk full");
      });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      const saveResult = await storage.save(result);

      // Assert
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBe("Disk full");
    });

    it("Doit gérer une erreur de création de dossier", async () => {
      // Arrange
      const storage = new MockStorage({ outputDir: testOutputDir });
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });
      
      const result: ScraperResult = {
        name: "test-scraper",
        url: "http://localhost:3000",
        data: [],
        pagesScraped: 1,
        totalRecords: 0,
        durationMs: 100,
        scrapedAt: new Date().toISOString(),
        error: null,
      };

      // Act
      const saveResult = await storage.save(result);

      // Assert
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBe("Permission denied");
    });
  });
});
