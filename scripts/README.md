# 🔐 Authentification UI

**Authentification fluide avec export automatique de session**

---

## 🚀 Usage

```bash
npm run auth
```

---

## 📋 Workflow

### 1. Lancer le script

```bash
npm run auth
```

### 2. Entrer l'URL

```
📝 URL de connexion : https://www.linkedin.com/login
```

### 3. Se connecter

- Un navigateur s'ouvre
- Connectez-vous normalement
- Appuyez sur Entrée dans le terminal

### 4. Fichiers créés

Le script génère automatiquement :

| Fichier | Contenu |
|---------|---------|
| `.env` | `[DOMAIN]_EMAIL`, `[DOMAIN]_PASS`, `[DOMAIN]_URL` |
| `sessions/[domain]_session.json` | Session complète |
| `scrappe/[domain].auth.scrappe.yaml` | Configuration YAML |

---

## 🎯 Exemple

```bash
npm run auth

# Entrées :
URL : https://www.linkedin.com/login
Email : user@example.com
Password : ********

# Sorties :
✅ .env → LINKEDIN_EMAIL, LINKEDIN_PASS, LINKEDIN_URL
✅ sessions/linkedin_session.json
✅ scrappe/linkedin.auth.scrappe.yaml
```

---

## 🔄 Réutiliser

```bash
# Lancer le scraper
npm run scrape -- --file linkedin.auth.scrappe.yaml
```

---

## 📁 Variables d'Environnement

Format : `[DOMAIN]_[FIELD]`

```bash
LINKEDIN_EMAIL=user@example.com
LINKEDIN_PASS=password
LINKEDIN_URL=https://www.linkedin.com/feed/
```

---

## 🔧 Dépannage

### Session expirée

```bash
npm run auth
```

### Fichier .env manquant

Vérifiez que `.env` existe à la racine.

### Mauvais credentials

Modifiez `.env` manuellement.

---

**Créé le:** 24 février 2026
