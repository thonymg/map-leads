/**
 * Selector Optimizer
 * Optimise les sélecteurs CSS en utilisant les rôles ARIA et les sélecteurs sémantiques
 *
 * Stratégies d'optimisation (par ordre de priorité):
 * 1. Rôles ARIA (getByRole) - Le plus robuste
 * 2. Labels ARIA (getByLabel) - Très robuste
 * 3. Test IDs (data-testid) - Robuste
 * 4. Textes (getByText) - Moyen
 * 5. CSS simplifié - Moins robuste
 */

import type { ExtractField, OptimizedSelector, RoleOptions } from './types';

/**
 * Mapping des rôles ARIA vers les sélecteurs CSS équivalents
 */
const ROLE_SELECTORS: Record<string, string[]> = {
  // Liens
  'link': ['a', '[role="link"]'],
  'button': ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'],
  
  // Formulaires
  'textbox': ['input[type="text"]', 'input[type="email"]', 'input[type="tel"]', 'textarea', '[role="textbox"]'],
  'searchbox': ['input[type="search"]', '[role="searchbox"]'],
  'checkbox': ['input[type="checkbox"]', '[role="checkbox"]'],
  'radio': ['input[type="radio"]', '[role="radio"]'],
  'combobox': ['select', '[role="combobox"]'],
  'listbox': ['select[multiple]', '[role="listbox"]'],
  'slider': ['input[type="range"]', '[role="slider"]'],
  'spinbutton': ['input[type="number"]', '[role="spinbutton"]'],
  
  // Navigation
  'menu': ['nav', '[role="menu"]', 'ul[role="menu"]'],
  'menuitem': ['[role="menuitem"]', 'li[role="menuitem"]'],
  'menubar': ['[role="menubar"]'],
  'tab': ['[role="tab"]', 'button[role="tab"]'],
  'tablist': ['[role="tablist"]'],
  'tabpanel': ['[role="tabpanel"]'],
  
  // Structure
  'heading': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]'],
  'list': ['ul', 'ol', '[role="list"]'],
  'listitem': ['li', '[role="listitem"]'],
  'table': ['table', '[role="table"]'],
  'row': ['tr', '[role="row"]'],
  'cell': ['td', '[role="cell"]'],
  'columnheader': ['th', '[role="columnheader"]'],
  'rowheader': ['th[scope="row"]', '[role="rowheader"]'],
  
  // Contenu
  'article': ['article', '[role="article"]'],
  'banner': ['header', '[role="banner"]'],
  'complementary': ['aside', '[role="complementary"]'],
  'contentinfo': ['footer', '[role="contentinfo"]'],
  'main': ['main', '[role="main"]'],
  'navigation': ['nav', '[role="navigation"]'],
  'region': ['section', '[role="region"]'],
  'search': ['[role="search"]'],
  
  // Dialogs
  'alert': ['[role="alert"]'],
  'alertdialog': ['[role="alertdialog"]'],
  'dialog': ['[role="dialog"]', 'dialog'],
  'tooltip': ['[role="tooltip"]'],
  
  // Status
  'log': ['[role="log"]'],
  'marquee': ['[role="marquee"]'],
  'progressbar': ['progress', '[role="progressbar"]'],
  'status': ['[role="status"]'],
  'timer': ['[role="timer"]'],
  
  // Windows
  'application': ['[role="application"]'],
  'document': ['[role="document"]'],
  'feed': ['[role="feed"]'],
  'figure': ['figure', '[role="figure"]'],
  'group': ['fieldset', '[role="group"]', '[role="grouping"]'],
  'img': ['img', '[role="img"]'],
  'mark': ['mark', '[role="mark"]'],
  'math': ['[role="math"]'],
  'none': ['[role="none"]'],
  'presentation': ['[role="presentation"]'],
  'scrollbar': ['[role="scrollbar"]'],
  'separator': ['hr', '[role="separator"]'],
  'switch': ['[role="switch"]'],
  'term': ['dt', '[role="term"]'],
  'definition': ['dd', '[role="definition"]'],
  'tree': ['[role="tree"]'],
  'treegrid': ['[role="treegrid"]'],
  'treeitem': ['[role="treeitem"]'],
};

/**
 * Attributs ARIA à privilégier
 */
const ARIA_ATTRIBUTES = [
  'data-testid',
  'data-test',
  'data-cy', // Cypress
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'role',
  'id',
];

/**
 * Optimiseur de sélecteurs
 */
export class SelectorOptimizer {
  
  /**
   * Optimise un sélecteur CSS
   */
  optimize(selector: string): OptimizedSelector {
    // Essayer d'abord les rôles ARIA
    const roleResult = this.tryRoleSelector(selector);
    if (roleResult && roleResult.confidence > 0.8) {
      return roleResult;
    }
    
    // Puis les attributs ARIA
    const ariaResult = this.tryAriaSelector(selector);
    if (ariaResult && ariaResult.confidence > 0.7) {
      return ariaResult;
    }
    
    // Puis les test IDs
    const testIdResult = this.tryTestIdSelector(selector);
    if (testIdResult && testIdResult.confidence > 0.9) {
      return testIdResult;
    }
    
    // Enfin, simplifier le CSS
    const cssResult = this.simplifyCssSelector(selector);
    return cssResult;
  }
  
  /**
   * Essaie de convertir en sélecteur par rôle
   */
  private tryRoleSelector(selector: string): OptimizedSelector | null {
    // Détecter les patterns comme button.submit, a.link, etc.
    const match = selector.match(/^(\w+)(?:\.([\w-]+))?(?:\[([^\]]+)\])?$/);
    if (!match) return null;
    
    const [, element, className, attribute] = match;
    if (!element) return null;
    
    // Trouver le rôle correspondant via méthode de tableau (remplace la boucle for)
    const roleEntry = Object.entries(ROLE_SELECTORS).find(([_, elements]) => 
      elements.includes(element) || elements.includes(`[${element}]`)
    );

    if (roleEntry) {
      const [role] = roleEntry;
      const roleOptions: RoleOptions = {};
      
      // Extraire le nom si présent (aria-label, title, etc.)
      if (attribute) {
        const nameMatch = attribute.match(/aria-label=["']([^"']+)["']/);
        if (nameMatch) {
          roleOptions.name = nameMatch[1];
        }
      }
      
      let optimized = `role=${role}`;
      if (roleOptions.name) {
        optimized += ` "${roleOptions.name}"`;
      }
      
      return {
        original: selector,
        optimized,
        strategy: 'role',
        confidence: roleOptions.name ? 0.95 : 0.85,
      };
    }
    
    return null;
  }
  
  /**
   * Essaie de convertir en sélecteur ARIA
   */
  private tryAriaSelector(selector: string): OptimizedSelector | null {
    // Chercher aria-label
    const ariaLabelMatch = selector.match(/\[aria-label=["']([^"']+)["']\]/);
    if (ariaLabelMatch) {
      return {
        original: selector,
        optimized: `aria-label="${ariaLabelMatch[1]}"`,
        strategy: 'aria',
        confidence: 0.9,
      };
    }
    
    // Chercher aria-labelledby
    const labelledByMatch = selector.match(/\[aria-labelledby=["']([^"']+)["']\]/);
    if (labelledByMatch) {
      return {
        original: selector,
        optimized: `aria-labelledby=${labelledByMatch[1]}`,
        strategy: 'aria',
        confidence: 0.8,
      };
    }
    
    return null;
  }
  
  /**
   * Essaie de convertir en sélecteur par test ID
   */
  private tryTestIdSelector(selector: string): OptimizedSelector | null {
    const testIdMatch = selector.match(/\[data-testid=["']([^"']+)["']\]/);
    if (testIdMatch) {
      return {
        original: selector,
        optimized: `data-testid="${testIdMatch[1]}"`,
        strategy: 'css',
        confidence: 0.95,
      };
    }
    
    const testMatch = selector.match(/\[data-test=["']([^"']+)["']\]/);
    if (testMatch) {
      return {
        original: selector,
        optimized: `data-test="${testMatch[1]}"`,
        strategy: 'css',
        confidence: 0.9,
      };
    }
    
    const cyMatch = selector.match(/\[data-cy=["']([^"']+)["']\]/);
    if (cyMatch) {
      return {
        original: selector,
        optimized: `data-cy="${cyMatch[1]}"`,
        strategy: 'css',
        confidence: 0.9,
      };
    }
    
    return null;
  }
  
  /**
   * Simplifie un sélecteur CSS
   */
  private simplifyCssSelector(selector: string): OptimizedSelector {
    let optimized = selector;
    
    // Supprimer les sélecteurs positionnels fragiles
    optimized = optimized
      .replace(/:nth-child\(\d+\)/g, '')
      .replace(/:nth-of-type\(\d+\)/g, '')
      .replace(/:first-child/g, '')
      .replace(/:last-child/g, '')
      .replace(/:only-child/g, '');
    
    // Remplacer les combinateurs enfants par des descendants
    optimized = optimized.replace(/ > /g, ' ');
    
    // Nettoyer les espaces multiples
    optimized = optimized.replace(/\s+/g, ' ').trim();
    
    // Supprimer les sélecteurs trop génériques au début
    optimized = optimized.replace(/^(html\s+)?body\s+/i, '');
    
    // Calculer la confiance basée sur la complexité
    const parts = optimized.split(/\s+/);
    const confidence = Math.max(0.5, 1 - (parts.length * 0.1));
    
    return {
      original: selector,
      optimized,
      strategy: 'css',
      confidence,
    };
  }
  
  /**
   * Optimise les paramètres d'une étape
   */
  optimizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const optimized = { ...params };
    
    // Optimiser le selector principal
    if (typeof optimized.selector === 'string') {
      const result = this.optimize(optimized.selector);
      optimized.selector = result.optimized;
    }
    
    // Optimiser les champs d'extraction
    if (Array.isArray(optimized.fields)) {
      optimized.fields = (optimized.fields as ExtractField[]).map(field => ({
        ...field,
        selector: typeof field.selector === 'string' 
          ? this.optimize(field.selector).optimized 
          : field.selector,
      }));
    }
    
    return optimized;
  }
}

/**
 * Convertit un sélecteur CSS en getByRole Playwright
 */
export function cssToGetByRole(selector: string, roleOptions?: RoleOptions): string {
  // Détecter l'élément
  const elementMatch = selector.match(/^(\w+)/);
  if (!elementMatch) return selector;
  
  const element = elementMatch[1];
  
  // Mapping élément → rôle
  const roleMap: Record<string, string> = {
    'a': 'link',
    'button': 'button',
    'input': 'textbox',
    'select': 'combobox',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'img': 'img',
    'table': 'table',
    'li': 'listitem',
    'ul': 'list',
    'ol': 'list',
    'nav': 'navigation',
    'header': 'banner',
    'footer': 'contentinfo',
    'main': 'main',
    'article': 'article',
    'aside': 'complementary',
    'section': 'region',
  };
  
  const role = roleMap[element] || 'generic';
  
  let result = `getByRole('${role}'`;
  
  if (roleOptions?.name) {
    result += `, { name: '${roleOptions.name}' }`;
  }
  
  result += ')';
  
  return result;
}
