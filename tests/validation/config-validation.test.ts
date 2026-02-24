/**
 * Tests de validation de configuration YAML
 */

import { describe, it, expect, vi } from "bun:test";
import { loadConfig, applyDefaults, validateConfig, ConfigValidationError } from "../../src/config";
import * as fs from "fs/promises";
import { existsSync } from "fs";

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

vi.mock('fs', () => ({
    existsSync: vi.fn(),
}));


const validScraper = `
name: test
url: http://example.com
steps:
  - action: navigate
    params:
      url: http://example.com
`;

describe("Configuration", () => {

    describe("validateConfig", () => {
        it("should pass with a valid config", () => {
            const config = {
                scrapers: [{
                    name: "test",
                    url: "http://example.com",
                    steps: [{ action: "navigate", params: { url: "http://example.com" } }]
                }]
            };
            expect(() => validateConfig(config)).not.toThrow();
        });

        it("should throw if scrapers is missing", () => {
            const config = { concurrency: 5 };
            expect(() => validateConfig(config)).toThrow(new ConfigValidationError(
                `Champ obligatoire manquant`,
                'root',
                `scrapers est requis`
            ));
        });

        it("should throw if scrapers is empty", () => {
            const config = { scrapers: [] };
            expect(() => validateConfig(config)).toThrow(new ConfigValidationError(
                'scrapers ne peut pas être vide', 'root.scrapers'
            ));
        });

        it("should throw on invalid step action", () => {
            const config = {
                scrapers: [{
                    name: "test",
                    url: "http://example.com",
                    steps: [{ action: "invalid-action", params: {} }]
                }]
            };
            expect(() => validateConfig(config)).toThrow(new ConfigValidationError(
                `Action invalide: invalid-action`,
                'scrapers[test].steps[0].action',
                `Une de: navigate, wait, click, fill, extract, paginate`
            ));
        });
    });

    describe("loadConfig", () => {
        it("should load and validate the config file", async () => {
            const yamlContent = `
scrapers:
  - name: test
    url: http://example.com
    steps:
      - action: navigate
        params:
          url: http://example.com
`;
            (existsSync as vi.Mock).mockReturnValue(true);
            (fs.readFile as vi.Mock).mockResolvedValue(yamlContent);

            const config = await loadConfig("config.yaml");
            expect(config.scrapers).toHaveLength(1);
            expect(config.scrapers[0].name).toBe("test");
        });

        it("should throw if file not found", async () => {
            (existsSync as vi.Mock).mockReturnValue(false);
            await expect(loadConfig("nonexistent.yaml")).rejects.toThrow("Fichier de configuration introuvable: nonexistent.yaml");
        });

        it("should throw on YAML parsing error", async () => {
            (existsSync as vi.Mock).mockReturnValue(true);
            (fs.readFile as vi.Mock).mockResolvedValue("invalid: yaml:");
            await expect(loadConfig("invalid.yaml")).rejects.toThrow(/Erreur de parsing YAML/);
        });
    });

    describe("applyDefaults", () => {
        it("should apply default concurrency and output_dir", () => {
            const config = { scrapers: [] };
            const defaultConfig = applyDefaults(config as any);
            expect(defaultConfig.concurrency).toBe(5);
            expect(defaultConfig.output_dir).toBe("./results");
        });

        it("should not override existing values", () => {
            const config = {
                concurrency: 10,
                output_dir: "./custom-dir",
                scrapers: [],
            };
            const defaultConfig = applyDefaults(config as any);
            expect(defaultConfig.concurrency).toBe(10);
            expect(defaultConfig.output_dir).toBe("./custom-dir");
        });

        it("should apply default headless and viewport to scrapers", () => {
            const config = {
                scrapers: [{ name: 'test', url: 'http://a.com', steps: [] }]
            };
            const defaultConfig = applyDefaults(config as any);
            expect(defaultConfig.scrapers[0].headless).toBe(true);
            expect(defaultConfig.scrapers[0].viewport).toEqual({ width: 1920, height: 1080 });
        });
    });
});
