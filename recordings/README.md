# 🎬 Enregistrements UI Mode

**Enregistrer des parcours de navigation avec Playwright UI**

---

## 🚀 Usage

```bash
npm run record
```

---

## 📋 Mode d'Emploi

### 1. Lancer le mode UI

```bash
npm run record
```

Une fenêtre Playwright s'ouvre.

### 2. Activer l'enregistrement

Dans la fenêtre Playwright :

1. **Cliquez sur "Record"** (bouton en haut à droite, icône ●)
2. **Choisissez le projet** (chromium)
3. **Une nouvelle page s'ouvre** - Naviguez et effectuez vos actions

### 3. Effectuer vos actions

- Naviguez vers le site
- Cliquez sur les éléments
- Remplissez les formulaires
- Scrollez pour charger le contenu

Toutes vos actions sont enregistrées en temps réel dans le panneau de gauche.

### 4. Arrêter l'enregistrement

1. **Cliquez à nouveau sur "Record"** (●) pour arrêter
2. **Le code est affiché** dans le panneau de gauche
3. **Copiez le code** dans un fichier `recordings/mon-parcours.ts`

### 5. Convertir

```bash
npm run convert -- -i recordings/mon-parcours.ts -o scrappe/mon-scraper.scrappe.yaml
```

---

## 📁 Fichier d'Exemple

`recordings/example.test.ts` - Fichier vide pour initialiser le mode UI.

---

## 🔄 Conversion Automatique

Le convertisseur transforme :

| Code Playwright | Action YAML |
|-----------------|-------------|
| `page.goto(url)` | `navigate` |
| `locator().waitFor()` | `wait` |
| `locator().click()` | `click` |
| Boucle + `textContent()` | `extract` |

---

## 📊 Exemple

**Code généré :**

```typescript
await page.goto('https://example.com');
await page.locator('.item').waitFor();

const items = page.locator('.item');
for (let i = 0; i < await items.count(); i++) {
  const item = items.nth(i);
  const title = await item.locator('h2').textContent();
}
```

**YAML converti :**

```yaml
steps:
  - action: navigate
    params:
      url: https://example.com
  
  - action: wait
    params:
      selector: .item
  
  - action: extract
    params:
      selector: .item
      fields:
        - name: title
          selector: h2
```

---

## 📖 Documentation

[src/converter/README.md](../src/converter/README.md) — Détails de la conversion

---

**Créé le:** 24 février 2026
