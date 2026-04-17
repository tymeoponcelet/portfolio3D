# Visual Redesign — Henry-style

**Date :** 2026-04-17
**Auteur :** Tyméo Poncelet
**Statut :** Approuvé

---

## Contexte

Le ShowcaseExplorer existe et fonctionne. Il affiche une HOME + 4 sections (BioNotepad, ProjectsExplorer, SkillsApp, ContactApp) avec une sidebar de navigation à gauche. Le rendu visuel est actuellement full Win95 gris. L'objectif est de lui donner un aspect "site web vivant" inspiré de Henry Heffernan : fond blanc, typographie propre, accent bleu `#000080`.

---

## Objectif

Redesigner visuellement toutes les sections du ShowcaseExplorer sans toucher à la logique ni à la structure de navigation. Le résultat doit ressembler à un site web moderne rendu dans une fenêtre Win95.

---

## Périmètre

| Fichier | Action |
|---|---|
| `src/styles/win95.css` | Modifier les classes ShowcaseExplorer existantes + ajouter classes section |
| `src/components/OS/apps/ShowcaseExplorer.jsx` | Ajustements markup HOME si nécessaire |
| `src/components/OS/apps/BioNotepad.jsx` | Supprimer chrome Explorer, redesign contenu |
| `src/components/OS/apps/ProjectsExplorer.jsx` | Supprimer chrome Explorer, redesign contenu |
| `src/components/OS/apps/SkillsApp.jsx` | Supprimer chrome Explorer, redesign contenu |
| `src/components/OS/apps/ContactApp.jsx` | Supprimer chrome Explorer, redesign contenu |

Fichiers **inchangés** : `Window.jsx`, `Taskbar.jsx`, `OS.jsx`, `Desktop.jsx`, `osStore.js`.

---

## Palette

| Rôle | Valeur |
|---|---|
| Fond principal | `#ffffff` |
| Texte principal | `var(--w-black)` (`#000`) |
| Texte secondaire | `#555` |
| Accent / liens | `#000080` |
| Bordures légères | `#d0d0d0` |
| Fond sidebar | `#ffffff` |
| Fond hover nav | `#f0f4ff` |

---

## HOME

### Layout

Plein écran dans la fenêtre, fond blanc, centré verticalement et horizontalement via flexbox.

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│          Tyméo Poncelet                  │
│             Student                      │
│    BTS SIO SISR — Recherche stage        │
│                                          │
│  BIOGRAPHIE  PROJETS  COMPÉTENCES  CONTACT │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

### Typographie

- Titre : `font-size: 32px`, `font-weight: bold`, `color: #000080`
- Sous-titre rôle : `font-size: 16px`, `color: #555`
- Sous-titre formation : `font-size: 13px`, `color: #777`
- Nav links : `font-size: 12px`, `color: #000080`, `text-decoration: underline`, espacés `gap: 20px`

### Classes CSS

```css
.win95-showcase-home          /* wrapper flex centré, fond blanc, 100% */
.win95-showcase-home-content  /* flex column, gap 12px, text-align center */
.win95-showcase-home-title    /* 32px bold #000080 */
.win95-showcase-home-role     /* 16px #555 */
.win95-showcase-home-sub      /* 13px #777 */
.win95-showcase-home-nav      /* flex row gap 20px justify-center */
.win95-showcase-home-link     /* bouton texte #000080 underline, pas de bg */
```

---

## Sidebar (toutes sections hors HOME)

### Layout

130px de large, fond blanc, bordure droite `1px solid #d0d0d0`.

```
┌──────────────┐
│ Tyméo        │
│ Poncelet     │
│ Portfolio    │
│              │
│ ○ HOME       │
│   BIOGRAPHIE │
│   PROJETS    │
│   COMPÉTENCES│
│   CONTACT    │
└──────────────┘
```

### Typographie & états

- Nom : `font-size: 13px`, `font-weight: bold`, `color: var(--w-black)`
- Brand "Portfolio" : `font-size: 10px`, `color: #777`
- Items nav : `font-size: 11px`, `color: var(--w-black)`, padding `6px 10px`
- Item actif : `color: #000080`, `text-decoration: underline`, préfixé `○`
- Hover : `background: #f0f4ff`

### Classes CSS

```css
.win95-showcase-sidebar         /* 130px, fond blanc, border-right #d0d0d0 */
.win95-showcase-sidebar-header  /* padding 12px 10px 8px */
.win95-showcase-sidebar-name    /* 13px bold */
.win95-showcase-sidebar-brand   /* 10px #777 */
.win95-showcase-sidebar-nav     /* flex column */
.win95-showcase-nav-item        /* bouton texte, 11px, padding 6px 10px */
.win95-showcase-nav-item.active /* #000080 underline */
.win95-showcase-nav-item:hover  /* bg #f0f4ff */
```

---

## BioNotepad

### Suppression

- Supprimer `div.win95-explorer-addr` (barre d'adresse)
- Supprimer `div.win95-statusbar` (barre de statut)
- Remplacer `div.win95-explorer` par `div.win95-bio`
- Remplacer `div.win95-explorer-body` par `div.win95-bio-body`

### Layout

Sidebar gauche (onglets section) + panel droit scrollable. Fond blanc.

```
┌────────────┬──────────────────────────────┐
│ Formation  │  ### Formation               │
│ Objectif   │  BTS SIO SISR...             │
│ Expérience │                              │
│ Contact    │                              │
└────────────┴──────────────────────────────┘
```

### Sidebar onglets

- Items : texte 11px, padding `6px 10px`
- Actif : `color: #000080`, `font-weight: bold`, `border-left: 2px solid #000080`

### Panel contenu

- Heading section : `font-size: 14px`, `font-weight: bold`, `color: #000080`, `margin-bottom: 10px`
- Texte : `font-size: 11px`, line-height 1.6
- Liens (email, téléphone, LinkedIn) : `color: #000080`, `text-decoration: underline`

### Classes CSS

```css
.win95-bio               /* flex column 100%, fond blanc */
.win95-bio-body          /* flex row flex:1 overflow:hidden */
.win95-bio-sidebar       /* 110px, border-right #d0d0d0 */
.win95-bio-tab           /* bouton texte 11px padding 6px 10px */
.win95-bio-tab.active    /* #000080 bold border-left 2px #000080 */
.win95-bio-panel         /* flex:1 overflow-y:auto padding:16px */
.win95-bio-section-title /* 14px bold #000080 margin-bottom:10px */
```

---

## ProjectsExplorer

### Suppression

- Supprimer `div.win95-explorer-addr`
- Supprimer `div.win95-statusbar`
- Remplacer `div.win95-explorer` par `div.win95-projects`

### Layout

Sidebar gauche (dossiers/catégories) + panel droit (liste de projets ou détail).

### Sidebar

Même style que BioNotepad sidebar : 110px, items 11px, actif `#000080` bold + border-left.

### Panel projets

- Quand dossier sélectionné (pas de fichier) : liste de fichiers avec icône `📄` + nom, cliquables
- Quand fichier sélectionné : `font-size: 11px`, titre bold `#000080`, description, technologies listées

### Classes CSS

```css
.win95-projects           /* flex column 100% fond blanc */
.win95-projects-body      /* flex row flex:1 overflow:hidden */
.win95-projects-sidebar   /* 110px border-right #d0d0d0 */
.win95-projects-tab       /* bouton texte 11px */
.win95-projects-tab.active /* #000080 bold border-left */
.win95-projects-panel     /* flex:1 overflow-y:auto padding:16px */
.win95-projects-file-row  /* flex row items-center gap:8px padding:4px */
.win95-projects-detail    /* flex column gap:8px */
.win95-projects-title     /* 14px bold #000080 */
```

---

## SkillsApp

### Suppression

- Supprimer `div.win95-explorer-addr`
- Supprimer `div.win95-statusbar`
- Remplacer `div.win95-explorer` par `div.win95-skills`

### Layout

Sidebar gauche (catégories) + panel droit (barres de progression).

### Panel compétences

- Titre catégorie : 14px bold `#000080`
- Barres existantes conservées (`win95-progress-track` / `win95-progress-fill`)
- Fond blanc, fond barre : `#e0e0e0`, fill : `#000080`

### Classes CSS

```css
.win95-skills            /* flex column 100% fond blanc */
.win95-skills-body       /* flex row flex:1 overflow:hidden */
.win95-skills-sidebar    /* 110px border-right #d0d0d0 */
.win95-skills-tab        /* bouton texte 11px */
.win95-skills-tab.active /* #000080 bold border-left */
.win95-skills-panel      /* flex:1 overflow-y:auto padding:16px */
.win95-skills-title      /* 14px bold #000080 */
```

---

## ContactApp

### Suppression

- Supprimer `div.win95-explorer-addr`
- Supprimer `div.win95-statusbar`
- Remplacer `div.win95-explorer` par `div.win95-contact`

### Layout

Sidebar gauche (types de contact) + panel droit (détail de l'entrée sélectionnée).

### Panel contact

- Icône : 32px
- Nom : 13px bold
- Rôle : 11px `#555`
- Valeur cliquable : `color: #000080`, `text-decoration: underline`
- Note de disponibilité : 10px `#555`

### Classes CSS

```css
.win95-contact            /* flex column 100% fond blanc */
.win95-contact-body       /* flex row flex:1 overflow:hidden */
.win95-contact-sidebar    /* 110px border-right #d0d0d0 */
.win95-contact-tab        /* bouton texte 11px */
.win95-contact-tab.active /* #000080 bold border-left */
.win95-contact-panel      /* flex:1 overflow-y:auto padding:16px */
.win95-contact-header     /* flex row items-center gap:10px border-bottom #d0d0d0 pb:8px */
```

---

## Critères de succès

- [ ] HOME fond blanc, titre 32px bleu, liens soulignés
- [ ] Sidebar fond blanc, bordure droite grise, item actif bleu + souligné + ○
- [ ] BioNotepad : pas de barre d'adresse, pas de statusbar, fond blanc
- [ ] ProjectsExplorer : pas de barre d'adresse, pas de statusbar, fond blanc
- [ ] SkillsApp : pas de barre d'adresse, pas de statusbar, fond blanc, barres bleues
- [ ] ContactApp : pas de barre d'adresse, pas de statusbar, fond blanc
- [ ] Toutes les sections : sidebar gauche de navigation persistante
- [ ] Aucune régression sur Window, Taskbar, ShutdownSequence, scène 3D
