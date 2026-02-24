# 🔄 Stratégie de Conversion Code → YAML

**Document technique détaillé pour la conversion du code généré par Playwright UI Mode vers configuration YAML MapLeads**

**Date :** 24 février 2026  
**Version :** 1.0  
**Statut :** Spécification technique

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture du Convertisseur](#2-architecture-du-convertisseur)
3. [Mapping des Actions](#3-mapping-des-actions)
4. [Algorithme de Conversion](#4-algorithme-de-conversion)
5. [Optimisation des Sélecteurs](#5-optimisation-des-sélecteurs)
6. [Gestion des Cas Complexes](#6-gestion-des-cas-complexes)
7. [Implémentation](#7-implémentation)
8. [Tests et Validation](#8-tests-et-validation)

---

## 1. Vue d'Ensemble

### 1.1 Flux de Conversion

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE CONVERSION                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Code        │────▶│  Parsing     │────▶│  AST         │
│  TypeScript  │     │  (TS Parser) │     │  (Abstract   │
│  Généré      │     │              │     │   Syntax Tree)│
└──────────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Fichier     │◀────│  Génération  │◀────│  Mapping     │
│  .scrappe.yaml│    │  YAML        │     │  Actions     │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 1.2 Exemple de Conversion

#### Entrée : Code Généré par UI Mode

```typescript
import { test, expect } from '@playwright/test';

test('Books Scraper', async ({ page }) => {
  // Navigation
  await page.goto('https://books.toscrape.com/');
  
  // Attente du chargement
  await page.locator('article.product_pod').first().waitFor();
  
  // Extraction des données
  const books = page.locator('article.product_pod');
  const bookCount = await books.count();
  
  for (let i = 0; i < bookCount; i++) {
    const book = books.nth(i);
    const title = await book.locator('h3 a').textContent();
    const price = await book.locator('p.price_color').textContent();
    const stock = await book.locator('p.instock').textContent();
  }
  
  // Pagination
  const nextButton = page.locator('li.next a');
  if (await nextButton.isVisible()) {
    await nextButton.click();
    await page.waitForLoadState('networkidle');
  }
});
```

#### Sortie : Configuration YAML

```yaml
name: books-scraper
url: https://books.toscrape.com/
headless: true
viewport:
  width: 1920
  height: 1080

steps:
  - action: navigate
    params:
      url: https://books.toscrape.com/
      timeout: 30000

  - action: wait
    params:
      selector: article.product_pod
      timeout: 10000

  - action: extract
    params:
      selector: article.product_pod
      fields:
        - name: title
          selector: h3 a
        - name: price
          selector: p.price_color
        - name: stock
          selector: p.instock

  - action: paginate
    params:
      selector: li.next a
      max_pages: 10
```

---

## 2. Architecture du Convertisseur

### 2.1 Modules Principaux

```
src/converter/
├── index.ts           ← Point d'entrée principal
├── parser.ts          ← Parsing du code TypeScript
├── mapper.ts          ← Mapping vers actions YAML
├── optimizer.ts       ← Optimisation des sélecteurs
├── generator.ts       ← Génération du fichier YAML
└── types.ts           ← Types partagés
```

### 2.2 Dépendances Techniques

```json
{
  "dependencies": {
    "typescript": "^5.0.0",
    "yaml": "^2.7.0"
  },
  "devDependencies": {
    "@types/node": "latest"
  }
}
```

**Justification :**
- `typescript` : Pour parser le code généré avec l'API TypeScript Compiler
- `yaml` : Déjà utilisé dans le projet pour la génération YAML

---

## 3. Mapping des Actions

### 3.1 Table de Correspondance

| Pattern Code Playwright | Action YAML | Paramètres Extraits |
|------------------------|-------------|---------------------|
| `page.goto(url)` | `navigate` | `url`, `timeout` (optionnel) |
| `page.waitForLoadState(state)` | `wait` | `timeout` |
| `locator(selector).waitFor()` | `wait` | `selector`, `timeout` |
| `locator(selector).click()` | `click` | `selector`, `timeout` |
| `locator(selector).fill(value)` | `fill` | `selector`, `value` |
| `locator(selector).textContent()` | `extract` | `selector`, `fields` |
| `locator(selector).getAttribute(attr)` | `extract` | `selector`, `fields[].attribute` |
| `locator(selector).isVisible()` | `wait` (optional) | `selector` |
| Boucle + `locator().nth(i)` | `paginate` | `selector`, `max_pages` |

### 3.2 Détection des Patterns

#### Pattern : Navigation

```typescript
// Détecté comme : navigate
await page.goto('https://example.com');
await page.goto('https://example.com', { waitUntil: 'networkidle', timeout: 30000 });
```

**Extraction :**
```yaml
- action: navigate
  params:
    url: https://example.com
    timeout: 30000
```

---

#### Pattern : Attente

```typescript
// Détecté comme : wait
await page.locator('.content').waitFor();
await page.waitForSelector('.content', { timeout: 10000 });
await page.waitForLoadState('networkidle');
```

**Extraction :**
```yaml
- action: wait
  params:
    selector: .content
    timeout: 10000
```

---

#### Pattern : Clic

```typescript
// Détecté comme : click
await page.locator('button.submit').click();
await page.locator('button.submit').click({ timeout: 5000 });
```

**Extraction :**
```yaml
- action: click
  params:
    selector: button.submit
    timeout: 5000
```

---

#### Pattern : Remplissage

```typescript
// Détecté comme : fill
await page.locator('#email').fill('test@example.com');
```

**Extraction :**
```yaml
- action: fill
  params:
    selector: #email
    value: test@example.com
```

---

#### Pattern : Extraction (le plus complexe)

```typescript
// Détecté comme : extract
const books = page.locator('article.product_pod');
const bookCount = await books.count();

for (let i = 0; i < bookCount; i++) {
  const book = books.nth(i);
  const title = await book.locator('h3 a').textContent();
  const price = await book.locator('p.price_color').textContent();
}
```

**Extraction :**
```yaml
- action: extract
  params:
    selector: article.product_pod
    fields:
      - name: title
        selector: h3 a
      - name: price
        selector: p.price_color
```

---

#### Pattern : Pagination

```typescript
// Détecté comme : paginate
const nextButton = page.locator('li.next a');
if (await nextButton.isVisible()) {
  await nextButton.click();
  await page.waitForLoadState('networkidle');
}
// Répété plusieurs fois ou dans une boucle
```

**Extraction :**
```yaml
- action: paginate
  params:
    selector: li.next a
    max_pages: 10
```

---

## 4. Algorithme de Conversion

### 4.1 Algorithme Principal

```typescript
/**
 * Algorithme de conversion Code → YAML
 */
async function convertCodeToYaml(code: string): Promise<ScraperConfig> {
  // Étape 1 : Parser le code TypeScript
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Étape 2 : Extraire la fonction de test
  const testFunction = extractTestFunction(sourceFile);
  
  // Étape 3 : Analyser les statements
  const statements = analyzeStatements(testFunction);
  
  // Étape 4 : Mapper vers actions YAML
  const steps = mapToActions(statements);
  
  // Étape 5 : Optimiser les sélecteurs
  const optimizedSteps = optimizeSelectors(steps);
  
  // Étape 6 : Générer la configuration YAML
  const config: ScraperConfig = {
    scrapers: [{
      name: generateName(),
      url: extractBaseUrl(statements),
      steps: optimizedSteps,
    }],
  };
  
  return config;
}
```

### 4.2 Analyse des Statements

```typescript
interface StatementAnalysis {
  type: 'navigate' | 'wait' | 'click' | 'fill' | 'extract' | 'paginate';
  selector?: string;
  url?: string;
  value?: string;
  fields?: ExtractField[];
  isOptional?: boolean;
  timeout?: number;
}

function analyzeStatement(node: ts.Statement): StatementAnalysis {
  // Si c'est un appel de fonction
  if (ts.isExpressionStatement(node)) {
    const call = node.expression;
    
    if (ts.isCallExpression(call)) {
      // Analyser page.goto()
      if (isPageGotoCall(call)) {
        return {
          type: 'navigate',
          url: extractUrl(call),
          timeout: extractTimeout(call),
        };
      }
      
      // Analyser locator().click()
      if (isLocatorClickCall(call)) {
        return {
          type: 'click',
          selector: extractSelector(call),
          timeout: extractTimeout(call),
        };
      }
      
      // Analyser locator().waitFor()
      if (isLocatorWaitCall(call)) {
        return {
          type: 'wait',
          selector: extractSelector(call),
          timeout: extractTimeout(call),
        };
      }
    }
  }
  
  // Si c'est une boucle for → potentiellement extract ou paginate
  if (ts.isForStatement(node)) {
    return analyzeForLoop(node);
  }
  
  // Si c'est un if avec isVisible() → optionnel
  if (ts.isIfStatement(node)) {
    return analyzeIfStatement(node);
  }
  
  throw new Error(`Statement non supporté: ${node.kind}`);
}
```

### 4.3 Détection de l'Extraction

```typescript
function analyzeForLoop(node: ts.ForStatement): StatementAnalysis {
  // Pattern détecté :
  // for (let i = 0; i < count; i++) {
  //   const item = items.nth(i);
  //   const field = item.locator('selector').textContent();
  // }
  
  const fields: ExtractField[] = [];
  let containerSelector: string | undefined;
  
  // Extraire le conteneur (items.nth(i))
  containerSelector = extractContainerSelector(node);
  
  // Extraire les champs depuis le corps de la boucle
  ts.forEachChild(node.statement, child => {
    if (ts.isVariableStatement(child)) {
      const field = extractFieldFromVariable(child);
      if (field) {
        fields.push(field);
      }
    }
  });
  
  return {
    type: 'extract',
    selector: containerSelector,
    fields,
  };
}
```

---

## 5. Optimisation des Sélecteurs

### 5.1 Problèmes des Sélecteurs Générés

Le code généré par UI Mode produit souvent des sélecteurs fragiles :

```typescript
// ❌ Fragile (généré)
page.locator('div:nth-child(3) > div.product-card > h3 > a')

// ✅ Robuste (optimisé)
page.locator('.product-card h3 a')
```

### 5.2 Stratégies d'Optimisation

```typescript
interface SelectorOptimizer {
  simplify(selector: string): string;
  removePositional(selector: string): string;
  preferSemantic(selector: string): string;
}

class SelectorOptimizerImpl implements SelectorOptimizer {
  
  // Supprimer les sélecteurs positionnels
  removePositional(selector: string): string {
    return selector
      .replace(/:nth-child\(\d+\)/g, '')
      .replace(/:nth-of-type\(\d+\)/g, '')
      .replace(/:first-child/g, '')
      .replace(/:last-child/g, '');
  }
  
  // Simplifier les combinateurs
  simplify(selector: string): string {
    return selector
      .replace(/ > /g, ' ')  // Enfant direct → descendant
      .replace(/\s+/g, ' ')   // Espaces multiples → un seul
      .trim();
  }
  
  // Préférer les sélecteurs sémantiques
  preferSemantic(selector: string): string {
    // Si le sélecteur contient [data-testid], l'utiliser seul
    const testIdMatch = selector.match(/\[data-testid="([^"]+)"\]/);
    if (testIdMatch) {
      return `[data-testid="${testIdMatch[1]}"]`;
    }
    
    // Si le sélecteur contient [aria-label], l'utiliser seul
    const ariaLabelMatch = selector.match(/\[aria-label="([^"]+)"\]/);
    if (ariaLabelMatch) {
      return `[aria-label="${ariaLabelMatch[1]}"]`;
    }
    
    return selector;
  }
  
  // Optimisation complète
  optimize(selector: string): string {
    let optimized = selector;
    optimized = this.removePositional(optimized);
    optimized = this.simplify(optimized);
    optimized = this.preferSemantic(optimized);
    return optimized;
  }
}
```

### 5.3 Exemples d'Optimisation

| Sélecteur Généré | Sélecteur Optimisé |
|-----------------|-------------------|
| `div:nth-child(3) > .product > h3` | `.product h3` |
| `ul > li:nth-child(2) > a.title` | `ul li a.title` |
| `[data-testid="submit-btn"]` | `[data-testid="submit-btn"]` |
| `body > div.app > main > section` | `main section` |

---

## 6. Gestion des Cas Complexes

### 6.1 Conditions (If Statements)

#### Pattern : Élément optionnel

```typescript
// Code généré
const cookieBtn = page.locator('#cookie-accept');
if (await cookieBtn.isVisible()) {
  await cookieBtn.click();
}
```

**Conversion :**
```yaml
- action: click
  params:
    selector: #cookie-accept
  options:
    optional: true
    timeout: 2000
```

---

#### Pattern : Navigation conditionnelle

```typescript
// Code généré
if (await page.locator('.login-form').isVisible()) {
  await page.locator('#email').fill('test@example.com');
  await page.locator('#password').fill('secret');
  await page.locator('button[type="submit"]').click();
}
```

**Conversion :**
```yaml
- action: wait
  params:
    selector: .login-form
  options:
    optional: true
    timeout: 3000

- action: fill
  params:
    selector: #email
    value: test@example.com
  options:
    optional: true

- action: fill
  params:
    selector: #password
    value: secret
  options:
    optional: true

- action: click
  params:
    selector: button[type="submit"]
  options:
    optional: true
```

---

### 6.2 Boucles Complexes

#### Pattern : Pagination avec limite

```typescript
// Code généré
let currentPage = 1;
const maxPages = 10;

while (currentPage <= maxPages) {
  // Extraction
  const items = page.locator('.item');
  const count = await items.count();
  
  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const title = await item.locator('h2').textContent();
  }
  
  // Navigation
  const nextBtn = page.locator('a.next');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    currentPage++;
  } else {
    break;
  }
}
```

**Conversion :**
```yaml
- action: paginate
  params:
    selector: a.next
    max_pages: 10
    itemSelector: .item
    fields:
      - name: title
        selector: h2
```

---

### 6.3 Try/Catch (Gestion d'Erreurs)

#### Pattern : Retry implicite

```typescript
// Code généré
try {
  await page.locator('.content').waitFor({ timeout: 5000 });
} catch (e) {
  console.log('Content not found, continuing...');
}
```

**Conversion :**
```yaml
- action: wait
  params:
    selector: .content
    timeout: 5000
  options:
    optional: true
    retry:
      maxAttempts: 3
      backoffFactor: 2
```

---

### 6.4 Attentes Personnalisées

#### Pattern : Attente avec condition

```typescript
// Code généré
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 10;
});
```

**Conversion :**
```yaml
- action: wait
  params:
    selector: .item
    timeout: 30000
  options:
    minCount: 10
```

---

## 7. Implémentation

### 7.1 Structure des Fichiers

```typescript
// src/converter/types.ts

export interface ConvertedStep {
  action: ActionType;
  params: Record<string, unknown>;
  options?: {
    optional?: boolean;
    timeout?: number;
    retry?: RetryConfig;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  backoffFactor: number;
}

export interface ConvertedConfig {
  name: string;
  url: string;
  steps: ConvertedStep[];
  metadata?: {
    recordedAt: string;
    playwrightVersion: string;
  };
}
```

---

### 7.2 Module Parser

```typescript
// src/converter/parser.ts

import * as ts from 'typescript';

export class PlaywrightCodeParser {
  private sourceFile: ts.SourceFile;
  
  constructor(code: string) {
    this.sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  }
  
  extractTestFunction(): ts.FunctionDeclaration | null {
    let testFn: ts.FunctionDeclaration | null = null;
    
    ts.forEachChild(this.sourceFile, child => {
      if (ts.isFunctionDeclaration(child) && child.name?.text === 'test') {
        testFn = child;
      }
    });
    
    return testFn;
  }
  
  extractStatements(fn: ts.FunctionDeclaration): ts.Statement[] {
    const body = fn.body;
    if (!body) return [];
    return Array.from(body.statements);
  }
  
  isPageGotoCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    const expr = node.expression;
    if (!ts.isPropertyAccessExpression(expr)) return false;
    return expr.name.text === 'goto';
  }
  
  extractUrlFromGoto(call: ts.CallExpression): string {
    const firstArg = call.arguments[0];
    if (firstArg && ts.isStringLiteral(firstArg)) {
      return firstArg.text;
    }
    throw new Error('URL non trouvée dans page.goto()');
  }
  
  extractSelectorFromLocator(node: ts.Node): string {
    // Extraire le sélecteur depuis locator('selector')
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'locator') {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          return arg.text;
        }
      }
    }
    throw new Error('Sélecteur non trouvé');
  }
}
```

---

### 7.3 Module Mapper

```typescript
// src/converter/mapper.ts

import { ConvertedStep } from './types';
import { PlaywrightCodeParser } from './parser';

export class ActionMapper {
  private parser: PlaywrightCodeParser;
  
  constructor(parser: PlaywrightCodeParser) {
    this.parser = parser;
  }
  
  mapStatements(statements: ts.Statement[]): ConvertedStep[] {
    const steps: ConvertedStep[] = [];
    
    for (const stmt of statements) {
      const step = this.mapStatement(stmt);
      if (step) {
        steps.push(step);
      }
    }
    
    return steps;
  }
  
  private mapStatement(stmt: ts.Statement): ConvertedStep | null {
    // Navigation
    if (this.isNavigateStatement(stmt)) {
      return this.mapNavigate(stmt);
    }
    
    // Attente
    if (this.isWaitStatement(stmt)) {
      return this.mapWait(stmt);
    }
    
    // Clic
    if (this.isClickStatement(stmt)) {
      return this.mapClick(stmt);
    }
    
    // Extraction (boucle for)
    if (this.isExtractStatement(stmt)) {
      return this.mapExtract(stmt);
    }
    
    // Pagination
    if (this.isPaginateStatement(stmt)) {
      return this.mapPaginate(stmt);
    }
    
    return null;
  }
  
  private mapNavigate(stmt: ts.Statement): ConvertedStep {
    const call = this.extractGotoCall(stmt);
    const url = this.parser.extractUrlFromGoto(call);
    const timeout = this.extractTimeout(call);
    
    return {
      action: 'navigate',
      params: {
        url,
        ...(timeout && { timeout }),
      },
    };
  }
  
  private mapExtract(stmt: ts.Statement): ConvertedStep {
    const containerSelector = this.extractContainerSelector(stmt);
    const fields = this.extractFields(stmt);
    
    return {
      action: 'extract',
      params: {
        selector: containerSelector,
        fields,
      },
    };
  }
  
  // ... autres méthodes de mapping
}
```

---

### 7.4 Module Generator

```typescript
// src/converter/generator.ts

import { stringify } from 'yaml';
import { ConvertedConfig } from './types';

export class YamlGenerator {
  generate(config: ConvertedConfig): string {
    const yamlConfig = {
      name: config.name,
      url: config.url,
      headless: true,
      viewport: {
        width: 1920,
        height: 1080,
      },
      steps: config.steps.map(step => ({
        action: step.action,
        params: {
          ...step.params,
          ...(step.options?.timeout && { timeout: step.options.timeout }),
        },
        ...(step.options?.optional && {
          options: {
            optional: step.options.optional,
          },
        }),
      })),
      metadata: config.metadata,
    };
    
    return stringify(yamlConfig, {
      indent: 2,
      lineWidth: -1, // Pas de wrapping
    });
  }
  
  saveToFile(config: ConvertedConfig, outputPath: string): void {
    const yaml = this.generate(config);
    writeFileSync(outputPath, yaml, 'utf-8');
  }
}
```

---

### 7.5 Point d'Entrée Principal

```typescript
// src/converter/index.ts

import { readFileSync, writeFileSync } from 'fs';
import { PlaywrightCodeParser } from './parser';
import { ActionMapper } from './mapper';
import { SelectorOptimizer } from './optimizer';
import { YamlGenerator } from './generator';

export interface ConvertOptions {
  inputFile: string;
  outputFile: string;
  optimizeSelectors?: boolean;
  dryRun?: boolean;
}

export async function convertCodeToYaml(options: ConvertOptions): Promise<void> {
  // Lire le code généré
  const code = readFileSync(options.inputFile, 'utf-8');
  
  // Parser
  const parser = new PlaywrightCodeParser(code);
  const testFn = parser.extractTestFunction();
  
  if (!testFn) {
    throw new Error('Fonction de test non trouvée');
  }
  
  // Extraire les statements
  const statements = parser.extractStatements(testFn);
  
  // Mapper vers actions
  const mapper = new ActionMapper(parser);
  let steps = mapper.mapStatements(statements);
  
  // Optimiser les sélecteurs
  if (options.optimizeSelectors !== false) {
    const optimizer = new SelectorOptimizer();
    steps = steps.map(step => ({
      ...step,
      params: optimizer.optimizeParams(step.params),
    }));
  }
  
  // Générer la configuration
  const generator = new YamlGenerator();
  const config: ConvertedConfig = {
    name: generateNameFromFilename(options.inputFile),
    url: extractBaseUrl(steps),
    steps,
    metadata: {
      recordedAt: new Date().toISOString(),
      playwrightVersion: '1.58.2',
    },
  };
  
  // Sauvegarder
  if (!options.dryRun) {
    generator.saveToFile(config, options.outputFile);
    console.log(`✅ Configuration générée: ${options.outputFile}`);
  } else {
    console.log('📄 Configuration générée (dry run):');
    console.log(generator.generate(config));
  }
}
```

---

## 8. Tests et Validation

### 8.1 Tests Unitaires

```typescript
// tests/converter/parser.test.ts

import { describe, it, expect } from 'bun:test';
import { PlaywrightCodeParser } from '../../src/converter/parser';

describe('PlaywrightCodeParser', () => {
  it('devrait extraire la fonction de test', () => {
    const code = `
      test('My Test', async ({ page }) => {
        await page.goto('https://example.com');
      });
    `;
    
    const parser = new PlaywrightCodeParser(code);
    const fn = parser.extractTestFunction();
    
    expect(fn).not.toBeNull();
    expect(fn?.name?.text).toBe('test');
  });
  
  it('devrait extraire l\'URL de page.goto()', () => {
    const code = `
      test('Test', async ({ page }) => {
        await page.goto('https://example.com/path');
      });
    `;
    
    const parser = new PlaywrightCodeParser(code);
    const fn = parser.extractTestFunction()!;
    const stmt = parser.extractStatements(fn)[0];
    const call = parser.extractGotoCall(stmt);
    const url = parser.extractUrlFromGoto(call);
    
    expect(url).toBe('https://example.com/path');
  });
  
  it('devrait extraire le sélecteur depuis locator()', () => {
    const code = `
      test('Test', async ({ page }) => {
        await page.locator('.my-class').click();
      });
    `;
    
    const parser = new PlaywrightCodeParser(code);
    const selector = parser.extractSelectorFromCode(code);
    
    expect(selector).toBe('.my-class');
  });
});
```

---

### 8.2 Tests d'Intégration

```typescript
// tests/converter/integration.test.ts

import { describe, it, expect } from 'bun:test';
import { convertCodeToYaml } from '../../src/converter';
import { parse } from 'yaml';

describe('Conversion Intégration', () => {
  it('devrait convertir un parcours simple', async () => {
    const inputCode = `
      test('Simple Scraper', async ({ page }) => {
        await page.goto('https://example.com');
        await page.locator('.content').waitFor();
        await page.locator('h1').textContent();
      });
    `;
    
    // Écrire le code dans un fichier temporaire
    const tempFile = '/tmp/test-recording.ts';
    writeFileSync(tempFile, inputCode);
    
    // Convertir
    await convertCodeToYaml({
      inputFile: tempFile,
      outputFile: '/tmp/test-config.yaml',
      dryRun: false,
    });
    
    // Lire et valider
    const yamlContent = readFileSync('/tmp/test-config.yaml', 'utf-8');
    const config = parse(yamlContent);
    
    expect(config.name).toBe('test-recording');
    expect(config.steps).toHaveLength(3);
    expect(config.steps[0].action).toBe('navigate');
    expect(config.steps[1].action).toBe('wait');
    expect(config.steps[2].action).toBe('extract');
  });
});
```

---

### 8.3 Matrice de Validation

| Pattern Code | Conversion Attendue | Test |
|-------------|---------------------|------|
| `page.goto(url)` | `action: navigate` | ✅ |
| `locator().waitFor()` | `action: wait` | ✅ |
| `locator().click()` | `action: click` | ✅ |
| `locator().fill(val)` | `action: fill` | ✅ |
| Boucle + `textContent()` | `action: extract` | ✅ |
| Boucle + `click()` + attente | `action: paginate` | ✅ |
| `if (isVisible())` | `options.optional: true` | ✅ |
| Sélecteur `:nth-child()` | Optimisé | ✅ |

---

## 9. Conclusion

### 9.1 Résumé de la Stratégie

1. **Parsing** : Utiliser l'API TypeScript Compiler pour analyser le code généré
2. **Mapping** : Convertir chaque pattern Playwright en action YAML
3. **Optimisation** : Simplifier les sélecteurs pour la robustesse
4. **Génération** : Produire un fichier YAML valide et lisible

### 9.2 Limitations Connues

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Code très dynamique | Conversion partielle | Révision manuelle requise |
| Conditions complexes | Mapping approximatif | Options `optional` génériques |
| Variables externes | Non résolues | Hardcoding des valeurs |

### 9.3 Perspectives d'Évolution

- 🎯 **Détection automatique** de la pagination
- 🔧 **Éditeur visuel** pour réviser la configuration générée
- 📊 **Validation en temps réel** pendant l'enregistrement
- 🤖 **IA pour l'optimisation** des sélecteurs

---

**Document rédigé par :** Assistant IA  
**Date :** 24 février 2026  
**Statut :** Spécification technique validée
