# 🍁 MapLeads

**Scraper Web Configurable** — Outil de scraping web modulaire, piloté par configuration YAML, avec authentification automatique.

---

## 🚀 Démarrage Rapide

### Installation

```bash
bun install
bunx playwright install chromium
```

### Configuration

```bash
cp .env.example .env
# Éditer .env avec vos credentials
```

### Lancer un Scraper

```bash
npm run scrape -- --file <fichier>.scrappe.yaml
```

---

## 📖 Documentation

La documentation complète se trouve dans le dossier [`docs/`](./docs/).

### Guides Principaux

| Document | Description |
|----------|-------------|
| [docs/README.md](./docs/README.md) | **Démarrage rapide** et vue d'ensemble |
| [docs/INDEX.md](./docs/INDEX.md) | **Portail de documentation** avec table des matières |
| [docs/SCRAPPE_YAML_CONFIG.md](./docs/SCRAPPE_YAML_CONFIG.md) | **Référence complète** des fichiers YAML |
| [docs/PIPELINE.md](./docs/PIPELINE.md) | Flux complet depuis l'authentification |

### Guides Thématiques

| Document | Description |
|----------|-------------|
| [docs/ENV.md](./docs/ENV.md) | Gestion des variables d'environnement |
| [docs/AUTH_UI.md](./docs/AUTH_UI.md) | Authentification via interface UI |
| [docs/CONVERTER.md](./docs/CONVERTER.md) | Conversion enregistrements → YAML |
| [docs/ACTION_LOOP.md](./docs/ACTION_LOOP.md) | Utilisation des boucles (`loop`) |
| [docs/EXTRACTION_DONNEES.md](./docs/EXTRACTION_DONNEES.md) | Guide d'extraction des données |

---

## 📋 Commandes Principales

| Commande | Description |
|----------|-------------|
| `npm run auth` | Authentification avec export session + credentials |
| `npm run scrape` | Lance tous les scrapers |
| `npm run scrape -- --file <file>` | Lance un fichier spécifique |
| `npm run scrape -- --list` | Liste les configurations disponibles |
| `npm run record` | Mode UI pour enregistrer un parcours |
| `npm run convert -i <in> -o <out>` | Convertit recording → YAML |

---

## 📁 Structure du Projet

```
mapleads/
├── docs/                  # 📚 Documentation
├── src/                   # Code source
├── scrappe/               # Configurations YAML (*.scrappe.yaml)
├── sessions/              # Sessions authentifiées (gitignore)
├── results/               # Résultats JSON des scrapings
├── recordings/            # Enregistrements Playwright UI
├── .env                   # Credentials (gitignore)
└── package.json
```

---

## 🔑 Fonctionnalités

- ✅ **Configuration YAML** — Définissez vos scrapers sans code
- ✅ **Authentification automatique** — Gestion des sessions et credentials
- ✅ **Variables d'environnement** — Credentials sécurisés dans `.env`
- ✅ **Pagination automatique** — Naviguez sur plusieurs pages
- ✅ **Boucles et itérations** — Traitez des listes d'éléments
- ✅ **Export JSON structuré** — Résultats prêts à l'emploi
- ✅ **Mode enregistrement** — Générez des configs via UI Playwright

---

## 🛠️ Technologies

- **Runtime :** Bun / Node.js
- **Langage :** TypeScript
- **Automation :** Playwright (Chromium)
- **Configuration :** YAML

---

## 📄 Licence

MIT

---

**Créé le :** 24 février 2026  
**Version :** 1.0.0  
**Dernière mise à jour :** 25 février 2026
