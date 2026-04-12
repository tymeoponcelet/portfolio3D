# Win95 Portfolio OS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le contenu placeholder de l'OS Win95 par le vrai portfolio de Tyméo Poncelet (BTS SIO SISR), avec un explorateur de fichiers pour les projets, en s'inspirant des styles CSS de Heffernan (os.henryheffernan.com).

**Architecture:** Store Zustand séparé (`useOSStore`) pour la gestion des fenêtres OS, découplé du store 3D existant. Composants `Window`, `Desktop`, `Taskbar` refactorisés. Contenu des apps dans des fichiers dédiés sous `src/components/OS/apps/`.

**Tech Stack:** React 18, Zustand, Framer Motion, CSS custom properties (Win95 design system), Tailwind absent — tout en CSS modules / inline styles Win95.

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/stores/osStore.js` | **Créer** | useOSStore — gestion fenêtres OS uniquement |
| `src/stores/windowStore.js` | **Modifier** | Garder uniquement screenRef + screenCenter (3D) |
| `src/components/Window/Window.jsx` | **Modifier** | Utilise useOSStore, drag titlebar amélioré |
| `src/styles/win95.css` | **Modifier** | Ajouter scanlines, border box-shadow vars Heffernan |
| `src/components/OS/Desktop.jsx` | **Réécrire** | Icônes réelles Tyméo, utilise useOSStore |
| `src/components/OS/Taskbar.jsx` | **Modifier** | Utilise useOSStore |
| `src/components/OS/OS.jsx` | **Modifier** | Utilise useOSStore |
| `src/components/OS/apps/BioNotepad.jsx` | **Créer** | Bloc-notes avec parcours réel Tyméo |
| `src/components/OS/apps/ProjectsExplorer.jsx` | **Créer** | Explorateur fichiers 2-panneaux avec preview |
| `src/components/OS/apps/ContactApp.jsx` | **Créer** | Carnet d'adresses avec vraies coordonnées |
| `src/components/OS/apps/SkillsApp.jsx` | **Créer** | Panneau de config style compétences |
| `src/components/OS/ScreenContent.jsx` | **Garder tel quel** | C64 BASIC (état non-focalisé) |
| `src/components/Scene/VintagePC.jsx` | **Garder tel quel** | Switch C64↔OS déjà implémenté |

---

## Task 1 — Créer `useOSStore` (Zustand OS)

**Files:**
- Create: `src/stores/osStore.js`
- Modify: `src/stores/windowStore.js` (supprimer la partie windows)

### Pourquoi séparer ?
`windowStore.js` mélange état 3D (screenRef, screenCenter) et état OS (windows). On sépare pour que l'OS soit autonome et testable.

- [ ] **Step 1.1 — Créer `src/stores/osStore.js`**

```js
// src/stores/osStore.js
import { create } from 'zustand'

let _zCounter = 100  // compteur global de z-index (style Heffernan)
let _idCounter = 1

export const useOSStore = create((set, get) => ({
  // ── Fenêtres ──────────────────────────────────────────────────
  windows: [],

  /**
   * Ouvre une fenêtre. Si une fenêtre avec le même `appId` est déjà ouverte,
   * on la focus plutôt que d'en ouvrir une deuxième (comportement Win95).
   */
  openWindow: (config) => {
    const { windows } = get()

    // Déduplification par appId
    if (config.appId) {
      const existing = windows.find((w) => w.appId === config.appId)
      if (existing) {
        get().focusWindow(existing.id)
        if (existing.isMinimized) {
          set((s) => ({
            windows: s.windows.map((w) =>
              w.id === existing.id ? { ...w, isMinimized: false } : w
            ),
          }))
        }
        return existing.id
      }
    }

    const id      = _idCounter++
    const count   = windows.length
    const zIndex  = ++_zCounter

    set((s) => ({
      windows: [
        ...s.windows,
        {
          id,
          appId:       config.appId ?? null,
          title:       config.title ?? 'Sans titre',
          icon:        config.icon  ?? null,
          content:     config.content,
          position:    { x: 40 + (count % 6) * 24, y: 30 + (count % 6) * 24 },
          size:        { width: config.width ?? 440, height: config.height ?? 320 },
          isMinimized: false,
          isMaximized: false,
          zIndex,
        },
      ],
    }))
    return id
  },

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  /**
   * Passe la fenêtre au premier plan en incrémentant un compteur global.
   * Inspiré de la gestion Heffernan : chaque clic → z-index = ++_zCounter.
   */
  focusWindow: (id) => {
    const zIndex = ++_zCounter
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, zIndex } : w
      ),
    }))
  },

  updatePosition: (id, pos) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: pos } : w)),
    })),

  updateSize: (id, size) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, size } : w)),
    })),
}))
```

- [ ] **Step 1.2 — Modifier `src/stores/windowStore.js` : ne garder que le 3D**

```js
// src/stores/windowStore.js
// ATTENTION : Ce store ne gère QUE l'état 3D (mesh-écran, centre world).
// La gestion des fenêtres OS est dans src/stores/osStore.js
import { create } from 'zustand'

export const useWindowStore = create((set) => ({
  screenRef:    null,
  setScreenRef:    (ref) => set({ screenRef: ref }),
  screenCenter: null,
  setScreenCenter: (v)   => set({ screenCenter: v }),
}))
```

- [ ] **Step 1.3 — Vérifier que le build ne casse pas**

```bash
npm run build 2>&1 | tail -20
```
Attendu : erreurs de type "useWindowStore has no property openWindow" dans OS.jsx, Desktop.jsx, Taskbar.jsx → normal, on les corrige dans les tâches suivantes.

---

## Task 2 — Mettre à jour `Window.jsx` pour `useOSStore`

**Files:**
- Modify: `src/components/Window/Window.jsx`

- [ ] **Step 2.1 — Réécrire `Window.jsx`**

```jsx
// src/components/Window/Window.jsx
import { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { useOSStore } from '../../stores/osStore'

export function Window({
  id, title, icon, children,
  position, size, zIndex, isMinimized, isMaximized,
}) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updatePosition, updateSize } =
    useOSStore()

  const dragControls  = useDragControls()
  const x             = useMotionValue(position.x)
  const y             = useMotionValue(position.y)
  const resizeOrigin  = useRef(null)
  const [isResizing, setIsResizing] = useState(false)

  const handleResizeDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.width, h: size.height }

    const onMove = (ev) => {
      if (!resizeOrigin.current) return
      updateSize(id, {
        width:  Math.max(200, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx),
        height: Math.max(120, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my),
      })
    }
    const onUp = () => {
      setIsResizing(false)
      resizeOrigin.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',  onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onUp)
  }, [id, size, updateSize])

  if (isMinimized) return null

  return (
    <motion.div
      className="win95-window"
      style={{
        zIndex,
        width:  isMaximized ? '100%' : size.width,
        height: isMaximized ? 'calc(100% - 28px)' : size.height,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
      }}
      drag={!isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => updatePosition(id, { x: x.get(), y: y.get() })}
      onMouseDown={() => focusWindow(id)}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.88, opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {/* ── Titlebar — drag exclusif à cette zone ── */}
      <div
        className="win95-titlebar"
        onPointerDown={(e) => {
          // Déclencher le drag si on appuie sur la titlebar elle-même
          // (pas sur les boutons qui stoppent la propagation)
          if (!isMaximized && !isResizing) dragControls.start(e)
        }}
        onDoubleClick={() => !isResizing && maximizeWindow(id)}
      >
        <div className="win95-title-left">
          {icon && <span className="win95-title-icon">{icon}</span>}
          <span>{title}</span>
        </div>
        <div className="win95-controls">
          <button
            className="win95-ctrl-btn"
            title="Réduire"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id) }}
          >─</button>
          <button
            className="win95-ctrl-btn"
            title="Agrandir"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id) }}
          >□</button>
          <button
            className="win95-ctrl-btn win95-ctrl-btn--close"
            title="Fermer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); closeWindow(id) }}
          >✕</button>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="win95-body">{children}</div>

      {/* ── Poignée resize ── */}
      {!isMaximized && (
        <div className="win95-resize-handle" onMouseDown={handleResizeDown} />
      )}
    </motion.div>
  )
}
```

Note : `win95-ctrl-btn--close` sera stylisé en rouge au hover dans le CSS (task 3).

- [ ] **Step 2.2 — Vérifier que Window compile**

```bash
npm run build 2>&1 | grep -i "Window"
```

---

## Task 3 — Mettre à jour `win95.css` (Heffernan exact + scanlines)

**Files:**
- Modify: `src/styles/win95.css`

- [ ] **Step 3.1 — Ajouter les variables Heffernan et les scanlines en début de fichier**

Remplacer le bloc `:root` existant par :

```css
:root {
  /* ── Palette Heffernan exacte (os.henryheffernan.com) ── */
  --w-highlight:    #ffffff;   /* bord haut-gauche (brillance) */
  --w-face:         #747474;   /* face médiane du bouton */
  --w-shadow:       #808080;   /* bord bas-droite (ombre) */
  --w-frame:        #2b2b2b;   /* cadre extérieur sombre */
  --w-surface:      #c0c0c0;   /* silver — surface principale */
  --w-surface-h:    #e9e9e9;   /* hover surface */
  --w-input-active: #fbffc4;   /* jaune pâle — input focalisé */

  /* Alias courts (compatibilité code existant) */
  --w-gray:   var(--w-surface);
  --w-white:  var(--w-highlight);
  --w-dark:   var(--w-shadow);
  --w-darker: var(--w-frame);
  --w-black:  #000000;
  --w-blue:   #000080;
  --w-blue2:  #1084d0;
  --w-teal:   #008080;
  --w-font:   "MS Sans Serif", "Microsoft Sans Serif", Tahoma, Arial, sans-serif;

  /* ── Borders 3D (système Heffernan — box-shadow inset) ── */
  --border-raised:
    inset  1px  1px var(--w-highlight),
    inset  2px  2px var(--w-face),
    inset -1px -1px var(--w-frame),
    inset -2px -2px var(--w-shadow);

  --border-sunken:
    inset  1px  1px var(--w-shadow),
    inset  2px  2px var(--w-frame),
    inset -1px -1px var(--w-highlight),
    inset -2px -2px var(--w-face);
}
```

- [ ] **Step 3.2 — Mettre à jour `.win95-window` pour utiliser `box-shadow` au lieu de `border-color`**

Remplacer le bloc `.win95-window` :

```css
.win95-window {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--w-surface);
  box-shadow: var(--border-raised);
  font-family: var(--w-font);
  font-size: 11px;
  min-width: 180px;
  min-height: 100px;
  cursor: default;
  user-select: none;
}
```

- [ ] **Step 3.3 — Ajouter le style `.win95-ctrl-btn--close` (rouge au hover)**

```css
.win95-ctrl-btn--close:hover {
  background: #c00000;
  color: #fff;
}
```

- [ ] **Step 3.4 — Ajouter les scanlines sur `.win95-desktop`**

```css
/* ── Scanlines CRT ── */
.win95-desktop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 1px,
    rgba(0, 0, 0, 0.06) 1px,
    rgba(0, 0, 0, 0.06) 2px
  );
  pointer-events: none;
  z-index: 99998;
}
```

- [ ] **Step 3.5 — Vérifier visuellement dans le navigateur**

```bash
npm run dev
```
Ouvrir http://localhost:5173, cliquer sur le moniteur → boot → bureau.
Vérifier : scanlines visibles (très discrètes), fenêtres avec bordures 3D correctes.

---

## Task 4 — Mettre à jour `OS.jsx` et `Taskbar.jsx` pour `useOSStore`

**Files:**
- Modify: `src/components/OS/OS.jsx`
- Modify: `src/components/OS/Taskbar.jsx`

- [ ] **Step 4.1 — Modifier `OS.jsx`**

Changer l'import :
```jsx
// Avant :
import { useWindowStore } from '../../stores/windowStore'
// Après :
import { useOSStore } from '../../stores/osStore'
```

Dans `OS()`, changer `useWindowStore((s) => s.windows)` en `useOSStore((s) => s.windows)`.

- [ ] **Step 4.2 — Modifier `Taskbar.jsx`**

Changer l'import :
```jsx
import { useOSStore } from '../../stores/osStore'
```

Dans `Taskbar()`, destructurer depuis `useOSStore()` au lieu de `useWindowStore()`.

Dans `handleStartItem`, changer `openWindow({ ...icon.window, content: icon.window.content() })` → l'icon.window.content sera maintenant un composant JSX directement (voir Task 5).

---

## Task 5 — Créer `BioNotepad.jsx` (contenu réel Tyméo)

**Files:**
- Create: `src/components/OS/apps/BioNotepad.jsx`

- [ ] **Step 5.1 — Créer le composant**

```jsx
// src/components/OS/apps/BioNotepad.jsx

const BIO_TEXT = `BIOGRAPHIE.TXT — Poncelet Tyméo
════════════════════════════════════════════

  Étudiant BTS SIO option SISR
  Pôle Sup DE LA SALLE — Promotion 2025-2026

────────────────────────────────────────────
  FORMATION
────────────────────────────────────────────

  BTS SIO (Services Informatiques aux Organisations)
  Spécialisation SISR — Systèmes, Réseaux & Cybersécurité
  Pôle Sup DE LA SALLE, 2025 – 2026

────────────────────────────────────────────
  OBJECTIF
────────────────────────────────────────────

  Étudiant passionné par les infrastructures réseau
  et la cybersécurité. Je recherche activement un
  stage dans les domaines suivants :
    • Administration systèmes & réseaux
    • Cybersécurité offensive / défensive
    • Supervision et monitoring

────────────────────────────────────────────
  COMPÉTENCES TECHNIQUES
────────────────────────────────────────────

  INFRASTRUCTURE & RÉSEAUX
    ✓ Windows Server / Active Directory
    ✓ Cisco Packet Tracer (routage, VLANs)
    ✓ Adressage IP / VLSM
    ✓ pfSense / VyOS (firewall, NAT, routage)
    ✓ VirtualBox

  CYBERSÉCURITÉ
    ✓ Kali Linux
    ✓ Wireshark (analyse réseau)
    ✓ Hashcat / Hydra (audit de mots de passe)
    ✓ Chiffrement / Hachage

  SYSTÈMES LINUX
    ✓ Debian / Ubuntu Server
    ✓ Gestion utilisateurs & droits
    ✓ GLPI (gestion de parc)
    ✓ Zabbix + Grafana (supervision)

────────────────────────────────────────────
  CONTACT
────────────────────────────────────────────

  Email   : tymeo.poncelet@gmail.com
  Tél     : 06 10 25 32 34
  LinkedIn: linkedin.com/in/tyméo-poncelet-83b667383

════════════════════════════════════════════
  C:\\PORTFOLIO\\BIO> _`

export function BioNotepad() {
  return (
    <textarea
      className="win95-notepad"
      defaultValue={BIO_TEXT}
      spellCheck={false}
      readOnly
    />
  )
}
```

---

## Task 6 — Créer `ProjectsExplorer.jsx` (explorateur 2 panneaux)

**Files:**
- Create: `src/components/OS/apps/ProjectsExplorer.jsx`

Structure visuelle :
```
┌──────────────────────────────────────────────┐
│  Barre d'adresse : C:\Projets\               │
├───────────────┬──────────────────────────────┤
│  📁 Réseau    │  [liste des fichiers du       │
│  📁 Sécu      │   dossier sélectionné]        │
│  📁 Supervision│                              │
│               │  preview en bas si fichier   │
│               │  sélectionné                 │
└───────────────┴──────────────────────────────┘
│  3 objet(s)   │  Active_Directory.proj sél.  │
└───────────────────────────────────────────────
```

- [ ] **Step 6.1 — Créer le composant**

```jsx
// src/components/OS/apps/ProjectsExplorer.jsx
import { useState } from 'react'

const TREE = [
  {
    id: 'reseau',
    label: 'Réseau & Infrastructure',
    icon: '🗂️',
    files: [
      {
        id: 'ad',
        name: 'Active_Directory',
        ext: 'proj',
        icon: '🖧',
        size: '1 024 Ko',
        date: '03/2026',
        tech: 'Windows Server · Active Directory · DNS · GPO · PowerShell',
        desc: `Déploiement d'un domaine Windows Server complet.

Objectifs :
  • Installation et configuration de Windows Server 2022
  • Mise en place de l'Active Directory (AD DS)
  • Création d'utilisateurs, groupes et unités d'organisation
  • Configuration DNS, DHCP et GPO
  • Scripts PowerShell pour automatiser la création de comptes
  • Profils itinérants et montage de lecteurs réseau

Résultat : domaine fonctionnel avec 30+ comptes, montage
automatique des lecteurs et politiques de groupe appliquées.`,
      },
      {
        id: 'pfsense',
        name: 'pfSense_Firewall',
        ext: 'proj',
        icon: '🔥',
        size: '768 Ko',
        date: '02/2026',
        tech: 'pfSense · VyOS · NAT · Firewall · VirtualBox',
        desc: `Étude comparative VyOS vs pfSense pour l'interconnexion réseau.

Objectifs :
  • Configuration d'un pare-feu pfSense (FreeBSD)
  • Mise en place NAT et règles de filtrage
  • Routage statique inter-sous-réseaux
  • Tests de connectivité avec ping / traceroute
  • Comparaison fonctionnelle avec VyOS

Résultat : deux sous-réseaux virtuels interconnectés avec
règles de filtrage et NAT opérationnels.`,
      },
    ],
  },
  {
    id: 'secu',
    label: 'Cybersécurité',
    icon: '🗂️',
    files: [
      {
        id: 'audit',
        name: 'Audit_Secu',
        ext: 'proj',
        icon: '🔐',
        size: '512 Ko',
        date: '04/2026',
        tech: 'Kali Linux · Wireshark · Hashcat · Hydra',
        desc: `Initiation aux outils d'audit de sécurité réseau.

Outils utilisés :
  • Wireshark — capture et analyse de trames réseau
  • Hashcat — craquage de mots de passe (MD5, SHA-1)
  • Hydra — test de robustesse par force brute
  • Kali Linux comme environnement de travail

Contexte : TP encadrés en environnement isolé (VMs),
dans le cadre du module cybersécurité BTS SIO SISR.`,
      },
    ],
  },
  {
    id: 'supervision',
    label: 'Supervision',
    icon: '🗂️',
    files: [
      {
        id: 'zabbix',
        name: 'Zabbix_Grafana',
        ext: 'proj',
        icon: '📊',
        size: '2 048 Ko',
        date: '01/2026',
        tech: 'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP',
        desc: `Supervision de la connectivité internet d'une organisation.

Infrastructure mise en place :
  • Ubuntu Server 22.04 comme hôte de supervision
  • Zabbix 7.4 avec base de données MySQL
  • Monitoring ICMP via fping (connectivité internet)
  • Intégration Grafana pour les dashboards temps réel
  • Suivi de l'espace disque et des interfaces réseau

Résultat : tableau de bord Grafana opérationnel avec
alertes ICMP et surveillance de l'espace disque.`,
      },
    ],
  },
]

export function ProjectsExplorer() {
  const [selectedFolder, setSelectedFolder] = useState(TREE[0])
  const [selectedFile,   setSelectedFile]   = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--w-font)', fontSize: 11 }}>

      {/* Barre d'adresse */}
      <div style={{
        padding: '2px 4px', borderBottom: '1px solid var(--w-dark)',
        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        <span style={{ color: 'var(--w-darker)' }}>Adresse :</span>
        <div style={{
          flex: 1, background: '#fff', padding: '1px 4px',
          boxShadow: 'var(--border-sunken)',
          fontFamily: 'var(--w-font)', fontSize: 11,
        }}>
          C:\Projets\{selectedFolder?.label ?? ''}
        </div>
      </div>

      {/* Corps : arbre gauche + liste droite */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panneau gauche — dossiers */}
        <div style={{
          width: 160, flexShrink: 0,
          borderRight: '1px solid var(--w-dark)',
          overflowY: 'auto',
          padding: '2px 0',
        }}>
          {TREE.map((folder) => (
            <div
              key={folder.id}
              className={`win95-file-row${selectedFolder?.id === folder.id ? ' selected' : ''}`}
              onClick={() => { setSelectedFolder(folder); setSelectedFile(null) }}
            >
              <span className="win95-file-icon">{folder.icon}</span>
              <span className="win95-file-name" style={{ fontSize: 10 }}>{folder.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau droit — fichiers + preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Liste des fichiers */}
          <div style={{ flex: selectedFile ? '0 0 40%' : '1', overflowY: 'auto' }}>
            {selectedFolder?.files.map((file) => (
              <div
                key={file.id}
                className={`win95-file-row${selectedFile?.id === file.id ? ' selected' : ''}`}
                onDoubleClick={() => setSelectedFile(file)}
                onClick={() => setSelectedFile(file)}
              >
                <span className="win95-file-icon">{file.icon}</span>
                <span className="win95-file-name">{file.name}.{file.ext}</span>
                <span className="win95-file-size">{file.size}</span>
                <span style={{ fontSize: 10, color: 'inherit', minWidth: 50, textAlign: 'right' }}>{file.date}</span>
              </div>
            ))}
          </div>

          {/* Preview */}
          {selectedFile && (
            <div style={{
              flex: 1, borderTop: '1px solid var(--w-dark)',
              padding: '6px 8px', overflowY: 'auto',
              background: '#fff',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{selectedFile.icon}</span>
                <span>{selectedFile.name}.{selectedFile.ext}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--w-darker)', marginBottom: 6, fontStyle: 'italic' }}>
                {selectedFile.tech}
              </div>
              <pre style={{
                fontFamily: '"Courier New", monospace', fontSize: 10,
                lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0,
                color: '#000',
              }}>
                {selectedFile.desc}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Barre de statut */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">
          {selectedFolder?.files.length ?? 0} objet(s)
        </span>
        <span className="win95-statusbar-field">
          {selectedFile ? `${selectedFile.name}.${selectedFile.ext} sélectionné` : 'Aucune sélection'}
        </span>
      </div>
    </div>
  )
}
```

---

## Task 7 — Créer `ContactApp.jsx` et `SkillsApp.jsx`

**Files:**
- Create: `src/components/OS/apps/ContactApp.jsx`
- Create: `src/components/OS/apps/SkillsApp.jsx`

- [ ] **Step 7.1 — Créer `ContactApp.jsx`**

```jsx
// src/components/OS/apps/ContactApp.jsx

const CONTACTS = [
  { icon: '📧', label: 'E-mail',   value: 'tymeo.poncelet@gmail.com',            href: 'mailto:tymeo.poncelet@gmail.com' },
  { icon: '📱', label: 'Téléphone', value: '06 10 25 32 34',                      href: 'tel:+33610253234' },
  { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/tyméo-poncelet-83b667383', href: 'https://www.linkedin.com/in/tyméo-poncelet-83b667383' },
  { icon: '🐙', label: 'GitHub',   value: 'github.com/tymeoponcelet',             href: 'https://github.com/tymeoponcelet' },
]

export function ContactApp() {
  return (
    <div className="win95-about">
      <div className="win95-about-header">
        <div className="win95-about-icon">📬</div>
        <div>
          <div className="win95-about-title">Poncelet Tyméo</div>
          <div className="win95-about-sub">Étudiant BTS SIO SISR — Recherche stage</div>
        </div>
      </div>
      {CONTACTS.map((c) => (
        <div key={c.label} className="win95-about-field">
          <span style={{ fontSize: 14, width: 18, flexShrink: 0 }}>{c.icon}</span>
          <span className="win95-about-key">{c.label} :</span>
          <a
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="win95-about-val"
            style={{ color: '#000080', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          >
            {c.value}
          </a>
        </div>
      ))}
      <hr className="win95-hr" />
      <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
        Disponible pour un stage en administration systèmes,<br />
        réseaux ou cybersécurité. N'hésitez pas à me contacter.
      </div>
    </div>
  )
}
```

- [ ] **Step 7.2 — Créer `SkillsApp.jsx`**

```jsx
// src/components/OS/apps/SkillsApp.jsx

const SKILL_SECTIONS = [
  {
    title: 'Infrastructure & Réseaux',
    items: [
      { name: 'Windows Server / AD',  level: 4, max: 5 },
      { name: 'Cisco / Packet Tracer',level: 3, max: 5 },
      { name: 'pfSense / VyOS',       level: 3, max: 5 },
      { name: 'Adressage IP / VLSM',  level: 4, max: 5 },
      { name: 'VirtualBox',           level: 4, max: 5 },
    ],
  },
  {
    title: 'Cybersécurité',
    items: [
      { name: 'Kali Linux',    level: 3, max: 5 },
      { name: 'Wireshark',     level: 3, max: 5 },
      { name: 'Hashcat / Hydra',level: 2, max: 5 },
      { name: 'Chiffrement',   level: 3, max: 5 },
    ],
  },
  {
    title: 'Systèmes Linux',
    items: [
      { name: 'Debian / Ubuntu',level: 4, max: 5 },
      { name: 'GLPI',           level: 3, max: 5 },
      { name: 'Zabbix + Grafana',level: 3, max: 5 },
      { name: 'Bash / Scripts', level: 3, max: 5 },
    ],
  },
]

function Bar({ level, max }) {
  return (
    <span style={{ fontFamily: '"Courier New", monospace', fontSize: 11 }}>
      {'█'.repeat(level)}{'░'.repeat(max - level)}
    </span>
  )
}

export function SkillsApp() {
  return (
    <div style={{
      padding: '8px 10px', fontFamily: 'var(--w-font)', fontSize: 11,
      display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', height: '100%',
    }}>
      {SKILL_SECTIONS.map((section) => (
        <div key={section.title}>
          <div style={{
            fontWeight: 'bold', fontSize: 11, marginBottom: 4,
            borderBottom: '1px solid var(--w-dark)', paddingBottom: 2,
            color: '#000080',
          }}>
            {section.title}
          </div>
          {section.items.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1px 0' }}>
              <span style={{ minWidth: 160 }}>{item.name}</span>
              <Bar level={item.level} max={item.max} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

---

## Task 8 — Réécrire `Desktop.jsx` avec vrai contenu + `useOSStore`

**Files:**
- Modify: `src/components/OS/Desktop.jsx` (réécriture complète)

- [ ] **Step 8.1 — Réécrire `Desktop.jsx`**

```jsx
// src/components/OS/Desktop.jsx
import { useState }         from 'react'
import { useOSStore }        from '../../stores/osStore'
import { BioNotepad }        from './apps/BioNotepad'
import { ProjectsExplorer }  from './apps/ProjectsExplorer'
import { ContactApp }        from './apps/ContactApp'
import { SkillsApp }         from './apps/SkillsApp'

// ── Définition des icônes / fenêtres ─────────────────────────────
export const ICONS = [
  {
    id: 'bio',
    label: 'Biographie',
    icon: '📄',
    pos: [10, 6],
    window: {
      appId:   'bio',
      title:   'BIOGRAPHIE.TXT — Bloc-notes',
      icon:    '📄',
      width:   460,
      height:  380,
      content: <BioNotepad />,
    },
  },
  {
    id: 'projects',
    label: 'Mes Projets',
    icon: '📁',
    pos: [10, 100],
    window: {
      appId:   'projects',
      title:   'C:\\Projets',
      icon:    '📁',
      width:   560,
      height:  380,
      content: <ProjectsExplorer />,
    },
  },
  {
    id: 'skills',
    label: 'Compétences',
    icon: '⚙️',
    pos: [10, 194],
    window: {
      appId:   'skills',
      title:   'Compétences — Panneau de configuration',
      icon:    '⚙️',
      width:   380,
      height:  360,
      content: <SkillsApp />,
    },
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: '📬',
    pos: [10, 288],
    window: {
      appId:   'contact',
      title:   'Contact — Carnet d\'adresses',
      icon:    '📬',
      width:   340,
      height:  260,
      content: <ContactApp />,
    },
  },
]

// ── Composant Desktop ─────────────────────────────────────────────
export function Desktop() {
  const { openWindow } = useOSStore()
  const [selected, setSelected] = useState(null)

  const handleOpen = (icon) => openWindow(icon.window)

  return (
    <div
      className="win95-desktop"
      onClick={() => setSelected(null)}
    >
      {ICONS.map((icon) => (
        <div
          key={icon.id}
          className={`win95-icon${selected === icon.id ? ' selected' : ''}`}
          style={{ left: icon.pos[0], top: icon.pos[1] }}
          onClick={(e) => { e.stopPropagation(); setSelected(icon.id) }}
          onDoubleClick={(e) => { e.stopPropagation(); handleOpen(icon) }}
        >
          <span className="win95-icon-img">{icon.icon}</span>
          <span className="win95-icon-label">{icon.label}</span>
        </div>
      ))}
    </div>
  )
}
```

**Note importante** : les `content` sont maintenant des éléments JSX pré-créés au niveau module, pas des fonctions appelées à chaque ouverture. Cela évite le pattern `content: () => <Comp />` qui causait des re-mounts inutiles.

---

## Task 9 — Mettre à jour `Taskbar.jsx` et `OS.jsx` final

**Files:**
- Modify: `src/components/OS/Taskbar.jsx`
- Modify: `src/components/OS/OS.jsx`

- [ ] **Step 9.1 — `Taskbar.jsx` : switch vers `useOSStore`**

```jsx
// src/components/OS/Taskbar.jsx
import { useState, useEffect, useRef } from 'react'
import { useOSStore }     from '../../stores/osStore'
import { AnimatePresence, motion } from 'framer-motion'
import { ICONS }          from './Desktop'

const START_ITEMS = [
  { label: 'Biographie',   icon: '📄', id: 'bio'      },
  { label: 'Mes Projets',  icon: '📁', id: 'projects' },
  { label: 'Compétences',  icon: '⚙️', id: 'skills'   },
  { label: 'Contact',      icon: '📬', id: 'contact'  },
  { divider: true },
  { label: 'Aide',         icon: '❓', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…',     icon: '🔌', id: 'shutdown' },
]

export function Taskbar() {
  const { windows, minimizeWindow, focusWindow, openWindow } = useOSStore()
  const [startOpen, setStartOpen] = useState(false)
  const [clock,     setClock]     = useState('')
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!startOpen) return
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setStartOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [startOpen])

  const handleStartItem = (item) => {
    if (item.disabled || !item.id) return
    setStartOpen(false)

    if (item.id === 'shutdown') {
      openWindow({
        appId: 'shutdown',
        title: '⚠️ Arrêt du système',
        icon:  '🔌',
        width: 280,
        height: 150,
        content: (
          <div style={{ padding: 12, fontFamily: 'var(--w-font)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>Voulez-vous vraiment quitter Windows 95 ?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="win95-btn" onClick={() => alert('Non ! Le portfolio continue !')}>Oui</button>
              <button className="win95-btn">Non</button>
            </div>
          </div>
        ),
      })
      return
    }

    const icon = ICONS.find((i) => i.id === item.id)
    if (icon) openWindow(icon.window)
  }

  return (
    <>
      <AnimatePresence>
        {startOpen && (
          <motion.div
            ref={menuRef}
            className="win95-startmenu"
            style={{ originY: 1 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="win95-startmenu-sidebar">
              <span>Windows 95</span>
            </div>
            <div className="win95-startmenu-items">
              {START_ITEMS.map((item, i) =>
                item.divider ? (
                  <div key={i} className="win95-startmenu-divider" />
                ) : (
                  <div
                    key={item.label}
                    className={`win95-startmenu-item${item.disabled ? ' disabled' : ''}`}
                    onClick={() => handleStartItem(item)}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="win95-taskbar">
        <button
          ref={btnRef}
          className={`win95-start-btn${startOpen ? ' open' : ''}`}
          onClick={() => setStartOpen((o) => !o)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <rect x="0" y="0" width="6" height="6" fill="#e74c3c" />
            <rect x="8" y="0" width="6" height="6" fill="#2ecc71" />
            <rect x="0" y="8" width="6" height="6" fill="#3498db" />
            <rect x="8" y="8" width="6" height="6" fill="#f1c40f" />
          </svg>
          Démarrer
        </button>

        <div className="win95-sep" />

        {windows.map((w) => (
          <button
            key={w.id}
            title={w.title}
            className={`win95-task-btn${!w.isMinimized ? ' active' : ''}`}
            onClick={() => {
              if (w.isMinimized) {
                minimizeWindow(w.id)
                focusWindow(w.id)
              } else {
                minimizeWindow(w.id)
              }
            }}
          >
            {w.icon && <span style={{ fontSize: 12 }}>{w.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {w.title}
            </span>
          </button>
        ))}

        <div className="win95-tray">
          <span style={{ fontSize: 11, marginRight: 4 }}>🔊</span>
          <span className="win95-clock">{clock}</span>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 9.2 — `OS.jsx` : switch vers `useOSStore`**

```jsx
// src/components/OS/OS.jsx
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence }  from 'framer-motion'
import { useOSStore }       from '../../stores/osStore'
import { Window }           from '../Window/Window'
import { Desktop }          from './Desktop'
import { Taskbar }          from './Taskbar'
import '../../styles/win95.css'

const BOOT_STEPS = [
  { pct: 15, label: 'Chargement des pilotes…'       },
  { pct: 35, label: 'Initialisation du registre…'   },
  { pct: 55, label: 'Démarrage des services…'        },
  { pct: 75, label: 'Chargement de l\'interface…'   },
  { pct: 95, label: 'Préparation du bureau…'         },
  { pct: 100, label: 'Bienvenue !'                   },
]

function BootScreen({ onComplete }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= BOOT_STEPS.length) {
      const t = setTimeout(onComplete, 500)
      return () => clearTimeout(t)
    }
    const delay = step === 0 ? 600 : 400 + Math.random() * 200
    const t = setTimeout(() => setStep((s) => s + 1), delay)
    return () => clearTimeout(t)
  }, [step, onComplete])

  const current = BOOT_STEPS[Math.min(step, BOOT_STEPS.length - 1)]

  return (
    <div className="win95-boot">
      <div className="win95-boot-logo">
        <div className="win95-boot-flag">
          <div className="win95-boot-flag-r" />
          <div className="win95-boot-flag-g" />
          <div className="win95-boot-flag-b" />
          <div className="win95-boot-flag-y" />
        </div>
        <div className="win95-boot-win">Microsoft Windows</div>
        <div className="win95-boot-95">95</div>
        <div className="win95-boot-tagline">Copyright © Microsoft Corp. 1981–1995</div>
      </div>
      <div className="win95-boot-bar-track">
        <div className="win95-boot-bar-fill" style={{ width: `${current.pct}%` }} />
      </div>
      <div className="win95-boot-status">{current.label}</div>
    </div>
  )
}

export function OS() {
  const windows = useOSStore((s) => s.windows)
  const [booted, setBooted] = useState(false)
  const handleBooted = useCallback(() => setBooted(true), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {!booted ? (
        <BootScreen onComplete={handleBooted} />
      ) : (
        <>
          <AnimatePresence>
            {windows.map((win) => (
              <Window key={win.id} {...win}>
                {win.content}
              </Window>
            ))}
          </AnimatePresence>
          <Desktop />
          <Taskbar />
        </>
      )}
    </div>
  )
}
```

---

## Task 10 — Nettoyage final et test

**Files:**
- Delete: `src/components/OS/ScreenContent.jsx` (remplacé par `BioNotepad`)
  - ⚠️ Attention : `VintagePC.jsx` importe encore `ScreenContent` pour l'état non-focalisé. **Ne pas supprimer**, juste vérifier.

- [ ] **Step 10.1 — Vérifier `VintagePC.jsx`**

S'assurer que les imports sont corrects :
```jsx
import { ScreenContent } from '../OS/ScreenContent'  // C64 non-focalisé
import { OS }            from '../OS/OS'              // Win95 focalisé
```
Aucun changement nécessaire ici.

- [ ] **Step 10.2 — Vérifier `windowStore.js` n'est plus importé par des composants OS**

```bash
grep -r "useWindowStore" src/components/OS/ src/components/Window/
```
Attendu : 0 résultats.

- [ ] **Step 10.3 — Build de production**

```bash
npm run build 2>&1 | tail -20
```
Attendu : `✓ built in X.XXs`, aucune erreur.

- [ ] **Step 10.4 — Test manuel complet**

1. `npm run dev` → http://localhost:5173
2. Cliquer sur le moniteur → caméra zoom → boot Win95
3. Double-cliquer sur "Biographie" → fenêtre Notepad avec vrai contenu Tyméo
4. Double-cliquer sur "Mes Projets" → explorateur 2 panneaux, cliquer dossier → fichiers, cliquer fichier → preview
5. Double-cliquer sur "Compétences" → barres de niveau
6. Double-cliquer sur "Contact" → coordonnées réelles, liens cliquables
7. Ouvrir 2 fenêtres → cliquer sur la fenêtre arrière → elle passe au premier plan (z-index)
8. Minimiser une fenêtre → elle disparaît du bureau, reste dans la taskbar
9. Cliquer sur son bouton taskbar → elle réapparaît
10. Appuyer sur Escape → zoom arrière → C64 BASIC réapparaît
11. Vérifier scanlines discrètes sur le bureau teal
12. Redimensionner une fenêtre via la poignée bas-droite

- [ ] **Step 10.5 — Commit**

```bash
git add src/stores/osStore.js src/stores/windowStore.js \
        src/components/Window/Window.jsx \
        src/styles/win95.css \
        src/components/OS/ \
        docs/superpowers/plans/
git commit -m "feat: Win95 OS portfolio — useOSStore, Heffernan styles, contenu réel Tyméo Poncelet"
```

---

## Self-Review

**Spec coverage :**
- [x] Store `useOSStore` avec openWindow/closeWindow/minimizeWindow/focusWindow → Task 1
- [x] Z-index Heffernan (compteur global incrémental) → Task 1 `focusWindow`
- [x] `Window.jsx` drag titlebar + Framer Motion → Task 2
- [x] Borders 3D Heffernan (box-shadow inset) → Task 3
- [x] Scanlines CRT → Task 3 Step 3.4
- [x] Desktop icônes réelles → Task 8
- [x] App Projets = explorateur 2 panneaux avec preview → Task 6
- [x] App Bio = vraie biographie Tyméo → Task 5
- [x] App Contact = vraies coordonnées → Task 7
- [x] App Compétences = barres de niveau → Task 7
- [x] Intégration 3D `<Html transform>` isFocused → déjà implémenté dans VintagePC.jsx (pas de change)
- [x] `pointerEvents` selon `isFocused` → déjà dans VintagePC.jsx

**Placeholders :** aucun TBD/TODO dans le plan.

**Cohérence des types :**
- `useOSStore().openWindow(config)` reçoit `{ appId, title, icon, width, height, content }` partout
- `ICONS[n].window` a exactement ces propriétés
- `Window` reçoit `{ id, title, icon, content, position, size, zIndex, isMinimized, isMaximized }` via spread du store
