# Gestion des Réclamations Clients - Tunisie Telecom

Projet de stage : Application complète de gestion des réclamations clients pour Tunisie Telecom.

## Architecture du projet

```
gestion-reclamations-tt/
├── mobile/          → Application Flutter (clients)
├── dashboard/       → Dashboard React + Tailwind CSS (admin/techniciens)
└── README.md
```

## Structure de données

Collection **"reclamations"** :

| Champ         | Type     | Description                          |
|---------------|----------|--------------------------------------|
| id            | String   | Identifiant unique                   |
| client_nom    | String   | Nom complet du client                |
| client_email  | String   | Email du client                      |
| type          | String   | Panne Internet / Panne Ligne Fixe / Problème Facturation / Autre |
| description   | String   | Description détaillée du problème    |
| date          | DateTime | Date de création                     |
| statut        | String   | En attente / En cours / Résolue      |

---

## 1. Application Mobile (Flutter)

### Prérequis
- Flutter SDK >= 3.0 installé ([guide d'installation](https://docs.flutter.dev/get-started/install))
- Android Studio ou VS Code avec l'extension Flutter
- Un émulateur Android/iOS ou un appareil physique

### Installation et lancement

```bash
# Accéder au dossier mobile
cd mobile

# Installer les dépendances
flutter pub get

# Lancer sur un émulateur ou appareil connecté
flutter run
```

### Comptes de test

| Email          | Mot de passe | Nom             |
|----------------|-------------|-----------------|
| client@tt.tn   | 123456      | Ahmed Ben Ali   |
| sara@tt.tn     | 123456      | Sara Mansouri   |
| test@test.com  | test123     | Utilisateur Test |

### Fonctionnalités
- Connexion / Inscription (authentification simulée)
- Liste des réclamations du client connecté
- Création d'une nouvelle réclamation (type + description)
- Suivi du statut avec timeline visuelle
- Design aux couleurs de Tunisie Telecom (rouge/orange/violet)

---

## 2. Dashboard Web (React + Tailwind CSS)

### Prérequis
- Node.js >= 18 installé ([télécharger](https://nodejs.org))
- npm (inclus avec Node.js)

### Installation et lancement

```bash
# Accéder au dossier dashboard
cd dashboard

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le dashboard sera accessible sur `http://localhost:5173`

### Fonctionnalités
- Tableau de bord avec statistiques (cartes + graphiques)
- Liste complète des réclamations avec filtres (statut, type, recherche)
- Changement de statut : En attente → En cours → Résolue
- Interface responsive et professionnelle

---

## Notes pour le rapport de stage

### Technologie utilisées
- **Mobile** : Flutter (Dart) - framework multiplateforme de Google
- **Web** : React.js + Tailwind CSS + Vite.js
- **Graphiques** : Recharts (bibliothèque de graphiques React)
- **Données** : Mock data en local (simulant Firebase Firestore)

### Pour passer en production avec Firebase
1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer Firestore Database
3. **Mobile** : Ajouter `cloud_firestore` et `firebase_core` dans `pubspec.yaml`, configurer avec FlutterFire CLI
4. **Web** : Ajouter `firebase` dans `package.json`, initialiser avec la config Firebase

### Workflow des statuts
```
En attente  →  En cours  →  Résolue
(client crée)  (technicien)  (technicien)
```
