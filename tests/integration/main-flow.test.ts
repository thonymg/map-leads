/**
 * Tests d'intégration pour le fluxo principal (Orchestrator + Runner)
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { orchestrate } from "../../src/orchestrator";
import { runScraper } from "../../src/runner";
import { chromium, type Browser } from "playwright";
import { createTestServer, type TestServer } from "../fixtures/test-server";
import type { ScraperConfig, ScraperDefinition } from "../../src/types";
import { rmSync, existsSync } from "fs";
import { join } from "path";

describe("Integration - Main Flow", () => {
  let browser: Browser;
  let testServer: TestServer;
  const outputDir = "./test-results-integration";

  beforeAll(async () => {
    console.log("BeforeAll: Launching browser...");
    browser = await chromium.launch();
    console.log("BeforeAll: Browser launched.");
    testServer = createTestServer({ port: 3001 });
    await testServer.start();
    console.log("BeforeAll: Test server started.");
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  }, 30000);

  afterAll(async () => {
    console.log("AfterAll: Closing browser...");
    if (browser) {
        await browser.close();
    }
    console.log("AfterAll: Browser closed.");
    if (testServer) {
        await testServer.stop();
    }
    console.log("AfterAll: Test server stopped.");
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
  }, 30000);

  describe("runScraper execution", () => {
    it("should run a simple scraper and extract data", async () => {
      const definition: ScraperDefinition = {
        name: "simple-extract",
        url: testServer.getPageUrl("list.html"),
        steps: [
          { action: "navigate", params: {url: testServer.getPageUrl("list.html")}},
          {
            action: "extract",
            params: {
              selector: ".item",
              fields: [
                { name: "title", selector: ".item-title" },
                { name: "price", selector: ".item-price" },
              ],
            },
          },
        ],
      };

      const context = await browser.newContext();
      const result = await runScraper(definition, context);

      expect(result.success).toBe(true);
      expect(result.recordCount).toBe(5);
      expect(result.data.length).toBe(5);
      expect(result.data[0]).toEqual({
        title: "Produit Alpha",
        price: "29.99",
      });
      await context.close();
    });

    it("should fail gracefully if a step fails", async () => {
        const definition: ScraperDefinition = {
            name: "failing-scraper",
            url: testServer.getPageUrl("simple.html"),
            steps: [
                { action: "navigate", params: {url: testServer.getPageUrl("simple.html")}},
                { action: "click", params: { selector: "#non-existent-button" } },
            ],
        };

        const context = await browser.newContext();
        const result = await runScraper(definition, context);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].action).toBe("click");
        await context.close();
    });
  });
});
