/**
 * Action Mapper
 * Convertit les statements TypeScript en actions YAML
 */

import * as ts from 'typescript';
import type { ConvertedStep, ConvertedConfig } from './types.ts';
import { PlaywrightCodeParser } from './parser.ts';
import { SelectorOptimizer } from './optimizer.ts';

/**
 * Mappeur de code Playwright vers actions YAML
 */
export class ActionMapper {
  private parser: PlaywrightCodeParser;
  private optimizer: SelectorOptimizer;
  private variableMap: Map<string, string> = new Map();

  constructor(parser: PlaywrightCodeParser) {
    this.parser = parser;
    this.optimizer = new SelectorOptimizer();
  }

  /**
   * Mappe tous les statements vers des étapes YAML via reduce
   */
  mapStatements(statements: ts.Statement[]): ConvertedStep[] {
    const steps = statements.reduce<ConvertedStep[]>((acc, stmt) => {
      // Navigation: page.goto()
      if (this.parser.isPageGotoCall(stmt)) {
        const url = this.parser.extractUrlFromGoto(stmt);
        if (url) {
          acc.push({
            action: 'navigate',
            params: { url },
          });
        }
        return acc;
      }

      // Clic: page.getByRole().click() ou locator().click()
      if (this.isClickStatement(stmt)) {
        const selector = this.extractSelectorFromClickStatement(stmt);
        if (selector) {
          acc.push({
            action: 'click',
            params: { selector },
            options: { optional: true },
          });
        }
        return acc;
      }

      // Attente implicite avec waitFor
      if (this.isWaitStatement(stmt)) {
        const step = this.mapWait(stmt);
        if (step) acc.push(step);
        return acc;
      }

      // Extraction: boucle for
      if (this.parser.isForLoop(stmt)) {
        const step = this.mapExtractOrPaginate(stmt);
        if (step) acc.push(step);
        return acc;
      }

      // Condition: if
      if (this.parser.isIfStatement(stmt)) {
        const step = this.mapConditional(stmt);
        if (step) acc.push(step);
        return acc;
      }

      return acc;
    }, []);

    // Si aucune étape trouvée, essayer une approche plus simple
    if (steps.length === 0) {
      console.log('  → Utilisation du mode simple...');
      return this.mapStatementsSimple(statements);
    }

    console.log(`✅ ${steps.length} actions mappées`);
    return this.optimizeSteps(steps);
  }

  /**
   * Approche simplifiée pour mapper les statements via reduce
   */
  private mapStatementsSimple(statements: ts.Statement[]): ConvertedStep[] {
    const steps = statements.reduce<ConvertedStep[]>((acc, stmt) => {
      // page.goto()
      if (this.parser.isPageGotoCall(stmt)) {
        const url = this.parser.extractUrlFromGoto(stmt);
        if (url) {
          acc.push({
            action: 'navigate',
            params: { url },
          });
        }
        return acc;
      }

      // page.getBy*().click()
      if (this.isClickStatement(stmt)) {
        const selector = this.extractSelectorFromClickStatement(stmt);
        if (selector) {
          acc.push({
            action: 'click',
            params: { selector },
            options: { optional: true },
          });
        }
        return acc;
      }
      
      return acc;
    }, []);

    return this.optimizeSteps(steps);
  }

  /**
   * Extrait le sélecteur depuis un statement click
   */
  private extractSelectorFromClickStatement(stmt: ts.Statement): string | null {
    if (!ts.isExpressionStatement(stmt)) return null;
    if (!ts.isAwaitExpression(stmt.expression)) return null;
    
    const call = stmt.expression.expression;
    if (!ts.isCallExpression(call)) return null;
    
    const expr = call.expression;
    if (!ts.isPropertyAccessExpression(expr)) return null;
    if (expr.name.text !== 'click') return null;
    
    // Remonter pour trouver le getByRole
    let current: ts.Node = expr.expression;
    
    while (current) {
      if (ts.isCallExpression(current)) {
        const selector = this.parser.extractSelectorFromLocator(current);
        if (selector) return selector;
      }
      
      if (ts.isPropertyAccessExpression(current)) {
        current = current.expression;
      } else {
        break;
      }
    }
    
    return null;
  }

  /**
   * Mappe un statement individuel vers une étape YAML
   */
  private mapStatement(stmt: ts.Statement, pendingLocator?: string | null): ConvertedStep | null {
    // Navigation: page.goto()
    if (this.parser.isPageGotoCall(stmt)) {
      return this.mapNavigate(stmt);
    }

    // Attente: locator().waitFor() ou page.waitForSelector()
    if (this.isWaitStatement(stmt)) {
      return this.mapWait(stmt);
    }

    // Clic: locator().click()
    if (this.isClickStatement(stmt)) {
      return this.mapClick(stmt, pendingLocator);
    }

    // Remplissage: locator().fill()
    if (this.isFillStatement(stmt)) {
      return this.mapFill(stmt, pendingLocator);
    }

    // Extraction: boucle for avec textContent()
    if (this.parser.isForLoop(stmt)) {
      return this.mapExtractOrPaginate(stmt);
    }

    // Condition: if avec isVisible()
    if (this.parser.isIfStatement(stmt)) {
      return this.mapConditional(stmt);
    }

    return null;
  }

  /**
   * Mappe page.goto() vers navigate
   */
  private mapNavigate(stmt: ts.Statement): ConvertedStep {
    const call = (stmt as ts.ExpressionStatement).expression as ts.CallExpression;
    const url = this.parser.extractUrlFromGoto(stmt as ts.ExpressionStatement);
    const timeout = this.parser.extractTimeoutFromCall(call);

    return {
      action: 'navigate',
      params: {
        url: url || '',
        ...(timeout && { timeout }),
      },
    };
  }

  /**
   * Mappe locator().waitFor() vers wait
   */
  private mapWait(stmt: ts.Statement): ConvertedStep {
    const call = (stmt as ts.ExpressionStatement).expression as ts.CallExpression;
    const selector = this.parser.extractSelectorChain(call.expression);
    const timeout = this.parser.extractTimeoutFromCall(call);

    return {
      action: 'wait',
      params: {
        selector: selector || '',
        ...(timeout && { timeout }),
      },
    };
  }

  /**
   * Mappe locator().click() vers click
   */
  private mapClick(stmt: ts.Statement, pendingLocator?: string | null): ConvertedStep {
    const call = (stmt as ts.ExpressionStatement).expression as ts.CallExpression;
    let selector = this.parser.extractSelectorChain(call.expression);
    const timeout = this.parser.extractTimeoutFromCall(call);

    // Combiner avec le locator en attente
    if (pendingLocator && selector) {
      selector = `${pendingLocator} ${selector}`;
    }

    return {
      action: 'click',
      params: {
        selector: selector || '',
        ...(timeout && { timeout }),
      },
      options: {
        optional: true, // Les clics sont optionnels par défaut
      },
    };
  }

  /**
   * Mappe locator().fill() vers fill
   */
  private mapFill(stmt: ts.Statement, pendingLocator?: string | null): ConvertedStep {
    const call = (stmt as ts.ExpressionStatement).expression as ts.CallExpression;
    let selector = this.parser.extractSelectorChain(call.expression);
    const value = this.parser.extractValueFromFill(call);
    const timeout = this.parser.extractTimeoutFromCall(call);

    // Combiner avec le locator en attente
    if (pendingLocator && selector) {
      selector = `${pendingLocator} ${selector}`;
    }

    return {
      action: 'fill',
      params: {
        selector: selector || '',
        value: value || '',
        ...(timeout && { timeout }),
      },
    };
  }

  /**
   * Mappe une boucle for vers extract ou paginate
   */
  private mapExtractOrPaginate(stmt: ts.ForStatement): ConvertedStep | null {
    // Analyser le corps de la boucle
    const fields: { name: string; selector: string; attribute?: string }[] = [];
    let containerSelector: string | null = null;
    let hasPagination = false;

    if (ts.isBlock(stmt.statement)) {
      for (const child of stmt.statement.statements) {
        // Chercher les extractions: const x = await item.locator('sel').textContent()
        if (ts.isVariableStatement(child)) {
          for (const decl of child.declarationList.declarations) {
            if (decl.initializer && ts.isAwaitExpression(decl.initializer)) {
              const inner = decl.initializer.expression;
              if (ts.isCallExpression(inner)) {
                // textContent() ou getAttribute()
                if (this.parser.isTextContentCall(inner) || this.parser.isGetAttributeCall(inner)) {
                  const selector = this.parser.extractSelectorChain(inner.expression);
                  const name = decl.name.getText(this.parser['sourceFile']).replace(/const\s+/, '');
                  const attribute = this.parser.isGetAttributeCall(inner) 
                    ? this.parser.extractAttributeName(inner) || undefined 
                    : undefined;
                  
                  if (selector) {
                    fields.push({ name, selector, attribute });
                  }
                }
              }
            }
          }
        }

        // Chercher la pagination: if (await nextBtn.isVisible()) { nextBtn.click() }
        if (ts.isIfStatement(child)) {
          hasPagination = true;
        }
      }
    }

    // Extraire le sélecteur du conteneur depuis la condition de la boucle
    containerSelector = this.extractContainerSelector(stmt);

    if (fields.length > 0 && containerSelector) {
      if (hasPagination) {
        // C'est une pagination
        return {
          action: 'paginate',
          params: {
            selector: 'li.next a', // Sélecteur par défaut pour "suivant"
            max_pages: 10,
            itemSelector: containerSelector,
            fields,
          },
        };
      } else {
        // C'est une extraction simple
        return {
          action: 'extract',
          params: {
            selector: containerSelector,
            fields,
          },
        };
      }
    }

    return null;
  }

  /**
   * Extrait le sélecteur du conteneur depuis une boucle for
   */
  private extractContainerSelector(stmt: ts.ForStatement): string | null {
    // Pattern: for (let i = 0; i < items.count(); i++) { items.nth(i) }
    // On cherche la variable utilisée dans la boucle
    
    const init = stmt.initializer;
    if (!init || !ts.isVariableDeclarationList(init)) return null;

    // Analyser le corps pour trouver le locator principal
    if (ts.isBlock(stmt.statement)) {
      for (const child of stmt.statement.statements) {
        if (ts.isVariableStatement(child)) {
          for (const decl of child.declarationList.declarations) {
            if (decl.initializer && ts.isCallExpression(decl.initializer)) {
              const expr = decl.initializer.expression;
              if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'nth') {
                // Trouver le locator de base
                const baseExpr = expr.expression;
                if (ts.isIdentifier(baseExpr)) {
                  // C'est une variable, retourner un sélecteur générique
                  return '.item';
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Mappe une condition if vers une étape optionnelle
   */
  private mapConditional(stmt: ts.IfStatement): ConvertedStep | null {
    // if (await locator.isVisible()) { locator.click() }
    const condition = stmt.expression;
    
    if (ts.isAwaitExpression(condition)) {
      const call = condition.expression;
      if (ts.isCallExpression(call) && this.parser.isIsVisibleCall(call)) {
        const selector = this.parser.extractSelectorChain(call.expression);
        
        // Vérifier le corps du if
        if (ts.isBlock(stmt.thenStatement)) {
          for (const child of stmt.thenStatement.statements) {
            if (this.isClickStatement(child)) {
              return {
                action: 'click',
                params: {
                  selector: selector || '',
                },
                options: {
                  optional: true,
                  timeout: 2000,
                },
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Extrait un locator depuis une déclaration de variable via find
   */
  private extractVariableLocator(stmt: ts.Statement): string | null {
    if (ts.isVariableStatement(stmt)) {
      const decl = stmt.declarationList.declarations.find(decl => 
        decl.initializer && 
        ts.isCallExpression(decl.initializer) && 
        ts.isPropertyAccessExpression(decl.initializer.expression) && 
        decl.initializer.expression.name.text === 'locator'
      );

      if (decl && decl.initializer && ts.isCallExpression(decl.initializer)) {
        return this.parser.extractSelectorFromLocator(decl.initializer);
      }
    }
    return null;
  }

  /**
   * Vérifie si un statement est une attente
   */
  private isWaitStatement(stmt: ts.Statement): boolean {
    if (ts.isExpressionStatement(stmt)) {
      const call = stmt.expression;
      if (ts.isCallExpression(call)) {
        const expr = call.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          return expr.name.text === 'waitFor';
        }
      }
    }
    return false;
  }

  /**
   * Vérifie si un statement est un clic
   */
  private isClickStatement(stmt: ts.Statement): boolean {
    if (!ts.isExpressionStatement(stmt)) return false;
    if (!ts.isAwaitExpression(stmt.expression)) return false;
    
    const call = stmt.expression.expression;
    if (!ts.isCallExpression(call)) return false;
    
    const expr = call.expression;
    if (!ts.isPropertyAccessExpression(expr)) return false;
    
    return expr.name.text === 'click';
  }

  /**
   * Vérifie si un statement est un fill
   */
  private isFillStatement(stmt: ts.Statement): boolean {
    if (ts.isExpressionStatement(stmt)) {
      const call = stmt.expression;
      if (ts.isCallExpression(call)) {
        const expr = call.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          return expr.name.text === 'fill';
        }
      }
    }
    return false;
  }

  /**
   * Applique l'optimisation aux étapes
   */
  optimizeSteps(steps: ConvertedStep[]): ConvertedStep[] {
    if (!steps || steps.length === 0) {
      return [];
    }
    
    return steps.map(step => {
      if (!step || !step.params) {
        return step;
      }
      const optimizer = new SelectorOptimizer();
      return {
        ...step,
        params: optimizer.optimizeParams(step.params),
      };
    });
  }
}

/**
 * Génère un nom de scraper depuis le nom de fichier
 */
export function generateScraperName(filename: string): string {
  return filename
    .replace('.ts', '')
    .replace('.js', '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Extrait l'URL de base depuis les étapes
 */
export function extractBaseUrl(steps: ConvertedStep[]): string {
  const navigateStep = steps.find(s => s.action === 'navigate');
  if (navigateStep && typeof navigateStep.params.url === 'string') {
    try {
      const url = new URL(navigateStep.params.url);
      return `${url.protocol}//${url.host}/`;
    } catch {
      return navigateStep.params.url;
    }
  }
  return 'https://example.com';
}
