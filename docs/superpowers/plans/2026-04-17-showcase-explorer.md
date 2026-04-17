# ShowcaseExplorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regrouper les 4 fenêtres portfolio (Bio, Projets, Compétences, Contact) dans une unique fenêtre `ShowcaseExplorer` avec page HOME splash et navigation sidebar — style Henry Heffernan, scène 3D conservée.

**Architecture:** Nouveau composant `ShowcaseExplorer.jsx` avec state `section` ('home'|'bio'|'projects'|'skills'|'contact'). HOME = layout plein écran centré. Autres sections = sidebar 130px + panel droit qui rend le composant enfant existant. Desktop réduit à 1 icône avec auto-ouverture au boot.

**Tech Stack:** React 19, Zustand 5, Framer Motion 12, Vite 8, win95.css design system existant.

---

## File Map

| Action | Fichier |
|---|---|
| CREATE | `src/components/OS/apps/ShowcaseExplorer.jsx` |
| MODIFY | `src/components/OS/apps/BioNotepad.jsx` |
| MODIFY | `src/components/OS/Desktop.jsx` |
| MODIFY | `src/components/OS/Taskbar.jsx` |
| MODIFY | `src/styles/win95.css` |

---

## Task 1 — CSS ShowcaseExplorer dans `win95.css`

**Files:**
- Modify: `src/styles/win95.css`

- [ ] **Step 1: Ajouter les styles à la fin de `win95.css`**

```css
/* ═══════════════════════════════════════════════════════════════
   SHOWCASE EXPLORER — HOME splash + sidebar layout
   ═══════════════════════════════════════════════════════════════ */

/* HOME — plein écran centré */
.win95-showcase-home {
  display:         flex;
  align-items:     center;
  justify-content: center;
  height:          100%;
  background:      var(--w-surface);
}

.win95-showcase-home-content {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  gap:            6px;
  text-align:     center;
}

.win95-showcase-home-title {
  font-family: var(--w-font);
  font-size:   22px;
  font-weight: bold;
  color:       #000;
  margin:      0;
}

.win95-showcase-home-role {
  font-family: var(--w-font);
  font-size:   13px;
  color:       var(--w-darker);
  margin:      0;
}

.win95-showcase-home-sub {
  font-family: var(--w-font);
  font-size:   10px;
  color:       var(--w-darker);
  margin:      0 0 10px 0;
}

.win95-showcase-home-nav {
  display: flex;
  gap:     12px;
}

.win95-showcase-home-link {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-blue);
  text-decoration: underline;
  background:      none;
  border:          none;
  cursor:          pointer;
  padding:         0;
}

.win95-showcase-home-link:hover { color: #000; }

/* Layout avec sidebar */
.win95-showcase {
  display:  flex;
  height:   100%;
  overflow: hidden;
}

.win95-showcase-sidebar {
  width:           130px;
  flex-shrink:     0;
  border-right:    1px solid var(--w-dark);
  background:      var(--w-surface);
  display:         flex;
  flex-direction:  column;
  padding:         8px 0 0 0;
}

.win95-showcase-sidebar-header {
  padding:       0 8px 8px 8px;
  border-bottom: 1px solid var(--w-dark);
  margin-bottom: 4px;
}

.win95-showcase-sidebar-name {
  font-family:  var(--w-font);
  font-size:    12px;
  font-weight:  bold;
  color:        #000;
  margin:       0;
  line-height:  1.4;
}

.win95-showcase-sidebar-brand {
  font-family: var(--w-font);
  font-size:   10px;
  color:       var(--w-darker);
  margin:      2px 0 0 0;
}

.win95-showcase-sidebar-nav {
  display:        flex;
  flex-direction: column;
}

.win95-showcase-nav-item {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-blue);
  text-align:      left;
  background:      none;
  border:          none;
  cursor:          pointer;
  padding:         4px 8px;
  text-decoration: none;
}

.win95-showcase-nav-item:hover  { text-decoration: underline; }
.win95-showcase-nav-item.active { color: #000; text-decoration: none; }

/* Panel droit — contient le composant enfant (BioNotepad etc.) */
.win95-showcase-panel {
  flex:           1;
  display:        flex;
  flex-direction: column;
  overflow:       hidden;
}
```

- [ ] **Step 2: Vérifier**

`npm run dev` — aucune erreur CSS console.

- [ ] **Step 3: Commit**

```bash
git add src/styles/win95.css
git commit -m "feat(css): add ShowcaseExplorer HOME + sidebar styles"
```

---

## Task 2 — Créer `ShowcaseExplorer.jsx`

**Files:**
- Create: `src/components/OS/apps/ShowcaseExplorer.jsx`

- [ ] **Step 1: Créer le fichier**

`src/components/OS/apps/ShowcaseExplorer.jsx` :
```jsx
// src/components/OS/apps/ShowcaseExplorer.jsx
import { useState } from 'react'
import { BioNotepad }       from './BioNotepad'
import { ProjectsExplorer } from './ProjectsExplorer'
import { SkillsApp }        from './SkillsApp'
import { ContactApp }       from './ContactApp'

const NAV = [
  { id: 'home',     label: 'HOME'        },
  { id: 'bio',      label: 'BIOGRAPHIE'  },
  { id: 'projects', label: 'PROJETS'     },
  { id: 'skills',   label: 'COMPÉTENCES' },
  { id: 'contact',  label: 'CONTACT'     },
]

function getPanel(section) {
  switch (section) {
    case 'bio':      return <BioNotepad />
    case 'projects': return <ProjectsExplorer />
    case 'skills':   return <SkillsApp />
    case 'contact':  return <ContactApp />
    default:         return null
  }
}

export function ShowcaseExplorer() {
  const [section, setSection] = useState('home')

  if (section === 'home') {
    return (
      <div className="win95-showcase-home">
        <div className="win95-showcase-home-content">
          <h1 className="win95-showcase-home-title">Tyméo Poncelet</h1>
          <p className="win95-showcase-home-role">Student</p>
          <p className="win95-showcase-home-sub">BTS SIO SISR — Recherche stage</p>
          <nav className="win95-showcase-home-nav">
            {NAV.filter((n) => n.id !== 'home').map((n) => (
              <button
                key={n.id}
                className="win95-showcase-home-link"
                onClick={() => setSection(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    )
  }

  return (
    <div className="win95-showcase">
      <div className="win95-showcase-sidebar">
        <div className="win95-showcase-sidebar-header">
          <p className="win95-showcase-sidebar-name">Tyméo<br />Poncelet</p>
          <p className="win95-showcase-sidebar-brand">Portfolio</p>
        </div>
        <nav className="win95-showcase-sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`win95-showcase-nav-item${section === n.id ? ' active' : ''}`}
              onClick={() => setSection(n.id)}
            >
              {section === n.id ? '○ ' : ''}{n.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="win95-showcase-panel">
        {getPanel(section)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier**

`npm run dev` — pas d'erreur d'import (les 4 composants enfants existent déjà).

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/ShowcaseExplorer.jsx
git commit -m "feat: create ShowcaseExplorer — HOME splash + sidebar nav wrapping 4 apps"
```

---

## Task 3 — Modifier `BioNotepad.jsx` — onglet Expérience

**Files:**
- Modify: `src/components/OS/apps/BioNotepad.jsx`

- [ ] **Step 1: Réécrire le fichier entier**

Remplacer l'intégralité de `src/components/OS/apps/BioNotepad.jsx` par :

```jsx
// src/components/OS/apps/BioNotepad.jsx
import { useState } from 'react'

const SECTIONS = [
  {
    id:    'formation',
    icon:  '📋',
    label: 'Formation',
    path:  'C:\\Portfolio\\Biographie\\Formation',
    text: `BTS SIO — Services Informatiques aux Organisations
Spécialisation SISR (Systèmes, Réseaux & Cybersécurité)
Pôle Sup DE LA SALLE — Promotion 2025-2026

Baccalauréat, Spécialité Maths/AMC
Mention Assez Bien — Lycée Jean Brito
Promotion 2023-2024`,
  },
  {
    id:    'objectif',
    icon:  '🎯',
    label: 'Objectif',
    path:  'C:\\Portfolio\\Biographie\\Objectif',
    text: `Étudiant passionné par les infrastructures réseau
et la cybersécurité. Je recherche activement un
stage dans les domaines suivants :

  • Administration systèmes & réseaux
  • Cybersécurité offensive / défensive
  • Supervision et monitoring`,
  },
  {
    id:    'experience',
    icon:  '💼',
    label: 'Expérience',
    path:  'C:\\Portfolio\\Biographie\\Expérience',
    text: `ÉQUIPIER — McDonald's, Bain de Bretagne
Juillet-Août 2024 · Février-Août 2025
  • Travail en équipe et coordination
  • Rigueur et respect des procédures
  • Normes d'hygiène et sécurité alimentaire

STAGE — Cabinet Kaliame (expert-comptable)
Février 2023 — 3 jours
  • Tri, classement et vérification de
    documents comptables
  • Organisation et rigueur administrative`,
  },
  {
    id:    'contact',
    icon:  '📞',
    label: 'Contact',
    path:  'C:\\Portfolio\\Biographie\\Contact',
    text: `Email   : tymeo.poncelet@gmail.com
Tél     : 06 10 25 32 34
LinkedIn: linkedin.com/in/tyméo-poncelet-83b667383
GitHub  : github.com/tymeoponcelet`,
  },
]

export function BioNotepad() {
  const [active, setActive] = useState(SECTIONS[0])

  return (
    <div className="win95-explorer">

      {/* Barre d'adresse */}
      <div className="win95-explorer-addr">
        <span>Adresse :</span>
        <div className="win95-explorer-addr-field">{active.path}</div>
      </div>

      {/* Corps */}
      <div className="win95-explorer-body">

        {/* Sidebar */}
        <div className="win95-explorer-sidebar">
          {SECTIONS.map((s) => (
            <div
              key={s.id}
              className={`win95-explorer-sidebar-item${active.id === s.id ? ' active' : ''}`}
              onClick={() => setActive(s)}
            >
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau */}
        <div className="win95-explorer-main">
          <pre style={{
            fontFamily: '"Courier New", monospace',
            fontSize:   11,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            margin:     0,
            color:      '#000',
          }}>
            {active.text}
          </pre>
        </div>
      </div>

      {/* Statusbar */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{SECTIONS.length} section(s)</span>
        <span className="win95-statusbar-field">{active.label}</span>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Vérifier**

Ouvrir la fenêtre Biographie → sidebar doit afficher 4 onglets : Formation · Objectif · Expérience · Contact (plus de "Compétences").

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/BioNotepad.jsx
git commit -m "feat(BioNotepad): replace Compétences tab with Expérience (CV data)"
```

---

## Task 4 — Modifier `Desktop.jsx` — 1 icône + auto-ouverture

**Files:**
- Modify: `src/components/OS/Desktop.jsx`

- [ ] **Step 1: Réécrire `Desktop.jsx` entièrement**

```jsx
// src/components/OS/Desktop.jsx
import { useRef, useCallback, useState, useEffect } from 'react'
import { AnimatePresence }                          from 'framer-motion'
import { icons }                                    from '../../assets/icons/index.js'
import { useOSStore }                               from '../../stores/osStore'
import { Window }                                   from '../Window/Window'
import { Taskbar }                                  from './Taskbar'
import { ShowcaseExplorer }                         from './apps/ShowcaseExplorer'

/* ── Registre de la fenêtre Showcase ─────────────────────────── */

const SHOWCASE_WINDOW = {
  appId:   'showcase',
  title:   'Portfolio — Tyméo Poncelet',
  icon:    '🖥️',
  width:   640,
  height:  480,
  content: <ShowcaseExplorer />,
}

export const ICONS = [
  {
    id:      'showcase',
    label:   'Portfolio',
    iconSrc: icons.showcaseIcon,
    pos:     { top: 6, left: 10 },
    window:  SHOWCASE_WINDOW,
  },
]

/* ── DesktopShortcut ─────────────────────────────────────────── */

function DesktopShortcut({ entry, isSelected, onSelect, onOpen }) {
  const { iconSrc, label, pos } = entry
  const timerRef = useRef(null)

  const handleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onOpen()
      return
    }
    onSelect()
    timerRef.current = setTimeout(() => { timerRef.current = null }, 300)
  }, [onSelect, onOpen])

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}`}
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={handleClick}
      aria-label={`Ouvrir ${label}`}
    >
      <div className="win95-shortcut-icon-wrap">
        {isSelected && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${iconSrc})` }}
          />
        )}
        <img src={iconSrc} alt={label} className="win95-shortcut-img" />
      </div>
      <span className="win95-shortcut-label">{label}</span>
    </button>
  )
}

/* ── Desktop ─────────────────────────────────────────────────── */

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)
  const [selected, setSelected] = useState(null)

  /* Auto-ouverture du ShowcaseExplorer au boot */
  useEffect(() => {
    openWindow(SHOWCASE_WINDOW)
  }, []) // eslint-disable-line

  const contentRefs = useRef({})
  windows.forEach((w) => {
    if (!contentRefs.current[w.id]) {
      const icon = ICONS.find((i) => i.id === w.appId)
      contentRefs.current[w.id] = icon?.window.content ?? w.content ?? null
    }
  })
  const openIds = new Set(windows.map((w) => w.id))
  Object.keys(contentRefs.current).forEach((id) => {
    if (!openIds.has(Number(id))) delete contentRefs.current[id]
  })

  const handleOpen = useCallback((icon) => { openWindow(icon.window) }, [openWindow])

  return (
    <div className="win95-desktop" onClick={() => setSelected(null)}>

      {ICONS.map((icon) => (
        <DesktopShortcut
          key={icon.id}
          entry={icon}
          isSelected={selected === icon.id}
          onSelect={() => setSelected(icon.id)}
          onOpen={() => handleOpen(icon)}
        />
      ))}

      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} {...win}>
            {contentRefs.current[win.id]}
          </Window>
        ))}
      </AnimatePresence>

      <Taskbar />
    </div>
  )
}
```

- [ ] **Step 2: Vérifier**

`npm run dev` → après le boot screen, la fenêtre ShowcaseExplorer s'ouvre automatiquement et affiche la page HOME.

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/Desktop.jsx
git commit -m "feat(Desktop): single Portfolio icon + auto-open ShowcaseExplorer on boot"
```

---

## Task 5 — Modifier `Taskbar.jsx` — START_ITEMS

**Files:**
- Modify: `src/components/OS/Taskbar.jsx`

- [ ] **Step 1: Remplacer les 4 START_ITEMS par 1**

Dans `src/components/OS/Taskbar.jsx`, remplacer le bloc `START_ITEMS` :
```js
const START_ITEMS = [
  { label: 'Biographie',  icon: '📄', id: 'bio'      },
  { label: 'Mes Projets', icon: '📁', id: 'projects' },
  { label: 'Compétences', icon: '⚙️', id: 'skills'   },
  { label: 'Contact',     icon: '📬', id: 'contact'  },
  { divider: true },
  { label: 'Aide',        icon: '❓', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…',   icon: '🔌', id: 'shutdown'  },
]
```
par :
```js
const START_ITEMS = [
  { label: 'Portfolio', icon: '🖥️', id: 'showcase' },
  { divider: true },
  { label: 'Aide',      icon: '❓', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…', icon: '🔌', id: 'shutdown' },
]
```

- [ ] **Step 2: Vérifier**

Menu Démarrer → 1 seul item "Portfolio" → clic → ouvre / remet au premier plan le ShowcaseExplorer.

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/Taskbar.jsx
git commit -m "feat(Taskbar): replace 4 START_ITEMS with single Portfolio entry"
```

---

## Task 6 — Vérification finale

- [ ] **Step 1: Build de production**

```bash
npm run build
```

Expected : `✓ built` sans erreurs (le warning chunk size Three.js est normal).

- [ ] **Step 2: Checklist visuelle**

| Élément | Attendu |
|---|---|
| Boot screen | Barre de progression → bureau |
| Auto-ouverture | ShowcaseExplorer s'ouvre sans clic |
| HOME | "Tyméo Poncelet" / "Student" / "BTS SIO SISR — Recherche stage" + 4 liens nav |
| Clic "BIOGRAPHIE" | Sidebar apparaît, section Biographie active (○ BIOGRAPHIE) |
| Sidebar header | "Tyméo Poncelet" + "Portfolio" |
| Navigation sidebar | Clic HOME → retour splash, clic autre section → change le panel |
| BioNotepad onglets | Formation · Objectif · Expérience · Contact (pas de Compétences) |
| Onglet Expérience | McDonald's + Stage Kaliame avec dates |
| ProjectsExplorer | Inchangé |
| SkillsApp | Inchangé |
| ContactApp | Inchangé |
| Bureau | 1 seule icône "Portfolio" |
| Menu Démarrer | 1 seul item "Portfolio" |
| Shutdown | Toujours fonctionnel |
| Scène 3D | Inchangée |

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat: ShowcaseExplorer complete — single window portfolio, HOME splash, sidebar nav"
```
