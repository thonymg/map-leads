/**
 * YAML Generator
 * Génère le fichier de configuration YAML
 */

import { writeFileSync } from 'fs';
import { stringify } from 'yaml';
import type { ConvertedConfig, ConvertedStep } from './types.ts';

/**
 * Générateur de configuration YAML
 */
export class YamlGenerator {
  
  /**
   * Génère une configuration YAML complète
   */
  generate(config: ConvertedConfig): string {
    const yamlConfig = this.buildYamlObject(config);
    
    // Créer le commentaire d'en-tête manuellement
    const header = [
      '# Scraper Configuration — Généré automatiquement par MapLeads',
      `# Date: ${new Date().toISOString()}`,
      '#',
      '# Ce fichier a été généré depuis un enregistrement Playwright UI Mode.',
      '# Vous pouvez le modifier manuellement pour affiner le scraping.',
      '',
    ].join('\n');
    
    return header + stringify(yamlConfig, {
      indent: 2,
      lineWidth: -1, // Pas de wrapping
      defaultStringType: 'PLAIN', // Pas de guillemets par défaut
    });
  }

  /**
   * Construit l'objet YAML
   */
  private buildYamlObject(config: ConvertedConfig): Record<string, unknown> {
    return {
      // Configuration globale
      name: config.name,
      url: config.url,
      headless: config.headless ?? true,
      viewport: config.viewport ?? { width: 1920, height: 1080 },
      
      // Liste des scrapers (requis par le validateur)
      scrapers: [
        {
          name: config.name,
          url: config.url,
          steps: config.steps.map(step => this.buildStepObject(step)),
        },
      ],
      
      // Métadonnées
      metadata: config.metadata,
    };
  }

  /**
   * Construit l'objet pour une étape
   */
  private buildStepObject(step: ConvertedStep): Record<string, unknown> {
    const stepObj: Record<string, unknown> = {
      action: step.action,
      params: { ...step.params },
    };

    // Ajouter les options si présentes
    if (step.options) {
      const options: Record<string, unknown> = {};
      
      if (step.options.optional !== undefined) {
        options.optional = step.options.optional;
      }
      
      if (step.options.timeout !== undefined) {
        options.timeout = step.options.timeout;
      }
      
      if (Object.keys(options).length > 0) {
        stepObj.options = options;
      }
    }

    return stepObj;
  }

  /**
   * Sauvegarde la configuration dans un fichier
   */
  saveToFile(config: ConvertedConfig, outputPath: string): void {
    const yaml = this.generate(config);
    writeFileSync(outputPath, yaml, 'utf-8');
  }
}

/**
 * Formate les étapes pour une meilleure lisibilité
 */
export function formatSteps(steps: ConvertedStep[]): string {
  const lines: string[] = [];
  
  for (const step of steps) {
    lines.push(`  - action: ${step.action}`);
    lines.push(`    params:`);
    
    for (const [key, value] of Object.entries(step.params)) {
      if (Array.isArray(value)) {
        lines.push(`      ${key}:`);
        for (const item of value) {
          if (typeof item === 'object') {
            lines.push(`        - name: ${item.name}`);
            lines.push(`          selector: ${item.selector}`);
            if (item.attribute) {
              lines.push(`          attribute: ${item.attribute}`);
            }
          } else {
            lines.push(`        - ${item}`);
          }
        }
      } else {
        lines.push(`      ${key}: ${JSON.stringify(value)}`);
      }
    }
    
    if (step.options) {
      lines.push(`    options:`);
      for (const [key, value] of Object.entries(step.options)) {
        lines.push(`      ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
  
  return lines.join('\n');
}
