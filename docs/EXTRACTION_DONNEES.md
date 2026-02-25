# 📋 Guide d'Extraction des Données

**Comment sélectionner les données à enregistrer avec MapLeads**

> 📚 Cette documentation fait partie de la [documentation complète MapLeads](./INDEX.md).

---

## 🎯 Vue d'Ensemble

MapLeads utilise l'action `extract` pour extraire des données structurées depuis des pages web. Vous configurez les champs à extraire dans vos fichiers YAML.

**Voir aussi :**
- [Action Loop](./ACTION_LOOP.md) — Itération sur des éléments
- [Référence YAML](./SCRAPPE_YAML_CONFIG.md) — Tous les paramètres

---

## 📝 Syntaxe de Base

### Action `extract`

```yaml
- action: extract
  params:
    selector: .item              # Sélecteur des éléments répétés
    fields:                       # Champs à extraire pour chaque élément
      - name: title               # Nom dans le JSON final
        selector: h2              # Sélecteur CSS pour ce champ
        attribute: textContent    # Optionnel: attribut à extraire
      
      - name: price
        selector: .price
        
      - name: link
        selector: a
        attribute: href           # Extraire l'attribut href
```

---

## 🔧 Attributs Supportés

| Attribut | Description | Exemple de valeur |
|----------|-------------|-------------------|
| `textContent` (défaut) | Texte visible de l'élément | `Bonjour à tous` |
| `href` | Lien URL | `https://example.com/page` |
| `src` | Source image/vidéo | `/images/photo.jpg` |
| `alt` | Texte alternatif image | `Description de l'image` |
| `data-*` | Attributs data personnalisés | `data-id="123"` |
| `innerHTML` | Contenu HTML brut | `<span>Texte</span>` |
| `value` | Valeur d'un input | `texte saisie` |

---

## 📚 Exemples Complets

### 1. Site E-commerce

```yaml
name: products-scraper
url: https://example.com/products

scrapers:
  - name: extract-products
    url: https://example.com/products
    steps:
      - action: navigate
        params:
          url: https://example.com/products
      
      - action: wait
        params:
          selector: .product-card
      
      - action: extract
        params:
          selector: .product-card
          fields:
            - name: title
              selector: h2.product-title
            - name: price
              selector: .product-price
            - name: currency
              selector: .currency-symbol
            - name: image
              selector: img.product-image
              attribute: src
            - name: url
              selector: a.product-link
              attribute: href
            - name: rating
              selector: .product-rating
              attribute: data-rating
            - name: reviews_count
              selector: span.reviews-count
```

**Résultat JSON :**

```json
{
  "name": "extract-products",
  "url": "https://example.com/products",
  "data": [
    {
      "title": "Produit A",
      "price": "29.99",
      "currency": "€",
      "image": "/images/produit-a.jpg",
      "url": "https://example.com/products/produit-a",
      "rating": "4.5",
      "reviews_count": "127"
    }
  ]
}
```

---

### 2. LinkedIn Posts

```yaml
name: linkedin-scraper
url: ${LINKEDIN_URL}

session:
  enabled: true
  name: linkedin_session

scrapers:
  - name: linkedin-feed
    url: https://www.linkedin.com/feed/
    steps:
      # Charger la session authentifiée
      - action: session-load
        params:
          sessionName: linkedin_session
          sessionsDir: ./sessions
      
      # Navigation vers le feed
      - action: navigate
        params:
          url: https://www.linkedin.com/feed/
      
      # Attendre le chargement du contenu
      - action: wait
        params:
          selector: .scaffold-finish-scroll-container
          timeout: 10000
      
      # Extraire les posts
      - action: extract
        params:
          selector: div.update-components-actor
          fields:
            # Nom de l'auteur
            - name: author
              selector: span.update-components-actor-content__title
            
            # Titre/role de l'auteur
            - name: author_subtitle
              selector: span.update-components-actor-subtitle
            
            # Contenu du post
            - name: content
              selector: div.update-components-text
            
            # Nombre de likes
            - name: likes_count
              selector: span.social-counts-text
            
            # Nombre de commentaires
            - name: comments_count
              selector: button[data-control-name="comments_count"]
            
            # Lien vers le post
            - name: post_url
              selector: a.update-components-activity-card__meta-link
              attribute: href
            
            # Timestamp
            - name: timestamp
              selector: span.update-components-actor-subtitle
            
            # Image du post (si présente)
            - name: image_url
              selector: img.update-components-image
              attribute: src
```

---

### 3. Avec Pagination

```yaml
name: paginated-scraper
url: https://example.com/articles

scrapers:
  - name: extract-all-articles
    url: https://example.com/articles
    steps:
      - action: navigate
        params:
          url: https://example.com/articles
      
      # Extraire avec pagination automatique
      - action: paginate
        params:
          selector: .next-page          # Bouton "page suivante"
          max_pages: 10                 # Limite de pages (optionnel)
          itemSelector: .article-card   # Sélecteur des éléments
          fields:
            - name: title
              selector: h2.article-title
            - name: summary
              selector: p.article-summary
            - name: author
              selector: span.author-name
            - name: date
              selector: time.article-date
              attribute: datetime
            - name: url
              selector: a.read-more
              attribute: href
            - name: category
              selector: span.category-badge
```

---

### 4. Extraction de Tableau

```yaml
name: table-scraper
url: https://example.com/data

scrapers:
  - name: extract-table
    url: https://example.com/data
    steps:
      - action: navigate
        params:
          url: https://example.com/data
      
      - action: extract
        params:
          selector: table tr
          fields:
            - name: column1
              selector: td:nth-child(1)
            - name: column2
              selector: td:nth-child(2)
            - name: column3
              selector: td:nth-child(3)
            - name: link
              selector: td:nth-child(4) a
              attribute: href
```

---

## 🎯 Sélecteurs CSS Courants

### LinkedIn

```yaml
fields:
  # Nom de l'auteur
  - name: author
    selector: span.update-components-actor-content__title
  
  # Contenu du post
  - name: content
    selector: div.update-components-text
  
  # Nombre de likes
  - name: likes
    selector: span.social-counts-text
  
  # Nombre de commentaires
  - name: comments
    selector: button[data-control-name="comments_count"]
  
  # Lien vers le post
  - name: post_url
    selector: a.update-components-activity-card__meta-link
    attribute: href
  
  # Image du post
  - name: image
    selector: img.update-components-image
    attribute: src
  
  # Timestamp
  - name: time
    selector: span.update-components-actor-subtitle
```

### Sites E-commerce

```yaml
fields:
  # Titre produit
  - name: title
    selector: h1.product-title, .product-name
  
  # Prix
  - name: price
    selector: .price, .product-price, [data-price]
  
  # Prix original (avant promo)
  - name: original_price
    selector: .price-old, .was-price
  
  # Description
  - name: description
    selector: .product-description, #description
  
  # Images
  - name: image
    selector: .product-image img, .gallery-img
    attribute: src
  
  # Disponibilité
  - name: stock
    selector: .stock-status, .availability
  
  # Note/avis
  - name: rating
    selector: .rating, .stars
    attribute: data-rating
  
  # Nombre d'avis
  - name: reviews
    selector: .reviews-count, .review-count
```

### Annuaires / Listes

```yaml
fields:
  # Nom entreprise
  - name: company
    selector: .company-name, h2.business-name
  
  # Adresse
  - name: address
    selector: .address, .location
  
  # Téléphone
  - name: phone
    selector: .phone, [data-phone]
  
  # Email (si visible)
  - name: email
    selector: .email, a[href^="mailto:"]
  
  # Site web
  - name: website
    selector: a.website
    attribute: href
  
  # Catégorie
  - name: category
    selector: .category, .industry
```

---

## 🛠️ Comment Trouver les Sélecteurs

### Méthode 1 : DevTools Manuellement

1. **Ouvrir la page** dans Chrome/Firefox
2. **Ouvrir DevTools** (F12 ou Clic droit → Inspecter)
3. **Sélectionner l'élément** avec l'outil de sélection (↖️)
4. **Clic droit** sur l'élément dans le DOM → Copy → Copy selector

### Méthode 2 : Mode Enregistrement

```bash
# Lancer l'enregistrement UI
npm run record

# 1. Naviguez sur le site
# 2. Interagissez avec les éléments
# 3. Le code est généré automatiquement

# Convertir en YAML
npm run convert -i recordings/mon-recording.ts -o scrappe/mon-scraper.scrappe.yaml

# Éditer le YAML pour affiner les sélecteurs
```

### Méthode 3 : Console JavaScript

Dans la console DevTools :

```javascript
// Tester un sélecteur
document.querySelectorAll('.product-card').length

// Voir le texte extrait
document.querySelector('.product-title').textContent

// Voir l'attribut
document.querySelector('a.product-link').href

// Lister tous les éléments
Array.from(document.querySelectorAll('.product-card')).map(el => ({
  title: el.querySelector('.title')?.textContent,
  price: el.querySelector('.price')?.textContent
}))
```

---

## 📊 Structure du Fichier de Sortie

Les données extraites sont sauvegardées dans `results/` :

```
results/
└── linkedin-feed-2026-02-24T10-30-00.json
```

### Format JSON

```json
{
  "name": "linkedin-feed",
  "url": "https://www.linkedin.com/feed/",
  "startedAt": "2026-02-24T10:30:00.000Z",
  "completedAt": "2026-02-24T10:31:00.000Z",
  "duration": 60000,
  "success": true,
  "pageCount": 1,
  "recordCount": 25,
  "data": [
    {
      "author": "John Doe",
      "author_subtitle": "CEO at Company",
      "content": "Bonjour à tous !",
      "likes_count": "45",
      "comments_count": "12",
      "post_url": "https://www.linkedin.com/posts/...",
      "timestamp": "2h",
      "image_url": "https://media.licdn.com/..."
    }
  ],
  "errors": []
}
```

---

## ⚠️ Bonnes Pratiques

### ✅ À Faire

```yaml
# 1. Utiliser des sélecteurs spécifiques
fields:
  - name: title
    selector: article h2.title  # Plutôt que juste h2

# 2. Gérer les éléments optionnels
fields:
  - name: image
    selector: img.product-image
    attribute: src
  # Si l'image n'existe pas, la valeur sera null

# 3. Utiliser des attributs data-* stables
fields:
  - name: product_id
    selector: .product-card
    attribute: data-product-id

# 4. Nommer clairement les champs
fields:
  - name: author_name      # Clair
  - name: author_avatar    # Clair
  - name: post_timestamp   # Clair
```

### ❌ À Éviter

```yaml
# 1. Sélecteurs trop génériques
fields:
  - name: title
    selector: div  # Trop vague !

# 2. Sélecteurs basés sur du texte dynamique
fields:
  - name: button
    selector: [role=button text with spaces]  # Peut changer !

# 3. Chemins absolus fragiles
fields:
  - name: title
    selector: div > div > div:nth-child(3) > span  # Fragile !

# 4. Noms de champs non descriptifs
fields:
  - name: field1  # Non clair
  - name: data    # Non clair
```

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW D'EXTRACTION                    │
└─────────────────────────────────────────────────────────────┘

1. Identifier la page cible
   └─→ Ouvrir dans le navigateur

2. Analyser la structure HTML
   └─→ F12 → Inspecter les éléments

3. Tester les sélecteurs
   └─→ Console : document.querySelectorAll('.selector')

4. Créer le fichier YAML
   └─→ scrappe/mon-scraper.scrappe.yaml

5. Configurer les champs
   └─→ Définir selector + fields

6. Lancer l'extraction
   └─→ npm run scrape -- --file mon-scraper.scrappe.yaml

7. Vérifier les résultats
   └─→ results/mon-scraper-*.json

8. Ajuster si nécessaire
   └─→ Modifier les sélecteurs et relancer
```

---

## 📖 Ressources Utiles

- [MDN — Sélecteurs CSS](https://developer.mozilla.org/fr/docs/Web/CSS/CSS_Selectors)
- [Playwright — Locators](https://playwright.dev/docs/locators)
- [CSS Diner](https://flukeout.github.io/) — Jeu pour apprendre les sélecteurs

---

## 🔗 Voir Aussi

- [INDEX.md](./INDEX.md) — Documentation principale
- [ACTION_LOOP.md](./ACTION_LOOP.md) — Itération sur des éléments
- [SCRAPPE_YAML_CONFIG.md](./SCRAPPE_YAML_CONFIG.md) — Référence YAML complète

---

**Dernière mise à jour :** 25 février 2026  
**Version :** 1.0.0
