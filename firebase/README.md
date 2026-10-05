# Firebase Backend Architecture - Production Ready

## 📁 Structure du Backend Firebase

```
firebase/
├── functions/              → Cloud Functions (Node.js)
│   ├── src/
│   │   ├── index.ts       → Point d'entrée principal
│   │   ├── auth/          → Fonctions d'authentification
│   │   ├── reclamations/  → Gestion des réclamations
│   │   ├── users/         → Gestion des utilisateurs
│   │   ├── notifications/ → Système de notifications
│   │   ├── analytics/     → Agrégation analytics
│   │   ├── audit/         → Logs d'audit
│   │   └── utils/         → Utilitaires communs
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules        → Règles de sécurité Firestore
├── storage.rules          → Règles de sécurité Storage
├── firestore.indexes.json → Index Firestore
└── firebase.json          → Configuration Firebase

```

## 🗄️ Architecture Firestore

### Collections Principales

#### **users** (Collection racine)
```
users/{userId}
  ├── email: string
  ├── displayName: string
  ├── phoneNumber: string (optionnel)
  ├── role: string (customer|support|moderator|admin|superadmin)
  ├── photoURL: string (optionnel)
  ├── emailVerified: boolean
  ├── accountStatus: string (active|suspended|deleted)
  ├── createdAt: timestamp
  ├── lastLoginAt: timestamp
  └── metadata: map
```

#### **reclamations** (Collection racine)
```
reclamations/{reclamationId}
  ├── clientId: string (référence vers users/{userId})
  ├── clientNom: string
  ├── clientEmail: string
  ├── type: string (panne_internet|panne_ligne_fixe|facturation|autre)
  ├── description: string
  ├── statut: string (en_attente|en_cours|resolue|fermee)
  ├── priority: string (basse|normale|haute|critique)
  ├── assignedTo: string (userId du technicien - optionnel)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── resolvedAt: timestamp (optionnel)
  ├── attachments: array<string> (URLs Storage)
  └── metadata: map
```

#### **loginHistory** (Sous-collection)
```
users/{userId}/loginHistory/{loginId}
  ├── timestamp: timestamp
  ├── ip: string
  ├── userAgent: string
  ├── device: string
  ├── browser: string
  ├── os: string
  ├── location: string (optionnel)
  └── success: boolean
```

#### **notifications** (Collection racine)
```
notifications/{notificationId}
  ├── userId: string
  ├── type: string (reclamation_created|status_changed|etc)
  ├── title: string
  ├── message: string
  ├── read: boolean
  ├── createdAt: timestamp
  └── metadata: map
```

#### **auditLogs** (Collection racine)
```
auditLogs/{logId}
  ├── userId: string
  ├── action: string (signup|login|update_profile|etc)
  ├── resource: string (users|reclamations|etc)
  ├── resourceId: string (optionnel)
  ├── timestamp: timestamp
  ├── ip: string
  ├── userAgent: string
  ├── success: boolean
  ├── errorMessage: string (optionnel)
  └── metadata: map
```

#### **analytics** (Collection racine)
```
analytics/daily/{date}
  ├── date: string (YYYY-MM-DD)
  ├── newUsers: number
  ├── activeUsers: number
  ├── totalLogins: number
  ├── reclamationsCreated: number
  ├── reclamationsResolved: number
  ├── pageViews: map<string, number>
  └── updatedAt: timestamp

analytics/monthly/{month}
  ├── month: string (YYYY-MM)
  ├── totalUsers: number
  ├── activeUsers: number
  ├── reclamationsTotal: number
  ├── avgResolutionTime: number
  └── updatedAt: timestamp
```

#### **supportTickets** (Collection racine)
```
supportTickets/{ticketId}
  ├── userId: string
  ├── subject: string
  ├── description: string
  ├── category: string
  ├── priority: string
  ├── status: string (open|in_progress|resolved|closed)
  ├── assignedTo: string (optionnel)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── messages: array<map> (historique conversation)
```

#### **settings** (Document unique)
```
settings/app
  ├── maintenanceMode: boolean
  ├── allowRegistrations: boolean
  ├── maxFileUploadSize: number
  ├── supportedFileTypes: array<string>
  └── contactEmail: string
```

## 🔐 Système RBAC (Role-Based Access Control)

### Hiérarchie des Rôles

1. **customer** (Client standard)
   - Créer/voir ses propres réclamations
   - Modifier son profil
   - Uploader son avatar

2. **support** (Agent de support)
   - Tout ce que customer peut faire
   - Voir toutes les réclamations
   - Changer le statut des réclamations assignées
   - Répondre aux tickets

3. **moderator** (Modérateur)
   - Tout ce que support peut faire
   - Assigner des réclamations
   - Voir les statistiques basiques
   - Gérer les priorités

4. **admin** (Administrateur)
   - Tout ce que moderator peut faire
   - Gérer les utilisateurs (suspend/reactiver)
   - Voir les logs d'audit
   - Accès au panneau admin
   - Voir toutes les analytics

5. **superadmin** (Super Administrateur)
   - Accès total
   - Modifier les rôles
   - Supprimer les utilisateurs
   - Gérer les paramètres système
   - Accès aux logs système

## 🚀 Cloud Functions

### Fonctions d'Authentification
- `onUserCreated` - Créer le profil utilisateur après inscription
- `sendWelcomeEmail` - Envoyer email de bienvenue
- `sendEmailVerificationReminder` - Rappel de vérification d'email
- `updateLoginHistory` - Enregistrer l'historique de connexion

### Fonctions de Réclamations
- `createReclamation` - Créer une nouvelle réclamation (avec validation)
- `updateReclamationStatus` - Mettre à jour le statut (avec permissions)
- `assignReclamation` - Assigner à un technicien
- `notifyReclamationUpdated` - Notifier le client des changements

### Fonctions Utilisateurs
- `deleteUserAccount` - Suppression sécurisée du compte
- `updateUserRole` - Changer le rôle (admin seulement)
- `suspendUser` - Suspendre un compte
- `getUserProfile` - Récupérer les données utilisateur

### Fonctions Analytics
- `aggregateDailyStats` - Agrégation quotidienne (scheduled)
- `aggregateMonthlyStats` - Agrégation mensuelle (scheduled)
- `cleanupOldLogs` - Nettoyage des vieux logs (scheduled)

### Fonctions Audit
- `logUserAction` - Enregistrer une action utilisateur
- `logSystemEvent` - Enregistrer un événement système

## 📊 Index Firestore Requis

```json
{
  "indexes": [
    {
      "collectionGroup": "reclamations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reclamations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "statut", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 🔒 Sécurité

### Principes Appliqués
- ✅ Principle of Least Privilege
- ✅ Validation côté serveur (jamais confiance au client)
- ✅ Custom Claims pour les rôles
- ✅ Règles Firestore strictes
- ✅ Règles Storage strictes
- ✅ Rate limiting sur les Cloud Functions
- ✅ Logs d'audit immutables
- ✅ Données sensibles jamais exposées
- ✅ CORS configuré correctement

## 📦 Installation

### Prérequis
- Node.js >= 18
- Firebase CLI: `npm install -g firebase-tools`
- Compte Firebase/Google Cloud

### Setup Initial

```bash
# 1. Initialiser Firebase dans le projet
cd firebase
firebase login
firebase init

# 2. Sélectionner les services:
#    - Firestore
#    - Functions
#    - Storage
#    - Authentication

# 3. Installer les dépendances des fonctions
cd functions
npm install

# 4. Déployer les règles de sécurité
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# 5. Déployer les Cloud Functions
firebase deploy --only functions

# 6. Créer les index Firestore
firebase deploy --only firestore:indexes
```

### Configuration Environnement

```bash
# Dans firebase/functions/.env
SENDGRID_API_KEY=votre_clé_sendgrid
ADMIN_EMAIL=admin@tt.tn
APP_URL=https://votre-app.web.app
```

## 🧪 Tests

```bash
# Tester localement avec l'émulateur Firebase
firebase emulators:start

# Tester les fonctions
cd functions
npm test

# Tester les règles de sécurité
firebase emulators:exec --only firestore "npm run test:rules"
```

## 📈 Monitoring Production

### Firebase Console
- Authentication: Utilisateurs, activité
- Firestore: Lectures/écritures, taille données
- Functions: Exécutions, erreurs, latence
- Storage: Utilisation, bande passante

### Google Cloud Console
- Cloud Functions logs
- Error Reporting
- Cloud Monitoring (alertes)
- Cloud Trace (performance)

## 🔄 Migration depuis Mock Data

Pour migrer les données mock existantes vers Firebase:

```bash
# Utiliser le script de migration
cd firebase/functions
npm run migrate:mockdata
```

Ce script va:
1. Créer des utilisateurs de test
2. Importer les réclamations existantes
3. Créer les données analytics initiales
4. Assigner les rôles par défaut

## 🎯 Prochaines Étapes

1. ✅ Créer un projet Firebase
2. ✅ Configurer Authentication (Email/Password)
3. ✅ Déployer les règles de sécurité
4. ✅ Déployer les Cloud Functions
5. ✅ Configurer les index
6. ✅ Intégrer Firebase dans le mobile (Flutter)
7. ✅ Intégrer Firebase dans le dashboard (React)
8. ✅ Tester end-to-end
9. ✅ Déployer en production

---

**Auteur:** Équipe Backend - Projet de Stage Tunisie Telecom  
**Date:** Juillet 2026  
**Version:** 1.0.0
