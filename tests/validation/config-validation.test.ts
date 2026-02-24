/**
 * Tests de validation de configuration YAML
 * CA-01 - Parsing valide
 * CA-02 - Valeur par défaut de la concurrence
 * CA-03 - Valeur par défaut du dossier de sortie
 * CA-04 - Rejet si aucun scraper défini
 * CA-05 - Rejet si un champ obligatoire est manquant
 * 
 * Note: Ces tests utilisent un parser YAML mocké. 
 * Dans l'implémentation réelle, utilisez la librairie 'yaml' pour le parsing.
 */

import { describe, it, expect, beforeEach, vi } from "bun:test";
import { parse } from "yaml";

// Types pour les tests
interface ScraperStep {
  action: string;
  params: Record<string, unknown>;
}

interface ScraperConfig {
  name: string;
  url: string;
  steps: ScraperStep[];
  headless?: boolean;
  viewport?: { width: number; height: number };
}

interface FullConfig {
  concurrency?: number;
  output_dir?: string;
  scrapers: ScraperConfig[];
}

interface ValidationResult {
  valid: boolean;
  config?: FullConfig;
  errors: string[];
}

// Validation de configuration avec le vrai parser YAML
function validateConfig(yamlContent: string): ValidationResult {
  const errors: string[] = [];

  try {
    // Utiliser le vrai parser YAML
    const config = parse(yamlContent) as Partial<FullConfig>;

    // Validation: au moins un scraper
    if (!config.scrapers || !Array.isArray(config.scrapers) || config.scrapers.length === 0) {
      errors.push("Configuration must contain at least one scraper");
      return { valid: false, errors };
    }

    // Validation: types des champs optionnels
    if (config.concurrency !== undefined) {
      if (typeof config.concurrency !== 'number' || config.concurrency <= 0) {
        errors.push("concurrency must be a positive number");
      }
    }

    // Validation: champs obligatoires pour chaque scraper
    config.scrapers.forEach((scraper: ScraperConfig, index: number) => {
      if (!scraper.name) {
        errors.push(`Scraper ${index}: missing required field 'name'`);
      }
      if (!scraper.url) {
        errors.push(`Scraper ${index}: missing required field 'url'`);
      } else if (typeof scraper.url !== 'string' || !scraper.url.match(/^https?:\/\/.+$/)) {
        errors.push(`Scraper ${index}: invalid URL format`);
      }
      if (!scraper.steps || !Array.isArray(scraper.steps) || scraper.steps.length === 0) {
        errors.push(`Scraper ${index}: missing required field 'steps'`);
      }
    });

    // Appliquer les valeurs par défaut
    const validatedConfig: FullConfig = {
      concurrency: config.concurrency ?? 5,
      output_dir: config.output_dir ?? "./results",
      scrapers: config.scrapers,
    };

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, config: validatedConfig, errors: [] };
  } catch (error) {
    errors.push(`YAML parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { valid: false, errors };
  }
}

describe("Validation de configuration YAML", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CA-01 - Parsing valide", () => {
    it("CA-01.1 - Configuration YAML bien formée est chargée sans erreur", async () => {
      // Arrange
      const yamlContent = `
concurrency: 3
output_dir: "./results"
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params:
          url: https://example.com
  - name: scraper-2
    url: https://test.com
    steps:
      - action: navigate
        params:
          url: https://test.com
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config).toBeDefined();
    });

    it("CA-01.2 - Nombre de scrapers correspond à la définition", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example1.com
    steps:
      - action: navigate
        params: {}
  - name: scraper-2
    url: https://example2.com
    steps:
      - action: navigate
        params: {}
  - name: scraper-3
    url: https://example3.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.scrapers).toHaveLength(3);
    });

    it("CA-01.3 - Configuration avec un seul scraper", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: single-scraper
    url: https://example.com
    steps:
      - action: navigate
        params:
          url: https://example.com
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.scrapers).toHaveLength(1);
    });

    it("CA-01.4 - Configuration avec plusieurs scrapers complexes", async () => {
      // Arrange
      const yamlContent = `
concurrency: 5
output_dir: "./output"
scrapers:
  - name: ecommerce-scraper
    url: https://shop.example.com
    headless: true
    viewport:
      width: 1280
      height: 800
    steps:
      - action: navigate
        params:
          url: https://shop.example.com
      - action: wait
        params:
          selector: .products
      - action: extract
        params:
          selector: .product
          fields:
            - name: title
              selector: .title
  - name: blog-scraper
    url: https://blog.example.com
    headless: false
    steps:
      - action: navigate
        params:
          url: https://blog.example.com
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.scrapers).toHaveLength(2);
      expect(result.config?.concurrency).toBe(5);
    });

    it("CA-01.5 - YAML avec commentaires est parsé correctement", async () => {
      // Arrange
      const yamlContent = `
# Configuration du scraper
# Version 1.0

concurrency: 3  # Nombre de scrapers en parallèle

scrapers:
  # Premier scraper
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.concurrency).toBe(3);
    });
  });

  describe("CA-02 - Valeur par défaut de la concurrence", () => {
    it("CA-02.1 - Concurrence par défaut à 5 si non spécifiée", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.concurrency).toBe(5);
    });

    it("CA-02.2 - Concurrence personnalisée est respectée", async () => {
      // Arrange
      const yamlContent = `
concurrency: 10
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.concurrency).toBe(10);
    });

    it("CA-02.3 - Concurrence de 1 pour exécution séquentielle", async () => {
      // Arrange
      const yamlContent = `
concurrency: 1
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.concurrency).toBe(1);
    });

    it("CA-02.4 - Concurrence élevée supportée", async () => {
      // Arrange
      const yamlContent = `
concurrency: 20
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.concurrency).toBe(20);
    });
  });

  describe("CA-03 - Valeur par défaut du dossier de sortie", () => {
    it("CA-03.1 - output_dir par défaut à ./results si non spécifié", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.output_dir).toBe("./results");
    });

    it("CA-03.2 - output_dir personnalisé est respecté", async () => {
      // Arrange
      const yamlContent = `
output_dir: "./custom-output"
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.output_dir).toBe("./custom-output");
    });

    it("CA-03.3 - output_dir avec chemin absolu", async () => {
      // Arrange
      const yamlContent = `
output_dir: "/var/www/scrapers/results"
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.output_dir).toBe("/var/www/scrapers/results");
    });

    it("CA-03.4 - output_dir avec guillemets", async () => {
      // Arrange
      const yamlContent = `
output_dir: "./my-results"
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.output_dir).toBe("./my-results");
    });
  });

  describe("CA-04 - Rejet si aucun scraper défini", () => {
    it("CA-04.1 - Tableau scrapers vide génère une erreur explicite", async () => {
      // Arrange
      const yamlContent = `
concurrency: 3
output_dir: "./results"
scrapers: []
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Configuration must contain at least one scraper");
    });

    it("CA-04.2 - Absence de clé scrapers génère une erreur", async () => {
      // Arrange
      const yamlContent = `
concurrency: 3
output_dir: "./results"
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("CA-04.3 - Processus s'arrête avec code non nul (simulé)", async () => {
      // Arrange
      const yamlContent = `
scrapers: []
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Configuration must contain at least one scraper");
    });

    it("CA-04.4 - Message d'erreur explicite pour scrapers vides", async () => {
      // Arrange
      const yamlContent = `
scrapers:
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("scraper"))).toBe(true);
    });
  });

  describe("CA-05 - Rejet si un champ obligatoire est manquant", () => {
    it("CA-05.1 - Erreur si champ 'name' manquant", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("name"))).toBe(true);
    });

    it("CA-05.2 - Erreur si champ 'url' manquant", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: my-scraper
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("url"))).toBe(true);
    });

    it("CA-05.3 - Erreur si champ 'steps' manquant", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: my-scraper
    url: https://example.com
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("steps"))).toBe(true);
    });

    it("CA-05.4 - Erreur précise quel scraper est problématique", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example1.com
    steps:
      - action: navigate
        params: {}
  - url: https://example2.com
    steps:
      - action: navigate
        params: {}
  - name: scraper-3
    url: https://example3.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Scraper 1"))).toBe(true);
    });

    it("CA-05.5 - Multiple erreurs sont toutes rapportées", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - url: https://example1.com
  - name: scraper-2
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it("CA-05.6 - Steps vide est considéré comme manquant", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: my-scraper
    url: https://example.com
    steps: []
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("steps"))).toBe(true);
    });

    it("CA-05.7 - Configuration valide avec tous les champs requis", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: valid-scraper
    url: https://example.com
    steps:
      - action: navigate
        params:
          url: https://example.com
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Validation des types", () => {
    it("Doit rejeter un concurrency non numérique", async () => {
      // Arrange
      const yamlContent = `
concurrency: "not-a-number"
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
    });

    it("Doit rejeter un concurrency négatif", async () => {
      // Arrange
      const yamlContent = `
concurrency: -5
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
    });

    it("Doit rejeter un concurrency nul", async () => {
      // Arrange
      const yamlContent = `
concurrency: 0
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
    });

    it("Doit accepter un viewport valide", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example.com
    viewport:
      width: 1280
      height: 800
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
    });

    it("Doit accepter headless boolean", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example.com
    headless: true
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe("Validation des URLs", () => {
    it("Doit accepter les URLs HTTP", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: http://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
    });

    it("Doit accepter les URLs HTTPS", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: https://example.com
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
    });

    it("Doit rejeter une URL vide", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: ""
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("url"))).toBe(true);
    });

    it("Doit rejeter une URL invalide", async () => {
      // Arrange
      const yamlContent = `
scrapers:
  - name: scraper-1
    url: not-a-valid-url
    steps:
      - action: navigate
        params: {}
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(false);
    });
  });

  describe("Scénarios réalistes", () => {
    it("Doit valider une configuration complète de production", async () => {
      // Arrange
      const yamlContent = `
# Configuration de production
concurrency: 5
output_dir: "./results"

scrapers:
  - name: linkedin-companies
    url: https://www.linkedin.com/company/search
    headless: true
    viewport:
      width: 1920
      height: 1080
    steps:
      - action: navigate
        params:
          url: https://www.linkedin.com/company/search
      - action: wait
        params:
          selector: .company-card
      - action: extract
        params:
          selector: .company-card
          fields:
            - name: name
              selector: .company-name
            - name: industry
              selector: .company-industry
      - action: paginate
        params:
          selector: .next-button
          max_pages: 10

  - name: google-maps-businesses
    url: https://www.google.com/maps/search/restaurants
    headless: true
    viewport:
      width: 1280
      height: 800
    steps:
      - action: navigate
        params:
          url: https://www.google.com/maps/search/restaurants
      - action: wait
        params:
          selector: .business-listing
      - action: extract
        params:
          selector: .business-listing
          fields:
            - name: name
              selector: .business-name
            - name: rating
              selector: .rating
            - name: address
              selector: .address
`;

      // Act
      const result = validateConfig(yamlContent);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.config?.scrapers).toHaveLength(2);
      expect(result.config?.concurrency).toBe(5);
      expect(result.config?.output_dir).toBe("./results");
    });
  });
});
