#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE DÉPLOIEMENT FIREBASE - Production
 * =============================================================================
 * 
 * Script automatisé pour déployer l'application en production
 * 
 * Étapes:
 * 1. Vérifier les prérequis (Firebase CLI, Node.js, etc.)
 * 2. Installer les dépendances
 * 3. Linter le code
 * 4. Build des Cloud Functions
 * 5. Build du dashboard React
 * 6. Déployer Firestore Rules
 * 7. Déployer Storage Rules
 * 8. Déployer Cloud Functions
 * 9. Déployer le Hosting
 * 10. Créer les index Firestore
 * 11. Initialiser les données de base
 * 
 * Usage:
 *   npm run deploy
 *   npm run deploy -- --only functions
 *   npm run deploy -- --only hosting
 * =============================================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execute(command, cwd = process.cwd()) {
  log(`\n> ${command}`, 'cyan');
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ Erreur lors de l'exécution: ${command}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n📋 Vérification des prérequis...', 'bright');

  // Vérifier Node.js
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
  } catch {
    log('❌ Node.js non trouvé. Veuillez installer Node.js >= 18', 'red');
    process.exit(1);
  }

  // Vérifier Firebase CLI
  try {
    const firebaseVersion = execSync('firebase --version').toString().trim();
    log(`✅ Firebase CLI: ${firebaseVersion}`, 'green');
  } catch {
    log('❌ Firebase CLI non trouvé. Installez avec: npm install -g firebase-tools', 'red');
    process.exit(1);
  }

  // Vérifier l'authentification Firebase
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    log('✅ Firebase: Authentifié', 'green');
  } catch {
    log('❌ Vous devez vous connecter à Firebase. Exécutez: firebase login', 'red');
    process.exit(1);
  }
}

function installDependencies() {
  log('\n📦 Installation des dépendances...', 'bright');

  // Functions
  log('\n→ Cloud Functions', 'yellow');
  if (!execute('npm install', path.join(__dirname, 'functions'))) {
    log('❌ Échec de l\'installation des dépendances Functions', 'red');
    process.exit(1);
  }

  // Dashboard
  log('\n→ Dashboard', 'yellow');
  if (!execute('npm install', path.join(__dirname, '..', 'dashboard'))) {
    log('❌ Échec de l\'installation des dépendances Dashboard', 'red');
    process.exit(1);
  }

  log('\n✅ Toutes les dépendances sont installées', 'green');
}

function lintCode() {
  log('\n🔍 Linting du code...', 'bright');

  log('\n→ Cloud Functions', 'yellow');
  if (!execute('npm run lint', path.join(__dirname, 'functions'))) {
    log('⚠️  Avertissement: Problèmes de lint détectés dans Functions', 'yellow');
    // Ne pas arrêter le déploiement pour des problèmes de lint
  }

  log('\n✅ Linting terminé', 'green');
}

function buildFunctions() {
  log('\n🔨 Build des Cloud Functions...', 'bright');

  if (!execute('npm run build', path.join(__dirname, 'functions'))) {
    log('❌ Échec du build des Functions', 'red');
    process.exit(1);
  }

  log('\n✅ Cloud Functions buildées avec succès', 'green');
}

function buildDashboard() {
  log('\n🔨 Build du Dashboard React...', 'bright');

  const dashboardPath = path.join(__dirname, '..', 'dashboard');
  
  if (!execute('npm run build', dashboardPath)) {
    log('❌ Échec du build du Dashboard', 'red');
    process.exit(1);
  }

  // Vérifier que le dossier dist existe
  const distPath = path.join(dashboardPath, 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Le dossier dist n\'a pas été créé', 'red');
    process.exit(1);
  }

  log('\n✅ Dashboard buildé avec succès', 'green');
}

function deploy(target = 'all') {
  log('\n🚀 Déploiement sur Firebase...', 'bright');

  const deployCommands = {
    all: 'firebase deploy',
    functions: 'firebase deploy --only functions',
    hosting: 'firebase deploy --only hosting',
    rules: 'firebase deploy --only firestore:rules,storage:rules',
    indexes: 'firebase deploy --only firestore:indexes',
  };

  const command = deployCommands[target] || deployCommands.all;

  if (!execute(command, __dirname)) {
    log(`❌ Échec du déploiement: ${target}`, 'red');
    process.exit(1);
  }

  log('\n✅ Déploiement réussi!', 'green');
}

function main() {
  const args = process.argv.slice(2);
  const onlyFlag = args.find(arg => arg.startsWith('--only='));
  const target = onlyFlag ? onlyFlag.split('=')[1] : 'all';

  log('\n═══════════════════════════════════════════════════════════', 'bright');
  log('  🔥 DÉPLOIEMENT FIREBASE - GESTION RÉCLAMATIONS TT', 'bright');
  log('═══════════════════════════════════════════════════════════\n', 'bright');

  log(`📌 Cible de déploiement: ${target}`, 'cyan');

  checkPrerequisites();

  if (target === 'all' || target === 'functions') {
    installDependencies();
    lintCode();
    buildFunctions();
  }

  if (target === 'all' || target === 'hosting') {
    buildDashboard();
  }

  deploy(target);

  log('\n═══════════════════════════════════════════════════════════', 'bright');
  log('  ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS', 'green');
  log('═══════════════════════════════════════════════════════════\n', 'bright');

  log('📝 Prochaines étapes:', 'cyan');
  log('   1. Vérifiez la console Firebase pour confirmer le déploiement');
  log('   2. Testez l\'application sur l\'URL de hosting');
  log('   3. Vérifiez les logs des Cloud Functions');
  log('   4. Configurez les alertes de monitoring\n');
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  log(`\n❌ Erreur non capturée: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log(`\n❌ Promise rejetée: ${error}`, 'red');
  console.error(error);
  process.exit(1);
});

main();
