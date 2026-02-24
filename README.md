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

### ⚠️ Important : Exécution avec Node.js

**Note :** En raison d'un problème de compatibilité entre Bun et Playwright sur Windows, utilisez **Node.js** pour exécuter les scrapers :

```bash
# Lancer un scraper (recommandé)
npm run scrape

# Ou directement avec Node.js
node --experimental-strip-types scrape.ts
```

## 📋 Commandes Disponibles

### Scraping

| Commande | Description |
|----------|-------------|
| `npm run scrape` | Lance tous les scrapers du dossier `./scrappe` |
| `npm run scrape -- --list` | Liste les configurations disponibles |
| `npm run scrape -- --file <fichier>` | Lance un fichier spécifique |
| `npm run scrape -- --domain <domaine>` | Lance tous les scrapers d'un domaine |

**Exemples :**

```bash
# Lister les configurations
npm run scrape -- --list

# Lancer un scraper spécifique
npm run scrape -- --file books.toscrape.com.scrappe.yaml

# Lancer par domaine
npm run scrape -- --domain toscrape.com

# Lancer tous les scrapers
npm run scrape
```

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
| `tsc --noEmit` | Vérification des types |
| `bun install` | Installation des dépendances |

## 📁 Structure du Projet

```
mapleads/
├── src/
│   ├── index.ts              ← Point d'entrée (config classique)
│   ├── scrape.ts             ← Script de lancement des scrapers
│   ├── orchestrator.ts       ← Orchestration des scrapers
│   ├── runner.ts             ← Exécution des parcours
│   ├── types.ts              ← Types TypeScript
│   ├── storage.ts            ← Sauvegarde des résultats
│   ├── config.ts             ← Chargement configuration YAML
│   ├── logger.ts             ← Logs structurés
│   ├── retry.ts              ← Retry automatique
│   └── actions/
│       ├── navigate.ts       ← Navigation URL
│       ├── wait.ts           ← Attente sélecteur
│       ├── click.ts          ← Clic élément
│       ├── fill.ts           ← Remplissage champ
│       ├── extract.ts        ← Extraction données
│       └── paginate.ts       ← Pagination
├── scrappe/                  ← Configurations de scraping (*.scrappe.yaml)
│   ├── README.md
│   ├── books.toscrape.com.scrappe.yaml
│   └── quotes.toscrape.com.scrappe.yaml
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
├── scraper.config.yaml       ← Configuration classique
├── results/                  ← Résultats JSON
├── logs/                     ← Logs d'exécution
├── package.json
├── tsconfig.json
└── bunfig.toml
```

## 🗂️ Dossier Scrappe

Le dossier `./scrappe` contient les configurations de scraping pour chaque site.

### Format des fichiers

Chaque fichier suit le format : `[nomdedomaine].scrappe.yaml`

**Exemple :** `books.toscrape.com.scrappe.yaml`

```yaml
# Configuration globale
concurrency: 2          # Nombre de scrapers en parallèle
output_dir: ./results   # Dossier de sortie

# Liste des scrapers
scrapers:
  - name: books-demo
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
              attribute: title
            - name: price
              selector: p.price_color
            - name: availability
              selector: p.instock.availability
      
      - action: paginate
        params:
          selector: li.next a
          max_pages: 5
```

### Ajouter un nouveau scraper

1. Créez un fichier `[domaine].scrappe.yaml` dans `./scrappe/`
2. Définissez la configuration
3. Testez avec : `npm run scrape -- --file [domaine].scrappe.yaml`

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [scrappe/README.md](./scrappe/README.md) | Guide du dossier scrappe |
| [TESTS.md](./TESTS.md) | Guide complet des tests |
| [DEVELOPPEMENT.md](./DEVELOPPEMENT.md) | Document de développement |
| [architecture.md](./architecture.md) | Architecture du projet |
| [acceptation.md](./acceptation.md) | Critères d'acceptation |

## ⚙️ Actions Disponibles

| Action | Description | Paramètres requis |
|--------|-------------|-------------------|
| `navigate` | Navigation vers une URL | `url` |
| `wait` | Attente d'un élément ou durée | `selector` ou `duration` |
| `click` | Clic sur un élément | `selector` |
| `fill` | Remplir un champ | `selector`, `value` |
| `extract` | Extraire des données | `selector`, `fields` |
| `paginate` | Navigation multi-pages | `selector` |

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

## 📊 Résultats

Les résultats sont sauvegardés dans `./results/` sous forme de fichiers JSON horodatés :

```
results/
├── books-demo-2026-02-24T12-09-19.json
└── quotes-demo-2026-02-24T12-11-08.json
```

Chaque fichier contient :
- Métadonnées d'exécution (durée, nombre de pages, erreurs)
- Tableau de données extraites

**Exemple de résultat :**

```json
{
  "name": "books-demo",
  "url": "https://books.toscrape.com/",
  "startedAt": "2026-02-24T12:09:19.674Z",
  "completedAt": "2026-02-24T12:09:32.561Z",
  "duration": 12887,
  "success": true,
  "pageCount": 10,
  "recordCount": 120,
  "data": [
    {
      "title": "A Light in the Attic",
      "price": "£51.77",
      "availability": "In stock",
      "link": "catalogue/a-light-in-the-attic_1000/index.html"
    }
  ],
  "errors": []
}
```

## 🔧 Dépendances

| Dépendance | Version | Usage |
|------------|---------|-------|
| `playwright` | ^1.58.2 | Automatisation navigateur |
| `yaml` | ^2.7.0 | Parsing configuration |
| `p-limit` | ^6.2.0 | Limitation concurrence |

## 🛠️ Dépannage

### Playwright ne s'ouvre pas avec Bun

**Problème :** Le navigateur ne se lance pas avec `bun run`

**Solution :** Utilisez Node.js à la place :

```bash
npm run scrape
```

### Erreur de navigation / timeout

**Solution :** Augmentez le timeout dans la configuration :

```yaml
- action: navigate
  params:
    url: https://example.com
    timeout: 60000  # 60 secondes
```

### Fichiers de configuration non trouvés

Vérifiez que vos fichiers sont dans le bon dossier :

```bash
ls scrappe/*.scrappe.yaml
```

## 📝 Licence

Propriétaire — MapLeads 2026

---

**Créé avec Bun & Node.js** — Runtime JavaScript et Playwright pour l'automatisation
