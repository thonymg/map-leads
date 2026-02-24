# 🍁 MapLeads — Scraper Web Configurable

Outil de scraping web modulaire, piloté par configuration YAML, capable d'exécuter plusieurs parcours de scraping en parallèle.

## 🚀 Démarrage Rapide

### Installation

```bash
# Installer les dépendances
bun install

# Installer les navigateurs Playwright
bunx playwright install chromium
```

### Configuration

Copiez le fichier d'exemple et adaptez-le :

```bash
cp .env.example .env
```

### Exécution

```bash
# Lancer le scraper
bun run index.ts
```

## 📋 Commandes Disponibles

### Tests

| Commande | Description |
|----------|-------------|
| `bun run test` | Exécute tous les tests |
| `bun run test:unit` | Tests unitaires |
| `bun run test:integration` | Tests d'intégration |
| `bun run test:validation` | Tests de validation |
| `bun run test:coverage` | Avec couverture de code |
| `bun run test:watch` | Mode watch (auto-reload) |

### Utilitaires

| Commande | Description |
|----------|-------------|
| `bun run typecheck` | Vérification des types |
| `bun install` | Installation des dépendances |

## 📁 Structure du Projet

```
mapleads/
├── src/
│   ├── index.ts              ← Point d'entrée
│   ├── orchestrator.ts       ← Orchestration des scrapers
│   ├── runner.ts             ← Exécution des parcours
│   ├── types.ts              ← Types TypeScript
│   ├── storage.ts            ← Sauvegarde des résultats
│   └── actions/
│       ├── navigate.ts       ← Navigation URL
│       ├── wait.ts           ← Attente sélecteur
│       ├── click.ts          ← Clic élément
│       ├── fill.ts           ← Remplissage champ
│       ├── extract.ts        ← Extraction données
│       └── paginate.ts       ← Pagination
├── tests/
│   ├── setup.ts              ← Configuration des tests
│   ├── fixtures/
│   │   └── pages/            ← Pages HTML de test
│   ├── unit/
│   │   ├── actions/          ← Tests des actions
│   │   ├── runner.test.ts
│   │   ├── orchestrator.test.ts
│   │   └── storage.test.ts
│   ├── validation/
│   │   └── config-validation.test.ts
│   └── integration/
│       └── robustness.test.ts
├── scraper.config.yaml       ← Configuration des scrapers
├── results/                  ← Résultats JSON
├── logs/                     ← Logs d'exécution
├── package.json
├── tsconfig.json
└── bunfig.toml
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [TESTS.md](./TESTS.md) | Guide complet des tests |
| [DEVELOPPEMENT.md](./DEVELOPPEMENT.md) | Document de développement |
| [architecture.md](./architecture.md) | Architecture du projet |
| [acceptation.md](./acceptation.md) | Critères d'acceptation |
| [tests/README.md](./tests/README.md) | README des tests |

## ⚙️ Configuration YAML

Exemple de configuration :

```yaml
concurrency: 5
output_dir: "./results"

scrapers:
  - name: example-scraper
    url: https://example.com
    headless: true
    viewport:
      width: 1280
      height: 800
    steps:
      - action: navigate
        params:
          url: https://example.com
      - action: wait
        params:
          selector: ".content"
      - action: extract
        params:
          selector: ".item"
          fields:
            - name: title
              selector: ".title"
            - name: price
              selector: ".price"
      - action: paginate
        params:
          selector: ".next"
          max_pages: 10
```

## 🧪 Tests

Le projet dispose d'une suite de tests complète couvrant **40/40 critères d'acceptation** :

```bash
# Tous les tests
bun run test

# Tests unitaires uniquement
bun run test:unit

# Avec couverture de code
bun run test:coverage
```

### Couverture des Tests

| Module | Critères | Tests |
|--------|----------|-------|
| Configuration YAML | CA-01 à CA-05 | 30+ |
| Actions | CA-06 à CA-20 | 90+ |
| Runner | CA-21 à CA-25 | 20+ |
| Orchestrateur | CA-26 à CA-32 | 25+ |
| Stockage | CA-33 à CA-37 | 20+ |
| Robustesse | CA-38 à CA-40 | 30+ |

**Total: ~250+ tests**

## 🔧 Dépendances

| Dépendance | Version | Usage |
|------------|---------|-------|
| `playwright` | ^1.49.0 | Automatisation navigateur |
| `yaml` | ^2.7.0 | Parsing configuration |
| `p-limit` | ^6.2.0 | Limitation concurrence |

## 📝 Licence

Propriétaire — MapLeads 2026

---

**Créé avec Bun** — Fast all-in-one JavaScript runtime
