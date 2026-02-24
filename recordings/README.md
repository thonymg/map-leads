# 🎬 Enregistrements avec Playwright Codegen

**Génération automatique de code par enregistrement de navigation**

---

## 🚀 Usage

```bash
npm run record
```

---

## 📋 Mode d'Emploi

### 1. Lancer Codegen

```bash
npm run record
```

Une fenêtre s'ouvre avec :
- **Navigateur** à droite
- **Code généré** à gauche

### 2. Naviguer et Enregistrer

1. **Entrez l'URL** dans la barre en haut
2. **Naviguez** sur le site
3. **Effectuez vos actions** (clics, remplissage, etc.)
4. **Le code est généré** en temps réel à gauche

### 3. Copier le Code

1. **Cliquez sur "Copy"** en haut du panneau de code
2. **Collez dans** `recordings/mon-parcours.ts`

### 4. Convertir

```bash
npm run convert -- -i recordings/mon-parcours.ts -o scrappe/mon-scraper.scrappe.yaml
```

---

## 🎯 Options

```bash
# Basique (sans sauvegarde auto)
npm run record

# Avec URL de départ
npx playwright codegen https://example.com

# Avec viewport personnalisé
npx playwright codegen --viewport-size 1920,1080

# Enregistrer directement dans un fichier
npm run record:file
# ou
npx playwright codegen -o recordings/mon-parcours.ts
```

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

- [Playwright Codegen](https://playwright.dev/docs/codegen)
- [src/converter/README.md](../src/converter/README.md)

---

**Créé le:** 24 février 2026
