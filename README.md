# 🍁 MapLeads — Scraper Web Configurable

Outil de scraping web modulaire, piloté par configuration YAML, avec authentification automatique.

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
| `npm run record` | Mode UI pour enregistrer un parcours |
| `npm run convert -i <file> -o <file>` | Convertit recording → YAML |

---

## 📁 Structure

```
mapleads/
├── src/
│   ├── actions/         # Actions (navigate, click, extract...)
│   ├── converter/       # Conversion UI → YAML
│   ├── config-env.ts    # Gestion des variables d'environnement
│   ├── session.ts       # Gestion des sessions
│   └── types.ts         # Types partagés
├── scrappe/             # Configurations YAML
├── sessions/            # Sessions (gitignore)
├── results/             # Résultats JSON
├── recordings/          # Enregistrements UI
├── scripts/
│   └── auth-ui.ts       # Script d'authentification
└── .env                 # Credentials (gitignore)
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

## 📖 Documentation

| Fichier | Description |
|---------|-------------|
| [PIPELINE.md](./PIPELINE.md) | **Flux complet du pipeline** |
| [ENV.md](./ENV.md) | Variables d'environnement |
| [scripts/README.md](./scripts/README.md) | Authentification UI |
| [scrappe/README.md](./scrappe/README.md) | Configurations YAML |
| [recordings/README.md](./recordings/README.md) | Enregistrement UI Mode |

---

## ⚙️ Configuration YAML

```yaml
name: mon-scraper
url: ${EXAMPLE_URL}  # Variable d'environnement
headless: true

steps:
  - action: navigate
    params:
      url: ${EXAMPLE_URL}
  
  - action: wait
    params:
      selector: .content
  
  - action: extract
    params:
      selector: .item
      fields:
        - name: title
          selector: h2
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

```bash
bunx playwright install chromium
```

### Fichier non trouvé

```bash
npm run scrape -- --list
```

---

**Créé le:** 24 février 2026  
**Version:** 1.0
