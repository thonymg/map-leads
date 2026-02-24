# Scraper configurable — Planning & Architecture

## 1. Objectif du projet

Développer un outil de scraping web modulaire, piloté par un fichier de configuration YAML, capable d'exécuter plusieurs parcours de scraping en parallèle au sein d'un unique navigateur Playwright. Chaque parcours dispose de son propre contexte isolé pour éviter tout conflit d'état entre les sessions.

---

## 2. Planning de développement

Le projet est découpé en 5 phases livrables et indépendantes. Chaque phase doit être validée avant de passer à la suivante.

### Phase 1 — Fondations (Jour 1)

Mise en place de l'environnement et des types partagés.

- Initialisation du projet Bun avec TypeScript
- Installation des dépendances : Playwright, yaml, p-limit
- Définition des interfaces TypeScript dans `types.ts`
- Création de la structure de dossiers du projet
- Rédaction du fichier `scraper.config.yaml` avec deux scrapers d'exemple

**Livrable :** projet initialisé, typé, config YAML fonctionnelle et parsable sans erreur.

---

### Phase 2 — Actions individuelles (Jours 2-3)

Développement de chaque action de manière isolée et testable indépendamment.

- Action `navigate` : navigation vers une URL avec attente du chargement
- Action `wait` : attente d'un sélecteur CSS ou d'une durée fixe
- Action `click` : clic sur un élément, tolérant si l'élément est absent
- Action `fill` : remplissage d'un champ de formulaire
- Action `extract` : extraction de champs depuis des éléments répétés
- Action `paginate` : navigation multi-pages en réutilisant l'action extract

**Livrable :** chaque action fonctionne de manière autonome sur une page de test.

---

### Phase 3 — Runner (Jour 4)

Assemblage des actions en un parcours complet pour un scraper donné.

- Lecture et interprétation séquentielle des étapes de la config
- Gestion du contexte Playwright par scraper (page isolée)
- Transmission de l'étape `extract` à l'action `paginate`
- Capture des erreurs sans interrompre les autres scrapers
- Retour d'un objet `ScraperResult` structuré

**Livrable :** un scraper complet peut s'exécuter du début à la fin sur une URL réelle.

---

### Phase 4 — Orchestrateur et stockage (Jour 5)

Mise en parallèle des scrapers et sauvegarde des résultats.

- Ouverture d'un browser unique partagé
- Création d'un contexte Playwright isolé par scraper
- Limitation de la concurrence via `p-limit`
- Fermeture propre du contexte après chaque scraper
- Sauvegarde de chaque résultat dans un fichier JSON horodaté
- Affichage d'un résumé global en fin d'exécution

**Livrable :** plusieurs scrapers s'exécutent en parallèle et produisent leurs fichiers de sortie.

---

### Phase 5 — Robustesse et finalisation (Jour 6)

Renforcement de la fiabilité et documentation finale.

- Validation de la config YAML au démarrage (champs obligatoires, types)
- Retry automatique en cas d'erreur réseau (1 à 3 tentatives)
- Logs structurés avec horodatage pour chaque action
- Revue des cas limites : page vide, sélecteur absent, timeout dépassé
- Rédaction du README

**Livrable :** outil stable, documenté, prêt à être utilisé en production.

---

## 3. Architecture du projet

```
scraper/
├── scraper.config.yaml       ← Fichier de configuration des parcours
├── src/
│   ├── index.ts              ← Point d'entrée : charge la config et lance l'orchestrateur
│   ├── orchestrator.ts       ← Gère le browser partagé et le parallélisme
│   ├── runner.ts             ← Exécute le parcours d'un scraper dans son contexte
│   ├── types.ts              ← Interfaces TypeScript partagées
│   ├── storage.ts            ← Sauvegarde des résultats en JSON
│   └── actions/
│       ├── navigate.ts       ← Aller à une URL
│       ├── wait.ts           ← Attendre un sélecteur ou une durée
│       ├── click.ts          ← Cliquer sur un élément
│       ├── fill.ts           ← Remplir un champ formulaire
│       ├── extract.ts        ← Extraire des données structurées
│       └── paginate.ts       ← Naviguer entre plusieurs pages
├── results/                  ← Fichiers JSON produits par chaque scraper
├── logs/                     ← Logs d'exécution
└── package.json
```

---

## 4. Flux d'exécution

```
index.ts
  └── Charge scraper.config.yaml
  └── Lance orchestrator.ts
        └── Ouvre 1 browser Playwright
        └── Pour chaque scraper (en parallèle, limité par concurrency) :
              └── Crée un BrowserContext isolé
              └── Lance runner.ts
                    └── Ouvre une Page dans le contexte
                    └── Exécute chaque étape (actions/)
                    └── Retourne un ScraperResult
              └── Ferme le BrowserContext
              └── Lance storage.ts → sauvegarde le JSON
        └── Affiche le résumé global
        └── Ferme le browser
```

---

## 5. Modèle de données

### Configuration YAML (entrée)

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `concurrency` | number | Non | Nombre de scrapers en parallèle (défaut: 5) |
| `output_dir` | string | Non | Dossier de sortie (défaut: ./results) |
| `scrapers` | array | Oui | Liste des scrapers à exécuter |
| `scrapers[].name` | string | Oui | Identifiant unique du scraper |
| `scrapers[].url` | string | Oui | URL de départ |
| `scrapers[].steps` | array | Oui | Séquence d'actions à exécuter |
| `scrapers[].headless` | boolean | Non | Mode headless (défaut: true) |
| `scrapers[].viewport` | object | Non | Dimensions du viewport |

### Actions disponibles dans les étapes

| Action | Paramètres requis | Paramètres optionnels |
|---|---|---|
| `navigate` | `url` | `timeout` |
| `wait` | `selector` ou `duration` | `timeout` |
| `click` | `selector` | `timeout` |
| `fill` | `selector`, `value` | `timeout` |
| `extract` | `selector`, `fields` | — |
| `paginate` | `selector` | `max_pages`, `timeout` |

### Résultat JSON (sortie)

Chaque scraper produit un fichier `{name}-{timestamp}.json` contenant les métadonnées d'exécution (durée, nombre de pages, erreurs) et le tableau de données extraites.

---

## 6. Contraintes techniques

- Le browser Playwright est instancié **une seule fois** pour l'ensemble de l'exécution afin d'optimiser la mémoire et le temps de démarrage.
- Chaque scraper dispose de son propre `BrowserContext` : cookies, localStorage, sessions et état réseau sont entièrement isolés.
- La concurrence est limitée par `p-limit` pour éviter une saturation des ressources système.
- Un scraper en erreur ne doit jamais interrompre les autres : les erreurs sont capturées, enregistrées dans le résultat, et l'exécution globale se poursuit.
- Le fichier YAML est la seule interface de configuration : aucun paramètre ne doit être codé en dur dans le code source.