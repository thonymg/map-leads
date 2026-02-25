# Documentation — Fichiers de Configuration YAML

## Vue d'ensemble

Le système de scraping MapLeads utilise des fichiers YAML pour configurer les scrapers. Deux types de fichiers YAML sont supportés :

1. **`scraper.config.yaml`** — Configuration globale avec liste de scrapers
2. **`*.scrappe.yaml`** — Configuration individuelle par site/domaine

---

## 1. Structure Globale (`scraper.config.yaml`)

```yaml
# Configuration globale
concurrency: 2          # Nombre de scrapers en parallèle (défaut: 5)
output_dir: ./results   # Dossier de sortie des résultats

# Liste des scrapers
scrapers:
  - name: mon-scraper
    url: https://example.com/
    # ... configuration du scraper
```

### Paramètres Globaux

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `concurrency` | `number` | `5` | Nombre maximum de scrapers exécutés en parallèle |
| `output_dir` | `string` | `./results` | Dossier où seront sauvegardés les résultats |
| `scrapers` | `array` | **requis** | Liste des définitions de scrapers |

---

## 2. Structure d'un Scraper Individuel (`*.scrappe.yaml`)

```yaml
name: tudorwatch.com.scrape
url: https://www.tudorwatch.com/
headless: true
viewport:
  width: 1920
  height: 1080
scrapers:
  - name: tudorwatch.com.scrape
    url: https://www.tudorwatch.com/
    steps:
      # ... étapes du scraper
```

### Paramètres de Scraper

| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| `name` | `string` | **requis** | Identifiant unique du scraper |
| `url` | `string` | **requis** | URL de départ du scraping |
| `headless` | `boolean` | `true` | Mode navigation sans interface graphique |
| `viewport` | `object` | `{width: 1920, height: 1080}` | Dimensions de la fenêtre du navigateur |
| `steps` | `array` | **requis** | Séquence d'actions à exécuter |

---

## 3. Actions Disponibles

### 3.1 `navigate` — Navigation vers une URL

```yaml
- action: navigate
  params:
    url: https://example.com/page
    timeout: 30000  # optionnel, en millisecondes
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `url` | `string` | ✅ | URL de destination |
| `timeout` | `number` | ❌ | Timeout en ms (défaut: 30000) |

---

### 3.2 `wait` — Attendre un élément ou une durée

```yaml
# Attendre un élément
- action: wait
  params:
    selector: article.product_pod
    timeout: 10000

# Attendre une durée fixe
- action: wait
  params:
    duration: 2000  # 2 secondes
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ❌* | Sélecteur CSS à attendre |
| `duration` | `number` | ❌* | Durée en ms (alternative à selector) |
| `timeout` | `number` | ❌ | Timeout maximum en ms |

*Au moins un des deux (`selector` ou `duration`) est requis.

---

### 3.3 `click` — Cliquer sur un élément

```yaml
- action: click
  params:
    selector: 'button[type="submit"]'
    timeout: 5000
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ✅ | Sélecteur CSS de l'élément |
| `timeout` | `number` | ❌ | Timeout en ms |

---

### 3.4 `fill` — Remplir un champ formulaire

```yaml
- action: fill
  params:
    selector: 'input[name="email"]'
    value: "user@example.com"
    timeout: 5000
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ✅ | Sélecteur CSS du champ |
| `value` | `string` | ✅ | Valeur à remplir |
| `timeout` | `number` | ❌ | Timeout en ms |

---

### 3.5 `extract` — Extraire des données

```yaml
- action: extract
  params:
    selector: article.product_pod
    fields:
      - name: title
        selector: h3 a
        attribute: title  # optionnel, extrait l'attribut
      - name: price
        selector: p.price_color
      - name: availability
        selector: p.instock.availability
      - name: link
        selector: h3 a
        attribute: href
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ✅ | Sélecteur CSS des éléments à extraire |
| `fields` | `array` | ✅ | Liste des champs à extraire |

#### Structure d'un champ (`ExtractField`)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `name` | `string` | ✅ | Nom du champ dans le résultat |
| `selector` | `string` | ✅ | Sélecteur CSS pour trouver l'élément |
| `attribute` | `string` | ❌ | Attribut à extraire (défaut: `textContent`) |

---

### 3.6 `paginate` — Pagination automatique

```yaml
- action: paginate
  params:
    selector: li.next a  # Bouton "page suivante"
    max_pages: 5
    itemSelector: article.product_pod
    timeout: 10000
    fields:
      - name: title
        selector: h3 a
        attribute: title
      - name: price
        selector: p.price_color
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ✅ | Sélecteur du bouton "page suivante" |
| `max_pages` | `number` | ❌ | Nombre maximum de pages à parcourir |
| `itemSelector` | `string` | ❌ | Sélecteur des éléments à extraire |
| `fields` | `array` | ❌ | Champs à extraire (hérités de `extract` si non spécifiés) |
| `timeout` | `number` | ❌ | Timeout en ms |

---

### 3.7 `session-load` — Charger une session sauvegardée

```yaml
- action: session-load
  params:
    sessionName: user-auth
    sessionsDir: ./sessions  # optionnel
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `sessionName` | `string` | ✅ | Nom de la session à charger |
| `sessionsDir` | `string` | ❌ | Dossier des sessions (défaut: `./sessions`) |

---

### 3.8 `session-save` — Sauvegarder la session courante

```yaml
- action: session-save
  params:
    sessionName: user-auth
    sessionsDir: ./sessions  # optionnel
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `sessionName` | `string` | ✅ | Nom de la session à sauvegarder |
| `sessionsDir` | `string` | ❌ | Dossier des sessions (défaut: `./sessions`) |

---

### 3.9 `loop` — Boucler sur des éléments

```yaml
- action: loop
  params:
    selector: 'ul[aria-labelledby="retailer-list-title"] > li'
    max_iterations: 10  # optionnel
    delayBetweenIterations: 1000  # optionnel, en ms
    steps:
      - action: click
        params:
          selector: 'a.see-details >> nth=${index}'
      - action: extract
        params:
          selector: body
          fields:
            - name: content
              selector: .store-details
      - action: navigate-back
        params: {}
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | `string` | ✅ | Sélecteur des éléments à itérer |
| `steps` | `array` | ✅ | Actions à exécuter pour chaque élément |
| `max_iterations` | `number` | ❌ | Nombre maximum d'itérations |
| `delayBetweenIterations` | `number` | ❌ | Délai en ms entre chaque itération |

**Note:** La variable `${index}` est disponible dans les sélecteurs pour accéder à l'index courant.

---

### 3.10 `navigate-back` — Revenir en arrière dans l'historique

```yaml
- action: navigate-back
  params:
    count: 1  # optionnel, défaut: 1
```

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `count` | `number` | ❌ | Nombre de pages à revenir (défaut: 1) |

---

## 4. Variables d'Environnement

Les fichiers YAML supportent l'interpolation de variables d'environnement :

```yaml
- action: navigate
  params:
    url: ${BASE_URL}
    
- action: fill
  params:
    selector: 'input[name="email"]'
    value: ${LOGIN_EMAIL}
```

### Format supporté
- `${VARIABLE_NAME}` 
- `$VARIABLE_NAME`

### Configuration des credentials par domaine

Dans le fichier `.env` :
```bash
EXAMPLE_COM_EMAIL=user@example.com
EXAMPLE_COM_PASS=motdepasse
EXAMPLE_COM_URL=https://example.com/login
```

---

## 5. Exemples Complets

### Exemple 1 : Scraping simple avec pagination

```yaml
name: books-scraper
url: https://books.toscrape.com/
headless: true
viewport:
  width: 1920
  height: 1080
scrapers:
  - name: books-demo
    url: https://books.toscrape.com/
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
          itemSelector: article.product_pod
          fields:
            - name: title
              selector: h3 a
              attribute: title
            - name: price
              selector: p.price_color
```

### Exemple 2 : Loop avec navigation détaillée

```yaml
name: tudorwatch.com.scrape
url: https://www.tudorwatch.com/
headless: true
viewport:
  width: 1920
  height: 1080
scrapers:
  - name: tudorwatch.com.scrape
    url: https://www.tudorwatch.com/
    steps:
      - action: navigate
        params:
          url: https://www.tudorwatch.com/fr/retailers/france?lat=46.217049743275915&lng=7.3170101562500145&z=5
      
      - action: loop
        params:
          selector: 'ul[aria-labelledby="retailer-list-title"] > li'
          steps:
            - action: click
              params:
                selector: 'ul[aria-labelledby="retailer-list-title"] > li >> nth=${index} >> role=link "See store details"'
            - action: extract
              params:
                selector: body
                fields:
                  - name: content
                    selector: .flex.flex-col.justify-between.ltr:text-right
                    type: text
            - action: navigate-back
              params: {}
```

---

## 6. Commandes CLI

```bash
# Lister les configurations disponibles
bun run scrape --list

# Lancer un fichier spécifique
bun run scrape --file tudorwatch.com.scrape.scrappe.yaml

# Lancer par domaine
bun run scrape --domain toscrape.com

# Lancer tous les scrapers
bun run scrape

# Afficher l'aide
bun run scrape --help
```

---

## 7. Validation et Erreurs

Le système valide automatiquement :

- ✅ Champs obligatoires présents
- ✅ Types de données corrects
- ✅ Actions valides
- ✅ Paramètres requis pour chaque action
- ✅ Structure des étapes imbriquées (loop, paginate)

En cas d'erreur de validation, une `ConfigValidationError` est levée avec :
- Le chemin du champ problématique
- Le type attendu
- Une description de l'erreur

---

## 8. Bonnes Pratiques

1. **Timeouts** : Toujours définir des timeouts raisonnables (10-30 secondes)
2. **Selectors** : Utiliser des sélecteurs CSS stables et spécifiques
3. **Delays** : Ajouter des délais entre les itérations pour éviter le blocage
4. **Headless** : Mettre `headless: false` pour le débogage
5. **Pagination** : Limiter `max_pages` pour les tests
6. **Sessions** : Utiliser `session-save`/`session-load` pour les sites avec authentification
