# Suite de Tests — Scraper Configurable

Ce dossier contient tous les tests unitaires, d'intégration et de validation pour le projet Scraper Configurable.

## 📁 Structure des Tests

```
tests/
├── setup.ts                          ← Configuration globale et mocks Playwright
├── tsconfig.json                     ← Configuration TypeScript pour les tests
├── fixtures/
│   ├── test-server.ts                ← Serveur HTTP local pour tests
│   └── pages/                        ← Pages HTML statiques pour tests
│       ├── simple.html               ← Page basique (navigation, extraction)
│       ├── form.html                 ← Formulaire (fill, submit)
│       ├── list.html                 ← Liste d'éléments (extract)
│       └── pagination.html           ← Liste paginée (paginate)
├── unit/
│   ├── actions/                      ← Tests unitaires des actions
│   │   ├── navigate.test.ts          ← CA-06, CA-07
│   │   ├── wait.test.ts              ← CA-08, CA-09
│   │   ├── click.test.ts             ← CA-10, CA-11
│   │   ├── fill.test.ts              ← CA-12, CA-13
│   │   ├── extract.test.ts           ← CA-14, CA-15, CA-16
│   │   └── paginate.test.ts          ← CA-17, CA-18, CA-19, CA-20
│   ├── runner.test.ts                ← CA-21, CA-22, CA-23, CA-24, CA-25
│   ├── orchestrator.test.ts          ← CA-26, CA-27, CA-28, CA-29, CA-30, CA-31, CA-32
│   └── storage.test.ts               ← CA-33, CA-34, CA-35, CA-36, CA-37
├── validation/
│   └── config-validation.test.ts     ← CA-01, CA-02, CA-03, CA-04, CA-05
└── integration/
    └── robustness.test.ts            ← CA-38, CA-39, CA-40
```

## 🚀 Exécuter les Tests

### Tous les tests
```bash
bun test
```

### Tests unitaires uniquement
```bash
bun test tests/unit/
```

### Tests d'intégration
```bash
bun test tests/integration/
```

### Tests de validation
```bash
bun test tests/validation/
```

### Tests par action
```bash
bun test tests/unit/actions/navigate.test.ts
bun test tests/unit/actions/wait.test.ts
bun test tests/unit/actions/click.test.ts
bun test tests/unit/actions/fill.test.ts
bun test tests/unit/actions/extract.test.ts
bun test tests/unit/actions/paginate.test.ts
```

### Tests avec couverture
```bash
bun test --coverage
```

### Tests avec filtre par nom
```bash
bun test --test-name-pattern "CA-06"
bun test --test-name-pattern "retry"
```

## 📊 Couverture des Critères d'Acceptation

| Module | CA | Fichier de test | Statut |
|--------|-----|-----------------|--------|
| **Configuration YAML** | CA-01 | `validation/config-validation.test.ts` | ✅ |
| | CA-02 | `validation/config-validation.test.ts` | ✅ |
| | CA-03 | `validation/config-validation.test.ts` | ✅ |
| | CA-04 | `validation/config-validation.test.ts` | ✅ |
| | CA-05 | `validation/config-validation.test.ts` | ✅ |
| **Action navigate** | CA-06 | `unit/actions/navigate.test.ts` | ✅ |
| | CA-07 | `unit/actions/navigate.test.ts` | ✅ |
| **Action wait** | CA-08 | `unit/actions/wait.test.ts` | ✅ |
| | CA-09 | `unit/actions/wait.test.ts` | ✅ |
| **Action click** | CA-10 | `unit/actions/click.test.ts` | ✅ |
| | CA-11 | `unit/actions/click.test.ts` | ✅ |
| **Action fill** | CA-12 | `unit/actions/fill.test.ts` | ✅ |
| | CA-13 | `unit/actions/fill.test.ts` | ✅ |
| **Action extract** | CA-14 | `unit/actions/extract.test.ts` | ✅ |
| | CA-15 | `unit/actions/extract.test.ts` | ✅ |
| | CA-16 | `unit/actions/extract.test.ts` | ✅ |
| **Action paginate** | CA-17 | `unit/actions/paginate.test.ts` | ✅ |
| | CA-18 | `unit/actions/paginate.test.ts` | ✅ |
| | CA-19 | `unit/actions/paginate.test.ts` | ✅ |
| | CA-20 | `unit/actions/paginate.test.ts` | ✅ |
| **Runner** | CA-21 | `unit/runner.test.ts` | ✅ |
| | CA-22 | `unit/runner.test.ts` | ✅ |
| | CA-23 | `unit/runner.test.ts` | ✅ |
| | CA-24 | `unit/runner.test.ts` | ✅ |
| | CA-25 | `unit/runner.test.ts` | ✅ |
| **Orchestrateur** | CA-26 | `unit/orchestrator.test.ts` | ✅ |
| | CA-27 | `unit/orchestrator.test.ts` | ✅ |
| | CA-28 | `unit/orchestrator.test.ts` | ✅ |
| | CA-29 | `unit/orchestrator.test.ts` | ✅ |
| | CA-30 | `unit/orchestrator.test.ts` | ✅ |
| | CA-31 | `unit/orchestrator.test.ts` | ✅ |
| | CA-32 | `unit/orchestrator.test.ts` | ✅ |
| **Stockage** | CA-33 | `unit/storage.test.ts` | ✅ |
| | CA-34 | `unit/storage.test.ts` | ✅ |
| | CA-35 | `unit/storage.test.ts` | ✅ |
| | CA-36 | `unit/storage.test.ts` | ✅ |
| | CA-37 | `unit/storage.test.ts` | ✅ |
| **Robustesse** | CA-38 | `integration/robustness.test.ts` | ✅ |
| | CA-39 | `integration/robustness.test.ts` | ✅ |
| | CA-40 | `integration/robustness.test.ts` | ✅ |

**Total: 40/40 critères d'acceptation couverts** ✅

## 🧪 Types de Tests

### Tests Unitaires
- Testent chaque module isolément
- Utilisent des mocks pour les dépendances externes
- Rapides et déterministes

### Tests d'Intégration
- Testent les interactions entre modules
- Utilisent un serveur HTTP local pour les fixtures
- Plus lents mais plus réalistes

### Tests de Validation
- Testent le parsing et la validation de la configuration YAML
- Vérifient les valeurs par défaut et les erreurs

## 🔧 Configuration

### Fichier `setup.ts`
Configure les mocks Playwright globaux pour tous les tests :
- `mockPage` : Mock de l'objet Page de Playwright
- `mockContext` : Mock de BrowserContext
- `mockBrowser` : Mock du Browser
- `mockElementHandle` : Mock des éléments DOM
- `mockLocator` : Mock des locators

### Fichier `test-server.ts`
Serveur HTTP local pour servir les pages HTML de test :
- Port configurable (défaut: 3000)
- Sert les fichiers depuis `fixtures/pages/`
- Gestion des MIME types

## 📝 Écriture de Nouveaux Tests

### Template de test unitaire
```typescript
import { describe, it, expect, beforeEach, vi } from "bun:test";
import { mockPage, createMockPage } from "../../setup";

describe("Nom du module", () => {
  let testPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    testPage = createMockPage();
    vi.clearAllMocks();
  });

  it("CA-XX - Description du test", async () => {
    // Arrange
    // ...

    // Act
    // ...

    // Assert
    expect(...).toBe(...);
  });
});
```

### Bonnes pratiques
1. **Nommer les tests selon les CA** : `CA-06.1 - Navigation vers une URL valide réussit`
2. **Utiliser Arrange/Act/Assert** pour une structure claire
3. **Isoler les tests** : chaque test doit être indépendant
4. **Tester les cas limites** : erreurs, timeouts, valeurs nulles
5. **Documenter les mocks** : expliquer ce qui est mocké et pourquoi

## 🐛 Debugging

### Exécuter un test spécifique
```bash
bun test --test-name-pattern "CA-06.1"
```

### Afficher les logs
```bash
bun test --verbose
```

### Timeout des tests
Par défaut, les tests ont un timeout de 5 secondes. Pour le modifier :
```typescript
it("Test lent", async () => {
  // ...
}, 10000); // 10 secondes
```

## 📈 Couverture de Code

Pour générer un rapport de couverture :
```bash
bun test --coverage
```

Le rapport est généré dans `coverage/`.

## 🔍 Résolution des Problèmes

### "Cannot find module"
Vérifiez que les imports sont corrects et que `tsconfig.json` est bien configuré.

### "Mock is not defined"
Assurez-vous que `setup.ts` est importé ou que les mocks sont configurés globalement.

### Test échoue aléatoirement
Vérifiez qu'il n'y a pas d'état partagé entre les tests. Utilisez `vi.clearAllMocks()` dans `beforeEach`.

### Timeout dépassé
Augmentez le timeout du test ou optimisez le code testé.

## 📚 Références

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Playwright Documentation](https://playwright.dev/)
- [Critères d'acceptation](../acceptation.md)
- [Architecture](../architecture.md)
- [Document de développement](../DEVELOPPEMENT.md)
