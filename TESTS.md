# 🧪 Guide de Tests — MapLeads Scraper

Ce document explique comment exécuter et configurer les tests pour le projet MapLeads.

## 📋 Prérequis

Assurez-vous d'avoir installé toutes les dépendances :

```bash
bun install
```

## 🚀 Commandes Disponibles

### Commandes de base

| Commande | Description |
|----------|-------------|
| `bun run test` | Exécute tous les tests |
| `bun run test:unit` | Exécute les tests unitaires |
| `bun run test:integration` | Exécute les tests d'intégration |
| `bun run test:validation` | Exécute les tests de validation |
| `bun run test:actions` | Exécute les tests des actions |

### Commandes avancées

| Commande | Description |
|----------|-------------|
| `bun run test:watch` | Exécute les tests en mode watch (re-run automatique) |
| `bun run test:coverage` | Exécute les tests avec rapport de couverture |
| `bun run test:verbose` | Exécute les tests avec logs détaillés |
| `bun run typecheck` | Vérifie les types TypeScript |
| `bun run typecheck:tests` | Vérifie les types des tests |

## 📁 Structure des Tests

```
tests/
├── setup.ts                          ← Configuration globale
├── fixtures/
│   ├── test-server.ts                ← Serveur HTTP local
│   └── pages/                        ← Pages HTML de test
├── unit/
│   ├── actions/                      ← Tests des actions (CA-06 à CA-20)
│   ├── runner.test.ts                ← Tests du runner (CA-21 à CA-25)
│   ├── orchestrator.test.ts          ← Tests de l'orchestrateur (CA-26 à CA-32)
│   └── storage.test.ts               ← Tests du stockage (CA-33 à CA-37)
├── validation/
│   └── config-validation.test.ts     ← Validation YAML (CA-01 à CA-05)
└── integration/
    └── robustness.test.ts            ← Robustesse (CA-38 à CA-40)
```

## 📖 Exemples d'Utilisation

### Exécuter tous les tests
```bash
bun run test
```

### Exécuter un fichier de test spécifique
```bash
bun test tests/unit/actions/navigate.test.ts
```

### Exécuter les tests avec un filtre par nom
```bash
bun test --test-name-pattern "CA-06"
bun test --test-name-pattern "retry"
```

### Exécuter avec couverture de code
```bash
bun run test:coverage
```

Les rapports sont générés dans le dossier `coverage/`.

### Mode watch (développement)
```bash
bun run test:watch
```

Les tests se ré-exécutent automatiquement à chaque modification de fichier.

## 🔧 Configuration

### Fichier `bunfig.toml`
```toml
[test]
timeout = 5000  # 5 secondes par défaut

[coverage]
enabled = false  # Activer pour la couverture
coverageDir = "./coverage"
```

### Fichier `.env`
Copiez `.env.example` en `.env` pour configurer :
- `CONCURRENCY` : Nombre de tests en parallèle
- `TIMEOUT` : Timeout global
- `LOG_LEVEL` : Niveau de log

## 📊 Couverture des Critères d'Acceptation

| Dossier | CA | Tests |
|---------|-----|-------|
| `validation/` | CA-01 à CA-05 | 30+ |
| `unit/actions/` | CA-06 à CA-20 | 90+ |
| `unit/runner.test.ts` | CA-21 à CA-25 | 20+ |
| `unit/orchestrator.test.ts` | CA-26 à CA-32 | 25+ |
| `unit/storage.test.ts` | CA-33 à CA-37 | 20+ |
| `integration/robustness.test.ts` | CA-38 à CA-40 | 30+ |

**Total: 40/40 CA couverts (~250+ tests)**

## 🐛 Dépannage

### "Cannot find module 'playwright'"
```bash
bun install
bunx playwright install chromium
```

### "Timeout exceeded"
Augmentez le timeout dans `bunfig.toml` :
```toml
[test]
timeout = 10000  # 10 secondes
```

### Les mocks ne fonctionnent pas
Vérifiez que `tests/setup.ts` est correctement importé.

### Erreurs de type TypeScript
```bash
bun run typecheck
bun run typecheck:tests
```

## 📚 Références

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Playwright Documentation](https://playwright.dev/)
- [Tests README](./tests/README.md)
