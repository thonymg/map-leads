# 🍁 MapLeads — Scraper Web Configurable

Outil de scraping web modulaire, piloté par configuration YAML, avec authentification automatique.

---

## 🚀 Démarrage Rapide

### Installation

```bash
bun install
bunx playwright install chromium
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
| `npm run record` | Mode UI pour enregistrer un parcours |
| `npm run convert -i <file> -o <file>` | Convertit recording → YAML |

---

## 📁 Structure

```
mapleads/
├── src/
│   ├── actions/         # Actions (navigate, click, extract...)
│   ├── converter/       # Conversion UI → YAML
│   ├── session.ts       # Gestion des sessions
│   └── types.ts         # Types partagés
├── scrappe/             # Configurations YAML
├── sessions/            # Sessions (gitignore)
├── results/             # Résultats JSON
├── recordings/          # Enregistrements UI
└── scripts/
    └── auth-ui.ts       # Script d'authentification
```

---

## 🔐 Authentification

Pour les sites nécessitant un login (LinkedIn, Facebook...) :

### 1. Lancer l'authentification

```bash
npm run auth
```

### 2. Suivre le guide

- Entrez l'URL de connexion
- Connectez-vous dans le navigateur
- Le script exporte automatiquement :
  - `.env` → Credentials (`[DOMAIN]_EMAIL`, `[DOMAIN]_PASS`)
  - `sessions/[domain]_session.json` → Session
  - `scrappe/[domain].auth.scrappe.yaml` → Configuration

### 3. Lancer le scraper

```bash
npm run scrape -- --file linkedin.auth.scrappe.yaml
```

---

## 📖 Documentation

| Fichier | Description |
|---------|-------------|
| [scripts/README.md](./scripts/README.md) | Authentification UI |
| [scrappe/README.md](./scrappe/README.md) | Configurations YAML |
| [recordings/README.md](./recordings/README.md) | Enregistrement UI Mode |
| [src/converter/README.md](./src/converter/README.md) | Conversion Code → YAML |

---

## ⚙️ Configuration YAML

```yaml
name: mon-scraper
url: https://example.com
headless: true

steps:
  - action: navigate
    params:
      url: https://example.com
  
  - action: wait
    params:
      selector: .content
  
  - action: extract
    params:
      selector: .item
      fields:
        - name: title
          selector: h2
        - name: link
          selector: a
          attribute: href
  
  - action: paginate
    params:
      selector: .next
      max_pages: 10
```

---

## 🎯 Actions Disponibles

| Action | Description |
|--------|-------------|
| `navigate` | Navigation vers une URL |
| `wait` | Attente d'un élément |
| `click` | Clic sur un élément |
| `fill` | Remplir un champ |
| `extract` | Extraire des données |
| `paginate` | Navigation multi-pages |
| `session-load` | Charger une session |
| `session-save` | Sauvegarder une session |

---

## 📊 Résultats

Les résultats sont sauvegardés dans `results/` :

```
results/
└── mon-scraper-2026-02-24T12-00-00.json
```

Format JSON avec métadonnées et données extraites.

---

## 🔧 Dépannage

### Session expirée

```bash
npm run auth
```

### Erreur de navigation

Vérifiez que les navigateurs sont installés :

```bash
bunx playwright install chromium
```

### Fichier non trouvé

Listez les configurations disponibles :

```bash
npm run scrape -- --list
```

---

**Créé le:** 24 février 2026  
**Version:** 1.0
