# Redesign UI SaaS — Spec de design

## Contexte

Aim Display est une application Angular 19 de gestion de compétitions de tir sportif. L'objectif est de moderniser l'interface vers un style SaaS sobre et minimaliste (direction "Minimaliste structuré"), en gardant Tailwind CSS + PrimeNG.

## Périmètre

### Ne PAS modifier
- **Sidebar** (`components/sidebar/`) : style préservé tel quel
- **Ranking** (`ranking/`) : page publique, style préservé
- **Login** (`login/`) : style préservé
- **Register** (`register/`) : style préservé
- **Forgot-password** (`forgot-password/`) : style préservé
- **Reset-password** (`reset-password/`) : style préservé

### À modifier
- `components/section-header/` — refonte du composant header partagé
- `home/` — ajustements mineurs
- `creation_shooter/` — formulaire de création tireur
- `creation_club/` — formulaire de création club
- `creation_competition/` — formulaire de création compétition
- `modification_shooter/` — tableau PrimeNG tireurs
- `modification_club/` — tableau PrimeNG clubs
- `modification_competition/` — tableau PrimeNG compétitions
- `display/` — page d'affichage du classement
- `generer_pdf/` — page de génération PDF
- `help/` — page aide & tutoriel (section header uniquement)
- `settings/` — page paramètres + modals
- `styles.css` — styles globaux PrimeNG et utilitaires

### Hors périmètre
- `splash_screen/` : pas de modification (page indépendante sans sidebar)
- `components/button/` : pas de modification
- `components/info-note/` : pas de modification
- `components/redirect-link/` : pas de modification
- `components/base-layout/` : pas de modification
- Aucune modification de logique métier, seulement du visuel (HTML templates + CSS)

## Design Tokens

Aucun changement de tokens. On conserve intégralement :

| Token | Valeur |
|---|---|
| `--color-prime-blue` | `#3b80f6` |
| `--color-hover-prime-blue` | `#1e63e0` |
| `--color-main-bg` | `#fafbfb` |
| `--color-main-dark-bg` | `#191a1a` |
| `--color-secondary-dark-bg` | `#232726` |
| Police | Inter |
| Transitions thème | 500ms |
| Animations | appear, fadeIn (inchangées) |

## Composants

### 1. Section Header (`components/section-header/`)

**Avant** : bandeau gradient bleu pleine largeur (`bg-gradient-to-r from-prime-blue to-hover-prime-blue`), icône blanche, texte blanc. En dark mode, le gradient disparaît (opacity 0), icône bleue, texte gris.

**Après** :
```
┌─────────────────────────────────────────────────┐
│ [■ icône]  Titre de la page                     │
│            Sous-titre descriptif                 │
│─────────────────────────────────────── (bleu) ───│
```

- Fond : `bg-white dark:bg-secondary-dark-bg transition-colors duration-500`
- Coins haut : `rounded-t-xl` (pour correspondre au card wrapper `rounded-xl`)
- Icône dans un carré : `w-10 h-10 bg-gradient-to-br from-prime-blue to-indigo-600 rounded-xl flex items-center justify-center`
- Taille de l'icône : `text-xl` (~20px) pour tenir dans le carré 40x40 sans déborder
- Icône couleur : `text-white` (le carré gradient reste visible en light ET dark)
- Titre : `text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-500`
- Sous-titre : `text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-500`
- Bordure basse : `border-b-2 border-prime-blue dark:border-gray-700 transition-colors duration-500`
- Padding : `px-8 py-5`
- Suppression du `<div>` gradient overlay et de la logique `dark:opacity-0`

### 2. Card wrapper (pattern commun à toutes les pages)

**Avant** : `bg-white dark:bg-secondary-dark-bg shadow-lg rounded-lg m-6`

**Après** : `bg-white dark:bg-secondary-dark-bg shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 m-6`

Changements :
- `shadow-lg` → `shadow-sm` (ombre plus subtile)
- `rounded-lg` → `rounded-xl` (coins plus arrondis, style SaaS)
- Ajout `border border-gray-200 dark:border-gray-700` (bordure fine)

### 3. Titres de section dans les formulaires

**Avant** :
```html
<h2 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
    Informations personnelles
</h2>
```

**Après** :
```html
<div class="flex items-center gap-2">
    <div class="w-1 h-5 bg-prime-blue rounded-full"></div>
    <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
        Informations personnelles
    </h2>
</div>
```

Changements :
- Suppression de `border-b` et `pb-2`
- Ajout accent vertical bleu (4px width, 20px height, arrondi)
- `text-lg` → `text-base`
- `dark:text-gray-300` → `dark:text-gray-100` (plus contrasté)

### 4. Tableaux PrimeNG (modification_*)

#### Headers

**Avant** : `class="!bg-gray-100 hover:dark:!bg-gray-700 hover:!bg-gray-200"` avec texte `text-prime-blue dark:text-gray-300`

**Après** : `class="!bg-transparent dark:!bg-transparent hover:!bg-gray-50 hover:dark:!bg-gray-700/50"` avec texte `text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`

Changements dans les templates HTML :
- Suppression du fond gris statique sur les `th`
- Hover subtil conservé pour les colonnes triables (feedback visuel PrimeNG)
- Headers en texte gris uppercase discret
- Bordure basse subtile uniquement

#### Corps

Ajout zébrage via CSS global. **Attention** : la règle dark existante `:where(.dark) .p-datatable tr { background-color: var(--color-secondary-dark-bg) !important; }` utilise `!important` — la règle de zébrage dark doit aussi utiliser `!important` pour la surcharger :
```css
.p-datatable tbody tr:nth-child(even) {
    background-color: rgba(249, 250, 251, 0.5); /* gray-50/50 */
}
:where(.dark) .p-datatable tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02) !important;
}
```

Première colonne (nom) : ajout `font-medium` sur le premier `<td>` de chaque row.

#### Icônes d'action

**Inchangées** : on conserve les `iconify-icon` edit/delete avec leur hover `hover:bg-gray-200 dark:hover:bg-gray-600`.

#### Pagination

Style inchangé fonctionnellement. Les couleurs s'harmonisent déjà avec le design via les variables CSS existantes.

### 5. Page Home

**Avant** : titre "Aim Display" en `text-prime-blue dark:text-gray-300`

**Après** : titre en `text-gray-900 dark:text-gray-100` pour un aspect plus SaaS (le bleu reste sur le carré d'icône du header, pas besoin de le répéter ici).

Le reste (logo, sous-titre, footer) reste identique.

### 6. Page Settings

#### Cards de section (Gestion du compte, Préférences générales, Nous contacter)

**Avant** : bandeau gradient bleu en haut de chaque card (`bg-gradient-to-r from-prime-blue to-hover-prime-blue rounded-t-lg`)

**Après** : header sobre avec icône carré gradient + titre + bordure bleue basse :
```
┌─────────────────────────────────────────────────┐
│ [■]  Gestion du compte                          │
│      Gérez vos informations personnelles        │
│─────────────────────────────────────── (bleu) ───│
│                                                   │
│  Contenu...                                       │
```

- Fond header : `bg-white dark:bg-secondary-dark-bg`
- Titre : `text-lg font-semibold text-gray-900 dark:text-gray-100`
- Sous-titre : `text-sm text-gray-500 dark:text-gray-400`
- Bordure : `border-b-2 border-prime-blue dark:border-gray-700`
- Ajout d'une icône dans un carré gradient (même style que section-header) avec les icônes correspondantes (EDIT pour compte, SETTINGS pour préférences, EMAIL_SEND pour contact)

#### Modals

**Avant** : bandeau gradient bleu en haut du modal

**Après** :
- Fond header : `bg-white dark:bg-gray-800` (note : le container modal est déjà `dark:bg-gray-800`, donc le header hérite naturellement — c'est intentionnellement différent de `dark:bg-secondary-dark-bg` des cards de page)
- Titre : `text-lg font-semibold text-gray-900 dark:text-gray-100`
- Sous-titre : `text-sm text-gray-500 dark:text-gray-400`
- Bordure basse : `border-b-2 border-prime-blue dark:border-gray-700`
- Padding : `p-5`

### 7. Page Help

- Section header : passage au style B
- Le heading "Tutoriel Détaillé" (ligne ~88 de `help.component.html`) utilise l'ancien pattern `<h2>` avec `border-b` : il doit aussi recevoir le traitement accent vertical bleu comme les titres de section des formulaires (section 3)
- Le reste de la page (cartes bleues, timeline, contenu) est déjà cohérent avec le nouveau design et ne nécessite aucune modification.

### 8. Page Generer PDF

- Section header : passage au style B
- Onglets compétition/tireur : **inchangés** (déjà modernes avec slider animé)
- Titres de section "Générer un rapport de..." : passage à l'accent vertical bleu
- Encarts bleus d'information : **inchangés**

### 9. Page Display

- Section header : passage au style B
- Titre de section : passage à l'accent vertical bleu
- Le reste (autocomplete, info notes, bouton) : **inchangé**

## Récapitulatif des changements CSS globaux (styles.css)

1. **Ajout** : zébrage des lignes de tableau (`.p-datatable tbody tr:nth-child(even)`) avec `!important` en dark mode pour surcharger la règle existante
2. **Aucune suppression** de styles existants relatifs aux inputs PrimeNG, dark mode, etc.
3. Les overrides `!bg-gray-100` sur les `th` seront retirés directement dans les templates HTML, pas dans styles.css
4. **Suppression** du `shadow-lg` intérieur sur les wrappers `<div class="min-w-[525px] mx-auto shadow-lg">` des pages modification_* (doublon avec le `shadow-sm` du card wrapper extérieur)

## Contraintes

- Tailwind CSS 4 + PrimeNG 19 uniquement
- Pas de nouvelles dépendances
- Support light + dark mode obligatoire avec transitions 500ms
- Les templates TypeScript (.ts) ne changent pas, seulement les .html
- Les fonctionnalités PrimeNG (tri, filtres, pagination, autoComplete, etc.) doivent rester intactes
