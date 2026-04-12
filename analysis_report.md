# Audit Complet — henryheffernan.com
**Généré le :** 2026-04-12  
**Outil :** Puppeteer v21+ (headless Chromium, viewport 1440×900)  
**Sources analysées :**  
- `https://henryheffernan.com/` — scène Three.js principale  
- `https://os.henryheffernan.com/` — application Win95 React (app séparée)  
- `bundle.cf64568055686c74.js` (781KB) — bundle Three.js  
- `static/js/main.fe030160.js` (422KB) — bundle OS React  

---

## 1. Computed Styles des Fenêtres Win95

### Architecture technique

L'OS Win95 est une **application React séparée** servie sur `os.henryheffernan.com`.  
Elle est intégrée dans la scène Three.js principale via un **`CSS3DObject`** (Three.js CSS3D Renderer) — pas une balise `<iframe>` HTML standard, ni `@react-three/drei Html`.

> **Conséquence directe pour notre projet :** notre approche via `<Html transform>` de Drei est fonctionnellement équivalente. La différence est architecturale, pas visuelle.

### Box-Shadow — Système de bordures 3D

Heffernan utilise exclusivement la technique **`box-shadow: inset` multi-couches** pour les effets 3D. Zéro `border-image`, zéro `backdrop-filter`.

```css
/* ── Deux helpers CSS définis dans l'OS app ── */
--border-raised-outer: inset -1px -1px var(--window-frame),
                       inset  1px  1px var(--button-highlight);

--border-raised-inner: inset -2px -2px var(--button-shadow),
                       inset  2px  2px var(--button-face);

/* Utilisation : */
.big-button-container {
  box-shadow: var(--border-raised-outer), var(--border-raised-inner);
}

/* Input / zone sunken : */
--border-field: inset -1px -1px var(--button-highlight),
                inset  1px  1px var(--button-shadow),
                inset -2px -2px var(--button-face),
                inset  2px  2px var(--window-frame);
```

### Palette de couleurs exacte (CSS Custom Properties)

| Variable CSS | Valeur | Rôle |
|---|---|---|
| `--button-highlight` | `#ffffff` | Bord haut-gauche (lumière) |
| `--button-face` | `#747474` | Face médiane bouton |
| `--button-shadow` | `grey` → `#808080` | Bord bas-droite (ombre) |
| `--window-frame` | `#2b2b2b` | Cadre extérieur sombre |
| `--surface` | `silver` → `#c0c0c0` | Surface principale Win95 |
| `--surface-hover` | `#e9e9e9` | Hover surface |
| `--border-field` | (voir ci-dessus) | Zone d'input sunken |

**Desktop :** background `#008080` (teal Win95 classique).

### Border-Image
**Non utilisé.** Toutes les bordures 3D sont réalisées par `box-shadow: inset`.

### Backdrop-Filter / Background-Blur
**Non utilisé.** Aucune fenêtre ne possède d'effet de flou. L'OS est entièrement opaque — cohérent avec l'esthétique Win95 1995.

### Desktop Shortcut Icons
```
Taille icône : 48×48 px
Position X   : 24 px (marge gauche)
Espacement Y : 104 px entre chaque icône (48px icône + 56px label/gap)
Icônes       : MyShowcase → TheOregonTrail → Doom → Scrabble → Henordle → Credits
```

---

## 2. Analyse Bundle.js — Librairies Window Management

### Bundles identifiés

| Fichier | Taille | Domaine |
|---|---|---|
| `bundle.cf64568055686c74.js` | 781 KB | `henryheffernan.com` (scène 3D) |
| `js-dos/js-dos.js` | 541 KB | `os.henryheffernan.com` (émulateur DOS) |
| `static/js/main.fe030160.js` | 422 KB | `os.henryheffernan.com` (OS React) |

### Librairies détectées par bundle

#### `bundle.cf64568055686c74.js` — Scène Three.js
| Librairie | Signatures trouvées |
|---|---|
| **React 18** | `react`, `createElement`, `useState`, `useEffect` |
| **React DOM** | `react-dom` |
| **Three.js** | `THREE`, `WebGLRenderer`, `BufferGeometry`, `three` |
| **Zustand** | `create(` |
| **CSS3D / Three** | ✅ `CSS3DObject`, `CSS3DSprite` |

#### `static/js/main.fe030160.js` — App OS Win95
| Librairie | Signatures trouvées |
|---|---|
| **React 18** | `react`, `createElement`, `useState`, `useEffect` |
| **React DOM** | `react-dom` |
| **Framer Motion** | `motion` |
| **Zustand** | `create(` |
| **React Spring** | `animated` |
| **⭐ Interact.js** | `interact`, `Interact` |
| **Redux** | `redux` |
| **Emotion/SC** | `emotion` |

### Conclusion Window Management

> **Heffernan N'utilise PAS de librairie dédiée "Window Manager".**

Le drag & resize des fenêtres Win95 est géré par **[Interact.js](https://interactjs.io/)** — une librairie JavaScript bas-niveau pour les interactions pointer (drag, resize, drop, multi-touch). Ce n'est pas une librairie "Win95 windows" préfabriquée.

**Stack technique OS Win95 :**
```
Framer Motion  → animations ouverture/fermeture des fenêtres
Interact.js    → drag & resize (titlebar drag, poignée resize)
Zustand        → state management (z-index, liste des fenêtres)
React Spring   → transitions secondaires (menus, start menu)
Emotion        → CSS-in-JS pour certains composants
Redux          → state global secondaire
```

**Comparaison avec notre implémentation :**

| Aspect | Heffernan | Notre projet |
|---|---|---|
| Drag fenêtres | Interact.js | Framer Motion `useDragControls` |
| Animations | Framer Motion | Framer Motion |
| State z-index | Zustand (`++_zCounter`) | Zustand (`++_zCounter`) ✅ Identique |
| Resize | Interact.js | `mousedown` + `window.addEventListener` |
| CSS borders | CSS Custom Props + box-shadow | CSS Custom Props + box-shadow ✅ Identique |

---

## 3. Taskbar — Espacements et Mesures Précises

### Élément Taskbar (démarrage de page)

> **Note :** la vraie taskbar Win95 est rendue dans l'OS app (`os.henryheffernan.com`) en contexte CSS3D. Les mesures ci-dessous proviennent de l'analyse DOM directe de l'OS app.

#### Zone "Start" + barre
```
Position    : x=79, y=873  (en bas, viewport 900px → hauteur taskbar ≈ 27px)
Dimensions  : 298×25 px
Background  : linear-gradient checkerboard (pattern Win95 hatching)
              linear-gradient(45deg, #fff 25%, transparent 25%) 0 0 / 4px 4px
              linear-gradient(-45deg, #fff 25%, transparent 25%) 0 0 / 4px 4px
Border      : top: 1px solid #86898d (ombre)
              left: 1px solid #86898d
              right: 1px solid #c3c6ca (highlight)
              bottom: 1px solid #c3c6ca
Padding     : 0px 0px 0px 4px (4px left only)
```

#### Bouton "Start"
```
Texte       : "Start"
Font        : lores-15-bold-alt-oakland (Adobe Typekit — police bitmap pixelisée)
Font-size   : 18px
Position    : x=32, y=875
Dimensions  : 35×21 px
Padding     : 0px (aucun)
Cursor      : pointer
```

#### Desktop Shortcut Icons (sidebar gauche)
```
Taille      : 48×48 px
Position X  : 24 px (gauche)
Y de base   : 16 px
Espacement  : 104 px (icône + label)
IDs trouvés : desktop-shortcut-MyShowcase
              desktop-shortcut-TheOregonTrail
              desktop-shortcut-Doom
              desktop-shortcut-Scrabble
              desktop-shortcut-Henordle
              desktop-shortcut-Credits
```

---

## 4. Typographie

### Polices Win95 OS App (`os.henryheffernan.com`)

| Police | Source | Usage |
|---|---|---|
| `MSSerif` / `MSSansSerif` | `/static/media/MSSansSerif.ttf` | UI système (fenêtres, boutons, menus) |
| `Millennium` | `/static/media/Millennium.ttf` | Texte de contenu (paragraphes) |
| `MillenniumBold` | `/static/media/Millennium-Bold.ttf` | Titres, labels gras |
| `Terminal` | `/static/media/Terminal.ttf` | Monospace / texte terminal |
| `lores-15-bold-alt-oakland` | Adobe Typekit (CDN) | Barre taskbar "Start", toolbar |
| `gastromond` | Adobe Typekit | `h1` (grands titres) |

### Règles typographiques CSS relevées
```css
/* Paragraphes */
p { font-family: Millennium, Times New Roman, serif; font-size: 18px; }
p b { font-family: MillenniumBold, Times New Roman, serif; }

/* Titres */
h1 { font-family: gastromond, sans-serif; font-size: 64px; }
h2 { font-family: MillenniumBold; font-size: 32px; }
h3, h4 { font-family: MillenniumBold; letter-spacing: 0; }
h3 { font-size: 24px; }
h4 { font-size: 18px; }

/* Toolbar */
.toolbar-text { font-family: lores-15-bold-alt-oakland; font-size: 18px; }
.showcase-header { font-family: lores-15-bold-alt-oakland; font-size: 15px; color: #fff; }
```

---

## 5. Autres Propriétés CSS Notables

### Input active (zone d'édition)
```css
input:active, input:focus,
textarea:active, textarea:focus {
  background-color: #fbffc4;  /* jaune pâle */
  outline: none;
}
```

### Sélection de texte
```css
* { -webkit-user-select: none; user-select: none; }
```
Toute sélection de texte est désactivée globalement — comportement authentique Win95.

### Animation jitter (scène 3D principale)
```css
.jitter {
  animation: jittery 0.3s ease-in-out infinite;
}
@keyframes jittery {
  10% { transform: translate(-0.1px, -0.15px) scale(1,1); }
  30% { transform: translate(-0.2px, -0.25px) scale(1,1); }
  /* micro-translations < 0.25px pour effet CRT screen */
}
```

### Blinking cursor
```css
.blinking-cursor {
  background-color: #fff;
  width: 0.8em; height: 0.15em;
  animation: 0.65s blink step-end infinite;
}
@keyframes blink { 50% { background-color: white; } }
```

### Notifications
```css
.notyf, .notyf-announcer { opacity: 0 !important; }
/* Les notifications système sont cachées */
```

---

## 6. Résumé Exécutif

| Point d'audit | Résultat |
|---|---|
| **Librairie Window Management** | ❌ Aucune dédiée — Interact.js pour drag/resize |
| **Borders 3D** | `box-shadow: inset` 4 couches (no border-image) |
| **Backdrop-filter / blur** | ❌ Non utilisé |
| **Palette couleurs** | `#fff` / `#747474` / `#808080` / `#2b2b2b` / `#c0c0c0` |
| **Framework fenêtres** | React + Zustand + Framer Motion + Interact.js |
| **Integration 3D** | CSS3DObject/CSS3DSprite (Three.js natif) |
| **Taskbar height** | ≈ 27px |
| **Start button font** | `lores-15-bold-alt-oakland` (Typekit bitmap) |
| **Icon size** | 48×48 px, espacement 104px vertical |
| **Typo UI** | MSSansSerif.ttf (custom embed) |
| **Typo contenu** | Millennium + MillenniumBold (custom embed) |
| **Desktop bg** | `#008080` (teal) |
| **Scène principale** | Three.js + CSS3DRenderer + Zustand |

---

*Rapport généré par audit Puppeteer automatisé — voir `scripts/heffernan-analysis/` pour les fichiers JSON bruts.*
