# 🎬 Enregistrements UI Mode

**Enregistrer des parcours de navigation avec Playwright UI**

---

## 🚀 Usage

```bash
npm run record
```

---

## 📋 Workflow

### 1. Lancer le mode UI

```bash
npm run record
```

### 2. Enregistrer

- Cliquez sur "Record"
- Naviguez sur le site
- Effectuez vos actions
- Arrêtez l'enregistrement

### 3. Convertir

```bash
npm run convert -- -i recordings/test.ts -o scrappe/test.scrappe.yaml
```

### 4. Exécuter

```bash
npm run scrape -- --file test.scrappe.yaml
```

---

## 📁 Template

Utilisez `recordings/template.ts` comme base.

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
