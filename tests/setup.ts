/**
 * Configuration globale des tests
 * Setup des mocks Playwright pour éviter de lancer un vrai navigateur dans les tests unitaires
 */

import { expect, beforeEach, afterEach, vi } from "bun:test";

// Export global de expect pour utilisation dans tous les tests
export { expect };

// Mock de Date.now() pour les tests
const originalDateNow = Date.now;
beforeEach(() => {
  Date.now = vi.fn(() => new Date().getTime());
});

afterEach(() => {
  Date.now = originalDateNow;
});

// Mocks Playwright - simulés pour les tests unitaires
export const mockPage = {
  goto: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  waitForSelector: vi.fn(),
  waitForTimeout: vi.fn(),
  waitForLoadState: vi.fn(),
  evaluate: vi.fn(),
  close: vi.fn(),
  title: vi.fn(),
  url: vi.fn(),
  screenshot: vi.fn(),
  content: vi.fn(),
  addInitScript: vi.fn(),
  setViewportSize: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isClosed: vi.fn(),
};

export const mockContext = {
  newPage: vi.fn(),
  close: vi.fn(),
  cookies: vi.fn(),
  addCookies: vi.fn(),
  clearCookies: vi.fn(),
  storageState: vi.fn(),
};

export const mockBrowser = {
  newContext: vi.fn(),
  close: vi.fn(),
  contexts: vi.fn(),
  isConnected: vi.fn(),
};

export const mockElementHandle = {
  click: vi.fn(),
  fill: vi.fn(),
  innerText: vi.fn(),
  innerHTML: vi.fn(),
  getAttribute: vi.fn(),
  $: vi.fn(),
  $$: vi.fn(),
  isVisible: vi.fn(),
  isHidden: vi.fn(),
};

export const mockLocator = {
  click: vi.fn(),
  fill: vi.fn(),
  first: vi.fn(),
  nth: vi.fn(),
  count: vi.fn(),
  all: vi.fn(),
  innerText: vi.fn(),
  innerHTML: vi.fn(),
  getAttribute: vi.fn(),
  isVisible: vi.fn(),
  isHidden: vi.fn(),
  waitFor: vi.fn(),
  elementHandle: vi.fn(),
  elementHandles: vi.fn(),
};

// Reset des mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset des comportements par défaut
  mockPage.goto.mockResolvedValue(undefined);
  mockPage.click.mockResolvedValue(undefined);
  mockPage.fill.mockResolvedValue(undefined);
  mockPage.waitForSelector.mockResolvedValue(mockElementHandle);
  mockPage.waitForTimeout.mockResolvedValue(undefined);
  mockPage.waitForLoadState.mockResolvedValue(undefined);
  mockPage.evaluate.mockResolvedValue([]);
  mockPage.close.mockResolvedValue(undefined);
  mockPage.title.mockResolvedValue("Test Page");
  mockPage.url.mockReturnValue("http://localhost:3000/test");
  mockPage.setContent = vi.fn().mockResolvedValue(undefined);
  mockPage.setViewportSize = vi.fn().mockResolvedValue(undefined);
  mockPage.isClosed.mockReturnValue(false);
  
  mockContext.newPage.mockResolvedValue(mockPage);
  mockContext.close.mockResolvedValue(undefined);
  mockContext.cookies.mockResolvedValue([]);
  mockContext.addCookies.mockResolvedValue(undefined);
  
  mockBrowser.newContext.mockResolvedValue(mockContext);
  mockBrowser.close.mockResolvedValue(undefined);
  mockBrowser.contexts.mockReturnValue([]);
  mockBrowser.isConnected.mockReturnValue(true);
  
  mockElementHandle.click.mockResolvedValue(undefined);
  mockElementHandle.fill.mockResolvedValue(undefined);
  mockElementHandle.innerText.mockResolvedValue("Test text");
  mockElementHandle.innerHTML.mockResolvedValue("<div>Test</div>");
  mockElementHandle.getAttribute.mockResolvedValue("test-value");
  mockElementHandle.$.mockResolvedValue(null);
  mockElementHandle.$$.mockResolvedValue([]);
  mockElementHandle.isVisible.mockResolvedValue(true);
  mockElementHandle.isHidden.mockResolvedValue(false);
  
  mockLocator.click.mockResolvedValue(undefined);
  mockLocator.fill.mockResolvedValue(undefined);
  mockLocator.first.mockReturnValue(mockLocator);
  mockLocator.nth.mockReturnValue(mockLocator);
  mockLocator.count.mockResolvedValue(0);
  mockLocator.all.mockResolvedValue([]);
  mockLocator.innerText.mockResolvedValue("Test text");
  mockLocator.innerHTML.mockResolvedValue("<div>Test</div>");
  mockLocator.getAttribute.mockResolvedValue("test-value");
  mockLocator.isVisible.mockResolvedValue(true);
  mockLocator.isHidden.mockResolvedValue(false);
  mockLocator.waitFor.mockResolvedValue(mockElementHandle);
  mockLocator.elementHandle.mockResolvedValue(mockElementHandle);
  mockLocator.elementHandles.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

// Helper pour créer un mock de page personnalisé
export function createMockPage(overrides: Partial<typeof mockPage> = {}) {
  return {
    ...mockPage,
    ...overrides,
  };
}

// Helper pour créer un mock de contexte personnalisé
export function createMockContext(overrides: Partial<typeof mockContext> = {}) {
  return {
    ...mockContext,
    ...overrides,
  };
}

// Helper pour simuler une erreur de timeout
export function mockTimeoutError(message: string = "Timeout exceeded") {
  return new Error(message);
}

// Helper pour simuler une erreur réseau
export function mockNetworkError(message: string = "Network error") {
  const error = new Error(message);
  error.name = "NetworkError";
  return error;
}

// Types pour les tests
export interface TestActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Fonction utilitaire pour attendre un délai
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export des mocks pour utilisation dans les tests
export const mocks = {
  page: mockPage,
  context: mockContext,
  browser: mockBrowser,
  elementHandle: mockElementHandle,
  locator: mockLocator,
};
