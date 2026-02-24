# 🔄 Pipeline Complet — MapLeads

**Flux complet depuis l'authentification jusqu'au résultat final**

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PIPELINE MAPLEADS                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. AUTH     │────▶│  2. RECORD   │────▶│  3. CONVERT  │
│  npm run auth│     │ npm run record│    │npm run convert│
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            └─────────┬──────────┘
                                      │
                                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  6. RESULTS  │◀────│  5. SCRAPE   │◀────│  4. CONFIG   │
│  results/*.json│   │npm run scrape│     │  scrappe/*.yaml│
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 📝 Étapes Détaillées

### 1️⃣ Authentification

**Commande :**
```bash
npm run auth
```

**Ce qui se passe :**
1. Un navigateur s'ouvre
2. Vous entrez l'URL de connexion
3. Vous vous connectez manuellement
4. Le script exporte automatiquement :
   - `.env` → Credentials (`LINKEDIN_EMAIL`, `LINKEDIN_PASS`)
   - `sessions/linkedin_session.json` → Session
   - `scrappe/linkedin.auth.scrappe.yaml` → Configuration (avec `${LINKEDIN_*}`)

**Fichiers créés :**
```
.env                          # Credentials
sessions/linkedin_session.json  # Session
scrappe/linkedin.auth.scrappe.yaml  # Configuration YAML
```

---

### 2️⃣ Enregistrement UI Mode

**Commande :**
```bash
npm run record
```

**Fichier créé :**
```
recordings/mon-parcours.ts  # Code Playwright généré
```

---

### 3️⃣ Conversion

**Commande :**
```bash
npm run convert -- -i recordings/mon-parcours.ts -o scrappe/mon-scraper.scrappe.yaml
```

**Fichier créé :**
```
scrappe/mon-scraper.scrappe.yaml  # Configuration YAML
```

---

### 4️⃣ Configuration

**Fichier :** `scrappe/mon-scraper.scrappe.yaml`

**Avec variables d'environnement :**
```yaml
name: mon-scraper
url: ${LINKEDIN_URL}  # Résolu au runtime

steps:
  - action: navigate
    params:
      url: ${LINKEDIN_URL}  # Résolu au runtime
```

---

### 5️⃣ Exécution

**Commande :**
```bash
npm run scrape -- --file mon-scraper.scrappe.yaml
```

**Ce qui se passe :**
1. Les variables `${*_}` sont résolues depuis `.env`
2. La session est chargée
3. Les étapes sont exécutées
4. Les résultats sont sauvegardés

---

### 6️⃣ Résultats

**Fichier :** `results/mon-scraper-*.json`

---

## 🎯 Exemple Complet : LinkedIn

### 1. Auth

```bash
npm run auth
```

### 2. Record

```bash
npm run record
```

### 3. Convert

```bash
npm run convert -- \
  -i recordings/linkedin.ts \
  -o scrappe/linkedin.final.scrappe.yaml
```

### 4. Config

**Fichier :** `scrappe/linkedin.final.scrappe.yaml`

```yaml
name: linkedin-feed-scraper
url: ${LINKEDIN_URL}

session:
  enabled: true
  name: linkedin_session

steps:
  - action: session-load
    params:
      sessionName: linkedin_session
  
  - action: navigate
    params:
      url: ${LINKEDIN_URL}
  
  - action: extract
    params:
      selector: div.feed-update
      fields:
        - name: author
          selector: span.update-actor__name
```

### 5. Exécution

```bash
npm run scrape -- --file linkedin.final.scrappe.yaml
```

### 6. Résultats

**Fichier :** `results/linkedin-feed-scraper-*.json`

---

## 📊 Résumé des Commandes

| Étape | Commande | Fichier Créé |
|-------|----------|--------------|
| 1. Auth | `npm run auth` | `.env`, `sessions/*.json`, `scrappe/*.yaml` |
| 2. Record | `npm run record` | `recordings/*.ts` |
| 3. Convert | `npm run convert -i <in> -o <out>` | `scrappe/*.yaml` |
| 4. Config | Éditeur | `scrappe/*.yaml` |
| 5. Scrape | `npm run scrape -- --file <file>` | `results/*.json` |

---

## 🔧 Dépannage

### Session expirée

```bash
npm run auth
```

### Erreur de conversion

```bash
node --experimental-strip-types recordings/mon-parcours.ts
```

### Variables non résolues

Vérifiez le fichier `.env` :

```bash
cat .env
```

---

**Créé le:** 24 février 2026  
**Version:** 1.0
