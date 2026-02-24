/**
 * Script d'enregistrement UI Mode avec export automatique de session
 * 
 * Workflow fluide :
 * 1. Ouvre le mode UI Playwright
 * 2. L'utilisateur se connecte manuellement
 * 3. Extraction automatique des credentials
 * 4. Sauvegarde dans .env avec format [DOMAIN]_EMAIL/PASS
 * 5. Export de la session pour réutilisation
 * 
 * Usage: npm run auth
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join, parse } from 'path';
import { createInterface } from 'readline';

/**
 * Interface pour les credentials
 */
interface Credentials {
  domain: string;
  email: string;
  password: string;
  url: string;
}

/**
 * Crée une interface de lecture
 */
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Pose une question à l'utilisateur
 */
function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

/**
 * Extrait le nom de domaine depuis une URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const parts = hostname.split('.');
    
    // Prend les deux dernières parties (ex: linkedin.com)
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join('.');
      return domain.replace(/\./g, '_').toUpperCase();
    }
    
    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Sauvegarde les credentials dans .env
 */
function saveCredentialsToEnv(credentials: Credentials): void {
  const envPath = join(process.cwd(), '.env');
  const domainPrefix = credentials.domain;
  
  // Contenu à ajouter
  const envContent = [
    '',
    `# Credentials pour ${credentials.url}`,
    `# Ajouté le ${new Date().toISOString()}`,
    `${domainPrefix}_URL=${credentials.url}`,
    `${domainPrefix}_EMAIL=${credentials.email}`,
    `${domainPrefix}_PASS=${credentials.password}`,
    '',
  ].join('\n');
  
  // Ajouter au fichier .env
  if (existsSync(envPath)) {
    appendFileSync(envPath, envContent, 'utf-8');
  } else {
    writeFileSync(envPath, envContent, 'utf-8');
  }
  
  console.log(`✅ Credentials sauvegardés dans .env`);
  console.log(`   Variables créées:`);
  console.log(`   - ${domainPrefix}_EMAIL`);
  console.log(`   - ${domainPrefix}_PASS`);
  console.log(`   - ${domainPrefix}_URL`);
}

/**
 * Sauvegarde la session (cookies + storage)
 */
async function saveSession(context: any, domain: string): Promise<string> {
  const sessionsDir = join(process.cwd(), 'sessions');
  const { mkdirSync } = require('fs');
  
  // Créer le dossier sessions s'il n'existe pas
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true });
  }
  
  // Récupérer les cookies
  const cookies = await context.cookies();
  
  // Récupérer le storage state
  const storageState = await context.storageState();
  
  // Créer l'état de session
  const sessionState = {
    cookies,
    origins: storageState.origins,
    savedAt: new Date().toISOString(),
    domain: domain,
  };
  
  // Sauvegarder
  const sessionFile = join(sessionsDir, `${domain.toLowerCase()}_session.json`);
  writeFileSync(sessionFile, JSON.stringify(sessionState, null, 2), 'utf-8');
  
  console.log(`✅ Session sauvegardée: ${sessionFile}`);
  
  return sessionFile;
}

/**
 * Génère un fichier de configuration YAML
 */
function generateYamlConfig(credentials: Credentials, sessionFile: string): string {
  const scrappeDir = join(process.cwd(), 'scrappe');
  const { mkdirSync } = require('fs');
  
  if (!existsSync(scrappeDir)) {
    mkdirSync(scrappeDir, { recursive: true });
  }
  
  const domainName = credentials.domain.toLowerCase().replace(/_/g, '.');
  const yamlFile = join(scrappeDir, `${domainName}.auth.scrappe.yaml`);
  
  const yamlContent = `# Configuration générée automatiquement
# Site: ${credentials.url}
# Généré le: ${new Date().toISOString()}

name: ${domainName}-auth-scraper
url: ${credentials.url}
headless: false

# Configuration de session
session:
  enabled: true
  name: ${credentials.domain.toLowerCase()}_session
  file: ${sessionFile}
  validate: true

scrapers:
  - name: ${domainName}-scraper
    url: ${credentials.url}
    steps:
      # Charger la session
      - action: session-load
        params:
          sessionName: ${credentials.domain.toLowerCase()}_session
          sessionsDir: ./sessions
      
      # Navigation vers la page protégée
      - action: navigate
        params:
          url: ${credentials.url}
          timeout: 30000
      
      # Attendre le chargement
      - action: wait
        params:
          selector: body
          timeout: 10000
      
      # TODO: Ajoutez vos étapes d'extraction ici
      - action: extract
        params:
          selector: body
          fields:
            - name: content
              selector: body
`;
  
  writeFileSync(yamlFile, yamlContent, 'utf-8');
  console.log(`✅ Configuration YAML générée: ${yamlFile}`);
  
  return yamlFile;
}

/**
 * Script principal
 */
async function main() {
  console.log('🔐 MapLeads — Authentification UI Mode');
  console.log('=====================================\n');
  
  // Demander l'URL de connexion
  const loginUrl = await ask('📝 URL de connexion (ex: https://linkedin.com/login): ');
  
  if (!loginUrl) {
    console.log('❌ URL requise');
    process.exit(1);
  }
  
  // Demander le nom du domaine (optionnel, sera auto-détecté)
  const domainInput = await ask('📁 Nom du domaine (appuyez sur Entrée pour auto-détecter): ');
  
  const domain = domainInput 
    ? domainInput.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    : extractDomain(loginUrl);
  
  console.log(`\n🌐 Domaine: ${domain}`);
  console.log('');
  
  // Ouvrir le navigateur
  console.log('🚀 Ouverture du navigateur...');
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Navigation vers la page de connexion
  console.log(`📝 Navigation vers ${loginUrl}...`);
  await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('👉 CONNECTEZ-VOUS DANS LE NAVIGATEUR');
  console.log('');
  console.log('   1. Entrez votre email et mot de passe');
  console.log('   2. Complétez éventuels CAPTCHA');
  console.log('   3. Assurez-vous d\'être bien connecté');
  console.log('   4. Revenez ici et appuyez sur Entrée');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Attendre que l'utilisateur se connecte
  await ask('Appuyez sur Entrée une fois connecté...');
  
  console.log('');
  console.log('🔍 Vérification de la connexion...');
  
  // Attendre un peu que la page se stabilise
  await page.waitForTimeout(2000);
  
  // Récupérer l'URL actuelle (après redirection)
  const currentUrl = page.url();
  
  // Essayer de détecter les champs de formulaire
  console.log('📊 Extraction des informations...');
  
  // Tenter de trouver l'email dans le formulaire (si encore présent)
  const emailValue = await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"], input[type="text"]') as HTMLInputElement;
    return emailInput?.value || '';
  });
  
  // Demander confirmation des credentials
  let email = emailValue;
  let password = '';
  
  if (!email) {
    email = await ask('📧 Email utilisé: ');
  } else {
    console.log(`📧 Email détecté: ${email}`);
    const confirm = await ask('   Confirmer ? (O/n): ');
    if (confirm.toLowerCase() === 'n') {
      email = await ask('📧 Nouvel email: ');
    }
  }
  
  password = await ask('🔑 Mot de passe: ');
  
  // Créer l'objet credentials
  const credentials: Credentials = {
    domain,
    email,
    password,
    url: currentUrl,
  };
  
  console.log('');
  console.log('💾 Sauvegarde des données...');
  console.log('');
  
  // Sauvegarder les credentials dans .env
  saveCredentialsToEnv(credentials);
  
  // Sauvegarder la session
  const sessionFile = await saveSession(context, domain);
  
  // Générer la configuration YAML
  const yamlFile = generateYamlConfig(credentials, sessionFile);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ CONFIGURATION TERMINÉE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📁 Fichiers créés:');
  console.log(`   • .env (credentials)`);
  console.log(`   • ${sessionFile} (session)`);
  console.log(`   • ${yamlFile} (configuration)`);
  console.log('');
  console.log('🚀 Prochaines étapes:');
  console.log('');
  console.log('   1. Modifiez le fichier YAML pour ajouter vos étapes:');
  console.log(`      ${yamlFile}`);
  console.log('');
  console.log('   2. Lancez le scraper:');
  console.log(`      npm run scrape -- --file ${domain.toLowerCase().replace(/_/g, '.')}.auth.scrappe.yaml`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Fermer le navigateur
  await browser.close();
  rl.close();
}

// Gérer les erreurs
main().catch(error => {
  console.error('');
  console.error('❌ Erreur:', error instanceof Error ? error.message : String(error));
  rl.close();
  process.exit(1);
});
