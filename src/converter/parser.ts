/**
 * Parser TypeScript
 * Analyse le code généré par Playwright UI Mode
 */

import * as ts from 'typescript';

/**
 * Parser pour le code Playwright généré
 */
export class PlaywrightCodeParser {
  private sourceFile: ts.SourceFile;

  constructor(code: string) {
    this.sourceFile = ts.createSourceFile(
      'recording.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  }

  /**
   * Extrait la fonction de test principale
   */
  extractTestFunction(): ts.FunctionDeclaration | ts.ArrowFunction | null {
    let testFn: ts.FunctionDeclaration | ts.ArrowFunction | null = null;

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === 'test') {
        testFn = node;
        return;
      }
      
      // Gérer aussi test('name', async ({ page }) => { ... })
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isIdentifier(expr) && expr.text === 'test' && node.arguments.length >= 2) {
          const secondArg = node.arguments[1];
          if (ts.isArrowFunction(secondArg) || ts.isFunctionExpression(secondArg)) {
            testFn = secondArg;
            return;
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(this.sourceFile, visit);
    return testFn;
  }

  /**
   * Extrait les statements du corps de la fonction
   */
  extractStatements(fn: ts.FunctionDeclaration | ts.ArrowFunction): ts.Statement[] {
    const body = fn.body;
    if (!body) return [];
    
    if (ts.isBlock(body)) {
      return Array.from(body.statements);
    }
    
    return [body];
  }

  /**
   * Vérifie si un node est un appel à page.goto()
   */
  isPageGotoCall(node: ts.Node): boolean {
    // await page.goto()
    if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression)) {
      const call = node.expression.expression;
      if (ts.isCallExpression(call)) {
        const expr = call.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          return expr.name.text === 'goto';
        }
      }
    }
    
    // page.goto() sans await
    if (ts.isExpressionStatement(node)) {
      const call = node.expression;
      if (ts.isCallExpression(call)) {
        const expr = call.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          return expr.name.text === 'goto';
        }
      }
    }
    
    return false;
  }

  /**
   * Extrait l'URL depuis page.goto()
   */
  extractUrlFromGoto(node: ts.Node): string | null {
    // await page.goto()
    if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression)) {
      const call = node.expression.expression;
      if (ts.isCallExpression(call) && call.arguments.length > 0) {
        const firstArg = call.arguments[0];
        if (ts.isStringLiteral(firstArg)) {
          return firstArg.text;
        }
      }
    }
    
    // page.goto() sans await
    if (ts.isExpressionStatement(node) && !ts.isAwaitExpression(node.expression)) {
      const call = node.expression;
      if (ts.isCallExpression(call) && call.arguments.length > 0) {
        const firstArg = call.arguments[0];
        if (ts.isStringLiteral(firstArg)) {
          return firstArg.text;
        }
      }
    }
    
    return null;
  }

  /**
   * Extrait le timeout depuis les options
   */
  extractTimeoutFromCall(call: ts.CallExpression): number | null {
    if (call.arguments.length < 2) return null;
    
    const optionsArg = call.arguments[1];
    if (!ts.isObjectLiteralExpression(optionsArg)) return null;
    
    for (const prop of optionsArg.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'timeout') {
        if (ts.isNumericLiteral(prop.initializer)) {
          return parseInt(prop.initializer.text, 10);
        }
      }
    }
    
    return null;
  }

  /**
   * Vérifie si un node est un appel à locator() ou getBy*()
   */
  isLocatorCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'locator' || 
               expr.name.text.startsWith('getBy');
      }
    }
    return false;
  }

  /**
   * Extrait le sélecteur depuis locator('selector') ou getByRole('button', { name: 'Submit' })
   */
  extractSelectorFromLocator(node: ts.Node): string | null {
    if (!ts.isCallExpression(node)) return null;
    
    const expr = node.expression;
    if (!ts.isPropertyAccessExpression(expr)) return null;
    
    const methodName = expr.name.text;
    
    // locator('.selector')
    if (methodName === 'locator' && node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (ts.isStringLiteral(firstArg)) {
        return firstArg.text;
      }
    }
    
    // getByRole('button', { name: 'Submit' })
    if (methodName.startsWith('getBy')) {
      const args: string[] = [];
      
      // Premier argument : rôle/type
      if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
        args.push(node.arguments[0].text);
      }
      
      // Deuxième argument : options { name: '...' }
      if (node.arguments.length > 1 && ts.isObjectLiteralExpression(node.arguments[1])) {
        for (const prop of node.arguments[1].properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'name') {
            if (ts.isStringLiteral(prop.initializer)) {
              args.push(prop.initializer.text);
            }
          }
        }
      }
      
      if (args.length > 0) {
        return `[role=${args.join(' ')}]`;
      }
    }
    
    return null;
  }

  /**
   * Vérifie si un node est un appel à waitFor()
   */
  isWaitForCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'waitFor';
      }
    }
    return false;
  }

  /**
   * Vérifie si un node est un appel à click()
   */
  isClickCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'click';
      }
    }
    return false;
  }

  /**
   * Vérifie si un node est un appel à fill()
   */
  isFillCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'fill';
      }
    }
    return false;
  }

  /**
   * Extrait la valeur depuis fill('value')
   */
  extractValueFromFill(node: ts.CallExpression): string | null {
    if (node.arguments.length === 0) return null;
    
    const firstArg = node.arguments[0];
    if (ts.isStringLiteral(firstArg)) {
      return firstArg.text;
    }
    
    return null;
  }

  /**
   * Vérifie si un node est un appel à textContent()
   */
  isTextContentCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'textContent';
      }
    }
    return false;
  }

  /**
   * Vérifie si un node est un appel à getAttribute()
   */
  isGetAttributeCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'getAttribute';
      }
    }
    return false;
  }

  /**
   * Extrait le nom de l'attribut depuis getAttribute('name')
   */
  extractAttributeName(node: ts.CallExpression): string | null {
    if (node.arguments.length === 0) return null;
    
    const firstArg = node.arguments[0];
    if (ts.isStringLiteral(firstArg)) {
      return firstArg.text;
    }
    
    return null;
  }

  /**
   * Vérifie si un node est un appel à isVisible()
   */
  isIsVisibleCall(node: ts.Node): boolean {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        return expr.name.text === 'isVisible';
      }
    }
    return false;
  }

  /**
   * Vérifie si un node est une boucle for
   */
  isForLoop(node: ts.Node): node is ts.ForStatement {
    return ts.isForStatement(node);
  }

  /**
   * Vérifie si un node est un statement if
   */
  isIfStatement(node: ts.Node): node is ts.IfStatement {
    return ts.isIfStatement(node);
  }

  /**
   * Extrait le sélecteur depuis une chaîne de locator en chaîne
   */
  extractSelectorChain(node: ts.Node): string | null {
    let current: ts.Node | undefined = node;
    
    while (current) {
      // Chercher locator('selector')
      if (ts.isCallExpression(current)) {
        const selector = this.extractSelectorFromLocator(current);
        if (selector) {
          return selector;
        }
      }
      
      // Remonter la chaîne
      if (ts.isPropertyAccessExpression(current)) {
        current = current.expression;
      } else if (ts.isCallExpression(current)) {
        current = current.expression;
      } else {
        break;
      }
    }
    
    return null;
  }

  /**
   * Analyse un statement et retourne le type d'action
   */
  analyzeStatement(node: ts.Statement): { type: string; data: Record<string, unknown> } {
    // page.goto()
    if (this.isPageGotoCall(node)) {
      const url = this.extractUrlFromGoto(node);
      const timeout = this.extractTimeoutFromCall((node as ts.ExpressionStatement).expression as ts.CallExpression);
      return {
        type: 'navigate',
        data: { url, timeout },
      };
    }

    // locator().waitFor()
    if (ts.isExpressionStatement(node)) {
      const call = node.expression;
      if (ts.isCallExpression(call)) {
        const expr = call.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          if (expr.name.text === 'waitFor') {
            const selector = this.extractSelectorChain(expr.expression);
            const timeout = this.extractTimeoutFromCall(call);
            return {
              type: 'wait',
              data: { selector, timeout },
            };
          }
          
          if (expr.name.text === 'click') {
            const selector = this.extractSelectorChain(expr.expression);
            const timeout = this.extractTimeoutFromCall(call);
            return {
              type: 'click',
              data: { selector, timeout },
            };
          }
          
          if (expr.name.text === 'fill' && call.arguments.length > 0) {
            const selector = this.extractSelectorChain(expr.expression);
            const value = this.extractValueFromFill(call);
            return {
              type: 'fill',
              data: { selector, value },
            };
          }
        }
      }
    }

    // Variable assignment avec locator
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer && ts.isCallExpression(decl.initializer)) {
          const expr = decl.initializer.expression;
          if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'locator') {
            const selector = this.extractSelectorFromLocator(decl.initializer);
            return {
              type: 'locator_defined',
              data: { selector, variableName: decl.name.getText(this.sourceFile) },
            };
          }
        }
      }
    }

    return {
      type: 'unknown',
      data: {},
    };
  }
}
