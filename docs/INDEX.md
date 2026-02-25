# 📚 Documentation MapLeads

Documentation complète pour l'utilisation du scraper web configurable MapLeads.

---

## 📖 Table des Matières

### Guides Principaux

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | **Démarrage rapide** et vue d'ensemble |
| [SCRAPPE_YAML_CONFIG.md](./SCRAPPE_YAML_CONFIG.md) | **Référence complète** des fichiers YAML |
| [PIPELINE.md](./PIPELINE.md) | Flux complet depuis l'authentification |

### Guides Thématiques

| Document | Description |
|----------|-------------|
| [ENV.md](./ENV.md) | Gestion des variables d'environnement |
| [AUTH_UI.md](./AUTH_UI.md) | Authentification via interface UI |
| [CONVERTER.md](./CONVERTER.md) | Conversion enregistrements → YAML |
| [ACTION_LOOP.md](./ACTION_LOOP.md) | Utilisation des boucles (`loop`) |
| [EXTRACTION_DONNEES.md](./EXTRACTION_DONNEES.md) | Guide d'extraction des données |

---

## 🚀 Démarrage en 5 Minutes

### 1. Installation

```bash
bun install
bunx playwright install chromium
```

### 2. Configuration

```bash
cp .env.example .env
# Éditer .env avec vos credentials
```

### 3. Authentification (si nécessaire)

```bash
npm run auth
```

### 4. Lancer un Scraper

```bash
npm run scrape -- --file <fichier>.scrappe.yaml
```

### 5. Voir les Résultats

```bash
ls results/
```

---

## 📁 Structure du Projet

```
mapleads/
├── docs/                  # Documentation
├── src/
│   ├── actions/           # Actions (navigate, click, extract...)
│   ├── converter/         # Conversion UI → YAML
│   ├── config.ts          # Validation configuration
│   ├── config-env.ts      # Variables d'environnement
│   ├── session.ts         # Gestion des sessions
│   ├── orchestrator.ts    # Orchestration des scrapers
│   └── types.ts           # Types partagés
├── scrappe/               # Configurations YAML (*.scrappe.yaml)
├── sessions/              # Sessions authentifiées (gitignore)
├── results/               # Résultats JSON des scrapings
├── recordings/            # Enregistrements Playwright UI
├── scripts/
│   └── auth-ui.ts         # Script d'authentification
├── .env                   # Credentials (gitignore)
├── scraper.config.yaml    # Configuration globale
└── package.json
```

---

## 🔑 Commandes Principales

| Commande | Description |
|----------|-------------|
| `npm run auth` | Authentification avec export session + credentials |
| `npm run scrape` | Lance tous les scrapers |
| `npm run scrape -- --file <file>` | Lance un fichier spécifique |
| `npm run scrape -- --list` | Liste les configurations disponibles |
| `npm run scrape -- --domain <domain>` | Lance tous les scrapers d'un domaine |
| `npm run record` | Mode UI pour enregistrer un parcours |
| `npm run convert -i <in> -o <out>` | Convertit recording → YAML |
| `npm run convert:all` | Convertit tous les recordings |
| `npm run typecheck` | Validation TypeScript |

---

## 📝 Exemple de Configuration YAML

```yaml
name: mon-scraper
url: https://example.com/
headless: true
viewport:
  width: 1920
  height: 1080

scrapers:
  - name: extract-data
    url: https://example.com/
    steps:
      # Navigation
      - action: navigate
        params:
          url: https://example.com/
          timeout: 30000

      # Attendre le chargement
      - action: wait
        params:
          selector: .content
          timeout: 10000

      # Extraire les données
      - action: extract
        params:
          selector: .item
          fields:
            - name: title
              selector: h2
            - name: price
              selector: .price
            - name: link
              selector: a
              attribute: href

      # Pagination automatique
      - action: paginate
        params:
          selector: .next-page
          max_pages: 5
          itemSelector: .item
          fields:
            - name: title
              selector: h2
            - name: price
              selector: .price
```

---

## 🎯 Actions Disponibles

| Action | Description |
|--------|-------------|
| `navigate` | Navigation vers une URL |
| `wait` | Attente d'un élément ou durée |
| `click` | Clic sur un élément |
| `fill` | Remplir un champ formulaire |
| `extract` | Extraire des données |
| `paginate` | Navigation multi-pages automatique |
| `session-load` | Charger une session sauvegardée |
| `session-save` | Sauvegarder la session courante |
| `loop` | Boucler sur des éléments |
| `navigate-back` | Revenir en arrière dans l'historique |

---

## 🔐 Variables d'Environnement

Format : `[DOMAIN]_[FIELD]`

```bash
# Exemple .env
LINKEDIN_EMAIL=user@example.com
LINKEDIN_PASS=password123
LINKEDIN_URL=https://www.linkedin.com/feed/

EXAMPLE_COM_EMAIL=admin@example.com
EXAMPLE_COM_PASS=secret
EXAMPLE_COM_URL=https://example.com/login
```

Utilisation dans YAML :

```yaml
steps:
  - action: navigate
    params:
      url: ${LINKEDIN_URL}
  - action: fill
    params:
      selector: 'input[name="email"]'
      value: ${LINKEDIN_EMAIL}
```

---

## 📊 Résultats

Les résultats sont sauvegardés dans `results/` :

```
results/
└── mon-scraper-2026-02-25T10-30-00.json
```

Format JSON :

```json
{
  "name": "mon-scraper",
  "url": "https://example.com/",
  "startedAt": "2026-02-25T10:30:00.000Z",
  "completedAt": "2026-02-25T10:31:00.000Z",
  "duration": 60000,
  "success": true,
  "pageCount": 5,
  "recordCount": 125,
  "data": [
    {
      "title": "Produit A",
      "price": "29.99",
      "link": "/products/a"
    }
  ],
  "errors": []
}
```

---

## 🛠️ Dépannage

### Session expirée

```bash
npm run auth
```

### Erreur de navigation

```bash
bunx playwright install chromium
```

### Fichier de configuration introuvable

```bash
npm run scrape -- --list
```

### Variables d'environnement non résolues

Vérifiez le fichier `.env` :
```bash
cat .env
```

---

## 📖 Pour Aller Plus Loin

1. **[SCRAPPE_YAML_CONFIG.md](./SCRAPPE_YAML_CONFIG.md)** — Référence complète de tous les paramètres YAML
2. **[ACTION_LOOP.md](./ACTION_LOOP.md)** — Guide avancé sur les boucles
3. **[EXTRACTION_DONNEES.md](./EXTRACTION_DONNEES.md)** — Techniques d'extraction de données
4. **[PIPELINE.md](./PIPELINE.md)** — Workflow complet d'authentification à l'extraction

---

**Dernière mise à jour :** 25 février 2026  
**Version :** 1.0.0
