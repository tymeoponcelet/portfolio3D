# Design Spec — Win95 OS (style Henry Heffernan)
Date : 2026-04-16

## Contexte

Le portfolio-3d intègre un OS Windows 95 affiché sur un écran CRT 3D (Three.js).
L'objectif est de reconstruire les composants visuels de cet OS en s'inspirant
directement du code source de henryheffernan.com, sans copier les mini-jeux.

## Périmètre — Approche B (ciblée)

### Ce qui reste intact
- `src/components/Window/Window.jsx` — drag, resize, minimize, maximize, focus
- `src/stores/osStore.js` — gestion Zustand des fenêtres
- `src/styles/win95.css` — design system Heffernan-accurate complet
- `src/components/OS/OS.jsx` — boot screen (ShutdownSequence greffée en plus)

### Ce qui est reconstruit ou créé

| Fichier | Action |
|---|---|
| `public/icons/*.png` | Ajout — icônes pixel-art Win95 32×32 |
| `src/components/OS/Desktop.jsx` | Refactor — DesktopShortcut Henry-style |
| `src/components/OS/Taskbar.jsx` | Refactor — Toolbar Henry-style |
| `src/components/OS/ShutdownSequence.jsx` | Nouveau |
| `src/components/Window/DragIndicator.jsx` | Nouveau |
| `src/components/Window/ResizeIndicator.jsx` | Nouveau |
| `src/components/OS/apps/BioNotepad.jsx` | Refactor UI — Explorer-style |
| `src/components/OS/apps/ProjectsExplorer.jsx` | Refactor UI — uniformisé |
| `src/components/OS/apps/SkillsApp.jsx` | Refactor UI — Explorer-style |
| `src/components/OS/apps/ContactApp.jsx` | Refactor UI — Explorer-style |

---

## Section 1 — Icons PNG

**Source** : icônes pixel-art Win95 32×32, domaine public / archives Win95.

| Usage | Fichier | Taille |
|---|---|---|
| Bureau Bio | `public/icons/notepad.png` | 32×32 |
| Bureau Projets | `public/icons/explorer.png` | 32×32 |
| Bureau Compétences | `public/icons/controlpanel.png` | 32×32 |
| Bureau Contact | `public/icons/mail.png` | 32×32 |
| Bouton Start | `public/icons/windowsStartIcon.png` | 18×18 |
| Tray volume | `public/icons/volumeOn.png` | 18×18 |
| Resize handle | `public/icons/windowResize.png` | 12×12 |
| Contrôle minimize | `public/icons/minimize.png` | 16×14 |
| Contrôle maximize | `public/icons/maximize.png` | 16×14 |
| Contrôle close | `public/icons/close.png` | 16×14 |

Un fichier `src/assets/icons/index.js` exporte toutes les icônes par nom (pattern Henry).

---

## Section 2 — DesktopShortcut (Desktop.jsx)

**Comportement** (identique Henry) :
- 1 clic → sélection de l'icône
- Double-clic → ouverture de la fenêtre
- Clic extérieur → désélection

**Visuel sélectionné** :
- Overlay checkerboard bleu via `backgroundImage` gradient 2×2px
- `WebkitMask: url(icon.png)` pour confiner l'effet à la forme de l'icône
- Fond texte bleu (`--w-blue`)

**Disposition** :
- Icônes positionnées en colonne absolue côté gauche (top: i * 104)
- Texte blanc, `W95FA`, 8px, centré, `textOverflow: wrap`
- Icône 32×32, `image-rendering: pixelated`

---

## Section 3 — Taskbar (Taskbar.jsx)

**Structure** :
```
[ ▣ Démarrer ] | [ tab1 ] [ tab2 ] ...  | 🔊 2:32 PM
```

**Bouton Démarrer** :
- Icône `windowsStartIcon.png` 18px + texte bold "Démarrer"
- État normal : `--border-raised`
- État actif/ouvert : `--border-sunken` + checkerboard pattern 4×4px (comme Henry)

**Menu Démarrer** (pop-up au-dessus de la taskbar) :
- Sidebar verticale gauche, dégradé `--w-title-from → --w-title-to`, texte "PonceletOS" écriture verticale
- Items : Biographie 📄, Mes Projets 📁, Compétences ⚙️, Contact 📬, séparateur, Arrêter… 🔌
- Hover item : fond `--w-blue`, texte blanc
- Fermeture au clic extérieur (mousedown global)

**Tabs fenêtres ouvertes** :
- Icône 16px + nom tronqué, max-width 200px
- État actif (fenêtre au premier plan, non minimisée) : checkerboard + bordure inversée
- Clic : toggle minimize/focus

**Tray** :
- `volumeOn.png` 18px
- Heure format `h:mm AM/PM` (en français : format 12h), mise à jour toutes les 5s
- Bordure inset `--border-sunken`

---

## Section 4 — ShutdownSequence (ShutdownSequence.jsx)

**Mécanisme** (identique Henry) :
- Fond `#1d2e2f`, texte blanc `monospace`
- Curseur clignotant (classe CSS `blinking-cursor`) pendant le chargement initial
- Typewriter char-by-char avec timer 20ms par caractère
- Syntaxe spéciale : `|texte|` = dump instantané, `>ms<` = pause
- Compteur `numShutdowns` pour escalade des messages

**Messages personnalisés Tyméo** :

| Arrêt | Message |
|---|---|
| 1–3 | Tentative connexion `PONCELET-PC/01`, erreur socket, reboot forcé |
| 4 | "Tu veux vraiment arrêter ce portfolio ? Il n'existe pas de shutdown ici." |
| 5 | "Sérieusement… j'ai passé des semaines sur ce site." |
| 6 | ">:(" |
| 7+ | Escalade créative progressive |

**Cycle** : après chaque séquence → `setShutdown(false)` → retour au bureau.

---

## Section 5 — DragIndicator & ResizeIndicator

> Note d'adaptation : Henry utilise des événements DOM bruts (dragRef DOM).
> Notre Window.jsx utilise Framer Motion (`useMotionValue` + `dragControls`).
> L'implémentation est adaptée en conséquence.

**DragIndicator** (`Window/DragIndicator.jsx`) :
- `div` position absolute couvrant toute la fenêtre (`inset: 0`)
- Contour `2px dashed rgba(255,255,255,0.6)`, `mixBlendMode: difference`
- Rendu conditionnel via prop `visible` (boolean)
- `pointerEvents: none`, `zIndex: 9999`

**ResizeIndicator** (`Window/ResizeIndicator.jsx`) :
- Même principe — contour pointillés visible pendant resize
- `pointerEvents: none`, `zIndex: 9999`

**Intégration dans Window.jsx** :
- État `isDragging` (boolean) géré via `onDragStart` / `onDragEnd` Framer Motion
- État `isResizing` déjà présent — utilisé directement
- `<DragIndicator visible={isDragging} />` et `<ResizeIndicator visible={isResizing} />`
  rendus à l'intérieur de la `motion.div` de la fenêtre
- Pas de refs DOM supplémentaires — compatibilité totale avec le drag Framer Motion existant

---

## Section 6 — Apps Explorer-style (×4)

**Layout commun** à toutes les apps :

```
┌──────────────────────────────────────────┐
│ Adresse : C:\[chemin courant]            │  ← barre d'adresse (--border-sunken)
├────────────┬─────────────────────────────┤
│  Sidebar   │  Panneau principal          │
│  (140px)   │  (flex: 1, overflow auto)   │
│            │                             │
│  items     │  contenu sélectionné        │
│  cliquables│                             │
└────────────┴─────────────────────────────┘
│ n objet(s) │ [nom sélection]             │  ← statusbar (.win95-statusbar)
```

### BioNotepad.jsx
- **Sidebar** : sections — `📋 Formation`, `🎯 Objectif`, `🔧 Compétences`, `📞 Contact`
- **Panneau** : texte de la section active, style notepad (font-mono, pre-wrap)
- **Adresse** : `C:\Portfolio\Biographie\[section]`

### ProjectsExplorer.jsx
- Layout déjà similaire, uniformisé aux classes communes
- **Sidebar** : dossiers Réseau, Cybersécurité, Supervision
- **Panneau droit** : liste fichiers en haut + preview en bas (existant conservé)
- **Adresse** : `C:\Projets\[dossier]`

### SkillsApp.jsx
- **Sidebar** : catégories — `🖧 Infrastructure`, `🔐 Cybersécurité`, `🐧 Linux`
- **Panneau** : liste de compétences avec barres de progression Win95 (sunken border + fill bleu)
- **Adresse** : `C:\Panneau de configuration\[catégorie]`

### ContactApp.jsx
- **Sidebar** : entrées — `📧 Email`, `📞 Téléphone`, `💼 LinkedIn`
- **Panneau** : fiche contact avec icône, valeur, bouton copier style Win95
- **Adresse** : `C:\Carnet d'adresses\[entrée]`

---

## Contraintes techniques

- Toutes les icônes PNG chargées via `import` statique (pattern Henry) dans `src/assets/icons/index.js`
- `image-rendering: pixelated` sur toutes les icônes PNG
- Pas de nouveaux packages — uniquement ce qui est déjà installé (React, Framer Motion, Lucide, Zustand, Tailwind)
- Les Lucide icons (Minus/Square/X) dans Window.jsx sont remplacées par les PNG minimize/maximize/close
- Le CSS existant (`win95.css`) est étendu pour les nouveaux composants, jamais modifié en destructif
