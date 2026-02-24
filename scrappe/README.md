# Dossier Scrappe — Configurations de Scraping

Ce dossier contient les fichiers de configuration pour chaque site à scraper.

## Structure des fichiers

Chaque fichier de configuration suit le format : `[nomdedomaine].scrappe.yaml`

### Exemples :
- `books.toscrape.com.scrappe.yaml` — Scraper pour books.toscrape.com
- `quotes.toscrape.com.scrappe.yaml` — Scraper pour quotes.toscrape.com
- `example.com.scrappe.yaml` — Scraper pour example.com

## Utilisation

### Lancer tous les scrapers
```bash
npm run scrape
```

### Lister les configurations disponibles
```bash
npm run scrape -- --list
```

### Lancer un fichier spécifique
```bash
npm run scrape -- --file books.toscrape.com.scrappe.yaml
```

### Lancer par domaine
```bash
npm run scrape -- --domain toscrape.com
```

## Structure d'un fichier de configuration

```yaml
# Configuration globale
concurrency: 2          # Nombre de scrapers en parallèle
output_dir: ./results   # Dossier de sortie des résultats

# Liste des scrapers à exécuter
scrapers:
  - name: mon-scraper           # Identifiant unique
    url: https://example.com/   # URL de départ
    headless: true              # Mode headless (optionnel)
    viewport:                   # Dimensions du viewport (optionnel)
      width: 1920
      height: 1080
    steps:                      # Séquence d'actions
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
            - name: link
              selector: a
              attribute: href
      
      - action: paginate
        params:
          selector: .next-page
          max_pages: 10
```

## Actions disponibles

| Action | Description | Paramètres requis |
|--------|-------------|-------------------|
| `navigate` | Navigation vers une URL | `url` |
| `wait` | Attente d'un élément ou durée | `selector` ou `duration` |
| `click` | Clic sur un élément | `selector` |
| `fill` | Remplir un champ | `selector`, `value` |
| `extract` | Extraire des données | `selector`, `fields` |
| `paginate` | Navigation multi-pages | `selector` |

## Ajouter un nouveau scraper

1. Créez un nouveau fichier `[domaine].scrappe.yaml` dans ce dossier
2. Définissez la configuration selon la structure ci-dessus
3. Testez avec `npm run scrape -- --file [domaine].scrappe.yaml`

## Résultats

Les résultats sont sauvegardés dans le dossier `./results` sous forme de fichiers JSON horodatés :
- `{nom}-{timestamp}.json`

Chaque fichier contient :
- Métadonnées d'exécution (durée, nombre de pages, erreurs)
- Tableau de données extraites
