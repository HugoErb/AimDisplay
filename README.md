# Aim Display

Aim Display offre des fonctionnalités pour saisir, stocker et visualiser les données relatives aux compétitions de tir sportif. Cela inclut les scores des participants, les classements, les statistiques de performance et d'autres informations. Son interface est intuitive et adaptée aux besoins spécifiques des organisateurs et participants de compétitions de tir sportif.

## Fonctionnalités principales

### Tableau de bord
Un accueil centralisé offrant une vue d'ensemble et un accès rapide aux différentes sections de l'application.

### Gestion des Clubs
*   **Annuaire des clubs** : Liste complète des clubs enregistrés.
*   **Création & Édition** : Ajoutez de nouveaux clubs ou modifiez les informations existantes (nom, ville).
*   **Sécurité** : Chaque utilisateur gère sa propre base de données de clubs.

### Gestion des Compétitions
*   **Paramétrage complet** : Définition des noms, dates (début/fin) et tarifs (inscription de base et catégories supplémentaires).
*   **Suivi** : Historique des compétitions organisées par l'utilisateur.

### Gestion des Tireurs & Scores
*   **Inscription simplifiée** : Enregistrement des tireurs par compétition, club, catégorie, arme et distance.
*   **Saisie des scores** : Interface dédiée pour saisir les scores (jusqu'à 8 séries selon l'arme utilisée, ex : P25).
*   **Calcul automatique** : Calcul en temps réel du score total avec gestion des scores nuls ou non renseignés.
*   **Gestion des doublons** : Vérifie si un tireur est déjà inscrit dans une même configuration pour éviter les erreurs.

### Affichage des Résultats (Ranking)
*   **Interface dédiée** : Vue plein écran optimisée pour la diffusion des résultats en direct lors des événements.
*   **Filtrage** : Tri et recherche facilités par compétition.

### Authentification & Compte
*   **Accès sécurisé** : Connexion, inscription et réinitialisation de mot de passe intégrées.
*   **Emails transactionnels** : Templates email personnalisés pour la vérification d'adresse, la réinitialisation de mot de passe et les alertes de changement de mot de passe.
*   **Isolation des données** : Chaque compte accède uniquement à ses propres données.

### Export PDF
*   **Générateur de rapports** : Créez des fichiers PDF professionnels pour les résultats d'une compétition complète ou pour un tireur spécifique.
*   **Mise en page** : Documents formatés pour l'impression et l'archivage.

## Stack Technique

*   **Langages** : TypeScript, HTML
*   **Frontend** : [Angular 21](https://angular.dev/) + [TailwindCSS 4](https://tailwindcss.com/)
*   **Desktop** : [Electron](https://www.electronjs.org/)
*   **Backend & Auth** : [Supabase](https://supabase.com/)

## Installation et Développement

### Prérequis
*   Node.js (version LTS recommandée)
*   Un projet Supabase configuré

### Installation
```bash
npm install
```

### Lancement en mode développement (Desktop)
```bash
npm run electron:dev
```
Cette commande lance simultanément le serveur Angular et l'application Electron avec les outils de développement ouverts.

### Build Production
*   **Windows** :
```bash
npm run dist:win
```
*   **Mac OS** : Pas encore disponible
*   **Linux** : Pas encore disponible

## Téléchargement

Le logiciel est téléchargeable sur mon site internet : [hugoeribon.fr/home](https://hugoeribon.fr/home)

---
© 2026 Hugo Eribon.
