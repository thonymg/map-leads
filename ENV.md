# 🔐 Variables d'Environnement

**Gestion centralisée des credentials et configurations**

---

## 📁 Fichier `.env`

Le fichier `.env` contient tous les credentials :

```bash
# LinkedIn
LINKEDIN_EMAIL=user@example.com
LINKEDIN_PASS=password123
LINKEDIN_URL=https://www.linkedin.com/feed/

# Facebook
FACEBOOK_EMAIL=user@example.com
FACEBOOK_PASS=password456
FACEBOOK_URL=https://www.facebook.com/

# Twitter
TWITTER_EMAIL=user@example.com
TWITTER_PASS=password789
TWITTER_URL=https://twitter.com/
```

---

## 🎯 Format

`[DOMAIN]_[FIELD]`

| Domaine | Variables |
|---------|-----------|
| LinkedIn | `LINKEDIN_EMAIL`, `LINKEDIN_PASS`, `LINKEDIN_URL` |
| Facebook | `FACEBOOK_EMAIL`, `FACEBOOK_PASS`, `FACEBOOK_URL` |
| Twitter | `TWITTER_EMAIL`, `TWITTER_PASS`, `TWITTER_URL` |

---

## 📝 Utilisation dans YAML

Les variables sont interpolées automatiquement :

```yaml
name: linkedin-scraper
url: ${LINKEDIN_URL}

session:
  enabled: true
  name: linkedin-session

steps:
  - action: navigate
    params:
      url: ${LINKEDIN_URL}
```

---

## 🔧 Commandes

### Lister les domaines configurés

```bash
node --experimental-strip-types -e "import { listConfiguredDomains } from './src/config-env.js'; console.log(listConfiguredDomains());"
```

### Vérifier les credentials

```bash
node --experimental-strip-types -e "import { hasCredentials } from './src/config-env.js'; console.log(hasCredentials('LINKEDIN'));"
```

---

## 🔐 Sécurité

- ✅ `.env` est dans `.gitignore`
- ✅ Jamais de credentials dans le code
- ✅ Variables isolées par domaine

---

## 📊 API

```typescript
import { loadEnv, getCredentials, hasCredentials } from './src/config-env';

// Charger les variables
loadEnv();

// Obtenir les credentials
const creds = getCredentials('LINKEDIN');
// { email: '...', password: '...', url: '...' }

// Vérifier si configuré
if (hasCredentials('LINKEDIN')) {
  // ...
}
```

---

**Créé le:** 24 février 2026
