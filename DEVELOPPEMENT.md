# Scraper Configurable — Document de Développement

**Projet :** MapLeads — Scraper Web Modulaire  
**Version :** 1.0  
**Date :** 24 février 2026

---

## 1. Objectif du Projet

Développer un outil de scraping web modulaire, piloté par un fichier de configuration YAML, capable d'exécuter plusieurs parcours de scraping en parallèle au sein d'un unique navigateur Playwright. Chaque parcours dispose de son propre contexte isolé pour éviter tout conflit d'état entre les sessions.

---

## 2. Phases de Développement

### Phase 1 — Fondations

**Objectif :** Mise en place de l'environnement et des types partagés.

#### Tâches

| ID | Tâche | Description |
|----|-------|-------------|
| T1.1 | Initialisation projet Bun + TypeScript | `bun init`, configuration `tsconfig.json`, `package.json` |
| T1.2 | Installation dépendances | `bun add playwright yaml p-limit`, `bun add -D @types/node` |
| T1.3 | Définition interfaces TypeScript | `types.ts` : Config, Scraper, Step, ScraperResult, Action interfaces |
| T1.4 | Structure de dossiers | Création `src/`, `src/actions/`, `results/`, `logs/` |
| T1.5 | Fichier config YAML exemple | `scraper.config.yaml` avec 2 scrapers de test |
| T1.6 | Parser YAML + validation basique | Module de chargement et parsing de la configuration |

#### Critères de validation

- [ ] `bun install` s'exécute sans erreur
- [ ] `tsc --noEmit` ne renvoie aucune erreur de typage
- [ ] Le fichier `scraper.config.yaml` est parsable et les valeurs sont accessibles
- [ ] Les interfaces TypeScript couvrent tous les champs décrits dans l'architecture
- [ ] Structure de dossiers conforme à l'architecture

---

### Phase 2 — Actions individuelles

**Objectif :** Développement de chaque action de manière isolée et testable indépendamment.

#### Tâches

| ID | Tâche | Description |
|----|-------|-------------|
| T2.1 | Action `navigate` | Navigation URL + gestion timeout + attente chargement |
| T2.2 | Action `wait` | Attente sélecteur CSS OU durée fixe en ms |
| T2.3 | Action `click` | Clic élément + tolérance si absent (CA-11) |
| T2.4 | Action `fill` | Remplissage champ + erreur si inexistant (CA-13) |
| T2.5 | Action `extract` | Extraction champs depuis éléments répétés + gestion null (CA-15) |
| T2.6 | Action `paginate` | Navigation multi-pages + concaténation résultats + arrêt automatique |

#### Critères de validation

- [ ] Chaque action est testable individuellement avec un fichier de test dédié
- [ ] CA-06 à CA-20 sont vérifiables manuellement sur une page de test locale
- [ ] Les actions gèrent correctement les timeouts
- [ ] Les actions tolérantes (`click`) ne lèvent pas d'erreur sur élément absent
- [ ] `extract` retourne `null` pour les champs manquants, pas d'erreur
- [ ] `paginate` s'arrête quand le bouton disparaît (CA-18)

---

### Phase 3 — Runner

**Objectif :** Assemblage des actions en un parcours complet pour un scraper donné.

#### Tâches

| ID | Tâche | Description |
|----|-------|-------------|
| T3.1 | Lecture et interprétation séquentielle | Boucle sur les étapes, exécution dans l'ordre (CA-21) |
| T3.2 | Gestion contexte Playwright par scraper | Création page dans le contexte, viewport configurable (CA-25) |
| T3.3 | Transmission état extract → paginate | Stockage temporaire du résultat extract pour paginate |
| T3.4 | Capture erreurs sans interruption | Try/catch par étape, préservation données partielles (CA-23) |
| T3.5 | Retour objet ScraperResult structuré | Construction résultat avec metadata (CA-22, CA-23) |

#### Critères de validation

- [ ] Un scraper complet s'exécute du début à la fin sur une URL réelle
- [ ] Les étapes sont exécutées dans l'ordre défini
- [ ] En cas d'erreur, les données collectées avant l'erreur sont préservées
- [ ] La page est toujours fermée après exécution (CA-24)
- [ ] Le résultat contient toutes les métadonnées requises

---

### Phase 4 — Orchestrateur et stockage

**Objectif :** Mise en parallèle des scrapers et sauvegarde des résultats.

#### Tâches

| ID | Tâche | Description |
|----|-------|-------------|
| T4.1 | Ouverture browser unique partagé | Instance unique Playwright (CA-26) |
| T4.2 | Création BrowserContext isolé par scraper | Isolation cookies, localStorage, sessions (CA-27) |
| T4.3 | Limitation concurrence via p-limit | Application du paramètre `concurrency` (CA-28) |
| T4.4 | Fermeture contexte après chaque scraper | Cleanup immédiat, libération ressources (CA-30) |
| T4.5 | Sauvegarde résultats JSON horodatés | Module `storage.ts`, création dossier auto (CA-33 à CA-37) |
| T4.6 | Affichage résumé global | Console output : scrapers exécutés, records, erreurs (CA-32) |

#### Critères de validation

- [ ] Plusieurs scrapers s'exécutent en parallèle sans conflit
- [ ] Les cookies d'un scraper ne sont pas visibles par un autre
- [ ] La concurrence est respectée (max N scrapers simultanés)
- [ ] Chaque scraper produit un fichier JSON unique et valide
- [ ] Le résumé global est affiché en fin d'exécution
- [ ] Le browser est fermé en fin d'exécution (CA-31)

---

### Phase 5 — Robustesse et finalisation

**Objectif :** Renforcement de la fiabilité et documentation finale.

#### Tâches

| ID | Tâche | Description |
|----|-------|-------------|
| T5.1 | Validation config YAML au démarrage | Champs obligatoires, types, erreurs explicites (CA-04, CA-05) |
| T5.2 | Retry automatique erreur réseau | 1 à 3 tentatives, backoff exponentiel (CA-38) |
| T5.3 | Logs structurés avec horodatage | Format JSON ou texte timestampé dans `logs/` |
| T5.4 | Revue cas limites | Page vide, sélecteur absent, timeout dépassé, timeout global (CA-39) |
| T5.5 | Rédaction README | Installation, usage, exemples, troubleshooting |

#### Critères de validation

- [ ] Une config invalide bloque le démarrage avec message explicite
- [ ] Une erreur réseau transitoire est retryée automatiquement
- [ ] Les logs sont consultables et compréhensibles
- [ ] Aucun processus navigateur ne reste actif après exécution
- [ ] Le README permet à un nouveau développeur de démarrer en < 15 min
- [ ] Tous les critères d'acceptation (CA-01 à CA-40) sont vérifiables

---

## 3. Architecture du Projet

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

## 4. Flux d'Exécution

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

## 5. Modèle de Données

### Configuration YAML (Entrée)

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `concurrency` | number | Non | Nombre de scrapers en parallèle (défaut: 5) |
| `output_dir` | string | Non | Dossier de sortie (défaut: ./results) |
| `scrapers` | array | Oui | Liste des scrapers à exécuter |
| `scrapers[].name` | string | Oui | Identifiant unique du scraper |
| `scrapers[].url` | string | Oui | URL de départ |
| `scrapers[].steps` | array | Oui | Séquence d'actions à exécuter |
| `scrapers[].headless` | boolean | Non | Mode headless (défaut: true) |
| `scrapers[].viewport` | object | Non | Dimensions du viewport |

### Actions Disponibles dans les Étapes

| Action | Paramètres requis | Paramètres optionnels |
|--------|-------------------|----------------------|
| `navigate` | `url` | `timeout` |
| `wait` | `selector` ou `duration` | `timeout` |
| `click` | `selector` | `timeout` |
| `fill` | `selector`, `value` | `timeout` |
| `extract` | `selector`, `fields` | — |
| `paginate` | `selector` | `max_pages`, `timeout` |

### Résultat JSON (Sortie)

Chaque scraper produit un fichier `{name}-{timestamp}.json` contenant les métadonnées d'exécution (durée, nombre de pages, erreurs) et le tableau de données extraites.

---

## 6. Contraintes Techniques

- Le browser Playwright est instancié **une seule fois** pour l'ensemble de l'exécution afin d'optimiser la mémoire et le temps de démarrage.
- Chaque scraper dispose de son propre `BrowserContext` : cookies, localStorage, sessions et état réseau sont entièrement isolés.
- La concurrence est limitée par `p-limit` pour éviter une saturation des ressources système.
- Un scraper en erreur ne doit jamais interrompre les autres : les erreurs sont capturées, enregistrées dans le résultat, et l'exécution globale se poursuit.
- Le fichier YAML est la seule interface de configuration : aucun paramètre ne doit être codé en dur dans le code source.

---

## 7. Analyse des Choix Techniques et Conséquences à Long Terme

### 7.1 Playwright vs Puppeteer vs Cheerio

| Critère | Playwright (choisi) | Puppeteer | Cheerio |
|---------|---------------------|-----------|---------|
| **Support navigateurs** | Chromium, Firefox, WebKit | Chromium uniquement | Aucun (HTML parsing) |
| **JavaScript rendering** | Oui, natif | Oui, natif | Non |
| **Attentes automatiques** | Oui (auto-wait) | Limité | N/A |
| **Isolation contexte** | BrowserContext natif | Incognito context | N/A |
| **Performance mémoire** | Moyenne | Moyenne | Excellente |
| **Maintenance** | Microsoft (active) | Google (active) | Communauté (stable) |
| **Courbe apprentissage** | Moyenne | Faible | Faible |

#### Conséquences à long terme

**Avantages du choix Playwright :**
- **Multi-browser :** Possibilité future de tester/scraper sur Firefox ou Safari si nécessaire
- **Auto-wait intégré :** Réduit les erreurs de timing et le besoin de `wait` explicites
- **BrowserContext isolé :** Feature native parfaitement adaptée à l'architecture multi-scraper
- **Support Microsoft :** Pérennité assurée, mises à jour régulières

**Risques :**
- **Taille dépendance :** Playwright inclut les binaries navigateurs (~300MB), impact sur CI/CD et déploiement
- **Évolution API :** Bien que stable, les breaking changes entre majeures peuvent nécessiter des adaptations
- **Surdimensionnement :** Pour du scraping statique simple, Playwright peut être excessif vs Cheerio

**Recommandation :** Conserver une couche d'abstraction (`PageAdapter`) pour permettre un switch partiel vers Cheerio si besoin pour les scrapers statiques.

---

### 7.2 Browser Unique Partagé vs Browser par Scraper

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Browser unique (choisi)** | - Mémoire optimisée<br>- Démarrage rapide<br>- Coordination centralisée | - Point de défaillance unique<br>- Limites de ressources partagées |
| **Browser par scraper** | - Isolation totale<br>- Résilience (un crash n'affecte pas les autres) | - Mémoire multipliée par N<br>- Démarrage lent<br>- Processes zombies possibles |

#### Conséquences à long terme

**Avantages du browser unique :**
- **Performance :** Un seul processus navigateur (~150-300MB) vs N processus
- **Démarrage :** Overhead unique au lieu de N démarrages
- **Cleanup simplifié :** Une seule fermeture à gérer

**Risques :**
- **Point de défaillance unique :** Si le browser crash, tous les scrapers sont affectés
- **Contention ressources :** CPU/mémoire partagés peuvent créer des goulots
- **Limites Playwright :** Nombre maximum de contexts par browser (~1000 théorique, ~50 pratique)

**Mitigation prévue :** BrowserContext isolé par scraper + p-limit pour la concurrence

**Recommandation :** Pour > 50 scrapers simultanés, envisager un pool de browsers (2-3 instances)

---

### 7.3 BrowserContext Isolé par Scraper

| Aspect | Impact |
|--------|--------|
| **Cookies/Storage** | Isolation totale, pas de fuite de session |
| **Performance** | Overhead faible (~10MB par context) |
| **Sécurité** | Pas de contamination croisée entre scrapers |
| **Debugging** | Plus complexe (quel context a quel état ?) |

#### Conséquences à long terme

**Avantages :**
- **Isolation garantie :** Feature native de Playwright, battle-tested
- **Flexibilité :** Possibilité future d'injecter des cookies/proxy par context
- **Scalabilité :** Supporte des centaines de contexts par browser

**Risques :**
- **Debugging distribué :** Tracer quel context a fait quelle action nécessite des logs structurés
- **Fuites mémoire :** Si les contexts ne sont pas fermés correctement (CA-30 critique)

**Recommandation :** Implémenter un watchdog mémoire qui alerte si > N contexts ouverts simultanément

---

### 7.4 YAML comme Seule Interface de Configuration

| Aspect | Impact |
|--------|--------|
| **Simplicité** | Configuration lisible, versionnable, editable sans coder |
| **Flexibilité** | Limitée aux structures prédéfinies dans les types |
| **Validation** | Nécessite un schema validator (Zod, Joi, ou custom) |
| **Extensibilité** | Ajout de features = ajout de champs YAML |

#### Conséquences à long terme

**Avantages :**
- **Low-code :** Les utilisateurs métier peuvent créer/modifier des scrapers sans développeur
- **Versioning :** Le YAML se versionne facilement dans Git
- **Documentation implicite :** La config elle-même documente le scraping

**Risques :**
- **Complexité croissante :** Risque de "YAML spaghetti" avec des configs de 500+ lignes
- **Validation limitée :** YAML ne permet pas de logique conditionnelle ou de boucles complexes
- **Secrets :** Les credentials ne doivent jamais être dans le YAML (nécessite variables d'environnement)

**Recommandation :**
- Ajouter un système de variables d'environnement dans le YAML (`${ENV_VAR}`)
- Prévoir un linter YAML custom pour détecter les configs trop complexes
- En V2, envisager un format JSON Schema pour validation automatique

---

### 7.5 p-limit pour la Concurrence

| Aspect | Impact |
|--------|--------|
| **Simplicité** | API minimale (`pLimit(n)(task)`) |
| **Performance** | Overhead négligeable |
| **Fiabilité** | Bibliothèque mature, 10M+ téléchargements/semaine |
| **Flexibilité** | Limitation globale uniquement, pas de priorités |

#### Conséquences à long terme

**Avantages :**
- **Simplicité :** 3 lignes de code pour implémenter la concurrence
- **Fiabilité :** Pas de bug connu, maintenance minimale
- **Testabilité :** Facile à mocker dans les tests

**Risques :**
- **Pas de priorités :** Tous les scrapers ont la même priorité
- **Pas de dynamique :** La concurrence est fixe, ne s'adapte pas à la charge CPU/mémoire
- **Single point :** Si p-limit a un bug, toute l'orchestration est affectée

**Recommandation :**
- En V2, envisager une file de priorité (high/medium/low)
- Ajouter un monitoring de la file d'attente (combien de scrapers en attente ?)

---

### 7.6 Architecture Modulaire (Actions Séparées)

| Aspect | Impact |
|--------|--------|
| **Maintenabilité** | Chaque action est testable et modifiable indépendamment |
| **Réutilisabilité** | Les actions peuvent être composées dans différents ordres |
| **Complexité** | Plus de fichiers, plus d'imports à gérer |
| **Évolutivité** | Ajout d'actions sans modifier le core |

#### Conséquences à long terme

**Avantages :**
- **Single Responsibility :** Chaque fichier a une raison de changer
- **Testabilité :** Tests unitaires par action, isolation maximale
- **Onboarding :** Un nouveau développeur peut comprendre une action en 30 min

**Risques :**
- **Fragmentation :** Trop de petits fichiers peut rendre la navigation complexe
- **Couplage implicite :** Les actions partagent un état (page, context) qui n'est pas toujours visible
- **Versioning :** Changer une signature d'action peut casser des configs YAML existantes

**Recommandation :**
- Documenter rigoureusement les signatures d'actions (params requis/optionnels)
- Implémenter un système de versioning de config YAML
- Prévoir un outil de migration de config entre versions majeures

---

### 7.7 Stockage JSON vs Base de Données

| Critère | JSON (choisi) | SQLite | PostgreSQL |
|---------|---------------|--------|------------|
| **Simplicité** | Excellente | Bonne | Moyenne |
| **Performance lecture** | Moyenne (fichier entier) | Bonne | Excellente |
| **Performance écriture** | Bonne | Bonne | Bonne |
| **Requêtes complexes** | Aucune | SQL complet | SQL complet |
| **Concurrence écriture** | Risque de corruption | Transactions | Transactions |
| **Déploiement** | Aucun | Fichier unique | Serveur dédié |
| **Backup** | Copie fichier | Copie fichier | Dump SQL |

#### Conséquences à long terme

**Avantages du JSON :**
- **Zéro dépendance :** Pas de driver, pas de connexion, pas de migration
- **Lisibilité :** Les résultats sont inspectables avec n'importe quel éditeur
- **Portabilité :** Les fichiers JSON se transfèrent, s'archivent, se compressent facilement

**Risques :**
- **Pas de requêtes :** Impossible de filtrer/agréger sans charger tous les fichiers
- **Concurrence écriture :** Risque de corruption si deux scrapers écrivent simultanément dans le même fichier (mitigé par fichier par scraper)
- **Volume :** À partir de 10 000+ records, les fichiers JSON deviennent lourds à manipuler
- **Pas d'historique :** Pas de traçabilité des changements sur un même scraper

**Recommandation :**
- **Court terme (V1) :** JSON est parfait pour le MVP
- **Moyen terme (V2) :** Ajouter SQLite en option (`storage_type: sqlite` dans config)
- **Long terme (V3) :** Prévoir un connecteur PostgreSQL pour les déploiements enterprise

---

## 8. Risques Identifiés et Mitigations

### 8.1 Risques Techniques

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| RT-01 | Playwright update breaking changes | Moyenne | Élevé | Pin version exacte dans package.json, tests de non-régression avant upgrade |
| RT-02 | Fuite mémoire BrowserContext non fermé | Moyenne | Élevé | CA-30 obligatoire, watchdog mémoire, tests de charge |
| RT-03 | Corruption fichier JSON écriture concurrente | Faible | Élevé | Un fichier par scraper + timestamp unique, lock file si nécessaire |
| RT-04 | Timeout global non respecté | Moyenne | Moyen | Utiliser `Promise.race` avec timeout, abort controller |
| RT-05 | Types TypeScript trop permissifs | Faible | Moyen | Utiliser `strict: true`, Zod pour validation runtime |

---

### 8.2 Risques de Maintenance

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| RM-01 | YAML config devient illisible (>500 lignes) | Moyenne | Moyen | Linter custom, warning si > N étapes, recommandation de découper |
| RM-02 | Nouvelles actions non documentées | Moyenne | Moyen | Template d'action obligatoire, README auto-généré depuis les types |
| RM-03 | Dette technique sur gestion erreurs | Moyenne | Élevé | Revue de code obligatoire sur les try/catch, checklist CA-23/CA-38 |
| RM-04 | Dépendance développeur initial | Faible | Élevé | Documentation complète, pair programming, bus factor > 1 |

---

### 8.3 Risques de Performance/Scalabilité

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| RP-01 | Saturation mémoire avec N scrapers | Moyenne | Élevé | p-limit configuré selon RAM disponible, monitoring mémoire |
| RP-02 | Goulot CPU sur extraction JSON | Faible | Moyen | Worker threads si nécessaire, streaming JSON |
| RP-03 | Limites navigateur (max contexts) | Faible | Élevé | Pool de browsers si > 50 scrapers, erreur explicite si limite atteinte |
| RP-04 | Disque saturé par les résultats | Faible | Moyen | Rotation des fichiers, compression gzip, cleanup automatique |

---

### 8.4 Risques Liés au Scraping (Blocages, Anti-Bot)

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| RS-01 | IP bloquée (rate limiting) | Élevée | Élevé | Proxy rotation (V2), délais entre requêtes, respect robots.txt |
| RS-02 | Détection bot (fingerprinting) | Moyenne | Élevé | User-Agent réaliste, viewport variable, playwright-extra (V2) |
| RS-03 | CAPTCHA | Moyenne | Élevé | Détection CAPTCHA, alerte utilisateur, service de résolution (V3) |
| RS-04 | Structure HTML change | Élevée | Moyen | Logs d'erreur détaillés, alerte si selecteurs non trouvés, versioning configs |
| RS-05 | JavaScript anti-scraping | Faible | Élevé | Playwright gère JS, mais prévoir stealth mode (playwright-extra) |

**Recommandations anti-détection (priorité V2) :**
1. `playwright-extra` avec plugin `stealth`
2. Rotation User-Agent par scraper
3. Délais aléatoires entre actions (humanization)
4. Proxy rotation (service tiers ou pool maison)
5. Respect `robots.txt` et `Crawl-Delay`

---

## 9. Recommandations d'Évolution Future

### 9.1 Features à Ajouter en V2

| Feature | Description | Priorité | Effort |
|---------|-------------|----------|--------|
| **Proxy rotation** | Support proxy par scraper, rotation automatique | Haute | 2 jours |
| **Stealth mode** | playwright-extra pour éviter détection bot | Haute | 1 jour |
| **SQLite storage** | Option `storage_type: sqlite` pour requêtes SQL | Moyenne | 3 jours |
| **Webhook notifications** | Callback HTTP en fin de scraper | Moyenne | 1 jour |
| **Variables d'environnement** | `${ENV_VAR}` dans le YAML pour secrets | Haute | 0.5 jour |
| **Priorité scrapers** | File de priorité (high/medium/low) | Moyenne | 1 jour |
| **Dashboard web** | UI pour visualiser résultats et logs | Basse | 5 jours |
| **API REST** | Endpoint pour lancer scrapers à distance | Basse | 3 jours |

---

### 9.2 Points d'Extension Prévus

#### Architecture extensible

```
src/
├── actions/           ← Nouvelles actions ajoutables sans modifier le core
│   ├── navigate.ts
│   ├── wait.ts
│   └── screenshot.ts  ← Ex: nouvelle action V2
├── storage/           ← Stratégies de stockage interchangeables
│   ├── json.ts
│   └── sqlite.ts      ← Ex: nouveau storage V2
├── detectors/         ← Détection anti-bot (V2)
│   ├── captcha.ts
│   └── rate-limit.ts
└── proxies/           ← Gestion proxy (V2)
    ├── rotation.ts
    └── pool.ts
```

#### Interfaces d'extension

```typescript
// Action interface (extensible)
interface Action {
  name: string;
  execute(params: Record<string, unknown>, page: Page): Promise<ActionResult>;
}

// Storage interface (extensible)
interface StorageStrategy {
  save(result: ScraperResult): Promise<void>;
  list(): Promise<ScraperResult[]>;
  delete(id: string): Promise<void>;
}

// Detector interface (V2)
interface ThreatDetector {
  detect(page: Page): Promise<Threat | null>;
  mitigate(threat: Threat): Promise<void>;
}
```

---

### 9.3 Dettes Techniques Potentielles à Surveiller

| Dette | Description | Quand la rembourser | Impact si ignoré |
|-------|-------------|---------------------|------------------|
| **Validation YAML basique** | V1: validation manuelle des champs | V2: Zod schema | Configs invalides passent silencieusement |
| **Logs texte non structurés** | V1: logs texte simples | V2: logs JSON structurés | Difficile à parser automatiquement |
| **Pas de tests E2E** | V1: tests unitaires uniquement | V2: tests E2E avec serveur mock | Régressions non détectées |
| **Gestion erreurs générique** | V1: try/catch basique | V2: erreur typée + retry策略 | Debugging complexe en prod |
| **Pas de monitoring** | V1: logs console uniquement | V2: métriques Prometheus | Pas de visibilité sur la santé du système |
| **Secrets dans YAML** | V1: documentation uniquement | V2: validation + env vars | Fuite de credentials dans Git |

---

## 10. Checklist de Validation Finale (Release V1)

### Code Quality
- [ ] `tsc --noEmit` sans erreur
- [ ] `eslint` sans warning
- [ ] Couverture tests > 80%
- [ ] Aucun `any` explicite dans le code

### Fonctionnel
- [ ] CA-01 à CA-40 vérifiés manuellement ou automatiquement
- [ ] 2 scrapers d'exemple fonctionnent sur des sites réels
- [ ] README permet un démarrage en < 15 min

### Performance
- [ ] 10 scrapers en parallèle sans fuite mémoire
- [ ] Aucun processus zombie après exécution
- [ ] Temps de démarrage < 5 secondes

### Sécurité
- [ ] Aucun secret dans le code ou le YAML d'exemple
- [ ] Validation des URLs (pas de `file://` ou `localhost` non autorisé)
- [ ] Permissions Playwright minimales

---

## 11. Conclusion

L'architecture modulaire choisie permet une **évolution progressive** sans refonte majeure. Les dettes techniques identifiées sont **conscientes et documentées**, avec un plan de remboursement clair pour la V2.

Les principaux points de vigilance sont :

1. **La détection anti-bot** — à adresser en V2 avec stealth mode
2. **La gestion des erreurs** — critique pour la fiabilité production
3. **La scalabilité mémoire** — à monitorer dès les premiers déploiements

**Recommandation finale :** Livrer la V1 rapidement, recueillir des feedbacks utilisateurs, et prioriser la V2 en fonction des besoins réels (proxy, stealth, storage SQL).
