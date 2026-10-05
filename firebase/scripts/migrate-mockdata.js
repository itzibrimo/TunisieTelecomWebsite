#!/usr/bin/env node

/**
 * =============================================================================
 * SCRIPT DE MIGRATION - Mock Data vers Firebase
 * =============================================================================
 * 
 * Migre les données mock existantes vers Firebase Firestore
 * 
 * Ce script:
 * 1. Crée des utilisateurs de test dans Firebase Auth
 * 2. Crée les profils utilisateurs dans Firestore
 * 3. Migre les réclamations existantes
 * 4. Assigne les rôles par défaut
 * 5. Crée les données analytics initiales
 * 6. Initialise les paramètres système
 * 
 * Usage:
 *   node scripts/migrate-mockdata.js
 * 
 * ⚠️  ATTENTION: Ce script nécessite les credentials Firebase Admin
 * =============================================================================
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialiser Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('❌ Erreur: GOOGLE_APPLICATION_CREDENTIALS non défini ou fichier introuvable');
  console.error('   Téléchargez la clé de service depuis Firebase Console:');
  console.error('   Project Settings > Service Accounts > Generate new private key');
  console.error('   Puis définissez: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();
const auth = admin.auth();

// Données utilisateurs de test
const testUsers = [
  {
    email: 'client@tt.tn',
    password: '123456',
    displayName: 'Ahmed Ben Ali',
    role: 'customer',
  },
  {
    email: 'sara@tt.tn',
    password: '123456',
    displayName: 'Sara Mansouri',
    role: 'customer',
  },
  {
    email: 'support@tt.tn',
    password: 'support123',
    displayName: 'Agent Support',
    role: 'support',
  },
  {
    email: 'admin@tt.tn',
    password: 'admin123',
    displayName: 'Administrateur',
    role: 'admin',
  },
  {
    email: 'superadmin@tt.tn',
    password: 'superadmin123',
    displayName: 'Super Admin',
    role: 'superadmin',
  },
];

// Données réclamations mock
const mockReclamations = [
  {
    clientEmail: 'client@tt.tn',
    type: 'panne_internet',
    description: 'Ma connexion ADSL ne fonctionne plus depuis hier soir. Le voyant DSL clignote en rouge sur le modem.',
    statut: 'en_cours',
    priority: 'haute',
    daysAgo: 3,
  },
  {
    clientEmail: 'client@tt.tn',
    type: 'facturation',
    description: 'J\'ai été facturé deux fois pour le mois de juin. Merci de vérifier et rembourser le montant en double.',
    statut: 'resolue',
    priority: 'normale',
    daysAgo: 7,
  },
  {
    clientEmail: 'sara@tt.tn',
    type: 'panne_ligne_fixe',
    description: 'Pas de tonalité sur ma ligne fixe depuis ce matin. Numéro concerné : 71 234 567.',
    statut: 'en_attente',
    priority: 'haute',
    daysAgo: 1,
  },
  {
    clientEmail: 'sara@tt.tn',
    type: 'panne_internet',
    description: 'Débit très lent depuis 3 jours, impossible de charger les vidéos ou de faire des visioconférences.',
    statut: 'en_cours',
    priority: 'normale',
    daysAgo: 5,
  },
];

async function createTestUsers() {
  console.log('\n📝 Création des utilisateurs de test...\n');

  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Vérifier si l'utilisateur existe déjà
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`   ⚠️  Utilisateur existe déjà: ${userData.email}`);
      } catch {
        // Créer l'utilisateur
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true,
        });
        console.log(`   ✅ Créé: ${userData.email}`);
      }

      // Définir les custom claims (rôle)
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role,
      });

      // Créer le profil Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        phoneNumber: null,
        photoURL: null,
        emailVerified: true,
        accountStatus: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          source: 'migration_script',
        },
      });

      createdUsers.push({
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
      });

      console.log(`   🔑 Rôle défini: ${userData.role}`);
    } catch (error) {
      console.error(`   ❌ Erreur pour ${userData.email}:`, error.message);
    }
  }

  console.log(`\n✅ ${createdUsers.length} utilisateurs créés\n`);
  return createdUsers;
}

async function migrateReclamations(users) {
  console.log('\n📋 Migration des réclamations...\n');

  let migratedCount = 0;

  for (const reclamation of mockReclamations) {
    try {
      // Trouver l'utilisateur correspondant
      const user = users.find((u) => u.email === reclamation.clientEmail);
      if (!user) {
        console.error(`   ⚠️  Utilisateur non trouvé: ${reclamation.clientEmail}`);
        continue;
      }

      // Calculer la date de création
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - reclamation.daysAgo);

      // Date de résolution si résolue
      let resolvedAt = null;
      if (reclamation.statut === 'resolue') {
        resolvedAt = new Date(createdAt);
        resolvedAt.setHours(resolvedAt.getHours() + 24); // Résolue 24h après
      }

      // Créer la réclamation
      const reclamationData = {
        clientId: user.uid,
        clientNom: user.displayName,
        clientEmail: user.email,
        type: reclamation.type,
        description: reclamation.description,
        statut: reclamation.statut,
        priority: reclamation.priority,
        assignedTo: reclamation.statut === 'en_cours' ? users.find(u => u.role === 'support')?.uid : null,
        createdAt: admin.firestore.Timestamp.fromDate(createdAt),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedAt: resolvedAt ? admin.firestore.Timestamp.fromDate(resolvedAt) : null,
        attachments: [],
        metadata: {
          source: 'migration_script',
        },
      };

      await db.collection('reclamations').add(reclamationData);
      migratedCount++;

      console.log(`   ✅ Réclamation créée: ${reclamation.type} (${reclamation.statut})`);
    } catch (error) {
      console.error(`   ❌ Erreur migration réclamation:`, error.message);
    }
  }

  console.log(`\n✅ ${migratedCount} réclamations migrées\n`);
}

async function initializeSettings() {
  console.log('\n⚙️  Initialisation des paramètres système...\n');

  await db.collection('settings').doc('app').set({
    maintenanceMode: false,
    allowRegistrations: true,
    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    contactEmail: 'support@tunisietelecom.tn',
    appVersion: '1.0.0',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('   ✅ Paramètres système initialisés\n');
}

async function initializeAnalytics() {
  console.log('\n📊 Initialisation des analytics...\n');

  const today = new Date().toISOString().split('T')[0];

  await db.collection('analytics').doc(`daily_${today}`).set({
    date: today,
    newUsers: testUsers.length,
    activeUsers: 0,
    totalLogins: 0,
    reclamationsCreated: mockReclamations.length,
    reclamationsResolved: mockReclamations.filter(r => r.statut === 'resolue').length,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('   ✅ Analytics initialisées\n');
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔥 MIGRATION MOCK DATA → FIREBASE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const users = await createTestUsers();
    await migrateReclamations(users);
    await initializeSettings();
    await initializeAnalytics();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 Comptes de test créés:\n');
    users.forEach(user => {
      console.log(`   ${user.email} (${user.role})`);
    });

    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces comptes\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error);
    process.exit(1);
  }
}

main();
