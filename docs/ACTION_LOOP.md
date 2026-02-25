# 🔄 Action Loop — Itération sur des Éléments

**Exécuter une séquence d'actions en boucle pour chaque élément d'une liste**

> 📚 Cette documentation fait partie de la [documentation complète MapLeads](./INDEX.md).

---

## 🎯 Vue d'Ensemble

L'action `loop` permet d'itérer sur une liste d'éléments et d'exécuter un sous-parcours d'actions pour chacun. C'est idéal pour :

- Cliquer sur chaque profil dans une liste et extraire des données
- Naviguer dans des pages de détail multiples
- Scraper des résultats de recherche un par un

**Voir aussi :**
- [Guide d'extraction des données](./EXTRACTION_DONNEES.md)
- [Référence complète YAML](./SCRAPPE_YAML_CONFIG.md)

---

## 📝 Syntaxe

```yaml
- action: loop
  params:
    selector: ".liste-elements"    # Sélecteur des éléments à itérer
    max_iterations: 10             # Maximum d'itérations (optionnel)
    delayBetweenIterations: 2000   # Délai entre chaque itération en ms (optionnel)
    steps:                         # Actions à exécuter pour chaque élément
      - action: click
        params:
          selector: "a.detail-link"
      - action: extract
        params:
          selector: ".detail-content"
          fields:
            - name: title
              selector: "h1"
            - name: description
              selector: "p"
      - action: navigate-back
        params:
          count: 1
```

---

## 🔧 Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `selector` | string | ✅ Oui | Sélecteur CSS des éléments à itérer |
| `steps` | array | ✅ Oui | Liste des actions à exécuter pour chaque élément |
| `max_iterations` | number | ❌ Non | Nombre maximum d'itérations (par défaut: tous) |
| `delayBetweenIterations` | number | ❌ Non | Délai en ms entre chaque itération (défaut: 1000ms) |
| `timeout` | number | ❌ Non | Timeout global en ms (défaut: 10000) |

---

## 📚 Exemples Complets

### 1. LinkedIn: Extraire les Profils depuis une Liste

```yaml
name: linkedin-profiles-scraper
url: ${LINKEDIN_URL}

session:
  enabled: true
  name: linkedin_session

scrapers:
  - name: extract-profiles
    url: https://www.linkedin.com/search/results/people/
    steps:
      # Charger la session
      - action: session-load
        params:
          sessionName: linkedin_session
      
      # Navigation vers la recherche
      - action: navigate
        params:
          url: https://www.linkedin.com/search/results/people/
      
      # Attendre les résultats
      - action: wait
        params:
          selector: .search-results-container
          timeout: 10000
      
      # Boucle sur chaque profil
      - action: loop
        params:
          selector: .search-results-container li
          max_iterations: 5
          delayBetweenIterations: 3000
          steps:
            # Cliquer sur le profil
            - action: click
              params:
                selector: a.app-aware-link
            
            # Attendre le chargement
            - action: wait
              params:
                selector: .pv-profile-section
                timeout: 10000
            
            # Extraire les données
            - action: extract
              params:
                selector: .pv-profile-section
                fields:
                  - name: full_name
                    selector: .text-heading-xlarge
                  - name: title
                    selector: .text-body-medium
                  - name: location
                    selector: .t-16
                  - name: about
                    selector: #about
                  - name: experience_title
                    selector: .pv-entity__summary-info h3
                  - name: experience_company
                    selector: .pv-entity__summary-info h4
                  - name: experience_duration
                    selector: .pv-entity__date-range
            
            # Revenir en arrière
            - action: navigate-back
              params:
                count: 1
            
            # Attendre le retour
            - action: wait
              params:
                selector: .search-results-container
                timeout: 10000
```

**Résultat JSON :**

```json
{
  "name": "extract-profiles",
  "data": [
    {
      "full_name": "Jean Dupont",
      "title": "CEO at Startup",
      "location": "Paris, France",
      "about": "Passionné par...",
      "experience_title": "CEO",
      "experience_company": "Startup",
      "experience_duration": "2020 - Présent"
    },
    {
      "full_name": "Marie Martin",
      "title": "CTO at TechCorp",
      "location": "Lyon, France",
      "about": "Expert en...",
      "experience_title": "CTO",
      "experience_company": "TechCorp",
      "experience_duration": "2019 - Présent"
    }
  ]
}
```

---

### 2. E-commerce: Extraire les Détails de Produits

```yaml
name: products-detail-scraper
url: https://example.com/products

scrapers:
  - name: extract-product-details
    url: https://example.com/products
    steps:
      - action: navigate
        params:
          url: https://example.com/products
      
      - action: wait
        params:
          selector: .product-grid
          timeout: 10000
      
      # Boucle sur chaque produit
      - action: loop
        params:
          selector: .product-grid .product-item
          max_iterations: 10
          delayBetweenIterations: 2000
          steps:
            # Cliquer sur le produit
            - action: click
              params:
                selector: a.product-link
            
            # Attendre
            - action: wait
              params:
                selector: .product-detail-page
                timeout: 10000
            
            # Extraire
            - action: extract
              params:
                selector: .product-detail-page
                fields:
                  - name: title
                    selector: h1.product-name
                  - name: price
                    selector: .price-current
                  - name: original_price
                    selector: .price-old
                  - name: description
                    selector: .product-description
                  - name: images
                    selector: .gallery-img
                    attribute: src
                  - name: stock_status
                    selector: .stock-status
                  - name: rating
                    selector: .product-rating
                    attribute: data-rating
                  - name: reviews_count
                    selector: .reviews-count
            
            # Retour
            - action: navigate-back
              params:
                count: 1
            
            - action: wait
              params:
                selector: .product-grid
                timeout: 10000
```

---

### 3. Annuaires: Extraire les Entreprises

```yaml
name: companies-scraper
url: https://annuaire.com

scrapers:
  - name: extract-companies
    url: https://annuaire.com/search
    steps:
      - action: navigate
        params:
          url: https://annuaire.com/search
      
      - action: wait
        params:
          selector: .results-list
          timeout: 10000
      
      # Boucle avec pagination intégrée
      - action: loop
        params:
          selector: .results-list .company-item
          max_iterations: 20
          delayBetweenIterations: 1500
          steps:
            # Cliquer
            - action: click
              params:
                selector: .company-name a
            
            # Attendre
            - action: wait
              params:
                selector: .company-profile
                timeout: 10000
            
            # Extraire
            - action: extract
              params:
                selector: .company-profile
                fields:
                  - name: company_name
                    selector: h1.company-name
                  - name: address
                    selector: .address
                  - name: phone
                    selector: .phone
                  - name: email
                    selector: a[href^="mailto:"]
                  - name: website
                    selector: a.website
                    attribute: href
                  - name: siret
                    selector: .siret
                  - name: category
                    selector: .category-badge
                  - name: employees
                    selector: .employees-count
            
            # Retour
            - action: navigate-back
              params:
                count: 1
            
            - action: wait
              params:
                selector: .results-list
                timeout: 10000
```

---

### 4. Boucle Niveaux Multiples

```yaml
name: nested-loop-scraper
url: https://example.com/categories

scrapers:
  - name: extract-all-data
    url: https://example.com/categories
    steps:
      - action: navigate
        params:
          url: https://example.com/categories
      
      # Boucle externe: catégories
      - action: loop
        params:
          selector: .category-item
          delayBetweenIterations: 2000
          steps:
            # Cliquer catégorie
            - action: click
              params:
                selector: a.category-link
            
            - action: wait
              params:
                selector: .products-list
                timeout: 10000
            
            # Boucle interne: produits
            - action: loop
              params:
                selector: .products-list .product-item
                max_iterations: 5
                delayBetweenIterations: 1000
                steps:
                  - action: click
                    params:
                      selector: a.product-detail
                  
                  - action: wait
                    params:
                      selector: .product-page
                      timeout: 10000
                  
                  - action: extract
                    params:
                      selector: .product-page
                      fields:
                        - name: category
                          selector: .breadcrumb .current
                        - name: product_name
                          selector: h1
                        - name: price
                          selector: .price
                  
                  - action: navigate-back
                    params:
                      count: 1
            
            # Retour page catégories
            - action: navigate-back
              params:
                count: 1
            
            - action: wait
              params:
                selector: .categories-list
                timeout: 10000
```

---

## ⚙️ Actions Supportées dans une Boucle

| Action | Supportée | Notes |
|--------|-----------|-------|
| `navigate` | ✅ | Navigation vers nouvelle page |
| `wait` | ✅ | Attendre élément/timeout |
| `click` | ✅ | Cliquer sur élément |
| `fill` | ✅ | Remplir champ |
| `extract` | ✅ | Extraire données |
| `navigate-back` | ✅ | Revenir en arrière |
| `loop` | ✅ | Boucle imbriquée |
| `session-load` | ⚠️ | Une fois avant la boucle |
| `session-save` | ⚠️ | Une fois après la boucle |
| `paginate` | ❌ | Non supporté dans loop |

---

## 🎯 Bonnes Pratiques

### ✅ Recommandé

```yaml
# 1. Ajouter des délais entre les itérations
- action: loop
  params:
    selector: .item
    delayBetweenIterations: 2000  # Évite le rate limiting
    steps: [...]

# 2. Limiter le nombre d'itérations pour tester
- action: loop
  params:
    selector: .item
    max_iterations: 5  # Test avec 5 éléments
    steps: [...]

# 3. Gérer les timeouts
- action: loop
  params:
    selector: .item
    steps:
      - action: click
        params:
          selector: a.link
      - action: wait
        params:
          selector: .content
          timeout: 10000  # Timeout explicite
      - action: extract
        params: {...}
      - action: navigate-back
        params:
          count: 1

# 4. Vérifier la présence des éléments
- action: loop
  params:
    selector: .item
    steps:
      - action: wait  # Attendre que l'élément soit visible
        params:
          selector: .detail-page
          timeout: 5000
      - action: extract
        params: {...}
```

### ❌ À Éviter

```yaml
# 1. Pas de délai (risque de blocage)
- action: loop
  params:
    selector: .item
    delayBetweenIterations: 0  # ❌ Trop rapide !
    steps: [...]

# 2. Boucle infinie potentielle
- action: loop
  params:
    selector: .item
    # Pas de max_iterations sur grande liste
    steps: [...]

# 3. Pas de gestion d'erreur
- action: loop
  params:
    selector: .item
    steps:
      - action: click
        params:
          selector: a.maybe-not-present  # Peut échouer
      # Pas de wait ou fallback

# 4. Navigate-back sans wait
- action: loop
  params:
    selector: .item
    steps:
      - action: click
        params: {...}
      - action: extract
        params: {...}
      - action: navigate-back
        params:
          count: 1
      # ❌ Pas de wait après le retour !
      - action: click  # Échouera car page pas chargée
        params: {...}
```

---

## 🐛 Dépannage

### La boucle s'arrête prématurément

**Problème :** La boucle s'arrête après quelques itérations.

**Solution :**
```yaml
- action: loop
  params:
    selector: .item
    delayBetweenIterations: 3000  # Augmenter le délai
    steps:
      - action: wait  # Attendre que la page soit stable
        params:
          selector: body
          timeout: 5000
      # ...
```

### Les sélecteurs ne fonctionnent pas après la première itération

**Problème :** Le DOM change après la première itération.

**Solution :** Les sélecteurs sont re-évalués à chaque itération. Utilisez des sélecteurs stables :

```yaml
# ❌ Mauvais
selector: div > div:nth-child(3) > span

# ✅ Bon
selector: .product-name
selector: [data-product-id]
```

### Timeout trop court

**Problème :** `Timeout exceeded` après quelques itérations.

**Solution :**
```yaml
steps:
  - action: click
    params:
      timeout: 15000  # Timeout plus long
  - action: wait
    params:
      timeout: 15000
      selector: .content
```

### Les données ne sont pas concaténées

**Problème :** Seules les données de la dernière itération sont présentes.

**Solution :** Vérifiez que l'action `extract` est bien dans les `steps` de la boucle :

```yaml
- action: loop
  params:
    selector: .item
    steps:
      - action: extract  # ✅ Doit être ici
        params:
          selector: .data
          fields: [...]
```

---

## 📊 Performances

| Configuration | Vitesse | Fiabilité |
|---------------|---------|-----------|
| `delayBetweenIterations: 0` | ⚡ Rapide | ❌ Risqué |
| `delayBetweenIterations: 1000` | ⚡⚡ Moyen | ✅ Bon |
| `delayBetweenIterations: 3000` | 🐢 Lent | ✅✅ Excellent |
| `max_iterations: 5` | ⚡⚡⚡ Test | ✅✅✅ Sûr |

**Recommandations :**
- Production: `delayBetweenIterations: 2000-3000`
- Test: `max_iterations: 3-5`
- Sites sensibles: `delayBetweenIterations: 5000`

---

## 📖 Voir Aussi

- [INDEX.md](./INDEX.md) — Documentation principale
- [EXTRACTION_DONNEES.md](./EXTRACTION_DONNEES.md) — Guide d'extraction
- [SCRAPPE_YAML_CONFIG.md](./SCRAPPE_YAML_CONFIG.md) — Référence YAML complète

---

**Dernière mise à jour :** 25 février 2026  
**Version :** 1.0.0
