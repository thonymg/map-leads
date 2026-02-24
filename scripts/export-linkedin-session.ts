/**
 * Script d'export de session LinkedIn
 * 
 * Usage:
 * 1. Lancez: node --experimental-strip-types scripts/export-linkedin-session.ts
 * 2. Un navigateur s'ouvre
 * 3. Connectez-vous à LinkedIn
 * 4. Appuyez sur Entrée dans le terminal
 * 5. La session est sauvegardée
 */

import { chromium } from 'playwright';
import { SessionManager } from '../src/session';

async function exportLinkedInSession() {
  console.log('🚀 Export de session LinkedIn');
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   1. Un navigateur va s\'ouvrir');
  console.log('   2. Connectez-vous à LinkedIn');
  console.log('   3. Revenez ici et appuyez sur Entrée');
  console.log('');
  console.log('Appuyez sur Entrée pour continuer...');

  // Attendre que l'utilisateur soit prêt
  await new Promise<void>(resolve => {
    process.stdin.once('data', () => resolve());
  });

  console.log('🌐 Ouverture du navigateur...');

  const browser = await chromium.launch({
    headless: false,  // Important: navigateur visible pour la connexion
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Ouvrir LinkedIn
  console.log('📝 Navigation vers LinkedIn...');
  await page.goto('https://www.linkedin.com/login', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  console.log('');
  console.log('👉 Connectez-vous à LinkedIn dans le navigateur...');
  console.log('👉 Une fois connecté, appuyez sur Entrée...');
  console.log('');

  // Attendre que l'utilisateur se connecte
  await new Promise<void>(resolve => {
    process.stdin.once('data', () => resolve());
  });

  // Vérifier la connexion
  console.log('🔍 Vérification de la connexion...');
  const isLoggedIn = await page.$('div.global-nav');

  if (!isLoggedIn) {
    console.log('❌ Vous n\'êtes pas connecté à LinkedIn');
    console.log('   Veuillez réessayer.');
    await browser.close();
    return;
  }

  console.log('✅ Connexion détectée!');

  // Sauvegarder la session
  console.log('💾 Sauvegarde de la session...');
  const sessionManager = new SessionManager('./sessions');
  const sessionName = 'linkedin-session';

  await sessionManager.saveSession(context, sessionName);

  console.log('');
  console.log('✅ Session exportée avec succès!');
  console.log('');
  console.log('📁 Fichier: sessions/linkedin-session.json');
  console.log('');
  console.log('🎯 Prochaine étape:');
  console.log('   npm run scrape -- --file linkedin.session.scrappe.yaml');
  console.log('');

  await browser.close();
}

// Gérer les erreurs
exportLinkedInSession().catch(error => {
  console.error('❌ Erreur:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
