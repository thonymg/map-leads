# 📁 Configurations Scrappe

**Fichiers de configuration YAML pour chaque site**

---

## 📋 Format

`[nomdedomaine].scrappe.yaml`

---

## 🚀 Usage

```bash
# Lancer un scraper
npm run scrape -- --file <fichier>.scrappe.yaml

# Lister les configurations
npm run scrape -- --list
```

---

## 📝 Structure

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
```

---

## 🔐 Avec Authentification

```yaml
name: linkedin-scraper
url: https://www.linkedin.com/
headless: false

session:
  enabled: true
  name: linkedin_session

steps:
  - action: session-load
    params:
      sessionName: linkedin_session
  
  - action: navigate
    params:
      url: https://www.linkedin.com/feed/
  
  - action: extract
    params:
      selector: div.feed-update
      fields:
        - name: author
          selector: span.update-actor__name
```

---

## 📊 Actions

| Action | Description |
|--------|-------------|
| `navigate` | Navigation URL |
| `wait` | Attente élément |
| `click` | Clic |
| `fill` | Remplir champ |
| `extract` | Extraire données |
| `paginate` | Pagination |
| `session-load` | Charger session |

---

## 🎯 Exemples

### LinkedIn

```bash
npm run scrape -- --file linkedin.auth.scrappe.yaml
```

### Books (test)

```bash
npm run scrape -- --file books.toscrape.com.scrappe.yaml
```

---

**Créé le:** 24 février 2026
