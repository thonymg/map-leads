# 🔄 Converter UI → YAML

**Conversion automatique du code Playwright vers configuration YAML**

---

## 🚀 Usage

```bash
npm run convert -- -i recordings/test.ts -o scrappe/test.scrappe.yaml
```

---

## 📋 Options

| Option | Court | Description |
|--------|-------|-------------|
| `--input` | `-i` | Fichier d'entrée |
| `--output` | `-o` | Fichier de sortie |
| `--dry-run` | `-d` | Aperçu sans écrire |

---

## 🔄 Conversions

| Code Playwright | Action YAML |
|-----------------|-------------|
| `page.goto(url)` | `navigate` |
| `locator().waitFor()` | `wait` |
| `locator().click()` | `click` |
| `locator().fill(val)` | `fill` |
| Boucle + `textContent()` | `extract` |
| `getAttribute(attr)` | `extract[].attribute` |

---

## 🎨 Optimisation

Le convertisseur optimise les sélecteurs :

| Avant | Après |
|-------|-------|
| `div:nth-child(3) > .product` | `.product` |
| `button[aria-label="Submit"]` | `role=button "Submit"` |
| `[data-testid="btn"]` | `data-testid="btn"` |

---

## 📊 Exemple

**Entrée :**

```typescript
await page.goto('https://example.com');
await page.locator('.item').waitFor();

const items = page.locator('.item');
for (let i = 0; i < await items.count(); i++) {
  const item = items.nth(i);
  const title = await item.locator('h2').textContent();
  const price = await item.locator('.price').textContent();
}
```

**Sortie :**

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
        - name: price
          selector: .price
```

---

## 🔧 API

```typescript
import { convertCodeToYaml } from './src/converter';

const config = await convertCodeToYaml({
  inputFile: 'recordings/test.ts',
  outputFile: 'scrappe/test.scrappe.yaml',
  optimizeSelectors: true,
});
```

---

**Créé le:** 24 février 2026
