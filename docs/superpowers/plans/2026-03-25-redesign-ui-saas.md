# Redesign UI SaaS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize Aim Display's visual interface to a clean SaaS "Minimaliste structuré" style without changing any business logic.

**Architecture:** Pure visual refactor — only `.html` templates and `styles.css` change. The section-header shared component is refactored first since all pages depend on it. Then pages are updated in dependency order: forms, tables, standalone pages. Global CSS changes (table zebra striping) come last to avoid conflicts during incremental work.

**Tech Stack:** Angular 19, Tailwind CSS 4, PrimeNG 19, Iconify icons

**Spec:** `docs/superpowers/specs/2026-03-25-redesign-ui-saas-design.md`

---

### Task 1: Section Header component refactor

**Files:**
- Modify: `src/app/components/section-header/section-header.component.html`

- [ ] **Step 1: Replace section-header template**

Replace the entire content of `section-header.component.html` with:

```html
<div class="relative px-8 py-5 rounded-t-xl border-b-2 border-prime-blue dark:border-gray-700 transition-colors duration-500">
	<div class="flex items-center space-x-4">
		<div class="w-10 h-10 bg-gradient-to-br from-prime-blue to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
			<iconify-icon [icon]="icon" class="text-xl text-white"></iconify-icon>
		</div>
		<div>
			<h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-500">{{ title }}</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-500">{{ subtitle }}</p>
		</div>
	</div>
</div>
```

- [ ] **Step 2: Build and verify**

Run: `ng serve`
Open any page that uses `<app-section-header>` (e.g. `/creation_club`). Verify:
- Light: icon in blue gradient square, title dark, subtitle gray, blue bottom border
- Dark: icon square stays gradient, title/subtitle gray tones, bottom border gray-700
- Toggle theme: smooth 500ms transition

- [ ] **Step 3: Commit**

```bash
git add src/app/components/section-header/section-header.component.html
git commit -m "refonte section-header : style minimaliste structuré avec icône carré gradient"
```

---

### Task 2: Card wrappers — all pages

Update the card wrapper `<div>` on every page from `shadow-lg rounded-lg` to `shadow-sm rounded-xl border border-gray-200 dark:border-gray-700`.

**Files:**
- Modify: `src/app/creation_shooter/creation_shooter.component.html`
- Modify: `src/app/creation_club/creation_club.component.html`
- Modify: `src/app/creation_competition/creation_competition.component.html`
- Modify: `src/app/modification_shooter/modification_shooter.component.html`
- Modify: `src/app/modification_club/modification_club.component.html`
- Modify: `src/app/modification_competition/modification_competition.component.html`
- Modify: `src/app/display/display.component.html`
- Modify: `src/app/generer_pdf/generer_pdf.component.html`
- Modify: `src/app/help/help.component.html`
- Modify: `src/app/settings/settings.component.html`

- [ ] **Step 1: Update all card wrappers**

In each file, find:
```html
<div class="bg-white dark:bg-secondary-dark-bg shadow-lg rounded-lg m-6">
```
Replace with:
```html
<div class="bg-white dark:bg-secondary-dark-bg shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 m-6">
```

Special cases:
- `help.component.html` has `transition-all duration-500` in the card classes — preserve those extra classes
- `settings.component.html` outer card also has `transition-all duration-500` — preserve it

- [ ] **Step 2: Remove inner shadow-lg on modification_* table wrappers**

In `modification_shooter.component.html`, `modification_club.component.html`, `modification_competition.component.html`, find:
```html
<div class="min-w-[525px] mx-auto shadow-lg">
```
Replace with:
```html
<div class="min-w-[525px] mx-auto">
```

- [ ] **Step 3: Verify visually**

Check any page: cards should have subtle shadow, rounded-xl corners, thin border. No double shadow on modification tables.

- [ ] **Step 4: Commit**

```bash
git add src/app/creation_shooter/creation_shooter.component.html src/app/creation_club/creation_club.component.html src/app/creation_competition/creation_competition.component.html src/app/modification_shooter/modification_shooter.component.html src/app/modification_club/modification_club.component.html src/app/modification_competition/modification_competition.component.html src/app/display/display.component.html src/app/generer_pdf/generer_pdf.component.html src/app/help/help.component.html src/app/settings/settings.component.html
git commit -m "card wrappers : shadow-sm, rounded-xl, bordure fine sur toutes les pages"
```

---

### Task 3: Section titles — accent vertical bleu

Replace `<h2>` section titles with the new accent bar pattern across all form pages.

**Files:**
- Modify: `src/app/creation_shooter/creation_shooter.component.html`
- Modify: `src/app/creation_club/creation_club.component.html`
- Modify: `src/app/creation_competition/creation_competition.component.html`
- Modify: `src/app/display/display.component.html`
- Modify: `src/app/generer_pdf/generer_pdf.component.html`
- Modify: `src/app/help/help.component.html`

- [ ] **Step 1: Update creation_shooter section titles**

There are multiple `<h2>` section titles in this file. Replace each instance of:
```html
<h2
    class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
```
With:
```html
<div class="flex items-center gap-2">
    <div class="w-1 h-5 bg-prime-blue rounded-full"></div>
    <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
```
And close the wrapping `</div>` after the `</h2>`.

Sections to update: "Informations personnelles", "Affiliation et compétition", "Catégorie et scores du tireur dans la compétition".

- [ ] **Step 2: Update creation_club section title**

Same pattern for "Informations du club".

- [ ] **Step 3: Update creation_competition section titles**

Same pattern for "Informations de la compétition" and "Configuration des prix".

- [ ] **Step 4: Update display section title**

Same pattern for "Affichage d'une compétition".

- [ ] **Step 5: Update generer_pdf section titles**

Same pattern for "Générer un rapport de compétition" and "Générer un rapport de tireur".

- [ ] **Step 6: Update help "Tutoriel Détaillé" heading**

In `help.component.html`, find:
```html
<h2
    class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-gray-300 flex items-center">
    Tutoriel Détaillé
</h2>
```
Replace with:
```html
<div class="flex items-center gap-2">
    <div class="w-1 h-5 bg-prime-blue rounded-full"></div>
    <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
        Tutoriel Détaillé
    </h2>
</div>
```

- [ ] **Step 7: Verify visually**

Check each page: section titles should show blue vertical bar on the left, no bottom border, text slightly smaller.

- [ ] **Step 8: Commit**

```bash
git add src/app/creation_shooter/creation_shooter.component.html src/app/creation_club/creation_club.component.html src/app/creation_competition/creation_competition.component.html src/app/display/display.component.html src/app/generer_pdf/generer_pdf.component.html src/app/help/help.component.html
git commit -m "titres de section : accent vertical bleu remplace les border-b"
```

---

### Task 4: Table headers — modification pages

**Files:**
- Modify: `src/app/modification_shooter/modification_shooter.component.html`
- Modify: `src/app/modification_club/modification_club.component.html`
- Modify: `src/app/modification_competition/modification_competition.component.html`

- [ ] **Step 1: Update modification_shooter table headers**

Replace all `<th>` classes. For sortable columns, change from:
```
class="!bg-gray-100 hover:dark:!bg-gray-700 hover:!bg-gray-200"
```
To:
```
class="!bg-transparent dark:!bg-transparent hover:!bg-gray-50 hover:dark:!bg-gray-700/50"
```

For non-sortable `<th>` (empty action columns), change from:
```
class="!bg-gray-100"
```
To:
```
class="!bg-transparent dark:!bg-transparent"
```

Change column header text spans from:
```
class="text-prime-blue dark:text-gray-300 mr-2 whitespace-nowrap"
```
To:
```
class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2 whitespace-nowrap"
```

Add `font-medium` to the first `<td>` (name column) in each row body template. For modification_shooter, the first `<td>` is `{{ shooter.lastName }}`:
```html
<td class="!py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{{ shooter.lastName }}</td>
```

- [ ] **Step 2: Update modification_club table headers**

Same pattern. First `<td>` is `{{ club.name }}` — add `font-medium text-gray-900 dark:text-gray-100`.

- [ ] **Step 3: Update modification_competition table headers**

Same pattern. First `<td>` is `{{ competition.name }}` — add `font-medium text-gray-900 dark:text-gray-100`.

- [ ] **Step 4: Verify visually**

Check each table: headers should be uppercase gray text on transparent background, first column bold, hover still works on sortable columns.

- [ ] **Step 5: Commit**

```bash
git add src/app/modification_shooter/modification_shooter.component.html src/app/modification_club/modification_club.component.html src/app/modification_competition/modification_competition.component.html
git commit -m "table headers : uppercase gris discret, fond transparent, première colonne en bold"
```

---

### Task 5: Global CSS — table zebra striping

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add zebra striping rules**

In `styles.css`, inside the `@layer utilities` block, after the existing `.p-datatable` rules, add:

```css
/* Zébrage des lignes de tableau */
/* On cible td (et non tr) car PrimeNG stylee déjà les td avec !important en dark mode.
   On applique la même stratégie en light mode pour éviter toute surprise de spécificité. */
.p-datatable tbody tr:nth-child(even) td {
    background-color: rgba(249, 250, 251, 0.5) !important; /* gray-50/50 */
}
:where(.dark) .p-datatable tbody tr:nth-child(even) td {
    background-color: rgba(255, 255, 255, 0.02) !important;
}
```

- [ ] **Step 2: Verify visually**

Open any modification page: rows should alternate white / very light gray. In dark mode, the alternation should be barely visible (subtle).

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "styles.css : ajout zébrage des lignes de tableau"
```

---

### Task 6: Page Home — title color

**Files:**
- Modify: `src/app/home/home.component.html`

- [ ] **Step 1: Update title color**

Find:
```html
class="text-5xl font-bold md:text-7xl text-prime-blue dark:text-gray-300 animate-appear opacity-0 transition-colors duration-500"
```
Replace with:
```html
class="text-5xl font-bold md:text-7xl text-gray-900 dark:text-gray-100 animate-appear opacity-0 transition-colors duration-500"
```

- [ ] **Step 2: Commit**

```bash
git add src/app/home/home.component.html
git commit -m "home : titre en gris foncé au lieu de bleu"
```

---

### Task 7: Page Settings — cards and modals

**Files:**
- Modify: `src/app/settings/settings.component.html`

- [ ] **Step 1: Update "Gestion du compte" card header**

Find the gradient header div:
```html
<div
    class="p-4 border-b border-gray-200 dark:border-gray-700 transition-all duration-500 bg-gradient-to-r from-prime-blue to-hover-prime-blue rounded-t-lg"
>
    <h2 class="text-lg font-semibold text-white transition-all duration-500">Gestion du compte</h2>
    <p class="text-sm text-blue-100 transition-all duration-500">Gérez vos informations personnelles et votre sécurité</p>
</div>
```
Replace with:
```html
<div
    class="p-4 border-b-2 border-prime-blue dark:border-gray-700 transition-all duration-500 rounded-t-lg"
>
    <div class="flex items-center space-x-3">
        <div class="w-9 h-9 bg-gradient-to-br from-prime-blue to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <iconify-icon [icon]="icons.EDIT" class="text-lg text-white"></iconify-icon>
        </div>
        <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-all duration-500">Gestion du compte</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 transition-all duration-500">Gérez vos informations personnelles et votre sécurité</p>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Update "Préférences générales" card header**

Same pattern. Replace the gradient header with the icon-square style, using `icons.SETTINGS` as the icon. Title: "Préférences générales", subtitle: "Configurez les paramètres globaux de l'application".

- [ ] **Step 3: Update "Nous contacter" card header**

Same pattern with `icons.EMAIL_SEND`. Title: "Nous contacter", subtitle: "Une question, un problème ou une suggestion ? Notre équipe est là pour vous aider."

- [ ] **Step 4: Update "Modifier le nom du club" modal header**

Find:
```html
<div class="p-4 bg-gradient-to-r from-prime-blue to-hover-prime-blue transition-all duration-500">
    <h2 class="text-lg font-semibold text-white">Modifier le nom du club</h2>
    <p class="text-sm text-blue-100">Saisissez un nouveau nom pour votre club</p>
</div>
```
Replace with:
```html
<div class="p-5 border-b-2 border-prime-blue dark:border-gray-700 transition-all duration-500">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifier le nom du club</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Saisissez un nouveau nom pour votre club</p>
</div>
```

- [ ] **Step 5: Update "Modifier votre mot de passe" modal header**

Same pattern. Title: "Modifier votre mot de passe", subtitle: "Saisissez un nouveau mot de passe pour votre compte Aim Display".

- [ ] **Step 6: Verify visually**

Check settings page: all 3 cards should have icon-square headers with blue bottom border. Both modals should have clean text headers without gradient. Test both light and dark modes.

- [ ] **Step 7: Commit**

```bash
git add src/app/settings/settings.component.html
git commit -m "settings : remplacement bandeaux gradient par headers minimalistes avec icône carré"
```

---

### Task 8: Final visual verification

- [ ] **Step 1: Full light mode check**

Navigate through every modified page in light mode:
- Home, creation_shooter, creation_club, creation_competition
- modification_shooter, modification_club, modification_competition
- display, generer_pdf, help, settings (including both modals)

Verify: consistent card style, section headers, section titles, table headers.

- [ ] **Step 2: Full dark mode check**

Toggle dark mode and repeat the same navigation. Verify:
- Smooth 500ms transitions on all elements
- Section header icon square stays gradient in dark mode
- Table zebra striping is barely visible but present
- No elements with white text on white background or vice versa

- [ ] **Step 3: Verify untouched pages**

Check that sidebar, login, register, forgot-password, reset-password, ranking, and splash-screen are visually unchanged.

- [ ] **Step 4: Build check**

Run: `ng build`
Expected: Build succeeds with no errors.
