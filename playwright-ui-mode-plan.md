# 🎭 Playwright UI Mode — Plan d'Exécution

**Document d'analyse et de migration vers le mode UI de Playwright**

**Date :** 24 février 2026  
**Version :** 1.0  
**Statut :** Proposition

---

## 📋 Table des Matières

1. [Introduction](#1-introduction)
2. [Analyse Comparative](#2-analyse-comparative)
3. [Plan d'Exécution](#3-plan-dexécution)
4. [Architecture Proposée](#4-architecture-proposée)
5. [Axes d'Amélioration](#5-axes-damélioration)
6. [Recommandations](#6-recommandations)

---

## 1. Introduction

### 1.1 Contexte

Actuellement, MapLeads utilise un système de configuration YAML pour définir les parcours de scraping. Ce document propose d'intégrer le **mode UI de Playwright** pour permettre l'enregistrement visuel des parcours avant leur utilisation dans le scraper.

### 1.2 Objectif

- Permettre aux utilisateurs d'enregistrer visuellement un parcours de navigation
- Générer automatiquement la configuration de scraping
- Réduire la courbe d'apprentissage et les erreurs de configuration

### 1.3 Prérequis Techniques

```bash
# Installation de Playwright Test (nécessaire pour UI Mode)
npm install -D @playwright/test

# Initialisation de la configuration Playwright
npx playwright init

# Lancement du mode UI
npx playwright test --ui
```

---

## 2. Analyse Comparative

### 2.1 Système Actuel (Configuration YAML)

#### ✅ Avantages

| Aspect | Description |
|--------|-------------|
| **Versioning** | Fichiers YAML versionnables dans Git, diff lisible |
| **Portabilité** | Configuration autonome, exécutable sur n'importe quelle machine |
| **Répétabilité** | Même configuration = même résultat garanti |
| **Maintenance** | Modification rapide sans réenregistrement |
| **Automatisation** | Intégration facile dans CI/CD |
| **Documentation** | La configuration elle-même documente le scraping |
| **Low-code** | Les utilisateurs métier peuvent créer/modifier sans coder |

#### ❌ Inconvénients

| Aspect | Description |
|--------|-------------|
| **Courbe d'apprentissage** | Nécessite de comprendre la structure YAML et les sélecteurs CSS |
| **Erreurs de syntaxe** | Risque d'erreurs dans les sélecteurs ou la structure |
| **Debugging complexe** | Difficile de tester un sélecteur sans exécuter tout le scraper |
| **Pas de preview** | Impossible de visualiser le parcours avant exécution |
| **Sélecteurs statiques** | Les sélecteurs doivent être trouvés manuellement (DevTools) |
| **Temps de configuration** | 15-30 minutes pour configurer un nouveau scraper |

---

### 2.2 Playwright UI Mode

#### ✅ Avantages

| Aspect | Description |
|--------|-------------|
| **Enregistrement visuel** | Navigation réelle enregistrée en temps réel |
| **Génération automatique** | Code généré automatiquement avec les bons sélecteurs |
| **Debugging intégré** | Test immédiat des sélecteurs, inspection des éléments |
| **Time-travel** | Revoir chaque étape de la navigation |
| **Pick locator** | Outil de sélection visuelle des éléments |
| **Rapidité** | Configuration en 2-5 minutes vs 15-30 minutes |
| **Accessibilité** | Accessible aux non-développeurs |
| **Export multiple** | Export en JavaScript, TypeScript, Python, Java, C# |

#### ❌ Inconvénients

| Aspect | Description |
|--------|-------------|
| **Code généré verbeux** | Code parfois trop spécifique, difficile à maintenir |
| **Pas de configuration YAML** | Sortie en code, pas en configuration déclarative |
| **Versioning complexe** | Difficile de versionner les parcours enregistrés |
| **Fragilité** | Les sélecteurs générés peuvent être trop spécifiques |
| **Dépendance à l'UI** | Nécessite l'interface graphique pour modifier |
| **Pas de paramètres** | Difficile de paramétrer dynamiquement (pagination, timeouts) |
| **CI/CD** | Nécessite une adaptation pour l'exécution headless |
| **Lock-in Playwright** | Migration vers un autre outil plus complexe |

---

### 2.3 Tableau Comparatif

| Critère | YAML (Actuel) | UI Mode | Gagnant |
|---------|---------------|---------|---------|
| **Facilité de création** | ⭐⭐ | ⭐⭐⭐⭐⭐ | UI Mode |
| **Maintenance** | ⭐⭐⭐⭐ | ⭐⭐ | YAML |
| **Versioning** | ⭐⭐⭐⭐⭐ | ⭐⭐ | YAML |
| **Debugging** | ⭐⭐ | ⭐⭐⭐⭐⭐ | UI Mode |
| **Accessibilité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | UI Mode |
| **Automatisation CI/CD** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | YAML |
| **Flexibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | YAML |
| **Rapidité configuration** | ⭐⭐ | ⭐⭐⭐⭐⭐ | UI Mode |
| **Portabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | YAML |
| **Documentation** | ⭐⭐⭐⭐ | ⭐⭐ | YAML |

---

## 3. Plan d'Exécution

### Phase 1 — Exploration et Preuve de Concept (Jours 1-2)

#### Objectif : Valider la faisabilité technique

**Tâches :**

| ID | Tâche | Durée | Livrable |
|----|-------|-------|----------|
| T1.1 | Installation et configuration de `@playwright/test` | 2h | `playwright.config.ts` |
| T1.2 | Exploration du mode UI et enregistrement d'un parcours simple | 4h | Script enregistré |
| T1.3 | Analyse du code généré et identification des patterns | 4h | Document d'analyse |
| T1.4 | Test d'export et d'exécution en mode headless | 2h | Rapport de test |
| T1.5 | Comparaison avec la configuration YAML actuelle | 4h | Matrice de correspondance |

**Critères de validation :**
- [ ] Un parcours complet peut être enregistré
- [ ] Le code généré peut être exécuté en mode headless
- [ ] Les sélecteurs générés sont exploitables

---

### Phase 2 — Développement du Parser (Jours 3-5)

#### Objectif : Convertir le code généré en configuration YAML

**Tâches :**

| ID | Tâche | Durée | Livrable |
|----|-------|-------|----------|
| T2.1 | Analyse syntaxique du code généré par UI Mode | 6h | AST parser |
| T2.2 | Mapping des commandes Playwright vers actions YAML | 8h | Table de correspondance |
| T2.3 | Développement du convertisseur Code → YAML | 12h | Module `converter.ts` |
| T2.4 | Gestion des cas limites (conditions, boucles) | 6h | Tests de conversion |
| T2.5 | Validation de la configuration générée | 4h | Tests de validation |

**Critères de validation :**
- [ ] 100% des actions de base sont convertibles
- [ ] La configuration générée est valide
- [ ] Le scraper peut exécuter la configuration convertie

---

### Phase 3 — Intégration dans MapLeads (Jours 6-8)

#### Objectif : Intégrer le flux UI → YAML dans l'outil

**Tâches :**

| ID | Tâche | Durée | Livrable |
|----|-------|-------|----------|
| T3.1 | Création d'un template de test pour l'enregistrement | 4h | `record.template.ts` |
| T3.2 | Script de lancement rapide du mode UI | 2h | `npm run record` |
| T3.3 | Intégration du convertisseur dans le workflow | 6h | Pipeline complet |
| T3.4 | Génération automatique du fichier `.scrappe.yaml` | 4h | Fichier de sortie |
| T3.5 | Documentation du nouveau workflow | 4h | Guide utilisateur |

**Critères de validation :**
- [ ] `npm run record` lance le mode UI
- [ ] L'enregistrement génère un fichier YAML exploitable
- [ ] Le fichier peut être exécuté avec `npm run scrape`

---

### Phase 4 — Optimisation et Robustesse (Jours 9-10)

#### Objectif : Améliorer la qualité des configurations générées

**Tâches :**

| ID | Tâche | Durée | Livrable |
|----|-------|-------|----------|
| T4.1 | Optimisation des sélecteurs générés (robustesse) | 6h | Module d'optimisation |
| T4.2 | Ajout de métadonnées (timeouts, retries) | 4h | Configuration enrichie |
| T4.3 | Gestion des parcours complexes (pagination, conditions) | 8h | Tests avancés |
| T4.4 | Tests de bout en bout sur 5 sites réels | 8h | Rapport de tests |
| T4.5 | Revue et validation finale | 4h | Checklist de validation |

**Critères de validation :**
- [ ] 5 scrapers réels fonctionnent avec le nouveau workflow
- [ ] Les sélecteurs sont robustes aux changements mineurs
- [ ] Documentation complète fournie

---

## 4. Architecture Proposée

### 4.1 Workflow Hybride

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW UTILISATEUR                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Mode UI     │────▶│  Conversion  │────▶│   Fichier    │
│  Enregistrement│   │  Code → YAML │   │  .scrappe.yaml │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                      │
       │                    │                      ▼
       │                    │            ┌──────────────┐
       │                    │            │   Exécution  │
       │                    │            │   Scraper    │
       │                    │            └──────────────┘
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│ Code généré  │     │ Configuration│
│ (temporaire) │     │   YAML       │
└──────────────┘     └──────────────┘
```

### 4.2 Structure des Fichiers

```
mapleads/
├── src/
│   ├── converter/
│   │   ├── index.ts           ← Convertisseur principal
│   │   ├── parser.ts          ← Parseur de code généré
│   │   ├── mapper.ts          ← Mapping actions
│   │   └── optimizer.ts       ← Optimisation sélecteurs
│   └── ...
├── recordings/                 ← Enregistrements temporaires
│   └── temp-recording.ts
├── scrappe/
│   └── [domaine].scrappe.yaml  ← Configuration générée
├── playwright.config.ts        ← Configuration Playwright Test
└── package.json
```

### 4.3 Commandes npm Ajoutées

```json
{
  "scripts": {
    "record": "npx playwright test --ui",
    "record:output": "npx playwright test --ui --output=./recordings",
    "convert": "bun run src/converter/index.ts",
    "scrape": "node --experimental-strip-types scrape.ts"
  }
}
```

---

## 5. Axes d'Amélioration

### 5.1 Amélioration du Code Généré

#### Problème : Sélecteurs trop spécifiques

**Code généré par UI Mode :**
```typescript
await page.locator('div:nth-child(3) > .product-card > h3').click();
```

**Version optimisée :**
```yaml
- action: click
  params:
    selector: .product-card h3
```

**Solution :** Implémenter un module d'optimisation qui :
- Simplifie les sélecteurs CSS
- Utilise des sélecteurs sémantiques (`[data-testid]`, `aria-label`)
- Évite les sélecteurs positionnels (`:nth-child`)

---

#### Problème : Code verbeux et répétitif

**Code généré :**
```typescript
const listItem1 = page.locator('ul > li').first();
await listItem1.click();
const listItem2 = page.locator('ul > li').nth(1);
await listItem2.click();
```

**Version optimisée :**
```yaml
- action: paginate
  params:
    selector: ul > li
    max_pages: 10
```

**Solution :** Détecter les patterns répétitifs et les convertir en actions de pagination.

---

### 5.2 Ajout de Métadonnées

#### Configuration enrichie post-enregistrement

```yaml
# Configuration générée automatiquement
name: books-scraper
url: https://books.toscrape.com/
headless: true
viewport:
  width: 1920
  height: 1080

# Métadonnées ajoutées automatiquement
metadata:
  recordedAt: 2026-02-24T12:00:00Z
  recordedBy: user@example.com
  playwrightVersion: 1.58.2
  optimizerVersion: 1.0.0

# Configuration de robustesse ajoutée
retry:
  maxAttempts: 3
  backoffFactor: 2
  
timeout:
  navigation: 30000
  action: 10000
  global: 300000

steps:
  # ... étapes converties
```

---

### 5.3 Gestion des Parcours Complexes

#### Conditions et Branchements

**Scénario :** Cliquer sur "Accepter les cookies" si présent

**Approche proposée :**
```yaml
steps:
  - action: click
    params:
      selector: #cookie-accept
    options:
      optional: true      # Ne pas échouer si absent
      timeout: 2000       # Timeout court
```

#### Boucles et Pagination

**Détection automatique :**
- Bouton "Suivant" cliqué plusieurs fois
- Même pattern d'extraction répété
- Conversion automatique en action `paginate`

---

### 5.4 Intégration CI/CD

#### Pipeline de Validation

```yaml
# .github/workflows/validate-scraper.yml
name: Validate Scraper Config

on:
  push:
    paths:
      - 'scrappe/*.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        
      - name: Install dependencies
        run: npm install
        
      - name: Validate config
        run: npm run typecheck
        
      - name: Test scraper (dry run)
        run: npm run scrape -- --file ${{ matrix.config }} --dry-run
```

---

### 5.5 Interface Utilisateur Simplifiée

#### Script de Lancement Rapide

```typescript
// scripts/record.ts
import { launchUIRecorder } from '../src/converter';

async function main() {
  const config = await launchUIRecorder({
    outputDir: './recordings',
    template: './templates/scraper-template.ts',
    autoConvert: true,
    optimizeSelectors: true,
  });
  
  console.log(`Enregistrement sauvegardé: ${config.outputFile}`);
}

main();
```

#### Template d'Enregistrement

```typescript
// templates/scraper-template.ts
import { test, expect } from '@playwright/test';

test('Scraper Recording', async ({ page }) => {
  // 🎯 NAVIGATION
  // Enregistrez votre navigation ici...
  
  // 📊 EXTRACTION
  // Les éléments extraits seront détectés automatiquement...
  
  // 📄 PAGINATION
  // Cliquez sur "Suivant" pour enregistrer la pagination...
});
```

---

## 6. Recommandations

### 6.1 Stratégie de Migration

#### Approche Hybride Recommandée

**Conserver le système YAML actuel :**
- ✅ Pour la maintenance et le versioning
- ✅ Pour l'exécution en production
- ✅ Pour l'automatisation CI/CD

**Ajouter UI Mode comme outil de création :**
- ✅ Pour l'enregistrement rapide
- ✅ Pour le debugging et le test de sélecteurs
- ✅ Pour les utilisateurs non-techniques

#### Workflow Recommandé

```
1. Enregistrement initial → UI Mode (5 min)
2. Conversion automatique → YAML
3. Révision manuelle → Éditeur YAML (5 min)
4. Test et validation → npm run scrape
5. Versioning → Git commit
6. Exécution production → npm run scrape
```

**Temps total :** 15 minutes vs 30 minutes (manuel)

---

### 6.2 Matrice de Décision

| Cas d'Usage | Approche Recommandée |
|-------------|---------------------|
| **Nouveau scraper simple** | UI Mode → Conversion → YAML |
| **Nouveau scraper complexe** | UI Mode (partiel) + YAML manuel |
| **Modification mineure** | Édition YAML directe |
| **Debugging de sélecteur** | UI Mode (Pick Locator) |
| **Scraper critique production** | YAML manuel + revue |
| **Prototype / POC** | UI Mode uniquement |

---

### 6.3 Roadmap de Déploiement

| Phase | Durée | Objectif |
|-------|-------|----------|
| **Phase 1** | Semaine 1 | POC et validation technique |
| **Phase 2** | Semaine 2 | Développement du convertisseur |
| **Phase 3** | Semaine 3 | Intégration et tests |
| **Phase 4** | Semaine 4 | Documentation et formation |
| **Phase 5** | Semaine 5 | Déploiement progressif |

---

### 6.4 Métriques de Succès

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **Temps de configuration** | < 15 min | Tracking utilisateur |
| **Taux de conversion** | > 90% | Scripts convertis avec succès |
| **Erreurs de sélecteurs** | < 5% | Logs d'exécution |
| **Satisfaction utilisateur** | > 4/5 | Survey interne |
| **Adoption** | > 80% | % scrapers créés via UI |

---

## 7. Conclusion

### 7.1 Synthèse

| Aspect | Recommandation |
|--------|---------------|
| **UI Mode** | ✅ Adopter comme outil de **création** |
| **YAML** | ✅ Conserver comme format de **production** |
| **Conversion** | ✅ Développer un module automatique |
| **Optimisation** | ✅ Implémenter un optimiseur de sélecteurs |

### 7.2 Bénéfices Attendus

- ⏱️ **Réduction de 50% du temps de configuration**
- 🎯 **Meilleure qualité des sélecteurs**
- 👥 **Accessibilité accrue pour les non-développeurs**
- 🔧 **Debugging simplifié**
- 📝 **Documentation automatique via YAML**

### 7.3 Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Code généré non maintenable | Élevé | Optimiseur de sélecteurs + revue manuelle |
| Dépendance à l'UI Graphique | Moyen | Conserver YAML comme format source |
| Complexité accrue | Moyen | Documentation et formation |
| Problems de compatibilité | Faible | Tests approfondis avant déploiement |

---

## 8. Annexes

### 8.1 Ressources Utiles

- [Playwright UI Mode Documentation](https://playwright.dev/docs/test-ui-mode)
- [Playwright Code Generator](https://playwright.dev/docs/codegen)
- [Playwright Test Introduction](https://playwright.dev/docs/intro)

### 8.2 Exemple Complet

#### Enregistrement UI Mode (code généré)

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://books.toscrape.com/');
  await page.locator('article.product_pod').first().waitFor();
  
  const title = await page.locator('article.product_pod h3 a').first().textContent();
  const price = await page.locator('article.product_pod .price_color').first().textContent();
  
  await page.locator('li.next a').click();
  await page.waitForLoadState('networkidle');
});
```

#### Configuration YAML Convertie

```yaml
name: books-scraper
url: https://books.toscrape.com/
headless: true
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
          selector: .price_color
      
  - action: paginate
    params:
      selector: li.next a
      max_pages: 10
```

---

**Document rédigé par :** Assistant IA  
**Date :** 24 février 2026  
**Statut :** Proposition en attente de validation
