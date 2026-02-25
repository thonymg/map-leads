# 🍁 MapLeads — Scraper Web Configurable

Outil de scraping web modulaire, piloté par configuration YAML, avec authentification automatique.

> 📚 **Cette documentation fait partie de la [documentation complète MapLeads](./INDEX.md).**

---

## 🚀 Démarrage Rapide

### Installation

```bash
bun install
bunx playwright install chromium
```

### Configuration (.env)

```bash
cp .env.example .env
# Modifier les credentials dans .env
```

### Authentification (Sites avec login)

```bash
npm run auth
```

→ Vous connecte et exporte session + credentials automatiquement.

### Lancer un Scraper

```bash
npm run scrape -- --file <fichier>.scrappe.yaml
```

---

## 📋 Commandes

| Commande | Description |
|----------|-------------|
| `npm run auth` | Authentification avec export session + credentials |
| `npm run scrape` | Lance tous les scrapers |
| `npm run scrape -- --file <file>` | Lance un fichier spécifique |
| `npm run scrape -- --list` | Liste les configurations |
| `npm run scrape -- --domain <domain>` | Lance tous les scrapers d'un domaine |
| `npm run record` | Mode UI pour enregistrer un parcours |
| `npm run convert -i <file> -o <file>` | Convertit recording → YAML |
| `npm run convert:all` | Convertit tous les recordings |
| `npm run typecheck` | Validation TypeScript |

---

## 📁 Structure

```
mapleads/
├── docs/                # Documentation
├── src/
│   ├── actions/         # Actions (navigate, click, extract...)
│   ├── converter/       # Conversion UI → YAML
│   ├── config-env.ts    # Gestion des variables d'environnement
│   ├── session.ts       # Gestion des sessions
│   ├── orchestrator.ts  # Orchestration des scrapers
│   └── types.ts         # Types partagés
├── scrappe/             # Configurations YAML (*.scrappe.yaml)
├── sessions/            # Sessions (gitignore)
├── results/             # Résultats JSON
├── recordings/          # Enregistrements UI
├── scripts/
│   └── auth-ui.ts       # Script d'authentification
├── .env                 # Credentials (gitignore)
├── scraper.config.yaml  # Configuration globale
└── package.json
```

---

## 🔐 Authentification

### 1. Créer le fichier .env

```bash
cp .env.example .env
```

### 2. Lancer l'authentification

```bash
npm run auth
```

### 3. Le script exporte automatiquement :

- `.env` → Credentials (`[DOMAIN]_EMAIL`, `[DOMAIN]_PASS`)
- `sessions/[domain]_session.json` → Session
- `scrappe/[domain].auth.scrappe.yaml` → Configuration

### 4. Lancer le scraper

```bash
npm run scrape -- --file linkedin.auth.scrappe.yaml
```

---

## ⚙️ Configuration YAML

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
      - action: navigate
        params:
          url: https://example.com/
          timeout: 30000

      - action: wait
        params:
          selector: .content
          timeout: 10000

      - action: extract
        params:
          selector: .item
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

## 📖 Documentation Complète

Pour plus de détails, consultez la [documentation complète](./INDEX.md) et les guides thématiques :

| Guide | Description |
|-------|-------------|
| [INDEX.md](./INDEX.md) | **Portail de documentation** avec table des matières |
| [SCRAPPE_YAML_CONFIG.md](./SCRAPPE_YAML_CONFIG.md) | **Référence complète** des fichiers YAML |
| [PIPELINE.md](./PIPELINE.md) | Flux complet depuis l'authentification |
| [ACTION_LOOP.md](./ACTION_LOOP.md) | Utilisation des boucles (`loop`) |
| [EXTRACTION_DONNEES.md](./EXTRACTION_DONNEES.md) | Guide d'extraction des données |
| [ENV.md](./ENV.md) | Variables d'environnement |
| [AUTH_UI.md](./AUTH_UI.md) | Authentification UI |
| [CONVERTER.md](./CONVERTER.md) | Conversion recordings → YAML |

---

## 🔧 Dépannage

### Session expirée

```bash
npm run auth
```

### Erreur de navigation

```bash
bunx playwright install chromium
```

### Fichier non trouvé

```bash
npm run scrape -- --list
```

### Variables d'environnement non résolues

Vérifiez le fichier `.env` :
```bash
cat .env
```

---

**Créé le :** 24 février 2026  
**Version :** 1.0.0  
**Dernière mise à jour :** 25 février 2026
